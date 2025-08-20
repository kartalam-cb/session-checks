import { NextRequest, NextResponse } from "next/server";

export async function debugNextAuthRequest(req: NextRequest) {
  // Parse the request URL
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = Object.fromEntries(url.searchParams.entries());

  // Generate a unique request ID
  const requestId = Math.random().toString(36).substring(2, 9);

  // Log request details
  console.log(`\n======= NextAuth Debug [${requestId}] =======`);
  console.log(`Request path: ${path}`);
  console.log(`Request method: ${req.method}`);
  console.log(`Query parameters:`, searchParams);
  console.log(`Request headers:`, {
    "content-type": req.headers.get("content-type"),
    "user-agent": req.headers.get("user-agent"),
    host: req.headers.get("host"),
    referer: req.headers.get("referer"),
    cookie: req.headers.has("cookie") ? "[REDACTED]" : "none",
  });

  // Check for auth-specific paths
  if (path.includes("/api/auth/")) {
    console.log(`Auth path detected: ${path}`);

    // Try to read the request body if it's a POST request
    if (req.method === "POST") {
      try {
        const clone = req.clone();
        const contentType = clone.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const body = await clone.json();
          console.log("Request body (JSON):", body);
        } else if (contentType?.includes("application/x-www-form-urlencoded")) {
          const formData = await clone.formData();
          const formDataObj = Object.fromEntries(formData.entries());
          console.log("Request body (Form):", formDataObj);
        } else {
          const text = await clone.text();
          console.log(
            "Request body (Text):",
            text.substring(0, 500) + (text.length > 500 ? "..." : "")
          );
        }
      } catch (e) {
        console.log(
          "Could not parse request body:",
          e instanceof Error ? e.message : String(e)
        );
      }
    }
  }

  console.log(`================================ [${requestId}]\n`);

  return requestId;
}

/**
 * Advanced debugging options for Next.js API routes
 */
interface DebugOptions {
  logHeaders?: boolean;
  logBody?: boolean;
  logCookies?: boolean;
  logSearchParams?: boolean;
  logResponse?: boolean;
}

/**
 * Wraps a Next.js API route handler with advanced debugging capabilities
 * This provides full request/response tracing with correlated IDs
 */
export function withDebug<T>(
  handler: (request: NextRequest) => Promise<Response>,
  options: DebugOptions = {}
) {
  const {
    logHeaders = true,
    logBody = true,
    logCookies = true,
    logSearchParams = true,
    logResponse = true,
  } = options;

  return async (request: NextRequest): Promise<Response> => {
    const { method, url, nextUrl } = request;
    const requestId = Math.random().toString(36).substring(2, 9);

    console.log(`[${requestId}] Auth Request: ${method} ${nextUrl.pathname}`);

    if (logSearchParams && nextUrl.searchParams.size > 0) {
      console.log(
        `[${requestId}] Search params:`,
        Object.fromEntries(nextUrl.searchParams.entries())
      );
    }

    if (logHeaders) {
      console.log(
        `[${requestId}] Headers:`,
        Object.fromEntries(request.headers.entries())
      );
    }

    if (logCookies) {
      console.log(`[${requestId}] Cookies:`, request.cookies.getAll());
    }

    if (logBody) {
      try {
        // Clone the request to read the body without consuming it
        const clone = request.clone();
        const contentType = request.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const body = await clone.json();
          console.log(`[${requestId}] Body (JSON):`, body);
        } else if (contentType?.includes("application/x-www-form-urlencoded")) {
          const text = await clone.text();
          const params = new URLSearchParams(text);
          console.log(
            `[${requestId}] Body (Form):`,
            Object.fromEntries(params.entries())
          );
        } else if (contentType?.includes("text/")) {
          const text = await clone.text();
          console.log(
            `[${requestId}] Body (Text):`,
            text.substring(0, 1000) + (text.length > 1000 ? "..." : "")
          );
        } else if (request.body) {
          console.log(
            `[${requestId}] Body present but not parsed (${
              contentType || "unknown type"
            })`
          );
        }
      } catch (error) {
        console.log(`[${requestId}] Error reading body:`, error);
      }
    }

    const startTime = Date.now();
    let response: Response;

    try {
      response = await handler(request);

      const duration = Date.now() - startTime;
      console.log(
        `[${requestId}] Response: ${response.status} (${duration}ms)`
      );

      if (logResponse) {
        try {
          const responseClone = response.clone();
          const contentType = responseClone.headers.get("content-type");

          if (contentType?.includes("application/json")) {
            const body = await responseClone.json();
            console.log(`[${requestId}] Response body:`, body);
          } else if (contentType?.includes("text/")) {
            const text = await responseClone.text();
            console.log(
              `[${requestId}] Response text:`,
              text.substring(0, 1000) + (text.length > 1000 ? "..." : "")
            );
          }
        } catch (error) {
          console.log(`[${requestId}] Error reading response body:`, error);
        }
      }

      return response;
    } catch (error) {
      console.error(`[${requestId}] Handler error:`, error);
      throw error;
    }
  };
}

/**
 * Wraps a handler with minimal debugging (just logs the request and response status)
 */
export function withSimpleDebug(
  handler: (request: NextRequest) => Promise<Response>
) {
  return withDebug(handler, {
    logHeaders: false,
    logBody: false,
    logCookies: false,
    logResponse: false,
  });
}
