import fs from "node:fs";
import url from "node:url";
import * as compilersfc from "@vue/compiler-sfc";

import { VueSetupScriptTransform } from "./transformation/vue-setup-script.js";

const fileUrl = url.fileURLToPath(new URL("../playground/src/App.vue", import.meta.url).href);
const result = fs.readFileSync(fileUrl, {
  encoding: "utf-8",
});

const sfc = compilersfc.parse(result, {
  sourceMap: false,
  filename: "App.vue",
});
const content = sfc.descriptor.scriptSetup?.content || "";

const code = new VueSetupScriptTransform().transform(content);
console.log("🚀 ~ code:", code);
