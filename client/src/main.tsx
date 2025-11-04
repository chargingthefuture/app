import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppClerkProvider } from "./components/clerk-provider";

// Initialize theme from localStorage before rendering
const storedTheme = localStorage.getItem("theme-preference");
if (storedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <AppClerkProvider>
    <App />
  </AppClerkProvider>
);
