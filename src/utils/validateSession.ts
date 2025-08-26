import {Session, User} from "next-auth";
import {cookies as nextCookies} from "next/headers";
import {SessionStore} from "@/utils/SessionStore";
import {authJsOptions} from "@/config/auth";
import {decode, encode} from "@/utils/jwt";
import {jwtCallback} from "@/config/callbacks";

export function checkSessionIfValid(session: Session) {
    if (session.sessionEnded === "absolute") {
        return false;
    }

    if (session.error) {
        return false;
    }

    if (session.expires) {
        const expiresAt = Date.parse(session.expires);
        if (!Number.isNaN(expiresAt) && Date.now() > expiresAt) {
            return false;
        }
    }

    return !(session.providerIdTokenExpiresAt && Date.now() > Number(session.providerIdTokenExpiresAt));

}

export const getSession = async () => {
    const cookies = await nextCookies();

    console.log("Cookies:", cookies.getAll());

    const cookieRecord = cookies.getAll().reduce((acc, cookie) => ({
        [cookie.name]: cookie.value
    }), {} as Record<string, string>)

    const sessionStore = new SessionStore(authJsOptions.cookies?.sessionToken!, cookieRecord);

    console.log("cookie options", authJsOptions.cookies?.sessionToken?.name);

    console.log("autjsoptions", authJsOptions);

    try {
        const decodedToken = await decode({
            token: sessionStore.value,
            secret: authJsOptions.secret,
            salt: authJsOptions.cookies?.sessionToken?.name
        })

        console.log("Decoded Token:", decodedToken);

        if (!decodedToken) throw new Error("JWT decode failed");

        const updatedToken = await jwtCallback({token: decodedToken, user: {} as User})

        console.log("Updated Token:", updatedToken);

        const expires = new Date(updatedToken.absoluteSessionExpiresAt ?? 0)

        // @ts-expect-error Property 'user' is missing in type
        const updatedSession = await authJsOptions.callbacks?.session?.({
            token: updatedToken,
            session: {
                expires: expires.toISOString(),
                user: {
                    name: undefined,
                    email: undefined,
                    image: undefined
                }
            }
        })

        console.log("Updated Session:", updatedSession);

        const encodedToken = await encode({
            token: updatedToken,
            maxAge: authJsOptions.session.maxAge,
            secret: authJsOptions.secret
        })

        const sessionCookies = sessionStore.chunk(encodedToken, {
            expires,
        })

        return {
            session: updatedSession,
            cookies: sessionCookies,
        }
    } catch (e) {
        console.error("session fetch has failed:", e);
    }
}