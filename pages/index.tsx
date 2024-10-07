import { useEffect, useState } from "react";
import Head from "next/head";
import { NextRouter, useRouter } from "next/router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HintLevel, useAppContext } from "../components/app_context";
import Button from "../components/button";
import Image from "../components/image";
import Input from "../components/input";
import { Map, RegionInfo, REGIONS } from "../components/map";

interface RegionImageProps {
  revealed: boolean;
  reveal: () => void;
  info: RegionInfo;
}

function RegionImage({ revealed, reveal, info }: RegionImageProps) {
  return (
    <div className="flex flex-col w-full justify-center items-center space-y-4 my-6">
      <div
        className={`flip-card z-0 ${revealed ? "flipped" : "cursor-pointer"}`}
        onClick={!revealed ? reveal : undefined} // Only clickable if not revealed
      >
        <div className="flip-card-inner">
          <div className="flip-card-back">
            <Image
              url="/unrevealed.png"
              alt="Unrevealed Image"
              className="w-full aspect-square"
            />
          </div>
          <div className="flip-card-front">
            <Image
              url={info.image}
              alt={`${info.name} Zone Image`}
              className="w-full aspect-square"
            />
          </div>
        </div>
      </div>
      <p className="text-md">
        {!revealed ? "Tap the card above to reveal" : info.image_description}
      </p>
    </div>
  );
}

const paragraphs = (text: string) => {
  return text.split("\n").map((line) => (
    <p key={line} className="text-lg mb-4">
      {line}
    </p>
  ));
};

interface HintBoxProps {
  region: number;
  hint: string;
  revealed: boolean;
  reveal: () => void;
  found: boolean;
}

function HintBox({ region, hint, revealed, reveal, found }: HintBoxProps) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setPressed(false);
  }, [region]);

  function clickHandler() {
    if (!pressed) {
      setPressed(true);
      return;
    }

    reveal();
  }

  if (revealed) {
    return paragraphs(hint);
  }

  if (found) return null;

  return (
    <div className="flex flex-row justify-center w-full">
      <Button
        text={!pressed ? "Show Hint" : "Are you sure?"}
        className="w-full max-w-72 my-4"
        onClick={clickHandler}
      />
    </div>
  );
}

interface CodeFormProps {
  selected: number;
  correctCode: string;
}

function CodeForm({ selected, correctCode }: CodeFormProps) {
  const { addFound } = useAppContext();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode("");
  }, [selected]);

  useEffect(() => {
    setError(null);
  }, [code]);

  function submitHandler() {
    if (code === "") {
      setError("Empty code");
      return;
    }

    if (code !== correctCode) {
      setError("Invalid code");
      return;
    }

    addFound(selected);
  }

  return (
    <div className="flex flex-col mb-6">
      <div className="flex flex-row space-x-4 max-w-screen-md justify-center align-middle mb-2">
        <Input
          className={error === null ? "border-black" : "border-red-600"}
          placeholder="Zone code"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitHandler();
            }
          }}
          onChange={(event) =>
            setCode(event.target.value.trim().toLocaleUpperCase())
          }
          value={code}
        />
        <Button text="Submit" className="" onClick={() => submitHandler()} />
      </div>
      {error !== null && (
        <span className="text-sm text-red-600 mb-2">{error}</span>
      )}
      <span className="text-sm text-gray-700">
        You can either enter the zone code in the field above or scan the QR
        code on the sticker.
      </span>
    </div>
  );
}

function hintCount(hintLevel: HintLevel): number {
  switch (hintLevel) {
    case "none":
      return 0;
    case "small":
      return 1;
    case "big":
      return 2;
  }
}

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
            ({hintCount(hintLevel)} hints used)
          </p>
        </>
      ) : (
        <CodeForm selected={selected} correctCode={regionInfo.code} />
      )}

      {isFound && (
        <RegionImage
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

function ZoneSummary() {
  const {
    state: { found, revealedImages, hints },
    revealImage,
  } = useAppContext();

  const foundAny = found.length > 0;
  const foundThemAll = found.length === 5;
  const hintsUsed = hints.reduce(
    (acc, hintLevel) => acc + hintCount(hintLevel),
    0
  );

  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-col justify-center items-center pb-8 select-none">
        <h1 className="text-3xl font-bold text-white text-outline font-chakra-petch">
          {foundThemAll ? "Hunt Completed!" : "Select a Zone"}
        </h1>
      </div>
      {!foundAny ? (
        <p className="pb-4 text-xl text-center">
          Click on a zone to see more information about it.
        </p>
      ) : (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold text-center">
            {foundThemAll
              ? "You've found all of the zen masters"
              : "Your discovered zen masters"}
          </h2>
          <p className="text-md pb-8">({hintsUsed} hints used)</p>

          {found
            .sort((a, b) => a - b)
            .map((index) => (
              <RegionImage
                revealed={revealedImages.includes(index)}
                reveal={() => revealImage(index)}
                info={REGIONS[index]}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full text-center text-black p-4 text-md">
      Made by{" "}
      <a href="https://danangell.com" className="underline">
        Daniel Angell
      </a>{" "}
      with ✌️
    </footer>
  );
}

function Menu() {
  const router = useRouter();
  const { resetFound, resetHints, resetRevealed } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const discover = async (code: string) => {
    await router.push({
      pathname: "/",
      query: {
        ...router.query,
        code,
      },
    });

    setIsMenuOpen(false);
  };

  const reset = () => {
    resetHints();
    resetFound();
    resetRevealed();
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`flex flex-col bg-white ${isMenuOpen ? "fixed top-0 left-0 right-0 mx-auto z-50 h-screen max-w-screen-md" : "border-b-6 border-black w-full h-auto"}`}
    >
      <div className="flex flex-row w-full h-20 justify-between items-center px-8">
        <h1 className="text-2xl font-bold">Park Scavenger Hunt</h1>
        {isMenuOpen ? (
          <div
            className="flex flex-row items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <XMarkIcon
              className="w-8 h-8 cursor-pointer"
              aria-label="Close menu"
            />
          </div>
        ) : (
          <div
            className="flex flex-row items-center"
            onClick={() => setIsMenuOpen(true)}
          >
            <Bars3Icon
              className="w-8 h-8 cursor-pointer"
              aria-label="Open menu"
            />
          </div>
        )}
      </div>
      {isMenuOpen && (
        <div className="flex flex-col space-y-8 px-8 mt-4">
          {REGIONS.map((region, index) => (
            <span
              key={index}
              className="text-md font-bold cursor-pointer"
              onClick={() => discover(region.code)}
            >
              Discover {region.name}
            </span>
          ))}
          <span
            className="text-md font-bold cursor-pointer"
            onClick={() => reset()}
          >
            Reset
          </span>
        </div>
      )}
    </div>
  );
}

function useQuery(router: NextRouter, key: string) {
  return [router.query[key]].flat()[0];
}

export default function Home() {
  const router = useRouter();
  const code = useQuery(router, "code");

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
    <div className="flex flex-col items-center bg-gray-200">
      <div className="max-w-screen-md min-h-screen flex flex-col justify-between items-center bg-gray-100">
        <Head>
          <title>Zen Masters of Golden Gate Park</title>
        </Head>

        <Menu />

        <Map found={found} selected={selected} setSelected={setSelected} />

        <div className="flex flex-col w-full flex-grow justify-start items-center border-t-6 border-black text-black">
          {selected === null ? (
            <ZoneSummary />
          ) : (
            <ZoneInfo selected={selected} setSelected={setSelected} />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
