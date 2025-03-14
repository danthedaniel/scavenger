import { useState } from "react";

import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import * as Sentry from "@sentry/nextjs";
import clsx from "clsx";
import mixpanel from "mixpanel-browser";

import { hintCount, useAppContext } from "~/components/app_context";
import { ZONES } from "~/components/map";

async function trackShare(userId: string | null) {
  await new Promise<void>((resolve) => {
    mixpanel.track(
      "Share",
      {
        distinct_id: userId,
        $insert_id: `${userId}-Share`,
      },
      {},
      () => resolve()
    );
  });
}

interface ZoneSummaryProps {
  setSelected: (index: number | null) => void;
}

function ZoneSummary({ setSelected }: ZoneSummaryProps) {
  const {
    state: { found, hints, userId },
  } = useAppContext();

  const [shareError, setShareError] = useState(false);

  const foundAny = found.length > 0;
  const foundThemAll = found.length === ZONES.length;

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
            `${"💡".repeat(hintCount(hints[index]))}${ZONES[index].emoji}`
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
      // Ignore AbortError, which is thrown when the user cancels the share dialog.
      if (error instanceof DOMException && error.name === "AbortError") return;

      console.error(error);
      Sentry.captureException(error);
      setShareError(true);
    }

    await trackShare(userId);
  }

  return (
    <div className="h-full w-full max-w-(--breakpoint-md) overflow-hidden p-8">
      <div
        className={clsx(
          "flex select-none flex-col items-center justify-center pb-4",
          foundThemAll
            ? "cursor-default"
            : "hover:cursor-pointer hover:text-blue-400"
        )}
        onClick={clickHandler}
      >
        <h1 className="text-outline font-chakra-petch text-3xl font-bold text-white">
          {foundThemAll ? "Hunt Completed!" : "Select a Zone"}
        </h1>
      </div>
      {hintsUsed === 0 && !foundAny ? (
        <p className="pb-4 text-center text-xl">
          Click on a zone to see more information about it.
        </p>
      ) : (
        <>
          <p className="pb text-md text-center">
            <span className="font-bold">{found.length}</span> /{" "}
            <span className="font-bold">{ZONES.length}</span> zones found
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
          className={clsx(
            "flex cursor-pointer flex-col items-center justify-center pt-8",
            shareError ? "text-red-400" : "text-black"
          )}
          onClick={shareHandler}
        >
          <ArrowUpOnSquareIcon className="h-12 w-12" />
          <p className="text-md text-center">Share your results!</p>
        </div>
      )}
    </div>
  );
}

export default ZoneSummary;
