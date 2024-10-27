import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { hintCount, HintLevel, useAppContext } from "../components/app_context";
import Footer from "../components/footer";
import Menu from "../components/menu";
import Map, { REGIONS } from "../components/map";
import ZoneInfo from "../components/zone_info";
import ZoneSummary from "../components/zone_summary";
import { useQuery } from "../components/hooks/use_query";
import mixpanel from "mixpanel-browser";

function trackFound(
  userId: string | null,
  index: number,
  foundCount: number,
  hintLevel: HintLevel
) {
  if (foundCount === 0) return;

  const regionInfo = REGIONS[index];
  if (!regionInfo) return;

  const eventName = [
    "Found First Region",
    "Found Second Region",
    "Found Third Region",
    "Found Fourth Region",
    "Found Fifth Region",
  ][foundCount - 1];

  mixpanel.track(eventName, {
    color: regionInfo.name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-${eventName}`,
  });
}

interface ZoneStatus {
  name: string;
  discovered_on: string;
}

function MapPage() {
  const router = useRouter();
  const code = useQuery("code");

  const {
    state: { found, hints, userId },
    addFound,
  } = useAppContext();
  const [selected, setSelected] = useState<number | null>(null);
  const [zoneStatuses, setZoneStatuses] = useState<ZoneStatus[]>([]);

  useEffect(() => {
    if (code === undefined) return;

    const index = REGIONS.findIndex((region) => region.code === code);
    if (index === -1) return;

    setSelected(index);

    if (!found.includes(index)) {
      // Record the discovery in local storage
      addFound(index);

      // Record the discovery in mixpanel
      trackFound(userId, index, found.length, hints[index]);

      // Record the discovery in supabase
      fetch("/api/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: REGIONS[index].name,
        }),
      })
        .then((res) => res.json())
        .then((data) => setZoneStatuses(data))
        .catch((err) => {
          console.error(err);
        });
    }

    // Clear code query parameter
    const newQuery = router.query;
    delete newQuery["code"];

    router.replace({
      pathname: router.pathname,
      query: newQuery,
    });
  }, [code]);

  useEffect(() => {
    fetch("/api/timestamps")
      .then((res) => res.json())
      .then((data) => setZoneStatuses(data))
      .catch((err) => {
        console.error(err);
      });
  }, [Math.floor(Date.now() / (60 * 1000))]);

  function discoveredOn(name: string) {
    const zone = zoneStatuses.find((zone) => zone.name === name);
    if (!zone) return null;

    return new Date(zone.discovered_on);
  }

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
            <ZoneInfo
              selected={selected}
              setSelected={setSelected}
              discoveredOn={discoveredOn(REGIONS[selected].name)}
            />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default MapPage;
