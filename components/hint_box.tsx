import { useEffect, useState } from "react";
import Button from "./button";
import paragraphs from "./paragraphs";

interface HintBoxProps {
  zone: number;
  hint: string;
  revealed: boolean;
  reveal: () => void;
  found: boolean;
}

function HintBox({ zone, hint, revealed, reveal, found }: HintBoxProps) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setPressed(false);
  }, [zone]);

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
    <div className="flex w-full flex-row justify-center">
      <Button
        text={!pressed ? "Show Hint" : "Are you sure?"}
        className="my-4 w-full max-w-72"
        onClick={clickHandler}
      />
    </div>
  );
}

export default HintBox;
