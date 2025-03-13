import { useEffect, useRef, useState } from "react";

import { ChevronDoubleUpIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  // Handle scroll when content expands
  useEffect(() => {
    if (!isVisible) return;
    if (!footerRef.current) return;

    // Scroll to ensure footer is visible when expanded
    const footerRect = footerRef.current.getBoundingClientRect();
    if (footerRect.bottom < window.innerHeight) return;

    window.scrollBy({
      top: footerRect.height,
      behavior: "smooth",
    });
  }, [isVisible]);

  return (
    <footer
      ref={footerRef}
      className="flex flex-col items-center justify-center"
    >
      <div className="p-2">
        <ChevronDoubleUpIcon
          className={clsx(
            "h-6 w-6 cursor-pointer transition-all duration-500 ease-in-out",
            isVisible ? "rotate-180" : "rotate-0"
          )}
          onClick={() => setIsVisible(!isVisible)}
        />
      </div>

      {isVisible && (
        <div className="text-md p-4 text-center text-black">
          Made by{" "}
          <a href="https://danangell.com" className="underline">
            Daniel Angell
          </a>{" "}
          with ✌️ &mdash;{" "}
          <span className="font-mono">
            [<a href="https://github.com/danthedaniel/scavenger">source</a>]
          </span>
        </div>
      )}
    </footer>
  );
}

export default Footer;
