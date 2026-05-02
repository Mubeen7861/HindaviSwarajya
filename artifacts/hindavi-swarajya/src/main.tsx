import { createRoot } from "react-dom/client";
import "@fontsource/metropolis/300.css";
import "@fontsource/metropolis/400.css";
import "@fontsource/metropolis/500.css";
import "@fontsource/metropolis/600.css";
import "@fontsource/metropolis/700.css";
import "@fontsource/metropolis/800.css";
import "@fontsource/anek-devanagari/300.css";
import "@fontsource/anek-devanagari/400.css";
import "@fontsource/anek-devanagari/500.css";
import "@fontsource/anek-devanagari/600.css";
import "@fontsource/anek-devanagari/700.css";
import "@fontsource/anek-devanagari/800.css";
import "./i18n";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
