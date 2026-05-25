import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/fonts.css";
import "./index.css";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
