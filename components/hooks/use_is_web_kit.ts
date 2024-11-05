import { useEffect, useState } from "react";

import { UAParser } from "ua-parser-js";

export default function useIsWebKit() {
  const [isWebKit, setIsWebKit] = useState(false);

  useEffect(() => {
    setIsWebKit(
      new UAParser(navigator.userAgent).getEngine().name === "WebKit"
    );
  }, []);

  return isWebKit;
}
