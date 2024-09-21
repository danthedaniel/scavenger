import Head from "next/head";
import { Map } from "../components/map";

export default function Home() {
  return (
    <div className="min-w-screen min-h-screen p-8 bg-gray-100 flex flex-col justify-center items-center">
      <Head>
        <title>Zen Masters</title>
      </Head>

      <Map />
    </div>
  );
}
