import { useState } from "react";
import { useRouter } from "next/router";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "./app_context";
import { ZONES } from "./map";
import clsx from "clsx";

function Menu() {
  const router = useRouter();
  const { resetFound, resetHints, resetRevealed, resetUserId } =
    useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const discover = async (code: string) => {
    await router.push({ pathname: `/${code}` });

    setIsMenuOpen(false);
  };

  function reset() {
    resetHints();
    resetFound();
    resetRevealed();
    resetUserId();
    setIsMenuOpen(false);
  }

  return (
    <div
      className={clsx(
        "flex flex-col bg-white",
        isMenuOpen
          ? "fixed left-0 right-0 top-0 z-50 mx-auto h-screen max-w-screen-md"
          : "border-b-6 h-auto w-full border-black"
      )}
    >
      <div className="flex h-20 w-full flex-row items-center justify-between px-8">
        <h1 className="font-chakra-petch text-2xl font-bold">
          Park Scavenger Hunt
        </h1>
        {isMenuOpen ? (
          <div
            className="flex flex-row items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <XMarkIcon
              className="h-8 w-8 cursor-pointer"
              aria-label="Close menu"
            />
          </div>
        ) : (
          <div
            className="flex flex-row items-center"
            onClick={() => setIsMenuOpen(true)}
          >
            <Bars3Icon
              className="h-8 w-8 cursor-pointer"
              aria-label="Open menu"
            />
          </div>
        )}
      </div>
      {isMenuOpen && (
        <div className="mt-4 flex flex-col space-y-8 px-8">
          {ZONES.map((zoneInfo, index) => (
            <span
              key={index}
              className="text-md cursor-pointer font-bold"
              onClick={() => discover(zoneInfo.code)}
            >
              Discover {zoneInfo.name}
            </span>
          ))}
          <span
            className="text-md cursor-pointer font-bold"
            onClick={() => reset()}
          >
            Reset
          </span>
        </div>
      )}
    </div>
  );
}

export default Menu;
