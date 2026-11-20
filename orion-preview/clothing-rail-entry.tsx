import * as React from "react";
import { createRoot } from "react-dom/client";
import OrionClothingRail from "../components/clothing-rail-hero";

const mount = document.getElementById("clothing-rail-root");
if (mount) {
  createRoot(mount).render(<OrionClothingRail variant={mount.dataset.page === "home" ? "home" : "page"} />);
}
