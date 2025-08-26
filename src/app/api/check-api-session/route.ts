import {NextRequest, NextResponse} from "next/server";
import {getSession} from "@/utils/validateSession";

export const GET = async (req: NextRequest) => {
    const {session: newSession, cookies} = await getSession();

    const res = NextResponse.json({
        message: "API Session",
        session: newSession,
    })

    // Set rotated session cookies (chunked)
    for (const cookie of cookies ?? []) {
        res.cookies.set({
            name: cookie.name,
            value: cookie.value,
            ...cookie.options,
        } as any)
    }

    return res
}