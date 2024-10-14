import { existsSync, readFileSync, writeFile, writeFileSync } from "fs"; // Added writeFileSync import
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
      fileContent = `${fileContent}\n/* ${sectionHeader} */${importStatement}\n`;
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
  const importStatement = `import ${componentName} from './components/c-${componentName}';\n`;

  if (existsSync(componentsFilePath)) {
    let componentsFileContent = readFileSync(componentsFilePath, "utf-8");

    // Ensure the import statement is not duplicated
    if (!componentsFileContent.includes(importStatement)) {
      // Find the index of the components object declaration
      const objectDeclarationIndex = componentsFileContent.indexOf(
        "const components = {"
      );

      // Insert the import statement above the components declaration
      if (objectDeclarationIndex !== -1) {
        componentsFileContent =
          componentsFileContent.slice(0, objectDeclarationIndex) +
          importStatement +
          componentsFileContent.slice(objectDeclarationIndex);
      } else {
        console.warn(
          "Components object declaration not found in components.js"
        );
      }
    }

    // Prepare the new object entry
    const objectEntry = `\n  ${componentName},\n`;
    const objectMatch = componentsFileContent.match(
      /const components = \{[^]*?\};/
    );

    if (objectMatch) {
      let updatedObject = objectMatch[0];

      // Check if the entry already exists
      if (!updatedObject.includes(objectEntry)) {
        // Remove the trailing comma before the closing brace if necessary
        const closingBraceIndex = updatedObject.indexOf("};");
        const updatedObjectWithoutComma =
          updatedObject.slice(0, closingBraceIndex - 1) +
          objectEntry +
          updatedObject.slice(closingBraceIndex);

        // Ensure no trailing commas exist before the closing brace
        const cleanUpdatedObject = updatedObjectWithoutComma.replace(
          /\s*}/,
          "\n}"
        );

        // Replace the original object with the updated one
        componentsFileContent = componentsFileContent.replace(
          objectMatch[0],
          cleanUpdatedObject
        );
      }
    } else {
      // If the components object doesn't exist, create it
      const initialContent = `const components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};\nexport default components;\n`;
      writeFileSync(componentsFilePath, initialContent, "utf-8");
      console.log(`Created components file: ${componentsFilePath}`);
      return;
    }

    // Write the updated content back to the file
    writeFileSync(componentsFilePath, componentsFileContent, "utf-8");
    console.log(`Updated components file: ${componentsFilePath}`);
  } else {
    // Create a new components file if it doesn't exist
    const initialContent = `const components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};
    export default components;\n`;
    writeFileSync(componentsFilePath, initialContent, "utf-8");
    console.log(`Created components file: ${componentsFilePath}`);
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
