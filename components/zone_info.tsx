import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { hintCount, useAppContext } from "../components/app_context";
import CodeForm from "../components/code_form";
import HintBox from "../components/hint_box";
import RegionImage from "../components/region_image";
import paragraphs from "../components/paragraphs";
import { REGIONS } from "../components/map";

interface ZoneInfoProps {
  selected: number;
  setSelected: (index: number | null) => void;
}

function ZoneInfo({ selected, setSelected }: ZoneInfoProps) {
  const {
    state: { hints, found, revealedImages },
    increaseHint,
    revealImage,
  } = useAppContext();

  const regionInfo = REGIONS[selected];
  const hintLevel = hints[selected];
  const isFound = found.includes(selected);
  const imageRevealed = revealedImages.includes(selected);
  const hintsUsed = hintCount(hintLevel);

  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-row justify-between items-center pb-8 select-none">
        <ArrowLeftIcon
          className={`w-8 h-8 mr-4 ${selected === 0 ? "opacity-0" : "hover:cursor-pointer hover:text-blue-400"}`}
          onClick={() => selected > 0 && setSelected(selected - 1)}
        />
        <h1 className="text-3xl font-bold text-white text-outline font-chakra-petch">
          {regionInfo.name} Zone
        </h1>
        <ArrowRightIcon
          className={`w-8 h-8 ml-4 ${selected === 4 ? "opacity-0" : "hover:cursor-pointer hover:text-blue-400"}`}
          onClick={() => selected < 4 && setSelected(selected + 1)}
        />
      </div>

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
            reveal={() => increaseHint(selected)}
            found={isFound}
          />

          {["small", "big"].includes(hintLevel) && (
            <HintBox
              region={selected}
              hint={regionInfo.hints["big"]}
              revealed={hintLevel === "big"}
              reveal={() => increaseHint(selected)}
              found={isFound}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ZoneInfo;
