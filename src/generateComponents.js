import { existsSync, readFileSync, appendFileSync, writeFile } from "fs";
import { resolve } from "path";

// Function to update the components.js file with the new component import
export const updateComponentsFile = (componentName) => {
  const componentsFilePath = resolve("assets/src/js/components.js");
  const importStatement = `import ${componentName} from './components/c-${componentName}';`;
  const objectEntry = `  ${componentName},`;

  let componentsFileContent = "";

  if (existsSync(componentsFilePath)) {
    componentsFileContent = readFileSync(componentsFilePath, "utf-8");

    // Add import statement if not already present
    if (!componentsFileContent.includes(importStatement)) {
      const importSectionEndIndex = componentsFileContent.indexOf(
        "const components = {"
      );

      if (importSectionEndIndex === -1) {
        componentsFileContent = `${importStatement}\n\n${componentsFileContent.trim()}`;
      } else {
        componentsFileContent =
          componentsFileContent.slice(0, importSectionEndIndex) +
          `${importStatement}\n` +
          componentsFileContent.slice(importSectionEndIndex);
      }
    }

    // Update the components object
    const objectMatch = componentsFileContent.match(
      /const components = \{[^]*?\};/
    );
    if (objectMatch) {
      let updatedObject = objectMatch[0];
      if (!updatedObject.includes(objectEntry)) {
        updatedObject = updatedObject.replace("};", `${objectEntry}\n};`);
        componentsFileContent = componentsFileContent.replace(
          objectMatch[0],
          updatedObject
        );
      }
    } else {
      const initialContent = `import ${componentName} from './components/c-${componentName}';\n\nconst components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};\n\nexport default components;\n`;
      writeFile(componentsFilePath, initialContent, (err) => {
        if (err) throw err;
        console.log(`Created components file: ${componentsFilePath}`);
      });
      return;
    }

    writeFile(componentsFilePath, componentsFileContent, (err) => {
      if (err) throw err;
      console.log(`Updated components file: ${componentsFilePath}`);
    });
  } else {
    const initialContent = `import ${componentName} from './components/c-${componentName}';\n\nconst components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};\n\nexport default components;\n`;
    createFile(resolve("assets/src/js"), "components.js", initialContent);
  }
};

// Function to update the main SCSS file with the new component's SCSS import
export const updateScssFile = (componentName) => {
  const scssFilePath = resolve("assets/src/scss/main.scss");
  const scssImportStatement = `@import './components/c-${componentName}';`;

  let scssFileContent = "";

  if (existsSync(scssFilePath)) {
    scssFileContent = readFileSync(scssFilePath, "utf-8");

    // Add SCSS import statement if not already present
    if (!scssFileContent.includes(scssImportStatement)) {
      scssFileContent = `${scssFileContent.trim()}${scssImportStatement}\n`;
      writeFile(scssFilePath, scssFileContent, (err) => {
        if (err) throw err;
        console.log(`Updated SCSS file: ${scssFilePath}`);
      });
    }
  } else {
    // Create a new SCSS file with the initial import
    const initialScssContent = `${scssImportStatement}\n`;
    createFile(resolve("assets/src/scss"), "main.scss", initialScssContent);
  }
};
