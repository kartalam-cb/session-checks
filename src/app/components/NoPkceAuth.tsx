"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * This component provides a button to disable PKCE for testing purposes
 */
export default function NoPkceAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<"no-pkce" | "default" | "nonce" | "basic" | "direct">("no-pkce");

  const handleSignInWithCustomOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      // This manually triggers the sign-in process with custom parameters
      switch (selectedOption) {
        case "no-pkce":
          // Attempt to sign in without PKCE
          await signIn("azure-ad-b2c", {
            callbackUrl: "/",
            // The redirect: false prevents the page from redirecting immediately
            redirect: false,
            checks: ["state"], // Only use state, not PKCE
          });
          break;
        
        case "nonce":
          // Use nonce instead of PKCE
          await signIn("azure-ad-b2c", {
            callbackUrl: "/",
            redirect: false,
            checks: ["nonce", "state"], // Use nonce and state, not PKCE
          });
          break;
        
        case "basic":
          // Most basic authentication, just with state
          await signIn("azure-ad-b2c", {
            callbackUrl: "/",
            redirect: false,
            checks: ["state"], // Only use state
            authorization: { params: { response_type: "code" } },
          });
          break;
          
        case "direct":
          // Direct auth with minimal parameters
          await signIn("azure-ad-b2c", {
            callbackUrl: "/",
            redirect: true, // Actually redirect immediately
            checks: [], // No security checks
          });
          break;
        
        case "default":
        default:
          // Regular sign in with PKCE (for comparison)
          await signIn("azure-ad-b2c", {
            callbackUrl: "/",
            redirect: false,
          });
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <p className="text-sm mb-3">
          <strong>Advanced Debugging:</strong> Test authentication with different security options to isolate issues.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Authentication Method:</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value as any)}
            disabled={loading}
          >
            <option value="no-pkce">Without PKCE (State Only)</option>
            <option value="nonce">With Nonce (No PKCE)</option>
            <option value="basic">Basic Auth Code Flow</option>
            <option value="direct">Direct Auth (No Checks)</option>
            <option value="default">Default (With PKCE)</option>
          </select>
        </div>
        
        <button
          onClick={handleSignInWithCustomOptions}
          disabled={loading}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-yellow-300"
        >
          {loading ? "Signing in..." : `Sign in ${selectedOption === 'default' ? 'with PKCE' : 'with custom options'}`}
        </button>
        
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
            {error}
          </div>
        )}
        
        <p className="mt-3 text-xs text-yellow-700">
          Note: These options modify how the authentication process works to help diagnose issues.
          Do not use in production environments.
        </p>
      </div>
    </div>
  );
}
