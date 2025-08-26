import {Session, User} from "next-auth";
import {cookies as nextCookies} from "next/headers";
import {SessionStore} from "@/utils/SessionStore";
import {decode, encode} from "@/utils/jwt";
import {jwtCallback, AppJWT} from "@/config/callbacks";
import {COOKIE_AUTH_JS_SESSION_TOKEN, sessionMaxAge} from "@/config/helpers";

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

    const sessionStore = new SessionStore({ name: COOKIE_AUTH_JS_SESSION_TOKEN, options: { httpOnly: true, sameSite: "lax", path: "/" } }, cookieRecord);

    try {
        const decodedToken = await decode({
            token: sessionStore.value,
            secret: process.env.AUTH_SECRET ?? "",
            salt: COOKIE_AUTH_JS_SESSION_TOKEN
        })

        

        if (!decodedToken) throw new Error("JWT decode failed");

        const updatedToken = await jwtCallback({token: decodedToken, user: {} as User})

        console.log("Updated Token:", updatedToken);

        const expires = new Date((updatedToken as AppJWT).absoluteSessionExpiresAt ?? 0)

        const t = updatedToken as AppJWT
        const updatedSession: Session = {
            // mirror v4 augmentation shape used by UI/debug
            error: t.error ?? null,
            sessionEnded: t.sessionEnded ?? null,
            tokenRotatedAt: t.tokenRotatedAt ?? null,
            tokenRotationCount: t.tokenRotationCount ?? null,
            providerIdTokenExpiresAt: t.providerIdTokenExpiresAt ?? null,
            expires: expires.toISOString(),
            user: {
                name: undefined as unknown as string | null,
                email: undefined as unknown as string | null,
                image: undefined as unknown as string | null,
            }
        }

        console.log("Updated Session:", updatedSession);

        const encodedToken = await encode({
            token: updatedToken,
            maxAge: sessionMaxAge,
            secret: process.env.AUTH_SECRET ?? "",
            salt: COOKIE_AUTH_JS_SESSION_TOKEN
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