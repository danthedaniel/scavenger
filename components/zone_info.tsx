import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { hintCount, HintLevel, useAppContext } from "./app_context";
import CodeForm from "./code_form";
import HintBox from "./hint_box";
import RegionImage from "./region_image";
import paragraphs from "./paragraphs";
import { REGIONS } from "./map";
import clsx from "clsx";
import mixpanel from "mixpanel-browser";

function trackHint(
  userId: string | null,
  regionIndex: number,
  hintLevel: HintLevel
) {
  mixpanel.track("Hint Used", {
    color: REGIONS[regionIndex].name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-Hint Used-${regionIndex}-${hintLevel}`,
  });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

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

  const regionInfo = REGIONS[selected];
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
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-row justify-between items-center mb-2 select-none">
        <ArrowLeftIcon
          className={clsx([
            "w-8 h-8 mr-4",
            selected === 0
              ? "opacity-0"
              : "hover:cursor-pointer hover:text-blue-400",
          ])}
          onClick={() => selected > 0 && setSelected(selected - 1)}
        />
        <h1 className="text-3xl font-bold text-white text-outline font-chakra-petch">
          {regionInfo.name} Zone
        </h1>
        <ArrowRightIcon
          className={clsx([
            "w-8 h-8 ml-4",
            selected === REGIONS.length - 1
              ? "opacity-0"
              : "hover:cursor-pointer hover:text-blue-400",
          ])}
          onClick={() => selected < 4 && setSelected(selected + 1)}
        />
      </div>
      <p className="text-sm mb-6 text-center">
        {discoveredOn ? `Last found ${getRelativeTime(discoveredOn)}` : ""}
      </p>
      {isFound ? (
        <>
          <h2 className="text-2xl font-bold text-center">
            You found this zone!
          </h2>
          <p className="text-md mb-14 text-center">
            ({hintsUsed} {hintsUsed === 1 ? "hint" : "hints"} used)
          </p>
        </>
      ) : (
        <CodeForm selected={selected} correctCode={regionInfo.code} />
      )}

      {isFound && (
        <RegionImage
          key={selected}
          revealed={imageRevealed}
          reveal={() => revealImage(selected)}
          info={regionInfo}
        />
      )}

      {!isFound && (
        <>
          {paragraphs(regionInfo.hints["none"])}

          <HintBox
            region={selected}
            hint={regionInfo.hints["small"]}
            revealed={["small", "big"].includes(hintLevel)}
            reveal={() => revealHint()}
            found={isFound}
          />

          {["small", "big"].includes(hintLevel) && (
            <HintBox
              region={selected}
              hint={regionInfo.hints["big"]}
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
