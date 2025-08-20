"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ErrorActions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDebugging, setShowDebugging] = useState(false);
  
  const error = searchParams?.get("error");
  const isPkceError = error === "CallbackRouteError" && 
                      searchParams?.get("error_description")?.includes("PKCE");
  
  const handleReturnHome = () => {
    router.push('/');
  };
  
  const handleTryAgain = () => {
    // Clear any error-related query params and redirect to sign in
    router.push('/');
  };
  
  const handleTryWithoutPkce = () => {
    // Navigate to debugging tools with PKCE tab active
    router.push('/?debug=pkce');
  };
  
  const handleViewDebugging = () => {
    setShowDebugging(true);
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          onClick={handleTryAgain}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        
        <button 
          onClick={handleReturnHome}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
      
      {isPkceError && (
        <div className="mt-4">
          <button
            onClick={handleTryWithoutPkce}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Try Authentication Debugging Tools
          </button>
          
          <p className="mt-2 text-xs text-gray-500 text-center">
            This will take you to the debugging tools where you can test different authentication methods.
          </p>
        </div>
      )}
      
      {!showDebugging && (
        <div className="mt-4 text-center">
          <button
            onClick={handleViewDebugging}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View debugging options
          </button>
        </div>
      )}
      
      {showDebugging && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium mb-3 text-gray-700">Debugging Suggestions</h3>
          
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check if cookies are being properly set (especially for PKCE and state verification)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Verify that the redirect URI matches exactly what's configured in Azure AD B2C</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Try authentication with different security options (PKCE, nonce, or basic)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check browser console for detailed authentication errors</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Ensure your browser isn't blocking third-party cookies</span>
            </li>
          </ul>
          
          <div className="mt-4">
            <button
              onClick={() => router.push('/?debug=true')}
              className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
            >
              Open Comprehensive Debugging Tools
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
