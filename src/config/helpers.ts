const tenant = process.env.CB_AUTH_AZURE_AD_B2C_TENANT_ID!;
const userFlow = process.env.CB_AUTH_AZURE_AD_B2C_USER_FLOW!;
const clientId = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_ID!;
const clientSecret = process.env.CB_AUTH_AZURE_AD_B2C_CLIENT_SECRET!;

export const sessionMaxAge = 90 * 24 * 60 * 60;
export const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;
export const ADB2C_WELL_KNOWN_URL = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/v2.0/.well-known/openid-configuration`;
export const ADB2C_AUTHORIZATION_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/authorize`;
export const ADB2C_TOKEN_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;
export const ADB2C_END_SESSION_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/logout`;
export const ADB2C_USER_INFO_ENDPOINT = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/userinfo`;
export const ADB2C_ISSUER = `https://${tenant}.b2clogin.com/69bc5b7b-5f86-47da-92a4-467d11cf97d6/v2.0/`;

export const refreshAdb2cTokens = async (refreshToken: string) => {
    if (!tenant || !userFlow || !clientId) {
        console.warn("Provider token refresh skipped: missing provider configuration");
        return;
    }

    const refreshTokenEndpoint = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${userFlow}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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