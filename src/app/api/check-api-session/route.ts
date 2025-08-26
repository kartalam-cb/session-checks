import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/validateSession";

export const GET = async (req: NextRequest) => {
  const { session: newSession, cookies } = await getSession(
    Object.fromEntries(req.cookies.getAll().map((c) => [c.name, c.value]))
  );

  const res = NextResponse.json({
    message: "API Session",
    session: newSession,
  });

  // Set rotated session cookies (chunked)
  for (const cookie of cookies ?? []) {
    res.cookies.set({
      name: cookie.name,
      value: cookie.value,
      ...cookie.options,
    });
  }

  return res;
};
