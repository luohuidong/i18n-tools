import parser from "@babel/parser";
import generator from "@babel/generator";
import traverse from "@babel/traverse";
import types from "@babel/types";
import crypto from "node:crypto";
import template from "@babel/template";

export class VueSetupScriptTransform {
  constructor() {}

  #containsChinese(str: string) {
    return /[\u4e00-\u9fa5]/.test(str);
  }

  #hasImportI18n = false;

  #importI18n(path: traverse.NodePath) {
    if (this.#hasImportI18n) return;

    const programPath = path.findParent((path) =>
      path.isProgram()
    ) as traverse.NodePath<types.Program>;
    console.log("🚀 ~ VueSetupScriptTransform ~ #importI18n ~ programPath:", programPath);

    // if vue-i18n is already imported, then stop traversing
    traverse.default(programPath.node, {
      ImportDeclaration: (path) => {
        if (path.node.source.value === "vue-i18n") {
          this.#hasImportI18n = true;
          path.stop();
        }
      },
    });

    // if vue-i18n is not imported, then import it
    if (!this.#hasImportI18n) {
      const importI18n = template.default(
        'import { useI18n } from "vue-i18n";'
      )() as types.Statement;
      programPath.node.body.unshift(importI18n);

      traverse.default(programPath.node, {
        ImportDeclaration: (path) => {
          const nextSibling = path.getNextSibling();
          if (!nextSibling.isImportDeclaration()) {
            nextSibling.insertBefore(
              template.default("const { t } = useI18n()")() as types.Statement
            );
          }
        },
      });
    }
  }

  transform(scriptContent: string) {
    const ast = parser.parse(scriptContent, {
      sourceType: "unambiguous",
      plugins: ["typescript"],
    });

    traverse.default(ast, {
      StringLiteral: (path) => {
        const value = path.node.value;
        if (this.#containsChinese(value)) {
          this.#importI18n(path);
          const hash = crypto.createHash("md5").update(value).digest("hex");
          path.replaceWith(types.stringLiteral(`t(${hash})`));
        }
      },
    });

    const code = generator.default(ast).code;
    return code;
  }
}
