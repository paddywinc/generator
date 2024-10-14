import { existsSync, readFileSync, writeFile } from "fs";
import { resolve } from "path";

// Utility to create a file if it doesn't exist
const createFile = (directory, fileName, content) => {
  const filePath = resolve(directory, fileName);
  if (!existsSync(filePath)) {
    writeFile(filePath, content, (err) => {
      if (err) throw err;
      console.log(`Created file: ${filePath}`);
    });
  }
};

// Function to inject SCSS imports into the right section of main.scss
// Function to inject SCSS imports into the right section of main.scss
export const injectCodeInSection = (
  filePath,
  sectionHeader,
  importStatement
) => {
  if (existsSync(filePath)) {
    let fileContent = readFileSync(filePath, "utf-8");

    // Create a regex to find the section header
    const sectionPattern = new RegExp(
      `\\/\\*\\s*${sectionHeader} End\\s*\\*\\/([\\s\\S]*?)(\\/\\*|$)`,
      "m"
    );
    const match = fileContent.match(sectionPattern);

    if (match) {
      const [fullMatch, sectionContent] = match;

      // Check if the import statement is already present
      if (!sectionContent.includes(importStatement)) {
        const updatedSectionContent = `${sectionContent.trim()}${importStatement}\n`;
        const updatedFileContent = fileContent.replace(
          fullMatch,
          `${fullMatch.replace(sectionContent, updatedSectionContent)}`
        );
        writeFile(filePath, updatedFileContent, (err) => {
          if (err) throw err;
          console.log(`Injected code into: ${filePath}`);
        });
      } else {
        console.log(`Import statement already present in section: ${filePath}`);
      }
    } else {
      // If the section header is not found, create a new section at the bottom
      console.log(
        `Section header not found in: ${filePath}. Adding header and statement at the end.`
      );
      fileContent = `${fileContent}\n/* ${sectionHeader} */\n${importStatement}\n`;
      writeFile(filePath, fileContent, (err) => {
        if (err) throw err;
        console.log(`Added section header and injected code into: ${filePath}`);
      });
    }
  } else {
    console.log(`File does not exist: ${filePath}`);
  }
};

// Function to update components.js
export const updateComponentsFile = (componentName) => {
  const componentsFilePath = resolve("assets/src/js/components.js");
  const importStatement = `import ${componentName} from './components/c-${componentName}';`;
  const objectEntry = `  ${componentName},`;

  if (existsSync(componentsFilePath)) {
    let componentsFileContent = readFileSync(componentsFilePath, "utf-8");

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
      return; // Exit if we create a new file
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

export const updateScssFile = (componentName, componentType) => {
  console.log(
    `updateScssFile called with: componentName=${componentName}, componentType=${componentType}`
  );
  const prefix = componentType === "Layout" ? "l-" : "c-";
  const newImportStatement = `@import "${componentType.toLowerCase()}/${prefix}${componentName}.scss";`;
  const newSectionHeader = componentType === "Layout" ? "Layout" : "Components";
  const filePath = resolve("assets/src/scss", "main.scss");

  console.log(`File path: ${filePath}`);

  injectCodeInSection(filePath, newSectionHeader, newImportStatement);
};

// Example of using both functions together
export const generateComponent = (
  componentName,
  componentType,
  createJsFile = true
) => {
  if (createJsFile) {
    updateComponentsFile(componentName);
  }
  updateScssFile(componentName, componentType);
};
