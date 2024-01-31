import parser from "@babel/parser";
import generator from "@babel/generator";
import traverse from "@babel/traverse";
import types, { Statement } from "@babel/types";
import crypto from "node:crypto";
import template from "@babel/template";

export class VueSetupScriptTransform {
  #recordMap: Map<string, string> = new Map();
  #hasImportI18n = false;

  #containsChinese(str: string) {
    return /[\u4e00-\u9fa5]/.test(str);
  }

  #generateTextHash(str: string) {
    const hash = crypto.createHash("md5").update(str).digest("hex");
    this.#recordMap.set(hash, str);
    return hash;
  }

  #importI18n(path: traverse.NodePath) {
    if (this.#hasImportI18n) return;

    const programPath = path.findParent((path) =>
      path.isProgram()
    ) as traverse.NodePath<types.Program>;

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
    const startTime = process.hrtime.bigint();

    const ast = parser.parse(scriptContent, {
      sourceType: "unambiguous",
      plugins: ["typescript"],
    });

    traverse.default(ast, {
      StringLiteral: (path) => {
        const value = path.node.value;
        if (this.#containsChinese(value)) {
          this.#importI18n(path);
          const newAst = template.default(`t("${this.#generateTextHash(value)}")`)() as Statement;
          path.replaceWith(newAst);
        }
      },
      TemplateLiteral: (path) => {
        if (!path.node.quasis.some((item) => this.#containsChinese(item.value.raw))) {
          return;
        }

        const interpolations: string[] = [];
        path.node.expressions.forEach((expression) => {
          interpolations.push(generator.default(expression).code);
        });

        // use placeholder to replace the expression
        // `foo ${a} bar` -> "foo {1} bar"
        let str = "";
        if (interpolations.length > 0) {
          for (let i = 0; i < interpolations.length; i++) {
            str += path.node.quasis[i].value.raw + `{${i}}`;
          }
        } else {
          str = path.node.quasis.map((item) => item.value.raw).join();
        }

        // template literal -> t("hash", [a, b, c]) or t("hash")
        const newAst =
          interpolations.length > 1
            ? (template.default(
                `t("${this.#generateTextHash(str)}", [${interpolations.join(",")}])`
              )() as Statement)
            : (template.default(`t("${this.#generateTextHash(str)}")`)() as Statement);
        path.replaceWith(newAst);
      },
    });

    const code = generator.default(ast).code;

    const endTime = process.hrtime.bigint();
    const transformTime = (endTime - startTime) / BigInt(1000000);
    console.log(`transformTime: ${transformTime} ms`);

    return code;
  }
}
