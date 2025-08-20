// Use lowercase for tenant and user flow to match Azure B2C behavior
const tenant = process.env.CB_AUTH_AZURE_AD_B2C_TENANT_ID!.toLowerCase();
const userFlow = process.env.CB_AUTH_AZURE_AD_B2C_USER_FLOW!.toLowerCase();
const clientId = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID!;
const clientSecret = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET!;

export const sessionMaxAge = 90 * 24 * 60 * 60;
export const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

// URLs directly from the well-known configuration to ensure exact matches
export const ADB2C_WELL_KNOWN_URL = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/v2.0/.well-known/openid-configuration`;
export const ADB2C_AUTHORIZATION_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/authorize`;
export const ADB2C_TOKEN_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;
export const ADB2C_END_SESSION_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/logout`;
// Corrected path for userinfo endpoint based on well-known configuration
export const ADB2C_USER_INFO_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/openid/v2.0/userinfo`;
// Ensure exact match with the issuer from well-known configuration
export const ADB2C_ISSUER = `https://${tenant}.b2clogin.com/1f7f9ca6-d7f5-48c0-8580-7add4dd0e672/v2.0/`;

export const refreshAdb2cTokens = async (refreshToken: string) => {
  if (!tenant || !userFlow || !clientId || !clientSecret) {
    console.warn(
      "Provider token refresh skipped: missing provider configuration"
    );
    return;
  }

  const refreshTokenEndpoint = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "openid offline_access profile email",
  });

  try {
    const res = await fetch(refreshTokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to refresh B2C token: ${res.status} ${errorText}`);
      throw new Error(`Token refresh failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    return {
      access_token: data.access_token as string,
      id_token: data.id_token as string,
      refresh_token: (data.refresh_token ?? refreshToken) as string,
    };
  } catch (error) {
    console.error("Token refresh exception:", error);
    throw error;
  }
};
