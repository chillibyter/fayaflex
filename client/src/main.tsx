import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeAuth } from "./lib/queryClient";

async function bootstrap() {
  try {
    await initializeAuth();
  } catch (error) {
    console.error("[App] Failed to initialize auth:", error);
  }
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
