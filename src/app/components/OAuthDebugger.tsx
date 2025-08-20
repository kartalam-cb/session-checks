"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CookieDebugData {
  cookies: Record<string, string>;
  pkce: {
    length: number;
    format: string;
    value: string;
    error?: string;
  } | null;
  headers: {
    cookie: string;
  };
  timestamp: string;
}

/**
 * This component captures and displays detailed debugging information
 * for OAuth2 authentication flows, especially for Azure AD B2C PKCE issues
 */
export default function OAuthDebugger() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cookieData, setCookieData] = useState<CookieDebugData | null>(null);
  const [pkceDebugData, setPkceDebugData] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Fetch PKCE cookie debug information
  const checkCookies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/cookie-debug");
      const data = await response.json();
      setCookieData(data);
    } catch (error) {
      setErrorDetails(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  // Fetch PKCE debug information
  const checkPkce = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/pkce-debug");
      const data = await response.json();
      setPkceDebugData(data);
    } catch (error) {
      setErrorDetails(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  // Force a retry of the authentication flow
  const retryAuth = () => {
    // Clear any error-related query params
    router.push("/");
  };

  return (
    <div className="w-full">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">OAuth Authentication Debugger</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={checkCookies}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Check Auth Cookies"}
          </button>
          
          <button
            onClick={checkPkce}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-300"
          >
            {loading ? "Loading..." : "Check PKCE"}
          </button>
          
          <button
            onClick={retryAuth}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry Authentication
          </button>
        </div>

        {errorDetails && (
          <div className="p-3 my-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {errorDetails}
          </div>
        )}

        {pkceDebugData && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">PKCE Cookie Status:</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(pkceDebugData, null, 2)}</pre>
            </div>
          </div>
        )}

        {cookieData && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Auth Cookies:</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(cookieData, null, 2)}</pre>
            </div>
            
            {cookieData.pkce && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">PKCE Details:</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-semibold">Format:</dt>
                    <dd>{cookieData.pkce.format}</dd>
                    <dt className="font-semibold">Length:</dt>
                    <dd>{cookieData.pkce.length} characters</dd>
                    {cookieData.pkce.error && (
                      <>
                        <dt className="font-semibold text-red-600">Error:</dt>
                        <dd className="text-red-600">{cookieData.pkce.error}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium mb-2">Common Azure AD B2C Issues:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>PKCE code verifier cookie missing or malformed</li>
            <li>Redirect URI mismatch between request and callback</li>
            <li>State cookie mismatch or expired</li>
            <li>Azure AD B2C policy (user flow) configuration issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
