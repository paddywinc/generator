import { readFileSync } from "fs";

export const applyTemplate = (templatePath, values) => {
  let templateContent = readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(values)) {
    const placeholder = `${key}`;
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    templateContent = templateContent.replace(regex, value);
  }
  return templateContent;
};
