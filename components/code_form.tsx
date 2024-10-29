import { useEffect, useState } from "react";
import { useAppContext } from "./app_context";
import Button from "./button";
import Input from "./input";

interface CodeFormProps {
  selected: number;
  correctCode: string;
}

function CodeForm({ selected, correctCode }: CodeFormProps) {
  const { addFound } = useAppContext();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode("");
  }, [selected]);

  useEffect(() => {
    setError(null);
  }, [code]);

  function submitHandler() {
    if (code === "") {
      setError("Empty code");
      return;
    }

    if (code !== correctCode) {
      setError("Invalid code");
      return;
    }

    addFound(selected);
  }

  return (
    <div className="flex flex-col mb-6">
      <div className="flex flex-row space-x-4 max-w-screen-md justify-center align-middle mb-2">
        <Input
          className={error === null ? "border-black" : "border-red-600"}
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
        <Button text="Submit" onClick={() => submitHandler()} />
      </div>
      {error !== null && (
        <span className="text-sm text-red-600 mb-2">{error}</span>
      )}
      <span className="text-sm text-gray-700">
        You can either enter the zone code in the field above or scan the QR
        code on the sticker.
      </span>
    </div>
  );
}

export default CodeForm;
