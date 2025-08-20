"use client";

import Image from "next/image";
import { useState } from "react";

export default function TriggerApi() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const triggerApi = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiResponse = await fetch("/api/check-api-session");
            if (!apiResponse.ok) {
                throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
            }
            const data = await apiResponse.json();
            console.log("API response:", data);
            setResponse(data);
        } catch (err) {
            console.error("API request failed:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-md">
            <button
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={triggerApi}
                disabled={loading}
            >
                {loading ? (
                    <span className="animate-pulse">Loading...</span>
                ) : (
                    <>
                        <Image
                            className="dark:invert"
                            src="/vercel.svg"
                            alt="Vercel logomark"
                            width={20}
                            height={20}
                        />
                        Trigger API
                    </>
                )}
            </button>
            
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                </div>
            )}
            
            {response && !error && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-60">
                    <h3 className="font-medium mb-2 text-sm">API Response:</h3>
                    <pre className="text-xs">{JSON.stringify(response, null, 2)}</pre>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium">
                            Session Status: {" "}
                            {response.session ? (
                                <span className="text-green-600">✓ Authenticated</span>
                            ) : (
                                <span className="text-red-600">✗ Not authenticated</span>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}