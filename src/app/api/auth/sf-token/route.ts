import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get("accessToken") || "";
    const userIdentifier = searchParams.get("userIdentifier") || "";

    const salesforceTokenApiUrl = new URL(
        `${process.env.CB_BFF_API_BASE_URL}/usr/${process.env.CB_BFF_API_VERSION}/${process.env.NEXT_PUBLIC_CB_MARKET_NAME}/users/${userIdentifier}/token`
    ).href;


    try {
        const response = await fetch(salesforceTokenApiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "Ocp-Apim-Subscription-Key": process.env.CB_BFF_API_APIM_SUBSCRIPTION_KEY || "",
            },
        })

        if (!response.ok) {
            throw new Error("Failed to fetch data from Salesforce token API: " + response.statusText)
        }

        const responseData = await response.json();

        if (!responseData) {
            throw new Error("No data received from Salesforce token API");
        }

        console.log("Response data from Salesforce token API:", responseData);

        const sfAccessToken = responseData.accessToken;
        return Response.json({ accessToken: sfAccessToken });
    } catch (error) {
        return NextResponse.json(
            {
                errorMessage: error,
            },
            { status: 500 }
        );
    }
}
export const revalidate = 0; // disables caching, always revalidates
