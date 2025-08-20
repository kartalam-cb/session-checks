import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint that provides detailed information about
 * all cookies being used during authentication
 */
export async function GET(request: NextRequest) {
  // Extract all cookies from request
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};

  // Parse cookie header to get individual cookies
  cookieHeader.split("; ").forEach((cookie) => {
    const [name, value] = cookie.split("=");
    if (name && value) {
      cookies[name] = value;
    }
  });

  // Look specifically for PKCE cookies
  const pkceVerifier = request.cookies.get("authjs.pkce.code_verifier");

  // Extract PKCE info if available
  const pkceInfo = pkceVerifier
    ? {
        length: pkceVerifier.value.length,
        format: pkceVerifier.value.includes(".") ? "Encrypted" : "Plain",
        value: `${pkceVerifier.value.substring(
          0,
          10
        )}...${pkceVerifier.value.substring(pkceVerifier.value.length - 10)}`,
        error:
          pkceVerifier.value.length < 43
            ? "PKCE verifier appears to be invalid (too short)"
            : undefined,
      }
    : null;

  return NextResponse.json({
    cookies,
    pkce: pkceInfo,
    headers: {
      cookie: cookieHeader,
    },
    timestamp: new Date().toISOString(),
  });
}
