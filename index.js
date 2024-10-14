import inquirer from "inquirer";
import { createFile } from "./src/createFile.js";
// import { updateComponentsFile } from "./src/generateComponents.js";
import {
  injectCodeInSection,
  updateComponentsFile,
  updateScssFile,
  generateComponent,
} from "./src/injectCode.js";
import { applyTemplate } from "./src/templates.js";
import { toKebabCase, removePrefixAndToKebabCase } from "./src/toKebabCase.js";
import { toPascalCase } from "./src/toPascalCase.js"; // New import
import { resolve, join } from "path";

const questions = [
  {
    type: "list",
    name: "componentType",
    message: "Is this an ACF layout or a reusable component?",
    choices: ["Layout", "Component"],
  },
  {
    type: "input",
    name: "componentName",
    message:
      "What is the name of the component? (if ACF please match the layout name (without l-)",
    validate: (input) => !!input || "Component name cannot be empty!",
  },
  {
    type: "confirm",
    name: "createJS",
    message: "Do you want to create a JavaScript file?",
    default: true,
  },
];

// Main function to handle the prompts and processing
const main = async () => {
  const answers = await inquirer.prompt(questions);
  const { componentName: rawComponentName, componentType, createJS } = answers;

  const prefix = componentType === "Layout" ? "l-" : "c-";
  const componentName = removePrefixAndToKebabCase(rawComponentName, prefix);
  const prefixedComponentName = `${prefix}${componentName}`;
  const pascalComponentName = toPascalCase(rawComponentName);
  const kebabComponentName = toKebabCase(componentName);

  const baseDir =
    componentType === "Layout" ? "www/inc/layout" : "www/inc/components";
  const scssDir =
    componentType === "Layout"
      ? "assets/src/scss/layout"
      : "assets/src/scss/components";
  const jsDir = "assets/src/js/components";

  const phpTemplatePath =
    componentType === "Layout"
      ? join(__dirname, "templates/layout-php.tpl")
      : join(__dirname, "templates/component-php.tpl");
  const scssTemplatePath = join(__dirname, "templates/scss.tpl");
  const jsTemplatePath = join(__dirname, "templates/js.tpl");

  const templateValues = {
    componentName: prefixedComponentName,
    rawComponentName: componentName,
    pascalComponentName: pascalComponentName,
    kebabComponentName: kebabComponentName,
    componentType,
  };

  const phpContent = applyTemplate(phpTemplatePath, templateValues);
  createFile(baseDir, `${prefixedComponentName}.php`, phpContent);
  injectCodeInSection(
    "assets/src/js/components.js",
    "Component Imports",
    `import ${componentName} from './components/c-${componentName}';`
  );

  if (createJS) {
    const jsContent = applyTemplate(jsTemplatePath, templateValues);
    createFile(jsDir, `c-${pascalComponentName}.js`, jsContent);
    updateComponentsFile(pascalComponentName);
  }

  const scssContent = applyTemplate(scssTemplatePath, templateValues);
  createFile(scssDir, `${prefix}${kebabComponentName}.scss`, scssContent);

  // Call to update SCSS file here
  updateScssFile(componentName, componentType);
};

main();
