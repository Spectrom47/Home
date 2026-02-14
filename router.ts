import { renderHome } from "./pages/home";
import { renderLore } from "./pages/lore";

export function router() {
  const app = document.getElementById("app")!;
  const hash = window.location.hash;

  if (hash === "#/lore") {
    app.innerHTML = renderLore();
  } else {
    app.innerHTML = renderHome();
  }
}
