import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import {
  ADB2C_AUTHORIZATION_ENDPOINT,
  ADB2C_ISSUER,
  ADB2C_TOKEN_ENDPOINT,
  ADB2C_USER_INFO_ENDPOINT,
  ADB2C_WELL_KNOWN_URL,
} from "@/config/helpers";

/**
 * Checks if an endpoint is reachable with more detailed diagnostics
 */
async function checkEndpoint(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    return {
      reachable: response.ok,
      status: response.status,
      statusText: response.statusText,
      url,
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : "Unknown error",
      url,
    };
  }
}

export async function GET() {
  // Do not expose this in production!
  // This is only for debugging purposes
  const config = {
    tenant: process.env.CB_AUTH_AZURE_AD_B2C_TENANT_ID,
    userFlow: process.env.CB_AUTH_AZURE_AD_B2C_USER_FLOW,
    clientId:
      process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID?.substring(0, 5) + "...", // Partial for security
    authEndpoint: ADB2C_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: ADB2C_TOKEN_ENDPOINT,
    userInfoEndpoint: ADB2C_USER_INFO_ENDPOINT,
    issuer: ADB2C_ISSUER,
    wellKnown: ADB2C_WELL_KNOWN_URL,
  };

  // Check if the wellKnown URL is accessible
  let wellKnownData = null;
  let wellKnownError = null;

  try {
    console.log(
      `Fetching well-known configuration from: ${ADB2C_WELL_KNOWN_URL}`
    );
    const response = await fetch(ADB2C_WELL_KNOWN_URL);

    if (!response.ok) {
      wellKnownError = `HTTP status: ${response.status} ${response.statusText}`;
      try {
        const text = await response.text();
        wellKnownError += ` - ${text.substring(0, 200)}`;
      } catch (e) {
        // Ignore error reading response body
      }
    } else {
      wellKnownData = await response.json();
      console.log("Well-known configuration retrieved successfully");
    }
  } catch (error) {
    wellKnownError = (error as Error).message;
    console.error("Error fetching well-known configuration:", error);
  }

  // Check endpoints with enhanced diagnostics
  const endpointChecks = {
    auth: await checkEndpoint(ADB2C_AUTHORIZATION_ENDPOINT),
    token: await checkEndpoint(ADB2C_TOKEN_ENDPOINT),
    userInfo: await checkEndpoint(ADB2C_USER_INFO_ENDPOINT),
  };

  // Get endpoints from well-known if available for comparison
  const wellKnownEndpoints = wellKnownData
    ? {
        auth: wellKnownData.authorization_endpoint
          ? await checkEndpoint(wellKnownData.authorization_endpoint)
          : null,
        token: wellKnownData.token_endpoint
          ? await checkEndpoint(wellKnownData.token_endpoint)
          : null,
        userInfo: wellKnownData.userinfo_endpoint
          ? await checkEndpoint(wellKnownData.userinfo_endpoint)
          : null,
      }
    : null;

  // Check if the actual issuer matches our configured issuer
  const issuerMatch = wellKnownData?.issuer === ADB2C_ISSUER;
  const issuerDetails = wellKnownData?.issuer
    ? {
        configured: ADB2C_ISSUER,
        actual: wellKnownData.issuer,
        match: ADB2C_ISSUER === wellKnownData.issuer,
      }
    : null;

  // Check if our endpoints match those from well-known
  const endpointsMatch = wellKnownData
    ? {
        authorization:
          ADB2C_AUTHORIZATION_ENDPOINT === wellKnownData.authorization_endpoint,
        token: ADB2C_TOKEN_ENDPOINT === wellKnownData.token_endpoint,
        userInfo: ADB2C_USER_INFO_ENDPOINT === wellKnownData.userinfo_endpoint,
      }
    : null;

  return NextResponse.json({
    config,
    endpoints: {
      wellKnownStatus: wellKnownError ? "Error" : "OK",
      authEndpointReachable: endpointChecks.auth.reachable,
      tokenEndpointReachable: endpointChecks.token.reachable,
      userInfoEndpointReachable: endpointChecks.userInfo.reachable,
      issuerMatch,
      endpointsMatch,
    },
    details: {
      configuredEndpoints: endpointChecks,
      wellKnownEndpoints,
      issuer: issuerDetails,
    },
    wellKnownError,
    wellKnownData,
    timestamp: new Date().toISOString(),
  });
}
