import { useEffect, useState } from "react";
import Button from "./button";
import paragraphs from "./paragraphs";

interface HintBoxProps {
  region: number;
  hint: string;
  revealed: boolean;
  reveal: () => void;
  found: boolean;
}

function HintBox({ region, hint, revealed, reveal, found }: HintBoxProps) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setPressed(false);
  }, [region]);

  function clickHandler() {
    if (!pressed) {
      setPressed(true);
      return;
    }

    reveal();
  }

  if (revealed) {
    return paragraphs(hint);
  }

  if (found) return null;

  return (
    <div className="flex flex-row justify-center w-full">
      <Button
        text={!pressed ? "Show Hint" : "Are you sure?"}
        className="w-full max-w-72 my-4"
        onClick={clickHandler}
      />
    </div>
  );
}

export default HintBox;
