"use client";

import { useState, useEffect } from 'react';

/**
 * A client component wrapper that catches and displays errors
 * from React components with proper error boundaries
 */
export default function ErrorWrapper({ 
  children,
  fallback = "An error occurred"
}: { 
  children: React.ReactNode;
  fallback?: string | React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset error state on component mount/remount
    setHasError(false);
    setError(null);
  }, []);

  if (hasError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-700 font-medium mb-2">Component Error</h3>
        <p className="text-red-600">{error?.message || fallback}</p>
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
          }}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (e) {
    setHasError(true);
    setError(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}
