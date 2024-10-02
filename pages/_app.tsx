import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AppProvider } from "../components/app_context";

function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default App;
