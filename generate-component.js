import {
  writeFile,
  mkdirSync,
  existsSync,
  appendFileSync,
  readFileSync,
} from "fs";
import { resolve, join } from "path";
import inquirer from "inquirer";

// Function to convert string to camel case
const toCamelCase = (str) => {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove non-alphanumeric characters except spaces
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase()) // Convert spaces to camel case
    .replace(/^\w/, (c) => c.toLowerCase()); // Ensure the first character is lowercase
};

// Function to remove prefix and convert to camel case
const removePrefixAndToCamelCase = (name, prefix) => {
  if (name.startsWith(prefix)) {
    name = name.slice(prefix.length);
  }
  return toCamelCase(name);
};

// Function to replace placeholders in a template
const applyTemplate = (templatePath, values) => {
  let templateContent = readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(values)) {
    const placeholder = `${key}`; // Use ${key} as the placeholder
    const regex = new RegExp(`\\$\\{${key}\\}`, "g"); // Create a global regex to replace all instances
    templateContent = templateContent.replace(regex, value);
  }
  return templateContent;
};

// CLI prompts using inquirer
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

// Function to create a file if it doesn't exist
const createFile = (dir, filename, content) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filePath = resolve(dir, filename);
  if (!existsSync(filePath)) {
    writeFile(filePath, content, (err) => {
      if (err) throw err;
      console.log(`Created file: ${filePath}`);
    });
  } else {
    console.log(`File already exists: ${filePath}`);
  }
};

// Function to inject code into a file if it hasn't been added already
const injectCode = (filePath, code) => {
  if (existsSync(filePath)) {
    const fileContent = readFileSync(filePath, "utf-8");
    if (!fileContent.includes(code)) {
      appendFileSync(filePath, `\n${code}`);
      console.log(`Injected code into: ${filePath}`);
    } else {
      console.log(`Code already exists in: ${filePath}`);
    }
  }
};

// Function to add import statements and update the components object
const updateComponentsFile = (componentName) => {
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
        // No components object, add import statements at the top
        componentsFileContent = `${importStatement}\n\n${componentsFileContent.trim()}`;
      } else {
        // Insert import statement before the components object
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
        // Ensure the new entry is at the end
        updatedObject = updatedObject.replace("};", `${objectEntry}\n};`);
        componentsFileContent = componentsFileContent.replace(
          objectMatch[0],
          updatedObject
        );
      }
    } else {
      // If the components object doesn't exist, create it
      const initialContent = `import ${componentName} from './components/c-${componentName}';\n\nconst components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};\n\nexport default components;\n`;
      writeFile(componentsFilePath, initialContent, (err) => {
        if (err) throw err;
        console.log(`Created components file: ${componentsFilePath}`);
      });
      return;
    }

    // Write the updated content back to the file
    writeFile(componentsFilePath, componentsFileContent, (err) => {
      if (err) throw err;
      console.log(`Updated components file: ${componentsFilePath}`);
    });
  } else {
    // Create a new components file if it doesn't exist
    const initialContent = `import ${componentName} from './components/c-${componentName}';\n\nconst components = {\n  ${componentName.toLowerCase()}: ${componentName},\n};\n\nexport default components;\n`;
    createFile(resolve("assets/src/js"), "components.js", initialContent);
  }
};

// Function to inject import statements into the correct section of the SCSS file
const injectCodeInSection = (filePath, sectionHeader, importStatement) => {
  if (existsSync(filePath)) {
    let fileContent = readFileSync(filePath, "utf-8");

    // Define regex patterns to find the section and its end
    const sectionPattern = new RegExp(
      `\\/\\*\\s*${sectionHeader}\\s*==========================================================================\\s*([\\s\\S]*?)(\\/\\*|$)`,
      "m"
    );

    // Find section
    const match = fileContent.match(sectionPattern);

    if (match) {
      const [fullMatch, sectionContent, nextSection] = match;

      // Ensure import statement is not already present
      if (!sectionContent.includes(importStatement)) {
        // Insert import statement before the next section header or end of file
        const updatedSectionContent = `${sectionContent.trim()}\n${importStatement}`;
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
      console.log(`Section header not found in: ${filePath}`);
    }
  } else {
    console.log(`File does not exist: ${filePath}`);
  }
};

// Run the inquirer prompts and process the results
inquirer.prompt(questions).then((answers) => {
  const { componentName: rawComponentName, componentType, createJS } = answers;

  // Define prefix and convert rawComponentName to camel case without the prefix
  const prefix = componentType === "Layout" ? "l-" : "c-";
  const componentName = removePrefixAndToCamelCase(rawComponentName, prefix);
  const prefixedComponentName = `${prefix}${componentName}`;

  // Set base directories based on whether it's a layout or a component
  const baseDir =
    componentType === "Layout" ? "www/inc/layout" : "www/inc/components";
  const scssDir =
    componentType === "Layout"
      ? "assets/src/scss/layout"
      : "assets/src/scss/components";
  const jsDir = "assets/src/js/components"; // JS components always go to this folder

  // Define paths to template files
  const phpTemplatePath =
    componentType === "Layout"
      ? join(__dirname, "layout-php.tpl")
      : join(__dirname, "component-php.tpl");
  const scssTemplatePath = join(__dirname, "scss.tpl");
  const jsTemplatePath = join(__dirname, "js.tpl");

  // Prepare values for template substitution
  const templateValues = {
    componentName: prefixedComponentName, // With prefix for SCSS/HTML
    rawComponentName: componentName, // Without prefix for PHP class name
    componentType,
  };

  // Generate content from templates
  const phpContent = applyTemplate(phpTemplatePath, templateValues);

  // Adjust the SCSS content to prefix `l-` or `c-` to the class name
  let scssContent = applyTemplate(scssTemplatePath, templateValues);
  scssContent = scssContent.replace(
    `.${componentName}`, // Look for the class definition in SCSS
    `.${prefixedComponentName}` // Add prefix
  );

  const jsContent = applyTemplate(jsTemplatePath, templateValues);

  // Create the PHP and SCSS files in the correct folder based on layout or component
  createFile(baseDir, `${prefixedComponentName}.php`, phpContent);
  createFile(scssDir, `${prefixedComponentName}.scss`, scssContent);

  // Optionally create the JS file based on user input
  if (createJS) {
    createFile(jsDir, `c-${componentName}.js`, jsContent);
    updateComponentsFile(componentName);
  }

  // Determine the correct section header based on componentType
  const sectionHeader = componentType === "Layout" ? "Layout" : "Components";

  // Inject imports into the main SCSS file
  injectCodeInSection(
    resolve("assets/src/scss", "main.scss"),
    sectionHeader,
    `@import "${componentType.toLowerCase()}/${prefixedComponentName}";`
  );
});
