"use client";

import Image from "next/image";

export default function TriggerApi() {
  return (
    <>
      <button
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer"
        onClick={async () => {
          const response = await fetch("/api/check-api-session");
          const data = await response.json();
          console.log("API response:", data);
        }}
      >
        <Image
          className="dark:invert"
          src="/vercel.svg"
          alt="Vercel logomark"
          width={20}
          height={20}
        />
        Trigger API
      </button>

      <button
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto cursor-pointer"
        onClick={async () => {
          const response = await fetch("/api/check-session-inbuilt");
          const data = await response.json();
          console.log("API response:", data);
        }}
      >
        <Image
          className="dark:invert"
          src="/vercel.svg"
          alt="Vercel logomark"
          width={20}
          height={20}
        />
        Trigger API with inbuilt functions
      </button>
    </>
  );
}
