import Head from "next/head";
import { useRouter } from "next/router";

import Button from "~/components/button";
import Footer from "~/components/footer";
import InfoPanel from "~/components/info_panel";

function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-(--breakpoint-md)">
      <div className="flex h-full min-h-screen flex-col items-center justify-between">
        <Head>
          <title>404 - Page Not Found</title>
        </Head>

        <InfoPanel />

        <div className="flex w-full grow flex-col items-center justify-center border-black text-black">
          <h1 className="font-chakra-petch mb-4 text-4xl font-bold">404</h1>
          <p className="mb-8 text-xl">Oops! This page doesn&apos;t exist.</p>
          <Button text="Go Home" onClick={() => router.push("/")} />
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default NotFoundPage;
