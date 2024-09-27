import Head from "next/head";
import { Map } from "../components/map";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const colors = ["Red", "Orange", "Yellow", "Green", "Blue"];

interface ZoneInfoProps {
  selected: number;
  setSelected: (index: number | null) => void;
}

function ZoneInfo({ selected, setSelected }: ZoneInfoProps) {
  return (
    <div className="w-full h-full p-8 overflow-hidden max-w-screen-md">
      <div className="flex flex-row justify-between items-center pb-6 select-none">
        <ArrowLeftIcon
          className={`w-8 h-8 mr-4 ${selected === 0 ? "opacity-50" : "hover:cursor-pointer hover:text-gray-400"}`}
          onClick={() => selected > 0 && setSelected(selected - 1)}
        />
        <h2 className="text-4xl font-bold">{colors[selected]} Zone</h2>
        <ArrowRightIcon
          className={`w-8 h-8 ml-4 ${selected === 4 ? "opacity-50" : "hover:cursor-pointer hover:text-gray-400"}`}
          onClick={() => selected < 4 && setSelected(selected + 1)}
        />
      </div>
      <p className="pb-4">
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
      <p className="pb-4">
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
      <h2 className="text-4xl font-bold pb-6">Select a Zone</h2>
      <p className="pb-4">Click on a zone to see more information about it.</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full text-center text-white p-4 text-sm">
      Made by{" "}
      <a href="https://danangell.com" className="underline">
        Daniel Angell
      </a>{" "}
      with 🥳
    </footer>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-w-screen min-h-screen flex flex-col justify-between items-center bg-gray-800">
      <Head>
        <title>Zen Masters of Golden Gate Park</title>
      </Head>
      {/*       <h1 className="font-chakra-petch text-white text-outline text-jumbo">
        Zen Masters
      </h1> */}

      <div className="w-full h-64 p-8 bg-blue-200 overflow-hidden">
        <Map selected={selected} setSelected={setSelected} />
      </div>

      <div className="flex flex-col w-full flex-grow justify-start items-center border-t-8 border-black text-white">
        {selected === null && <ZonePlaceholder />}
        {selected !== null && (
          <ZoneInfo selected={selected} setSelected={setSelected} />
        )}
      </div>

      <Footer />
    </div>
  );
}
