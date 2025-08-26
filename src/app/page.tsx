import Image from "next/image";
import Signin from "@/app/Signin";
import TriggerApi from "@/app/TriggerApi";
import { getSession } from "@/utils/validateSession";

// next-auth (v5)

export default async function Home() {
    const session = await getSession();

    console.log("Session:", session);
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

          <pre className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
            Session: {JSON.stringify(session, null, 2)}
          </pre>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Signin />
            <TriggerApi/>
        </div>
      </main>
    </div>
  );
}
