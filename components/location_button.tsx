import { useEffect, useState } from "react";

import { MapPinIcon } from "@heroicons/react/24/outline";

class AbortError extends DOMException {
  constructor() {
    super("Operation was aborted", "AbortError");
  }
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function abortableSleep(ms: number, signal: AbortSignal) {
  return await Promise.race([
    sleep(ms),
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

interface ArcProgressCircleProps {
  className: string;
  progress: number;
}

function ArcProgressCircle({ className, progress }: ArcProgressCircleProps) {
  const radius = 50;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={className}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`${-strokeWidth} ${-strokeWidth} ${radius * 2 + strokeWidth * 2} ${radius * 2 + strokeWidth * 2}`}
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    </div>
  );
}

interface LocationButtonProps {
  setLatLong: (latLong: Position | null) => void;
}

export default function LocationButton({ setLatLong }: LocationButtonProps) {
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [buttonState, setButtonState] = useState<ButtonState>("off");
  const [progress, setProgress] = useState(1);

  // Get location when the button is pressed.
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
    pollLocation(newAbortController);
  }, [buttonState]);

  async function pollLocation(abortController: AbortController) {
    let position: GeolocationPosition;

    try {
      position = await new Promise((resolve, reject) =>
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

    setLatLong({
      y: position.coords.latitude,
      x: position.coords.longitude,
    });

    // Wait for 30 seconds, or until the sleep is aborted.
    const duration = 30000;
    try {
      await Promise.all([
        abortableSleep(duration, abortController.signal),
        animateProgress(duration, abortController.signal),
      ]);
    } catch (e) {
      if (e instanceof AbortError) {
        return;
      }

      throw e;
    }

    setButtonState("off");
    setLatLong(null);
  }

  async function animateProgress(duration: number, signal: AbortSignal) {
    const step = 100;
    setProgress(1);

    for (let i = 0; i < duration; i += step) {
      setProgress(1 - i / duration);
      await abortableSleep(step, signal);
    }
  }

  if (buttonState === "on") {
    return (
      <div
        className="absolute bottom-4 right-4 z-10"
        onClick={() => setButtonState("off")}
        aria-label="Hide Location"
      >
        <ArcProgressCircle
          className="absolute -left-1 -top-1 w-10 h-10 text-black"
          progress={progress}
        />
        <MapPinIcon className="h-8 w-8 cursor-pointer" />
      </div>
    );
  }

  if (buttonState === "error") {
    return (
      <div
        className="absolute bottom-4 right-4 z-10"
        onClick={() => setButtonState("on")}
        aria-label="Check Location"
      >
        <MapPinIcon className="h-8 w-8 cursor-pointer text-red-500" />
      </div>
    );
  }

  // buttonState === "off"
  return (
    <div
      className="absolute bottom-4 right-4 z-10"
      onClick={() => setButtonState("on")}
      aria-label="Check Location"
    >
      <MapPinIcon className="h-8 w-8 cursor-pointer text-slate-400" />
    </div>
  );
}
