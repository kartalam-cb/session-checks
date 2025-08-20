import { NextRequest, NextResponse } from "next/server";

/**
 * This API route helps diagnose PKCE issues by examining cookie state
 * Do not expose this in production!
 */
export async function GET(request: NextRequest) {
  const cookieStore = request.cookies;
  // Check for both authjs and next-auth prefixes to handle different versions
  const pkceVerifier =
    cookieStore.get("authjs.pkce.code_verifier") ||
    cookieStore.get("next-auth.pkce.code_verifier");
  const state =
    cookieStore.get("authjs.state") || cookieStore.get("next-auth.state");
  const sessionToken =
    cookieStore.get("authjs.session-token") ||
    cookieStore.get("next-auth.session-token");

  // Get all cookie headers for more comprehensive debugging
  const cookieHeader = request.headers.get("cookie") || "";

  try {
    // Return cookie information - we can't actually decode the cookies
    // as they're encrypted, but we can check if they exist and their format
    return NextResponse.json({
      hasPkceVerifier: !!pkceVerifier,
      hasState: !!state,
      hasSession: !!sessionToken,
      cookies: {
        pkceVerifier: pkceVerifier
          ? {
              value: `${pkceVerifier.value.substring(0, 20)}...`,
              length: pkceVerifier.value.length,
              format: pkceVerifier.value.includes(".") ? "Encrypted" : "Plain",
              prefix: pkceVerifier.name.startsWith("authjs")
                ? "authjs"
                : "next-auth",
            }
          : null,
        state: state
          ? {
              value: `${state.value.substring(0, 20)}...`,
              length: state.value.length,
              format: state.value.includes(".") ? "Encrypted" : "Plain",
              prefix: state.name.startsWith("authjs") ? "authjs" : "next-auth",
            }
          : null,
        session: sessionToken
          ? {
              exists: true,
              length: sessionToken.value.length,
              prefix: sessionToken.name.startsWith("authjs")
                ? "authjs"
                : "next-auth",
            }
          : null,
      },
      allCookies: request.cookies.getAll().map((c) => ({
        name: c.name,
        length: c.value.length,
      })),
      // Group cookies by prefix for better analysis
      authCookieGroups: {
        authjs: request.cookies
          .getAll()
          .filter((c) => c.name.startsWith("authjs"))
          .map((c) => c.name),
        nextauth: request.cookies
          .getAll()
          .filter((c) => c.name.startsWith("next-auth"))
          .map((c) => c.name),
        csrf: request.cookies
          .getAll()
          .filter((c) => c.name.includes("csrf"))
          .map((c) => c.name),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error processing cookies", details: String(error) },
      { status: 500 }
    );
  }
}
