import { MapPinIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

class AbortError extends DOMException {
  constructor() {
    super("Operation was aborted", "AbortError");
  }
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates an abortable version of any Promise
 */
async function makeAbortable<T>(promise: Promise<T>, signal: AbortSignal) {
  if (!signal) return promise;

  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => {
        reject(new AbortError());
      });
    }),
  ]);
}

const GEOLOCATION_ERROR_CODE_NAME = {
  1: "Permission Denied",
  2: "Position Unavailable",
  3: "Timeout",
} as const;

type ButtonState = "off" | "on" | "error";

interface Position {
  x: number;
  y: number;
}

interface LocationButtonProps {
  setLatLong: (latLong: Position | null) => void;
}

export default function LocationButton({ setLatLong }: LocationButtonProps) {
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [buttonState, setButtonState] = useState<ButtonState>("off");

  useEffect(() => {
    if (abortController) {
      abortController.abort(new AbortError());
      setAbortController(null);
    }

    if (buttonState !== "on") {
      setLatLong(null);
      return;
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    pollLocation(newAbortController).catch((e: unknown) => {
      if (e instanceof AbortError) {
        return;
      }

      throw e;
    });
  }, [buttonState]);

  async function pollLocation(abortController: AbortController) {
    let position: GeolocationPosition;

    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 10000,
          timeout: 10000,
          enableHighAccuracy: false,
        })
      );
    } catch (error: unknown) {
      setButtonState("error");

      if (error instanceof GeolocationPositionError) {
        const code = error.code as keyof typeof GEOLOCATION_ERROR_CODE_NAME;
        const message = `${GEOLOCATION_ERROR_CODE_NAME[code]}: ${error.message}`;

        alert(message);
        console.error(message);
      }

      return;
    }

    setButtonState("on");
    setLatLong({
      y: position.coords.latitude,
      x: position.coords.longitude,
    });

    await makeAbortable(sleep(30000), abortController.signal);

    setButtonState("off");
    setLatLong(null);
  }

  if (buttonState === "off") {
    return (
      <div
        className="absolute bottom-4 right-4 z-10"
        onClick={() => setButtonState("on")}
        aria-label="Show Location"
      >
        <MapPinIcon className="h-8 w-8 cursor-pointer text-slate-400" />
      </div>
    );
  }

  if (buttonState === "error") {
    return (
      <div
        className="absolute bottom-4 right-4 z-10"
        onClick={() => setButtonState("on")}
        aria-label="Show Location"
      >
        <MapPinIcon className="h-8 w-8 cursor-pointer text-red-500" />
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-10"
      onClick={() => setButtonState("off")}
      aria-label="Hide Location"
    >
      <div className="absolute -left-1 -top-1 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-slate-500"></div>
      <MapPinIcon className="h-8 w-8 cursor-pointer text-black" />
    </div>
  );
}
