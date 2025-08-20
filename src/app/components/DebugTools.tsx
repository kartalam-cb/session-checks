"use client";

import React, { useState } from "react";
import OAuthDebugger from "./OAuthDebugger";
import PkceDisabler from "./PkceDisabler";
import ErrorWrapper from "./ErrorWrapper";
import NoPkceAuth from "./NoPkceAuth";
import ApiSessionCheck from "./ApiSessionCheck";

/**
 * Combined debugging tools panel for Azure AD B2C authentication
 */
export default function DebugTools() {
  const [activeTab, setActiveTab] = useState<"cookies" | "pkce" | "logs" | "api">("cookies");

  return (
    <ErrorWrapper>
      <div className="w-full">
        <div className="mb-4 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                className={`inline-block p-4 ${
                  activeTab === "cookies"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("cookies")}
              >
                Cookie Inspection
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 ${
                  activeTab === "pkce"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("pkce")}
              >
                PKCE Settings
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 ${
                  activeTab === "api"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("api")}
              >
                API Session
              </button>
            </li>
            <li>
              <button
                className={`inline-block p-4 ${
                  activeTab === "logs"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("logs")}
              >
                Logs
              </button>
            </li>
          </ul>
        </div>

        <div className="p-4">
          {activeTab === "cookies" && <OAuthDebugger />}
          {activeTab === "pkce" && (
            <div className="space-y-6">
              <PkceDisabler />
              <NoPkceAuth />
            </div>
          )}
          {activeTab === "api" && <ApiSessionCheck />}
          {activeTab === "logs" && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Authentication Logs</h2>
              <p className="text-gray-600">
                Console logs are available in the browser developer tools.
                Check for entries with the "[NextAuth]" prefix.
              </p>
              
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <code className="text-xs text-gray-800">
                  Press F12 to open developer tools, then select the "Console" tab.
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorWrapper>
  );
}
