"use client";

import { useEffect, useState } from "react";

type ApiStatus = "idle" | "loading" | "success" | "error";

export default function ApiStatusChecker() {
  const [authEndpointStatus, setAuthEndpointStatus] = useState<ApiStatus>("idle");
  const [tokenEndpointStatus, setTokenEndpointStatus] = useState<ApiStatus>("idle");
  const [configStatus, setConfigStatus] = useState<ApiStatus>("idle");
  const [configData, setConfigData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiConfig = async () => {
      setConfigStatus("loading");
      try {
        const response = await fetch("/api/auth-config");
        if (!response.ok) {
          throw new Error(`Failed to fetch auth config: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setConfigData(data);
        setConfigStatus("success");
        
        // Check auth endpoint
        setAuthEndpointStatus(
          data?.details?.configuredEndpoints?.auth?.reachable ? "success" : "error"
        );
        
        // Check token endpoint
        setTokenEndpointStatus(
          data?.details?.configuredEndpoints?.token?.reachable ? "success" : "error"
        );
        
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setConfigStatus("error");
      }
    };

    checkApiConfig();
  }, []);

  const StatusIndicator = ({ status }: { status: ApiStatus }) => {
    if (status === "loading") {
      return <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse"></div>;
    } else if (status === "success") {
      return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
    } else if (status === "error") {
      return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
    }
    return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
  };

  return (
    <div className="w-full">
      <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">API Status</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <StatusIndicator status={configStatus} />
            <span>Configuration</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator status={authEndpointStatus} />
            <span>Auth Endpoint</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator status={tokenEndpointStatus} />
            <span>Token Endpoint</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {configData && configStatus === "success" && (
          <div className="mt-4">
            <details>
              <summary className="cursor-pointer text-blue-600 font-medium">
                View Configuration Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto">
                <pre className="text-xs">{JSON.stringify(configData, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
