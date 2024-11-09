import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import clsx from "clsx";
import mixpanel from "mixpanel-browser";

import { HintLevel, hintCount, useAppContext } from "~/components/app_context";
import Footer from "~/components/footer";
import InfoPanel from "~/components/info_panel";
import Map, { ZONES } from "~/components/map";
import ZoneInfo from "~/components/zone_info";
import ZoneSummary from "~/components/zone_summary";

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

  const timestamp = Math.floor(Date.now() / (60 * 1000));

  useEffect(() => {
    if (code === undefined) return;

    const index = ZONES.findIndex((zone) => zone.code === code.toUpperCase());
    if (index === -1) return;

    // A small delay is necessary because of ridiculous iOS Safari issues.
    setTimeout(() => unlockZone(index), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    fetchZoneStatuses();
  }, [
    // HACK: Rerun on state updates, but only once per minute.
    timestamp,
  ]);

  async function fetchZoneStatuses() {
    try {
      const response = await fetch("/api/timestamps", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        console.error(response.statusText);
        return;
      }

      setZoneStatuses(await response.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function unlockZone(index: number) {
    setSelected(index);

    if (!found.includes(index)) {
      // Record the discovery in local storage
      addFound(index);

      // Record the discovery in mixpanel
      trackFound(userId, index, found.length, hints[index]);

      // Record the discovery in supabase
      try {
        const response = await fetch("/api/discover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: ZONES[index].name,
          }),
        });
        if (!response.ok) {
          console.error(response.statusText);
          return;
        }

        setZoneStatuses(await response.json());
      } catch (e) {
        console.error(e);
      }
    }

    await router.replace({ pathname: "/" });
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
          <title>Golden Gate Park Scavenger Hunt</title>
        </Head>

        <InfoPanel />

        <Map found={found} selected={selected} setSelected={setSelected} />

        <div
          className={clsx(
            "border-t-6 flex w-full flex-col items-center justify-start border-black text-black",
            selected !== null && "flex-grow"
          )}
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
