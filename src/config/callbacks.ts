import {FIFTEEN_MIN_IN_MS, refreshAdb2cTokens, sessionMaxAge} from "@/config/helpers";
import type {JWT} from "next-auth-v5/jwt";
import type {Account as NextV5Account,} from "next-auth-v5";


export type AppJWT = JWT & {
    providerRefreshToken?: string | null;
    providerIdTokenExpiresAt?: number | null;
    absoluteSessionExpiresAt?: number | null;
    sessionEnded?: "absolute" | null;
    tokenRotatedAt?: number | null;
    tokenRotationCount?: number | null;
    error?: {
        message: string;
        description?: string;
    } | null;
}

export async function jwtCallback({user, token, account}: {
    token: JWT,
    user: {id?: string | undefined},
    account?: NextV5Account | null,
}) {
    const t = token as AppJWT;

    // Initial sign-in: store provider refresh token and force provider ID token expiry to 15 minutes (POC)
    if (account && user) {
        const now = Date.now();
        // POC: Force ID token window to 15 minutes to exercise refresh flow
        const providerIdTokenExpiresAt = now + FIFTEEN_MIN_IN_MS;
        return {
            ...token,
            sub: user.id,
            providerRefreshToken: account.refresh_token ?? null,
            providerIdTokenExpiresAt,
            absoluteSessionExpiresAt: now + (sessionMaxAge * 1000),
            sessionEnded: null,
            tokenRotatedAt: now,
            tokenRotationCount: 0,
            error: null,
        } satisfies AppJWT;
    }

    // If we don't have provider refresh token, we cannot mint a new provider ID token to exchange for SF
    if (!t.providerRefreshToken) {
        return {
            ...token,
            error: {message: "Missing providerRefreshToken", description: "Cannot refresh provider ID token."},
        };
    }

    const now = Date.now();

    // Enforce 90-day absolute session cap
    const absoluteExpiresAt = t.absoluteSessionExpiresAt ?? 0;
    if (absoluteExpiresAt && now >= absoluteExpiresAt) {
        console.warn("JWT: absolute session cap reached, ending session");
        return {
            ...t,
            providerRefreshToken: null,
            sessionEnded: "absolute",
            error: {message: "Absolute session cap reached", description: "Session ended due to 90-day cap."},
        } as AppJWT;
    }

    // If provider ID token expiry is set and not near/past expiry, nothing to do for POC
    const providerExpiresAt = Number(t.providerIdTokenExpiresAt ?? 0);
    if (providerExpiresAt && now < providerExpiresAt) {
        console.warn(`JWT: provider id token still valid until ${providerExpiresAt}, now=${now}`);
        return {...token, error: null};
    }

    console.log("JWT: attempting provider ID token refresh via refresh_token", token);

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

        return {
            ...t,
            providerRefreshToken: refreshedToken.refresh_token,
            tokenRotatedAt: now,
            tokenRotationCount: (t.tokenRotationCount ?? 0) + 1,
            error: null,
            providerIdTokenExpiresAt: now + FIFTEEN_MIN_IN_MS,
        } satisfies AppJWT;
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
