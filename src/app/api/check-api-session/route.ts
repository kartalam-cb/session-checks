import {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import {authJsOptions} from "@/config/auth";
import {getSession} from "@/utils/validateSession";

export const GET = async (req: NextRequest) => {
    // const session = await getServerSession(authJsOptions);
    // console.log("API Session:", session);

    const {session: newSession, cookies} = await getSession();

    console.log("New API Session:", newSession);
    console.log("New API Session Cookies:", cookies);

    return Response.json({
        message: "API Session",
        session: newSession,
    })
}