import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { useAppContext } from "~/components/app_context";
import { ZONES } from "~/components/map";

const INIT_DEV_MODE_TAPS = 7;

function InfoPanel() {
  const router = useRouter();
  const { resetFound, resetHints, resetRevealed, resetUserId } =
    useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [devModeTapsLeft, setDevModeTapsLeft] = useState(INIT_DEV_MODE_TAPS);

  useEffect(() => {
    setDevModeTapsLeft(INIT_DEV_MODE_TAPS);
  }, [isMenuOpen]);

  async function discover(code: string) {
    await router.replace({ pathname: `/${code}` });

    setIsMenuOpen(false);
  }

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
          ? "fixed left-0 right-0 top-0 z-50 mx-auto h-screen max-w-(--breakpoint-md)"
          : "border-b-6 h-auto w-full border-black"
      )}
    >
      <div className="flex h-20 w-full flex-row items-center justify-between px-8">
        <div className="flex flex-row items-center gap-4">
          <img
            src="/images/logo.svg"
            alt="Hippie Hill Hunt Logo"
            className="h-12 w-12"
          />

          <h1 className="font-chakra-petch text-2xl font-bold">
            Hippie Hill Hunt
          </h1>
        </div>

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
            <InformationCircleIcon
              className="h-8 w-8 cursor-pointer"
              aria-label="Open menu"
            />
          </div>
        )}
      </div>
      {isMenuOpen && devModeTapsLeft > 0 && (
        <div
          className="mt-4 flex flex-col space-y-8 px-8"
          onClick={() => setDevModeTapsLeft(Math.max(devModeTapsLeft - 1, 0))}
        >
          <p className="text-lg">
            The Hippie Hill Hunt is a fun way to explore Golden Gate Park. There
            is no need to go anywhere that costs money.
          </p>
          <p className="text-lg">
            Please stay on the paths and trails. Please respect the park as you
            search for the stickers in each zone.
          </p>
          <p className="text-lg">
            Stickers are all tucked just out of sight. They are generally found
            on benches and other flat surfaces. They are easy to find once you
            are in the right location. Each sticker has a QR code that you can
            scan to check off the zone. Alternatively, you can type the code on
            the sticker into the code box.
          </p>
        </div>
      )}
      {isMenuOpen && devModeTapsLeft === 0 && (
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

export default InfoPanel;
