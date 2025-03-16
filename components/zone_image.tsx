import { useEffect, useState } from "react";

import clsx from "clsx";

import { ZoneInfo } from "~/components/map";
import * as Stamps from "~/components/stamps";
import styles from "~/components/zone_image.module.css";

interface ZoneImageProps {
  info: ZoneInfo;
  revealed: boolean;
  setRevealed: () => void;
}

function ZoneImage({ info, revealed, setRevealed }: ZoneImageProps) {
  const [stamped, setStamped] = useState(revealed);

  useEffect(() => {
    if (!stamped) return;
    if (revealed) return;

    // Persist the revealed state once the animation is complete
    setTimeout(() => setRevealed(), 1500);
  }, [revealed, stamped, setRevealed]);

  if (!(info["image"] in Stamps)) {
    throw new Error(`Invalid zone image: ${info["image"]}`);
  }

  const Stamp = Stamps[info["image"] as keyof typeof Stamps];

  return (
    <div className="my-6 flex w-full flex-col items-center justify-center space-y-4">
      <div className="w-full border-8 p-1 bg-amber-100 border-amber-100 rounded-2xl">
        <div className="w-full border-8 border-yellow-700 border-dashed">
          {stamped ? (
            <Stamp
              className={clsx(
                "aspect-square text-stone-800 relative opacity-80",
                info["image_class"],
                revealed ? null : styles["stamp"]
              )}
            />
          ) : (
            <div className="aspect-square flex items-center justify-center font-bold text-4xl text-yellow-700">
              <span
                className={clsx("text-center cursor-pointer", styles["shake"])}
                onClick={() => setStamped(true)}
              >
                Stamp
                <br />
                Here
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ZoneImage;
