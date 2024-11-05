import type { AppProps } from "next/app";
import { useEffect } from "react";

import mixpanel from "mixpanel-browser";
import Confetti from "react-confetti";

import { AppProvider, useAppContext } from "~/components/app_context";
import { useWindowSize } from "~/components/hooks/use_window_size";
import "~/styles/chakra_petch.css";
import "~/styles/globals.css";

function ConfettiWrapper() {
  const {
    state: { confettiOnScreen },
    hideConfetti,
  } = useAppContext();
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  // Draws a star shape on the confetti canvas.
  function drawStar(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();

    const outerRadius = 10;
    const innerRadius = 5;
    const numPoints = 5;

    for (let i = 0; i < 2 * numPoints + 1; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * (Math.PI / numPoints);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }

  if (!confettiOnScreen) return null;

  return (
    <Confetti
      numberOfPieces={100}
      recycle={false}
      width={windowWidth}
      height={windowHeight}
      drawShape={drawStar}
      onConfettiComplete={() => hideConfetti()}
    />
  );
}

function Mixpanel() {
  const {
    state: { userId },
  } = useAppContext();

  useEffect(() => {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    mixpanel.identify(userId);
  }, [userId]);

  return null;
}

function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Component {...pageProps} />
      <ConfettiWrapper />
      <Mixpanel />
    </AppProvider>
  );
}

export default App;
