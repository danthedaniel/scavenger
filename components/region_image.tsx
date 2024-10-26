import { useEffect, useState } from "react";
import Image from "./image";
import { RegionInfo } from "./map";
import clsx from "clsx";

interface RegionImageProps {
  revealed: boolean;
  reveal: () => void;
  info: RegionInfo;
}

function RegionImage({ revealed, reveal, info }: RegionImageProps) {
  const [isFlipped, setIsFlipped] = useState(revealed);

  useEffect(() => {
    setIsFlipped(revealed);
  }, [revealed]);

  const handleClick = () => {
    if (revealed) return;

    setIsFlipped(true);
    reveal();
  };

  return (
    <div className="flex flex-col w-full justify-center items-center space-y-4 my-6">
      <div
        className={clsx([
          "flip-card z-0",
          isFlipped ? "flipped" : "cursor-pointer",
        ])}
        onClick={handleClick}
      >
        <div className="flip-card-inner">
          <div className="flip-card-back">
            <Image
              url="/images/unrevealed.png"
              ariaLabel="Unrevealed Image"
              className="w-full aspect-square border-4 border-black"
            />
          </div>
          <div className="flip-card-front">
            <Image
              url={info.image}
              ariaLabel={`${info.name} Zone Image`}
              className="w-full aspect-square border-4 border-black"
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

export default RegionImage;
