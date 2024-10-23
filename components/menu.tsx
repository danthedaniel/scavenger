import { useState } from "react";
import { useRouter } from "next/router";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../components/app_context";
import { REGIONS } from "../components/map";
import clsx from "clsx";

function Menu() {
  const router = useRouter();
  const { resetFound, resetHints, resetRevealed, resetUserId } =
    useAppContext();
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
    resetUserId();
    setIsMenuOpen(false);
  };

  return (
    <div
      className={clsx(
        "flex flex-col bg-white",
        isMenuOpen
          ? "fixed top-0 left-0 right-0 mx-auto z-50 h-screen max-w-screen-md"
          : "border-b-6 border-black w-full h-auto"
      )}
    >
      <div className="flex flex-row w-full h-20 justify-between items-center px-8">
        <h1 className="text-2xl font-bold font-chakra-petch">
          Park Scavenger Hunt
        </h1>
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

export default Menu;
