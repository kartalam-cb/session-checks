import { handlers } from "@/config/auth";
import { NextRequest } from "next/server";
import { debugNextAuthRequest, withDebug } from "@/config/debug";

// Create wrapped handlers with full request/response tracing
const GET = withDebug(handlers.GET, {
  // Enhanced debugging for GET requests
  logHeaders: true,
  logBody: false, // GETs don't typically have bodies
  logCookies: true,
  logSearchParams: true,
  logResponse: true,
});

const POST = withDebug(handlers.POST, {
  // Full debugging for POST requests
  logHeaders: true,
  logBody: true,
  logCookies: true,
  logSearchParams: true,
  logResponse: true,
});

export { GET, POST };
