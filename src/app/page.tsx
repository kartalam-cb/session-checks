import Image from "next/image";
import Signin from "@/app/Signin";
import TriggerApi from "@/app/TriggerApi";
import {auth} from "@/config/auth";
import {cookies} from "next/headers";
import ApiStatusChecker from "@/app/components/ApiStatusChecker";
import DebugTools from "@/app/components/DebugTools";

// next-auth (v5)

export default async function Home() {
    const session = await auth();

    console.log("Session:", session);
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <div className="w-full bg-white/[.06] dark:bg-black/[.05] p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <pre className="bg-black/[.05] dark:bg-white/[.06] font-mono text-xs p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Signin />
            <TriggerApi/>
        </div>
        
        <ApiStatusChecker />
        
        <div className="w-full mt-8">
          <details className="w-full">
            <summary className="cursor-pointer font-medium mb-4">
              OAuth Debugging Tools
            </summary>
            <div className="pt-2 space-y-6">
              <DebugTools />
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}
