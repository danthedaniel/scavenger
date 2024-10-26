import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { hintCount, useAppContext } from "./app_context";
import { REGIONS } from "./map";
import { useState } from "react";
import clsx from "clsx";

interface ZoneSummaryProps {
  setSelected: (index: number | null) => void;
}

function ZoneSummary({ setSelected }: ZoneSummaryProps) {
  const {
    state: { found, hints },
  } = useAppContext();

  const [shareError, setShareError] = useState(false);

  const foundAny = found.length > 0;
  const foundThemAll = found.length === REGIONS.length;

  const hintsUsed = hints.reduce(
    (acc, hintLevel) => acc + hintCount(hintLevel),
    0
  );

  function clickHandler() {
    if (foundThemAll) return;

    setSelected(0);
  }

  async function shareHandler() {
    if (!foundThemAll) return;

    const shareText = [
      `I completed the Golden Gate Park Scavenger Hunt!`,
      "",
      found
        .map(
          (index) =>
            `${"💡".repeat(hintCount(hints[index]))}${REGIONS[index].emoji}`
        )
        .join(""),
      "",
      "https://sfpark.gold",
    ].join("\n");

    if (!navigator.canShare({ text: shareText })) {
      setShareError(true);
      return;
    }

    setShareError(false);

    try {
      await navigator.share({ text: shareText });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div
        className={clsx([
          "flex flex-col justify-center items-center pb-4 select-none",
          foundThemAll
            ? "cursor-default"
            : "hover:cursor-pointer hover:text-blue-400",
        ])}
        onClick={clickHandler}
      >
        <h1 className="text-3xl font-bold text-white text-outline font-chakra-petch">
          {foundThemAll ? "Hunt Completed!" : "Select a Zone"}
        </h1>
      </div>
      {hintsUsed === 0 && !foundAny ? (
        <p className="pb-4 text-xl text-center">
          Click on a zone to see more information about it.
        </p>
      ) : (
        <>
          <p className="pb text-md text-center">
            <span className="font-bold">{found.length}</span> /{" "}
            <span className="font-bold">{REGIONS.length}</span> zones found
          </p>
          <p className="pb-4text-md text-center">
            <span className="text-gray-500">
              (<span className="font-bold">{hintsUsed}</span>{" "}
              {hintsUsed === 1 ? "hint" : "hints"} used)
            </span>
          </p>
        </>
      )}
      {foundThemAll && (
        <div
          className={clsx([
            "flex flex-col justify-center items-center pt-8 cursor-pointer",
            shareError ? "text-red-400" : "text-black",
          ])}
          onClick={shareHandler}
        >
          <ArrowUpOnSquareIcon className="w-12 h-12" />
          <p className="text-md text-center">Share your results!</p>
        </div>
      )}
    </div>
  );
}

export default ZoneSummary;
