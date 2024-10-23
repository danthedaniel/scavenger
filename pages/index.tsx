import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAppContext } from "../components/app_context";
import Footer from "../components/footer";
import Menu from "../components/menu";
import Map, { REGIONS } from "../components/map";
import ZoneInfo from "../components/zone_info";
import ZoneSummary from "../components/zone_summary";
import { useQuery } from "../components/hooks/use_query";

export default function Home() {
  const router = useRouter();
  const code = useQuery("code");

  const {
    state: { found },
    addFound,
  } = useAppContext();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (code === undefined) return;

    const index = REGIONS.findIndex((region) => region.code === code);
    if (index === -1) return;

    setSelected(index);
    addFound(index);

    // Clear code query parameter
    const newQuery = router.query;
    delete newQuery["code"];

    router.replace({
      pathname: router.pathname,
      query: newQuery,
    });
  }, [code]);

  return (
    <div className="mx-auto max-w-screen-md">
      <div className="flex flex-col justify-between items-center h-full min-h-screen">
        <Head>
          <title>Zen Masters of Golden Gate Park</title>
        </Head>

        <Menu />

        <Map found={found} selected={selected} setSelected={setSelected} />

        <div className="flex flex-col w-full justify-start items-center border-t-6 border-black text-black">
          {selected === null ? (
            <ZoneSummary setSelected={setSelected} />
          ) : (
            <ZoneInfo selected={selected} setSelected={setSelected} />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
