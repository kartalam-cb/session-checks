import NextAuth, {AuthOptions} from "next-auth";
import AzureADB2C, {AzureB2CProfile} from "next-auth/providers/azure-ad-b2c";
import {AppJWT, jwtCallback} from "@/config/callbacks";
import {
    ADB2C_AUTHORIZATION_ENDPOINT,
    ADB2C_ISSUER,
    ADB2C_TOKEN_ENDPOINT,
    ADB2C_WELL_KNOWN_URL,
    clientId,
    clientSecret,
    sessionMaxAge,
    tenant,
    userFlow,
    COOKIE_AUTH_JS_SESSION_TOKEN
} from "@/config/helpers";
import {decode, encode} from "@/utils/jwt";

declare module "next-auth" {
    interface Session {
        error?: {
            message: string;
            description?: string;
        } | null;
        sessionEnded?: "absolute" | null;
        tokenRotatedAt?: number | null;
        tokenRotationCount?: number | null;
        providerIdTokenExpiresAt?: number | null;
        expires?: string | null;
    }
}

export const authJsOptions: AuthOptions = {
    debug: true,
    secret: process.env.AUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: sessionMaxAge,
        updateAge: 0
    },
    jwt: {
        maxAge: sessionMaxAge,
        encode: encode,
        decode: decode,
    },
    providers: [
        AzureADB2C({
            clientId,
            clientSecret,
            tenantId: tenant,
            primaryUserFlow: userFlow,
            authorization: {
                url: ADB2C_AUTHORIZATION_ENDPOINT,
                params: {
                    scope: "openid offline_access profile",
                },
            },
            checks: ["nonce", "pkce"],
            issuer: ADB2C_ISSUER,
            token: ADB2C_TOKEN_ENDPOINT,
            client: {token_endpoint_auth_method: "none"},
            wellKnown: ADB2C_WELL_KNOWN_URL,
            profileUrl: "https://graph.microsoft.com/oidc/userinfo",
            profile: (profile: AzureB2CProfile) => ({
                id: profile.sub,
                name: `${profile.given_name} ${profile.family_name}`,
                email: profile.emails?.[0] ?? "",
            }),
        })
    ],
    cookies: {
        sessionToken: {
            name: COOKIE_AUTH_JS_SESSION_TOKEN,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        jwt: jwtCallback,
        session: ({token}) => {
            const t = token as AppJWT;

            return {
                error: t.error ?? null,
                sessionEnded: t.sessionEnded ?? null,
                tokenRotatedAt: t.tokenRotatedAt ?? null,
                tokenRotationCount: t.tokenRotationCount ?? null,
                providerIdTokenExpiresAt: t.providerIdTokenExpiresAt ?? null,
                refreshToken: t.providerRefreshToken
            }
        }
    }
}

export const nextAuth = NextAuth(authJsOptions)