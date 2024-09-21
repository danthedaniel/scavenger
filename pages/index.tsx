import Head from "next/head";
import { Map } from "../components/map";

export default function Home() {
  return (
    <div className="min-w-screen min-h-screen flex flex-col justify-begin items-center">
      <Head>
        <title>Zen Masters</title>
      </Head>

      <h1 className="font-chakra-petch text-white text-outline text-jumbo">
        Zen Masters
      </h1>

      <div className="w-full h-full p-8 bg-gray-200 overflow-hidden">
        <Map />
      </div>
    </div>
  );
}
