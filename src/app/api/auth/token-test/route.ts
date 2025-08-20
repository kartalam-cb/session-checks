import { NextRequest, NextResponse } from "next/server";
import {
  ADB2C_TOKEN_ENDPOINT,
  ADB2C_ISSUER,
  ADB2C_WELL_KNOWN_URL,
} from "@/config/helpers";

/**
 * This endpoint tests the token exchange with Azure AD B2C
 * It simulates the token request that NextAuth would make
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the authorization code from the request
    const data = await request.json();
    const { code, redirectUri } = data;

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: "Redirect URI is required" },
        { status: 400 }
      );
    }

    // Get client credentials from environment variables
    const clientId = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID;
    const clientSecret = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client credentials not configured" },
        { status: 500 }
      );
    }

    // Create form data for token request
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      scope: "openid offline_access profile email",
    });

    console.log("Sending token request to:", ADB2C_TOKEN_ENDPOINT);
    console.log("Token request params:", Object.fromEntries(params.entries()));

    // Make the token request
    const response = await fetch(ADB2C_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    // Get the response
    const responseBody = await response.text();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseBody);
    } catch (e) {
      parsedResponse = { rawResponse: responseBody };
    }

    // Return the diagnostic information
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      tokenEndpoint: ADB2C_TOKEN_ENDPOINT,
      headers: Object.fromEntries(response.headers.entries()),
      response: parsedResponse,
      diagnostics: {
        issuer: ADB2C_ISSUER,
        wellKnown: ADB2C_WELL_KNOWN_URL,
        tokenEndpoint: ADB2C_TOKEN_ENDPOINT,
      },
    });
  } catch (error) {
    console.error("Token diagnostic error:", error);

    return NextResponse.json(
      {
        error: "Failed to test token exchange",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
