"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Signin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [configStatus, setConfigStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [configData, setConfigData] = useState<any>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    // Check auth configuration on mount
    useEffect(() => {
        const checkConfig = async () => {
            try {
                const response = await fetch('/api/auth-config');
                const data = await response.json();
                setConfigData(data);
                
                // Check if there are any issues with the endpoints
                if (data.wellKnownStatus === 'Error' || 
                    !data.endpoints?.authEndpointReachable || 
                    !data.endpoints?.tokenEndpointReachable ||
                    !data.endpoints?.issuerMatch) {
                    setConfigStatus('error');
                } else {
                    setConfigStatus('success');
                }
            } catch (err) {
                console.error('Error checking auth config:', err);
                setConfigStatus('error');
            }
        };
        
        checkConfig();
    }, []);

    const handleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log("Starting Azure AD B2C sign-in...");
            
            const response = await signIn("azure-ad-b2c", {
                redirect: false,
                callbackUrl: "/",
            });
            
            console.log("Sign in response:", response);
            
            if (response?.error) {
                setError(`Authentication error: ${response.error}`);
            } else if (response?.url) {
                // Successful redirect
                window.location.href = response.url;
            }
        } catch (err) {
            console.error("Sign-in error:", err);
            setError(err instanceof Error ? err.message : "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    const checkWellKnown = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/auth-config');
            const data = await response.json();
            setConfigData(data);
            
            // Check for configuration issues
            if (data.wellKnownError || 
                !data.endpoints?.authEndpointReachable || 
                !data.endpoints?.tokenEndpointReachable ||
                !data.endpoints?.issuerMatch) {
                setConfigStatus('error');
                setError(`Configuration issues detected. See diagnostics for details.`);
            } else {
                setConfigStatus('success');
                setError(null);
            }
        } catch (err) {
            console.error('Error checking well-known endpoint:', err);
            setError('Failed to check configuration');
            setConfigStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {configStatus === 'loading' && (
                <div className="text-blue-500 text-sm mb-4">Checking authentication configuration...</div>
            )}
            
            {configStatus === 'error' && (
                <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded-md">
                    <p>There might be an issue with the authentication configuration.</p>
                    <button 
                        className="ml-2 underline text-blue-500"
                        onClick={checkWellKnown}
                    >
                        Retry Check
                    </button>
                    <button 
                        className="ml-4 underline text-blue-500"
                        onClick={() => setShowDiagnostics(!showDiagnostics)}
                    >
                        {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                    </button>
                </div>
            )}
            
            {showDiagnostics && configData && (
                <div className="w-full max-w-3xl p-4 text-xs bg-gray-100 rounded-md overflow-auto">
                    <h3 className="font-bold">Configuration Diagnostics:</h3>
                    <ul className="mt-2 space-y-1">
                        <li>Well-known endpoint: {configData.endpoints?.wellKnownStatus === 'OK' ? '✅' : '❌'}</li>
                        <li>Auth endpoint reachable: {configData.endpoints?.authEndpointReachable ? '✅' : '❌'}</li>
                        <li>Token endpoint reachable: {configData.endpoints?.tokenEndpointReachable ? '✅' : '❌'}</li>
                        <li>User info endpoint reachable: {configData.endpoints?.userInfoEndpointReachable ? '✅' : '❌'}</li>
                        <li>Issuer matches well-known: {configData.endpoints?.issuerMatch ? '✅' : '❌'}</li>
                    </ul>
                    
                    {configData.wellKnownError && (
                        <div className="mt-2">
                            <p className="font-bold text-red-500">Well-known Error:</p>
                            <pre className="mt-1 p-2 bg-red-50 rounded overflow-auto">{configData.wellKnownError}</pre>
                        </div>
                    )}
                    
                    <div className="mt-4">
                        <p className="font-bold">Configuration Values:</p>
                        <pre className="mt-1 p-2 bg-white rounded overflow-auto">{JSON.stringify(configData.config, null, 2)}</pre>
                    </div>
                    
                    {configData.wellKnownData && (
                        <div className="mt-4">
                            <p className="font-bold">Well-known Data:</p>
                            <div className="mt-1 flex gap-2">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(configData.wellKnownData, null, 2));
                                        alert('Copied to clipboard!');
                                    }}
                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                                >
                                    Copy
                                </button>
                                <button 
                                    onClick={() => window.open(configData.config.wellKnown, '_blank')}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                                >
                                    Open URL
                                </button>
                            </div>
                            <pre className="mt-1 p-2 bg-white rounded max-h-60 overflow-auto">{JSON.stringify(configData.wellKnownData, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
            
            <button
                className={`rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer ${
                    loading ? "opacity-70" : ""
                }`}
                onClick={handleSignIn}
                disabled={loading}
            >
                {loading ? (
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                ) : (
                    <Image
                        className="dark:invert"
                        src="/vercel.svg"
                        alt="Vercel logomark"
                        width={20}
                        height={20}
                    />
                )}
                {loading ? "Signing in..." : "Sign in with Azure AD B2C"}
            </button>
            
            {error && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
}