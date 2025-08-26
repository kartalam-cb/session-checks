import type { Session } from "next-auth";
import { cookies as nextCookies } from "next/headers";
import { SessionStore } from "@/utils/SessionStore";
import { decode, encode } from "@/utils/jwt";
import { jwtCallback, AppJWT } from "@/config/callbacks";
import { COOKIE_AUTH_JS_SESSION_TOKEN, sessionMaxAge } from "@/config/helpers";

type AppSession = Session & {
  error?: { message: string; description?: string } | null;
  sessionEnded?: "absolute" | null;
  tokenRotatedAt?: number | null;
  tokenRotationCount?: number | null;
  providerIdTokenExpiresAt?: number | null;
  expires?: string | null;
};

export function checkSessionIfValid(session: AppSession) {
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

  return !(
    session.providerIdTokenExpiresAt &&
    Date.now() > Number(session.providerIdTokenExpiresAt)
  );
}

export const getSession = async (cookies?: Record<string, string>) => {
  let cookieRecord: Record<string, string> = cookies ?? {};
  if (!cookies) {
    const cookies = await nextCookies();

    cookieRecord = cookies.getAll().reduce((acc, cookie) => {
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
    const decodedToken = await decode({
      token: sessionStore.value,
      secret: process.env.AUTH_SECRET ?? "",
      salt: COOKIE_AUTH_JS_SESSION_TOKEN,
    });

    if (!decodedToken) throw new Error("JWT decode failed");

    const updatedToken = await jwtCallback({
      token: decodedToken,
      user: {} as { id?: string },
    });

    const expires = new Date(
      (updatedToken as AppJWT).absoluteSessionExpiresAt ?? 0
    );

    const t = updatedToken as AppJWT;
    const updatedSession: AppSession = {
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
      secret: process.env.AUTH_SECRET ?? "",
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
    console.error("session fetch has failed:", e);
  }
};
