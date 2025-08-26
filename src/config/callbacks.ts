import {
  FIFTEEN_MIN_IN_MS,
  refreshAdb2cTokens,
  sessionMaxAge,
} from "@/config/helpers";
import type { JWT } from "next-auth/jwt";
import type { Account, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

export async function jwtCallback({
  token,
  user,
  account,
}: {
  token: JWT;
  user: User | AdapterUser;
  account?: Account | null;
}): Promise<JWT> {
  const t = token;

  // Initial sign-in: store provider refresh token and force provider ID token expiry to 15 minutes (POC)
  if (account && user) {
    const now = Date.now(); // ms
    // POC: Force ID token window to 15 minutes to exercise refresh flow
    const providerIdTokenExpiresAt = now + FIFTEEN_MIN_IN_MS; // ms
    return {
      sub: user.id,
      providerRefreshToken: account.refresh_token,
      providerIdTokenExpiresAt, // ms
      absoluteSessionExpiresAt: now + sessionMaxAge * 1000, // ms
      sessionEnded: null,
      error: null,
    };
  }

  // If we don't have provider refresh token, we cannot mint a new provider ID token to exchange for SF
  if (!t.providerRefreshToken) {
    return {
      ...token,
      error: {
        message: "Missing providerRefreshToken",
        description: "Cannot refresh provider ID token.",
      },
    };
  }

  const now = Date.now(); // ms

  // Enforce 90-day absolute session cap
  const absoluteExpiresAt = t.absoluteSessionExpiresAt ?? 0;
  if (absoluteExpiresAt && now >= absoluteExpiresAt) {
    console.warn("JWT: absolute session cap reached, ending session");
    return {
      ...t,
      providerRefreshToken: null,
      sessionEnded: "absolute",
      error: {
        message: "Absolute session cap reached",
        description: "Session ended due to 90-day cap.",
      },
    };
  }

  // If provider ID token expiry is set and not near/past expiry, nothing to do for POC
  const providerExpiresAt = Number(t.providerIdTokenExpiresAt ?? 0); // ms
  if (providerExpiresAt && now < providerExpiresAt) {
    console.warn(
      `JWT: provider id token still valid until ${new Date(
        providerExpiresAt
      )}, now=${new Date(now)}`
    );
    return { ...token, error: null };
  }

  console.log("JWT: attempting provider ID token refresh via refresh_token");

  try {
    const refreshedToken = await refreshAdb2cTokens(t.providerRefreshToken);

    if (!refreshedToken) {
      return {
        ...t,
        error: {
          message: "Provider ID token refresh failed",
          description: "Failed to refresh provider ID token.",
        },
      };
    }

    console.log(
      `JWT: provider ID token refreshed, new expiry at ${new Date(
        now + FIFTEEN_MIN_IN_MS
      )}`
    );

    return {
      ...t,
      providerRefreshToken: refreshedToken.refresh_token,
      error: null,
      providerIdTokenExpiresAt: now + FIFTEEN_MIN_IN_MS, // ms
    };
  } catch (e) {
    return {
      ...t,
      error: {
        message: "Provider ID token refresh exception",
        description: e instanceof Error ? e.message : String(e),
      },
    };
  }
}
