import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

export default function useIsSafari() {
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const parser = new UAParser(navigator.userAgent);
    console.log(parser.getBrowser());
    setIsSafari(
      parser.getBrowser().name?.toLowerCase()?.includes("safari") ?? false
    );
  }, []);

  return isSafari;
}
