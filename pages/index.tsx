import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { hintCount, HintLevel, useAppContext } from "../components/app_context";
import Footer from "../components/footer";
import Menu from "../components/menu";
import Map, { ZONES } from "../components/map";
import ZoneInfo from "../components/zone_info";
import ZoneSummary from "../components/zone_summary";
import mixpanel from "mixpanel-browser";
import clsx from "clsx";

function throwIfNotOk(res: Response) {
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  return res;
}

function trackFound(
  userId: string | null,
  index: number,
  foundCount: number,
  hintLevel: HintLevel
) {
  if (foundCount === 0) return;

  const zoneInfo = ZONES[index];
  if (!zoneInfo) return;

  const eventName = [
    "Found First Region",
    "Found Second Region",
    "Found Third Region",
    "Found Fourth Region",
    "Found Fifth Region",
  ][foundCount - 1];

  mixpanel.track(eventName, {
    color: zoneInfo.name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-${eventName}`,
  });
}

interface ZoneStatus {
  name: string;
  discovered_on: string;
}

export interface MapPageProps {
  // Secret code for a map zone.
  code?: string;
}

function MapPage({ code }: MapPageProps) {
  const router = useRouter();

  const {
    state: { found, hints, userId },
    addFound,
  } = useAppContext();
  const [selected, setSelected] = useState<number | null>(null);
  const [zoneStatuses, setZoneStatuses] = useState<ZoneStatus[]>([]);

  useEffect(() => {
    if (code === undefined) return;

    const index = ZONES.findIndex((zone) => zone.code === code.toUpperCase());
    if (index === -1) return;

    // A small delay is necessary because of ridiculous iOS Safari issues.
    setTimeout(() => unlockZone(index), 500);
  }, [code]);

  useEffect(() => {
    fetch("/api/timestamps", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then(throwIfNotOk)
      .then((res) => res.json())
      .then((data) => setZoneStatuses(data))
      .catch((err) => console.error(err));
  }, [
    // HACK: Rerun on state updates, but only once per minute.
    Math.floor(Date.now() / (60 * 1000)),
  ]);

  function unlockZone(index: number) {
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
          name: ZONES[index].name,
        }),
      })
        .then(throwIfNotOk)
        .then((res) => res.json())
        .then((data) => setZoneStatuses(data))
        .catch((err) => console.error(err));
    }

    router.replace({ pathname: "/" });
  }

  function discoveredOn(name: string) {
    const zone = zoneStatuses.find((zone) => zone.name === name);
    if (!zone) return null;

    return new Date(zone.discovered_on);
  }

  return (
    <div className="mx-auto max-w-screen-md">
      <div className="flex h-full min-h-screen flex-col items-center justify-between">
        <Head>
          <title>Zen Masters of Golden Gate Park</title>
        </Head>

        <Menu />

        <Map found={found} selected={selected} setSelected={setSelected} />

        <div
          className={clsx([
            "border-t-6 flex w-full flex-col items-center justify-start border-black text-black",
            selected !== null && "flex-grow",
          ])}
        >
          {selected === null ? (
            <ZoneSummary setSelected={setSelected} />
          ) : (
            <ZoneInfo
              selected={selected}
              setSelected={setSelected}
              discoveredOn={discoveredOn(ZONES[selected].name)}
            />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default MapPage;
