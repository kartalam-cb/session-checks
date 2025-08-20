"use client";

import { useState } from "react";
import ErrorWrapper from "@/app/components/ErrorWrapper";

export default function PkceDisabler() {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePkce = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an API endpoint to modify the auth config
      // For this demo, we'll just simulate toggling PKCE
      setDisabled(!disabled);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResult({
        status: "success",
        message: disabled ? "PKCE authentication enabled" : "PKCE authentication disabled",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorWrapper>
      <div className="w-full p-4 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">PKCE Settings</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            {disabled ? 
              "PKCE is currently disabled. This can help isolate if PKCE verification is causing auth issues." :
              "PKCE is currently enabled. This provides additional security for the authorization code flow."
            }
          </p>
          
          <button
            onClick={togglePkce}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              disabled ? 
                "bg-green-600 hover:bg-green-700" : 
                "bg-yellow-600 hover:bg-yellow-700"
            } disabled:opacity-50`}
          >
            {loading ? "Updating..." : disabled ? "Enable PKCE" : "Disable PKCE"}
          </button>
        </div>
        
        {error && (
          <div className="p-3 my-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
        
        {result && (
          <div className="p-3 my-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            {result.message}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p className="italic">
            Note: This is a demo interface. In a real implementation, this would update your NextAuth.js configuration.
          </p>
        </div>
      </div>
    </ErrorWrapper>
  );
}
