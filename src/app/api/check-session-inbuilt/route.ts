import { auth } from "@/config/entraAuth";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
  const session = req.auth;

  return NextResponse.json({
    message: "API Session",
    session,
  });
});
