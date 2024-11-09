import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { QrCodeIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import Button from "~/components/button";
import Camera from "~/components/camera";
import Input from "~/components/input";

interface CodeFormProps {
  selected: number;
  correctCode: string;
}

function CodeForm({ selected, correctCode }: CodeFormProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    setCode("");
  }, [selected]);

  useEffect(() => {
    setError(null);
  }, [code]);

  function handleScan(qrData: string) {
    setShowCamera(false);

    let url: URL | null = null;
    try {
      url = new URL(qrData);
    } catch (err) {
      setError("Invalid QR code");
      return;
    }

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.host !== window.location.host ||
      !url.pathname.match(/\/[A-Z]+/)
    ) {
      setError("Invalid QR code");
      return;
    }

    const code = url.pathname.slice(1);
    if (code !== correctCode) {
      setError("Invalid code");
      return;
    }

    router.push(`/${code}`);
  }

  function submitHandler() {
    if (code === "") {
      setError("Empty code");
      return;
    }

    if (code !== correctCode) {
      setError("Invalid code");
      return;
    }

    router.push(`/${code}`);
  }

  return (
    <div className="mb-10 flex flex-col">
      {showCamera && (
        <Camera onClose={() => setShowCamera(false)} onScan={handleScan} />
      )}
      <div className="mb-2 flex flex-row justify-center align-middle space-x-6">
        <div className="flex flex-row w-full space-x-2">
          <Button icon={QrCodeIcon} onClick={() => setShowCamera(true)} />
          <Input
            className={clsx(error === null ? "border-black" : "border-red-600")}
            placeholder="Zone code"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitHandler();
              }
            }}
            onChange={(event) =>
              setCode(event.target.value.trim().toLocaleUpperCase())
            }
            value={code}
          />
        </div>
        <Button text="Unlock" onClick={submitHandler} />
      </div>
      {error !== null && (
        <span className="mb-2 text-sm text-red-600">{error}</span>
      )}
      <span className="text-sm text-gray-700">
        You can either enter the zone code in the field above or scan the QR
        code on the sticker.
      </span>
    </div>
  );
}

export default CodeForm;
