import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

export default function useIsWebKit() {
  const [isWebKit, setIsWebKit] = useState(false);

  useEffect(() => {
    const parser = new UAParser(navigator.userAgent);
    setIsWebKit(parser.getEngine().name === "WebKit");
  }, []);

  return isWebKit;
}
