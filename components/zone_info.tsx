import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import mixpanel from "mixpanel-browser";

import { HintLevel, hintCount, useAppContext } from "~/components/app_context";
import CodeForm from "~/components/code_form";
import HintBox from "~/components/hint_box";
import { ZONES } from "~/components/map";
import paragraphs from "~/components/paragraphs";
import ZoneImage from "~/components/zone_image";

function trackHint(
  userId: string | null,
  zoneIndex: number,
  hintLevel: HintLevel
) {
  mixpanel.track("Hint Used", {
    color: ZONES[zoneIndex].name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-Hint Used-${zoneIndex}-${hintLevel}`,
  });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);

  if (diffMinutes < 1) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  }
}

interface ZoneInfoProps {
  selected: number;
  setSelected: (index: number | null) => void;
  discoveredOn: Date | null;
}

function ZoneInfo({ selected, setSelected, discoveredOn }: ZoneInfoProps) {
  const {
    state: { hints, found, revealedImages, userId },
    increaseHint,
    revealImage,
  } = useAppContext();

  const zoneInfo = ZONES[selected];
  const hintLevel = hints[selected];
  const isFound = found.includes(selected);
  const imageRevealed = revealedImages.includes(selected);
  const hintsUsed = hintCount(hintLevel);

  function revealHint() {
    if (hintLevel === "big") return;

    increaseHint(selected);
    trackHint(userId, selected, hintLevel);
  }

  return (
    <div className="h-full w-full max-w-screen-md overflow-hidden p-8">
      <div className="mb-2 flex select-none flex-row items-center justify-between">
        <ArrowLeftIcon
          className={clsx(
            "mr-4 h-8 w-8",
            selected === 0
              ? "opacity-0"
              : "hover:cursor-pointer hover:text-blue-400"
          )}
          onClick={() => setSelected(Math.max(selected - 1, 0))}
        />
        <h1 className="text-outline font-chakra-petch text-3xl font-bold text-white">
          {zoneInfo.name} Zone
        </h1>
        <ArrowRightIcon
          className={clsx(
            "ml-4 h-8 w-8",
            selected === ZONES.length - 1
              ? "opacity-0"
              : "hover:cursor-pointer hover:text-blue-400"
          )}
          onClick={() => setSelected(Math.min(selected + 1, ZONES.length - 1))}
        />
      </div>
      <p className="mb-6 text-center text-sm">
        {discoveredOn ? `Last found ${getRelativeTime(discoveredOn)}` : ""}
      </p>
      {isFound ? (
        <>
          <h2 className="text-center text-2xl font-bold">
            You found this zone!
          </h2>
          <p className="text-md mb-14 text-center">
            ({hintsUsed} {hintsUsed === 1 ? "hint" : "hints"} used)
          </p>
        </>
      ) : (
        <CodeForm selected={selected} correctCode={zoneInfo.code} />
      )}

      {isFound && (
        <ZoneImage
          key={selected}
          revealed={imageRevealed}
          reveal={() => revealImage(selected)}
          info={zoneInfo}
        />
      )}

      {!isFound && (
        <>
          <div className="mb-8 text-center">
            {paragraphs(
              zoneInfo.hints["none"],
              "font-edu-australia-precursive text-2xl mb-2"
            )}
          </div>

          <HintBox
            zone={selected}
            hint={zoneInfo.hints["small"]}
            revealed={["small", "big"].includes(hintLevel)}
            reveal={() => revealHint()}
            found={isFound}
          />

          {["small", "big"].includes(hintLevel) && (
            <HintBox
              zone={selected}
              hint={zoneInfo.hints["big"]}
              revealed={hintLevel === "big"}
              reveal={() => revealHint()}
              found={isFound}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ZoneInfo;
