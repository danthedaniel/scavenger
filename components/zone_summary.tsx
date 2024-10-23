import { hintCount, useAppContext } from "./app_context";

interface ZoneSummaryProps {
  setSelected: (index: number | null) => void;
}

function ZoneSummary({ setSelected }: ZoneSummaryProps) {
  const {
    state: { found, hints },
  } = useAppContext();

  const foundAny = found.length > 0;
  const foundThemAll = found.length === 5;

  const hintsUsed = hints.reduce(
    (acc, hintLevel) => acc + hintCount(hintLevel),
    0
  );

  function clickHandler() {
    if (foundThemAll) return;

    setSelected(0);
  }
  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div
        className={`flex flex-col justify-center items-center pb-4 select-none ${foundThemAll ? "cursor-default" : "hover:cursor-pointer hover:text-blue-400"}`}
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
            <span className="font-bold">5</span> zones found
          </p>
          <p className="pb-4text-md text-center">
            <span className="text-gray-500">
              (<span className="font-bold">{hintsUsed}</span>{" "}
              {hintsUsed === 1 ? "hint" : "hints"} used)
            </span>
          </p>
        </>
      )}
    </div>
  );
}

export default ZoneSummary;
