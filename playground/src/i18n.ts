import { createI18n } from "vue-i18n";

import zh_CN from "./locales/zh-CN.yaml";
console.log("🚀 ~ zh_CN:", zh_CN);

export default createI18n({
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zh_CN,
  },
});
