import { useMemo } from "react";
import { UAParser } from "ua-parser-js";

export default function useIsWebKit() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" &&
      new UAParser(navigator.userAgent).getEngine().name === "WebKit",
    []
  );
}
