import NextAuth, { NextAuthConfig } from "next-auth";
import AzureADB2C from "next-auth/providers/azure-ad-b2c";
import { AppJWT, jwtCallback } from "@/config/callbacks";
import {
  ADB2C_AUTHORIZATION_ENDPOINT,
  ADB2C_ISSUER,
  ADB2C_TOKEN_ENDPOINT,
  ADB2C_USER_INFO_ENDPOINT,
  ADB2C_WELL_KNOWN_URL,
  sessionMaxAge,
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
  logger: {
    error(error) {
      console.error("[Auth Error]:", error);
    },
    warn(warning) {
      console.warn("[Auth Warning]", warning);
    },
    debug(message, metadata) {
      console.log("[Auth Debug]", message, metadata);
    },
  },
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAge,
    updateAge: 0,
  },
  jwt: {
    maxAge: sessionMaxAge,
  },
  cookies: {
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900, // 15 minutes in seconds
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900, // 15 minutes in seconds
      },
    },
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: sessionMaxAge,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
  },
  trustHost: true,
  providers: [
    AzureADB2C({
      clientId: process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET!,
      issuer: ADB2C_ISSUER,
      wellKnown: ADB2C_WELL_KNOWN_URL,
      authorization: {
        url: ADB2C_AUTHORIZATION_ENDPOINT,
        params: {
          scope: "openid offline_access profile email",
          response_mode: "query", // Ensure consistent response mode
          response_type: "code",
        },
      },
      token: ADB2C_TOKEN_ENDPOINT,
      userinfo: ADB2C_USER_INFO_ENDPOINT,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.emails?.[0] || "",
          image: null,
        };
      },
      idToken: true,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    jwt: jwtCallback,
    session: ({ token }) => {
      const t = token as AppJWT;

      return {
        error: t.error ?? null,
        sessionEnded: t.sessionEnded ?? null,
        tokenRotatedAt: t.tokenRotatedAt ?? null,
        tokenRotationCount: t.tokenRotationCount ?? null,
        providerIdTokenExpiresAt: t.providerIdTokenExpiresAt ?? null,
      };
    },
  },
  events: {
    async signIn(message) {
      console.log("Sign in successful", {
        user: message.user?.id,
        accountType: message.account?.provider,
        isNewUser: message.isNewUser,
      });
    },
    async session(message) {
      console.log("Session update", {
        sessionExpiry: message.session?.expires,
      });
    },
  },
};

export const { auth, signIn, handlers } = NextAuth(authJsOptions);
