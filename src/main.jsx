import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/fonts.css";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
