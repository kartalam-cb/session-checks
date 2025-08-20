"use client";

import { useState } from "react";

export default function ApiSessionCheck() {
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApiSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/check-api-session");
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Session Check</h2>
        
        <button
          onClick={checkApiSession}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
        >
          {loading ? "Checking..." : "Check API Session"}
        </button>
        
        {error && (
          <div className="p-3 my-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
        
        {sessionData && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Session Data:</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium">Session Status:</h4>
              <p className="text-sm mt-1">
                {sessionData.session ? 
                  "✅ Authenticated API session detected" : 
                  "❌ No authenticated session detected"}
              </p>
              
              {sessionData.session && (
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">User:</span> {sessionData.session.user?.name || "No name"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {sessionData.session.user?.email || "No email"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span> {sessionData.session.expires ? 
                      new Date(sessionData.session.expires).toLocaleString() : "Unknown"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
