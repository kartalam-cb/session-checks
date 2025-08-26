import type { DefaultSession, NextAuthResult } from "next-auth";
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
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
import { jwtCallback } from "@/config/callbacks";
import { decode, encode } from "@/utils/jwt";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    error?: { message: string; description?: string } | null;
    sessionEnded?: "absolute" | null;
    providerIdTokenExpiresAt?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    providerRefreshToken?: string | null;
    providerIdTokenExpiresAt?: number | null;
    absoluteSessionExpiresAt?: number | null;
    error?: { message: string; description?: string } | null;
    sessionEnded?: "absolute" | null;
    sub?: string;
  }
}

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
        params: { scope: "profile User.Read email openid offline_access" },
      },
    }),
    // Azure AD B2C (consumer accounts) via custom OIDC config
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
        params: (() => {
          const apiScope = process.env.CB_B2C_API_SCOPE; // e.g. "https://yourtenant.onmicrosoft.com/your-api/scope.read"
          const base = "openid offline_access profile";
          return { scope: apiScope ? `${base} ${apiScope}` : base };
        })(),
      },
      token: {
        url: ADB2C_TOKEN_ENDPOINT,
        // Some B2C policies return only id_token + refresh_token. Map id_token to access_token to satisfy Auth.js expectations.
        async conform(response: Response) {
          try {
            const original: Record<string, unknown> = await response.json();
            const hasAccess = typeof original["access_token"] === "string";
            const hasId = typeof original["id_token"] === "string";
            if (!hasAccess && hasId) {
              original["access_token"] = original["id_token"] as string;
            }
            return new Response(JSON.stringify(original), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          } catch {
            return response;
          }
        },
      },
      checks: ["pkce", "nonce"],
      client: { token_endpoint_auth_method: "none" },
      profile(
        profile: Record<string, unknown> & {
          sub?: string;
          given_name?: string;
          family_name?: string;
          emails?: string[];
          email?: string;
        }
      ) {
        return {
          id: profile.sub ?? "",
          name: `${profile.given_name ?? ""} ${
            profile.family_name ?? ""
          }`.trim(),
          email:
            (profile.emails && Array.isArray(profile.emails)
              ? profile.emails[0]
              : undefined) ??
            profile.email ??
            "",
        };
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

    session({ session, token }) {
      return {
        ...session,

        error: token.error,
        sessionEnded: token.sessionEnded ?? null,
      };
    },
  },
});
