import Head from "next/head";
import { Map, REGIONS } from "../components/map";
import { useAppContext } from "../components/app_context";
import { useWindowSize } from "../components/hooks/use_window_size";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

interface ZoneInfoProps {
  selected: number;
  setSelected: (index: number | null) => void;
}

function ZoneInfo({ selected, setSelected }: ZoneInfoProps) {
  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-row justify-between items-center pb-6 select-none">
        <ArrowLeftIcon
          className={`w-8 h-8 mr-4 ${selected === 0 ? "opacity-0" : "hover:cursor-pointer hover:text-blue-400"}`}
          onClick={() => selected > 0 && setSelected(selected - 1)}
        />
        <h1 className="text-4xl font-bold text-white text-outline font-chakra-petch">
          {REGIONS[selected].name} Zone
        </h1>
        <ArrowRightIcon
          className={`w-8 h-8 ml-4 ${selected === 4 ? "opacity-0" : "hover:cursor-pointer hover:text-blue-400"}`}
          onClick={() => selected < 4 && setSelected(selected + 1)}
        />
      </div>
      <p className="pb-4 text-xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at
        augue iaculis molestie sed vel odio. Aliquam erat volutpat. Suspendisse
        lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula
        magna pretium vitae. Phasellus porttitor hendrerit ultricies. Fusce
        lobortis urna in quam egestas, nec posuere dui pulvinar. Praesent
        tincidunt enim non ipsum imperdiet, sit amet imperdiet nulla mollis.
        Quisque tincidunt blandit elit, vitae gravida lectus tristique non.
        Praesent turpis enim, aliquet ut ullamcorper quis, ultrices vitae
        tellus. In tempor suscipit orci eget sagittis. Aenean posuere feugiat
        lorem sed mattis. Quisque commodo feugiat turpis a fermentum. Maecenas
        ut quam aliquam, sodales ex ut, finibus arcu. Praesent consectetur
        pharetra ante eget lobortis.
      </p>
      <p className="pb-4 text-xl">
        Fusce nec pharetra lectus. Nullam at sem interdum, pellentesque mi id,
        dictum nisl. Morbi at lectus convallis, fringilla ex eu, accumsan
        tortor. Morbi tempor metus eget turpis fringilla interdum. Suspendisse
        sollicitudin libero libero, a condimentum ex congue vitae. Proin et
        fermentum dolor, vel auctor nisl. Duis hendrerit efficitur orci,
        consectetur mattis arcu egestas a. Aliquam felis erat, ultrices sit amet
        eleifend ac, aliquam ac libero. Mauris viverra vulputate ligula, quis
        dignissim nisi. Proin scelerisque nec dolor in fringilla. Nunc non
        commodo odio.
      </p>
    </div>
  );
}

function ZonePlaceholder() {
  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-col justify-center items-center pb-6 select-none">
        <h1 className="text-4xl font-bold text-white text-outline font-chakra-petch">
          Select a Zone
        </h1>
      </div>
      <p className="pb-4 text-xl">
        Click on a zone to see more information about it.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full text-center text-black p-4 text-md">
      Made by{" "}
      <a href="https://danangell.com" className="underline">
        Daniel Angell
      </a>{" "}
      with ✌️
    </footer>
  );
}

function Menu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`flex flex-col bg-white ${isMenuOpen ? "fixed top-0 left-0 z-50 h-screen w-screen" : "border-b-6 border-black w-full h-auto"}`}
    >
      <div className="flex flex-row w-full h-20 justify-between items-center px-8">
        <h1 className="text-2xl font-bold">Park Scavenger Hunt</h1>
        <div
          className="flex flex-row items-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <XMarkIcon
              className="w-8 h-8 cursor-pointer"
              aria-label="Close menu"
            />
          ) : (
            <Bars3Icon
              className="w-8 h-8 cursor-pointer"
              aria-label="Open menu"
            />
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="flex flex-col space-y-8 px-8">
          <span className="text-md font-bold">Item 1</span>
          <span className="text-md font-bold">Item 2</span>
          <span className="text-md font-bold">Item 3</span>
        </div>
      )}
    </div>
  );
}

// Draws a star shape on the confetti canvas.
function drawStar(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();

  const outerRadius = 10;
  const innerRadius = 5;
  const numPoints = 5;

  for (let i = 0; i < 2 * numPoints + 1; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * (Math.PI / numPoints);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.fill();
  ctx.closePath();
}

export default function Home() {
  const {
    state: { found },
  } = useAppContext();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [selected, setSelected] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (found.length === 0) return;

    setShowConfetti(true);
  }, [JSON.stringify(found)]);

  return (
    <div className="min-w-screen min-h-screen flex flex-col justify-between items-center bg-gray-100">
      <Head>
        <title>Zen Masters of Golden Gate Park</title>
      </Head>

      <Menu />

      <Map found={found} selected={selected} setSelected={setSelected} />

      <div className="flex flex-col w-full flex-grow justify-start items-center border-t-6 border-black text-black">
        {selected === null && <ZonePlaceholder />}
        {selected !== null && (
          <ZoneInfo selected={selected} setSelected={setSelected} />
        )}
      </div>

      {showConfetti && (
        <Confetti
          recycle={false}
          width={windowWidth}
          height={windowHeight}
          drawShape={drawStar}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      <Footer />
    </div>
  );
}
