import type {NextAuthResult} from "next-auth-v5";
import NextAuth from "next-auth-v5";
import MicrosoftEntraID from "next-auth-v5/providers/microsoft-entra-id";
import {COOKIE_AUTH_JS_SESSION_TOKEN, sessionMaxAge} from "@/config/helpers";
import {jwtCallback} from "@/config/callbacks";
import {decode, encode} from "@/utils/jwt";

// @ts-ignore
export const {
        handlers,
    }: {
        handlers: NextAuthResult["handlers"];
    } = NextAuth({
        secret: process.env.NEXTAUTH_SECRET,
        debug: true,
        session: {
            strategy: "jwt",
            maxAge: sessionMaxAge,
            updateAge: 0,
        },
        jwt: {
            maxAge: sessionMaxAge,
            encode: encode,
            decode: decode
        },
        providers: [
            MicrosoftEntraID({
                clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
                clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
                issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
                profile: undefined, // This is to avoid type errors, as the profile is not used in this context
                authorization: {
                    params: {scope: "profile User.Read email openid offline_access"},
                },
            }),
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
            // @ts-expect-error session is defined as custom type to ease the sync with multiple versions of next-auth
            session({token, session}
            ) {
                return {...session,}
            }
            ,
        },
    })
;
