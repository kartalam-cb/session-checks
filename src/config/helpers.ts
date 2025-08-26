export const tenant = process.env.CB_AUTH_AZURE_AD_B2C_TENANT_ID!;
const tenantLower = tenant?.toLowerCase?.() ?? tenant;
export const userFlow = process.env.CB_AUTH_AZURE_AD_B2C_USER_FLOW!;
export const clientId = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID!;
export const clientSecret = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET!;

export const COOKIE_AUTH_JS_SESSION_TOKEN = "auth.session-token";
export const sessionMaxAge = 90 * 24 * 60 * 60; // 90 days in seconds
export const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
export const ADB2C_WELL_KNOWN_URL = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/v2.0/.well-known/openid-configuration`;
export const ADB2C_AUTHORIZATION_ENDPOINT = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/oauth2/v2.0/authorize`;
export const ADB2C_TOKEN_ENDPOINT = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;
export const ADB2C_END_SESSION_ENDPOINT = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/oauth2/v2.0/logout`;
export const ADB2C_USER_INFO_ENDPOINT = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/oauth2/v2.0/userinfo`;
export const ADB2C_ISSUER = `https://${tenantLower}.b2clogin.com/69bc5b7b-5f86-47da-92a4-467d11cf97d6/v2.0/`;

export const refreshAdb2cTokens = async (refreshToken: string) => {
    if (!tenant || !userFlow || !clientId) {
        console.warn("Provider token refresh skipped: missing provider configuration");
        return;
    }

    const refreshTokenEndpoint = `https://${tenantLower}.b2clogin.com/${tenantLower}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });

    const res = await fetch(refreshTokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!res.ok) {
        throw new Error(`Failed to refresh B2C token: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();

    return {
        access_token: data.access_token as string,
        id_token: data.id_token as string,
        refresh_token: (data.refresh_token ?? refreshToken) as string,
    };
}