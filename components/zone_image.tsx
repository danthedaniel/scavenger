import clsx from "clsx";

import Image from "~/components/image";
import { ZoneInfo } from "~/components/map";

interface ZoneImageProps {
  revealed: boolean;
  reveal: () => void;
  info: ZoneInfo;
}

function ZoneImage({ revealed, reveal, info }: ZoneImageProps) {
  function handleClick() {
    if (revealed) return;

    reveal();
  }

  return (
    <div className="my-6 flex w-full flex-col items-center justify-center space-y-4">
      <div
        className={clsx(
          "flip-card z-0",
          revealed ? "flipped" : "cursor-pointer"
        )}
        onClick={handleClick}
      >
        <div className="flip-card-inner">
          <div className="flip-card-back">
            <Image
              url="/images/unrevealed.png"
              alt="Unrevealed Image"
              ariaLabel="Unrevealed Image"
              className="aspect-square w-full border-4 border-black"
            />
          </div>
          <div className="flip-card-front">
            <Image
              url={info.image}
              alt={`${info.name} Zone Image`}
              ariaLabel={`${info.name} Zone Image`}
              className="aspect-square w-full border-4 border-black"
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

export default ZoneImage;
