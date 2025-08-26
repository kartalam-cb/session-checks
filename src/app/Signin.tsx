"use client";

import Image from "next/image";
import {signIn as signInV5} from 'next-auth/react'

export default function Signin() {
    return <>
        <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer"
            onClick={async () => {
                const response = await signInV5("azure-ad-b2c");
                console.log("Sign in v5 (B2C) response:", response);
            }}
        >
            <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
            />
            Sign in with Azure AD B2C
        </button>

        <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer"
            onClick={async () => {
                const response = await signInV5("microsoft-entra-id");
                console.log("Sign in v5 (Entra) response:", response);
            }}
        >
            <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
            />
            Sign in with Entra ID
        </button>
    </>
}