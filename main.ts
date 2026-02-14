import { initStarfield } from "./starfield";
import { router } from "./router";

initStarfield();
router();

window.addEventListener("hashchange", router);
