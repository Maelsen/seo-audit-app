import { writeFileSync } from "node:fs";
import { pageChrome, PAGE_HEIGHT_MM, PAGE_WIDTH_MM } from "../src/lib/editor/page-builders";

const template = {
  id: "m3-chrome",
  name: "M3 Chrome Smoke",
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pages: [
    {
      id: "chrome-only",
      name: "Chrome Only",
      background: "#1a1a1a",
      width: PAGE_WIDTH_MM,
      height: PAGE_HEIGHT_MM,
      blocks: pageChrome(),
    },
  ],
};
writeFileSync("data/templates/m3-chrome.json", JSON.stringify(template, null, 2));
console.log("wrote data/templates/m3-chrome.json");
