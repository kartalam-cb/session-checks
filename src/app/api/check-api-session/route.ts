import {auth} from "@/config/auth";

export const GET = auth(async (req) => {
    console.log("API Session:", req.auth);

    return Response.json({
        message: "API Session",
        session: req.auth
    })
})