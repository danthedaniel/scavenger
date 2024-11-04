import { MapPinIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useState } from "react";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GEOLOCATION_ERROR_CODE_NAME = {
  1: "Permission Denied",
  2: "Position Unavailable",
  3: "Timeout",
} as const;

interface Position {
  x: number;
  y: number;
}

interface LocationButtonProps {
  setLatLong: (latLong: Position | null) => void;
}

export default function LocationButton({ setLatLong }: LocationButtonProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Subscribe to location updates.
  useEffect(() => {
    if (!locationEnabled) {
      setLatLong(null);
      return;
    }

    pollLocation();
  }, [locationEnabled]);

  async function pollLocation() {
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
      setLocationEnabled(false);
      setLocationError(true);

      if (error instanceof GeolocationPositionError) {
        const code = error.code as keyof typeof GEOLOCATION_ERROR_CODE_NAME;
        const message = `${GEOLOCATION_ERROR_CODE_NAME[code]}: ${error.message}`;

        alert(message);
        console.error(message);
      }

      return;
    }

    setLocationError(false);
    setLatLong({
      y: position.coords.latitude,
      x: position.coords.longitude,
    });

    await sleep(30000);

    setLocationEnabled(false);
    setLatLong(null);
  }

  if (!locationEnabled) {
    return (
      <MapPinIcon
        className={clsx([
          "absolute z-10 bottom-4 right-4 w-8 h-8 cursor-pointer",
          locationError ? "text-red-500" : "text-slate-400",
        ])}
        onClick={() => setLocationEnabled(true)}
        aria-label="Enable Location Services"
      />
    );
  }

  return (
    <div className="absolute z-10 bottom-4 right-4">
      <div className="absolute -top-1 -left-1 animate-spin rounded-full border-b-2 border-t-2 border-slate-500 w-10 h-10"></div>
      <MapPinIcon
        className="w-8 h-8 cursor-pointer text-black"
        onClick={() => setLocationEnabled(false)}
        aria-label="Disable Location Services"
      />
    </div>
  );
}
