import type {NextAuthResult} from "next-auth-v5";
import NextAuth from "next-auth-v5";
import MicrosoftEntraID from "next-auth-v5/providers/microsoft-entra-id";
import {
    COOKIE_AUTH_JS_SESSION_TOKEN,
    sessionMaxAge,
    ADB2C_AUTHORIZATION_ENDPOINT,
    ADB2C_TOKEN_ENDPOINT,
    ADB2C_WELL_KNOWN_URL,
    ADB2C_ISSUER,
    clientId as b2cClientId,
    clientSecret as b2cClientSecret,
} from "@/config/helpers";
import {jwtCallback} from "@/config/callbacks";
import {decode, encode} from "@/utils/jwt";

export const {
        handlers,
        auth,
        signIn,
        signOut,
    }: {
        handlers: NextAuthResult["handlers"];
        auth: NextAuthResult["auth"];
        signIn: NextAuthResult["signIn"];
        signOut: NextAuthResult["signOut"];
    } = NextAuth({
        secret: process.env.AUTH_SECRET,
        debug: true,
        session: {
            strategy: "jwt",
            maxAge: sessionMaxAge,
            updateAge: 0,
        },
        // Cast to any to bridge local jwt utils and next-auth-v5 expectations
        jwt: {
            maxAge: sessionMaxAge,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            encode: encode as unknown as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            decode: decode as unknown as any,
        },
        providers: [
            // Microsoft Entra ID (work/school accounts)
            MicrosoftEntraID({
                clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
                clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
                issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
                profile: undefined, // This is to avoid type errors, as the profile is not used in this context
                authorization: {
                    params: {scope: "profile User.Read email openid offline_access"},
                },
            }),
            // Azure AD B2C (consumer accounts) via custom OAuth config
            {
                id: "azure-ad-b2c",
                name: "Azure AD B2C",
                type: "oidc",
                issuer: ADB2C_ISSUER,
                wellKnown: ADB2C_WELL_KNOWN_URL,
                clientId: b2cClientId,
                clientSecret: b2cClientSecret,
                authorization: {
                    url: ADB2C_AUTHORIZATION_ENDPOINT,
                    params: { scope: "openid offline_access profile" },
                },
                token: ADB2C_TOKEN_ENDPOINT,
                checks: ["pkce", "nonce"],
                client: { token_endpoint_auth_method: "none" },
                profile(profile: Record<string, unknown> & {
                    sub?: string;
                    given_name?: string;
                    family_name?: string;
                    emails?: string[];
                    email?: string;
                }) {
                    return {
                        id: profile.sub ?? "",
                        name: `${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim(),
                        email: (profile.emails && Array.isArray(profile.emails) ? profile.emails[0] : undefined) ?? profile.email ?? "",
                    }
                },
            },
        ],
        trustHost: true,
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
            // jwt: jwtCallback,

            /**
             * This callback is called whenever a session is checked.
             * session calls will only expose sfAccessToken and sub
             * to the client.
             *
             * rest of the jwt token is not exposed to the client as the refresh and revoke is based on callbacks and events
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            session(args: any) {
                const { session } = args;
                return {...session,}
            }
            ,
        },
    })
;
