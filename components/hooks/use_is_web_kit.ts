import { useMemo } from "react";
import { UAParser } from "ua-parser-js";

export default function useIsWebKit() {
  return useMemo(
    () => new UAParser(navigator.userAgent).getEngine().name === "WebKit",
    []
  );
}
