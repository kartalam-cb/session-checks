import type { Session } from "next-auth";
import { cookies as nextCookies } from "next/headers";
import { SessionStore } from "@/utils/SessionStore";
import { decode, encode } from "@/utils/jwt";
import { jwtCallback } from "@/config/callbacks";
import { COOKIE_AUTH_JS_SESSION_TOKEN, sessionMaxAge } from "@/config/helpers";

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

  const providerExpiryMs = session.providerIdTokenExpiresAt ?? null;
  return !(providerExpiryMs && Date.now() > providerExpiryMs);
}

export const getSession = async (cookies?: Record<string, string>) => {
  let cookieRecord: Record<string, string> = cookies ?? {};
  if (!cookies) {
    const cookiesStore = await nextCookies();
    cookieRecord = cookiesStore.getAll().reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {} as Record<string, string>);
  }

  if (!cookieRecord[COOKIE_AUTH_JS_SESSION_TOKEN]) {
    return {
      session: null,
      cookies: [],
    };
  }

  const sessionStore = new SessionStore(
    {
      name: COOKIE_AUTH_JS_SESSION_TOKEN,
      options: { httpOnly: true, sameSite: "lax", path: "/" },
    },
    cookieRecord
  );

  try {
    const secret = process.env.AUTH_SECRET ?? "";
    if (!secret) throw new Error("AUTH_SECRET is not set");

    const decodedToken = await decode({
      token: sessionStore.value,
      secret,
      salt: COOKIE_AUTH_JS_SESSION_TOKEN,
    });

    if (!decodedToken) throw new Error("JWT decode failed");

    const updatedToken = await jwtCallback({
      token: decodedToken,
      user: {},
    });

    // Keeping the cookie expires date from the point user logged in.
    // Rather than extending the cookie expiration date whenever the user is active.
    const absoluteMs = updatedToken.absoluteSessionExpiresAt ?? 0;
    const expires = new Date(absoluteMs);

    const t = updatedToken;
    const updatedSession: Session = {
      // mirror v4 augmentation shape used by UI/debug
      error: t.error ?? null,
      sessionEnded: t.sessionEnded ?? null,
      providerIdTokenExpiresAt: t.providerIdTokenExpiresAt ?? null,
      expires: expires.toISOString(),
      user: {
        name: undefined as unknown as string | null,
        email: undefined as unknown as string | null,
        image: undefined as unknown as string | null,
      },
    };

    const encodedToken = await encode({
      token: updatedToken,
      maxAge: sessionMaxAge,
      secret,
      salt: COOKIE_AUTH_JS_SESSION_TOKEN,
    });

    const sessionCookies = sessionStore.chunk(encodedToken, {
      expires,
    });

    return {
      session: updatedSession,
      cookies: sessionCookies,
    };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("getSession failed", e);
    }
    return { session: null, cookies: [] };
  }
};
