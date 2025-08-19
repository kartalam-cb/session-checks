import NextAuth, {NextAuthConfig} from "next-auth";
import AzureADB2C from "next-auth/providers/azure-ad-b2c";
import {AppJWT, jwtCallback} from "@/config/callbacks";
import {
    ADB2C_AUTHORIZATION_ENDPOINT,
    ADB2C_ISSUER,
    ADB2C_TOKEN_ENDPOINT,
    ADB2C_WELL_KNOWN_URL,
    sessionMaxAge
} from "@/config/helpers";

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

const authJsOptions: NextAuthConfig = {
    debug: true,
    session: {
        strategy: "jwt",
        maxAge: sessionMaxAge,
        updateAge: 0
    },
    jwt: {
        maxAge: sessionMaxAge
    },
    trustHost: true,
    providers: [
        AzureADB2C({
            clientId: process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID,
            clientSecret: process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET,
            authorization: {
                url: ADB2C_AUTHORIZATION_ENDPOINT,
                params: {
                    scope: "openid offline_access profile",
                },
            },
            checks: ["nonce", "pkce"],
            issuer: ADB2C_ISSUER,
            token: ADB2C_TOKEN_ENDPOINT,
            client: { token_endpoint_auth_method: "client_secret_post" },
            wellKnown: ADB2C_WELL_KNOWN_URL
        })
    ],
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
            }
        }
    }
}

export const {
    auth, signIn, handlers
} = NextAuth(authJsOptions)