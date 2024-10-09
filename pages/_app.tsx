import "../styles/globals.css";
import "../styles/chakra_petch.css";
import type { AppProps } from "next/app";
import { AppProvider, useAppContext } from "../components/app_context";
import { useWindowSize } from "../components/hooks/use_window_size";
import Confetti from "react-confetti";

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
      recycle={false}
      width={windowWidth}
      height={windowHeight}
      drawShape={drawStar}
      onConfettiComplete={() => hideConfetti()}
    />
  );
}

function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Component {...pageProps} />
      <ConfettiWrapper />
    </AppProvider>
  );
}

export default App;
