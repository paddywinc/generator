import { writeFile, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

export const createFile = (dir, filename, content) => {
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
