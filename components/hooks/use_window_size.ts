import { useEffect, useState } from "react";

export function useWindowSize() {
  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries.length < 1) return;

      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  return size;
}
