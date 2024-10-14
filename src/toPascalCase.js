// src/toPascalCase.js

export const toPascalCase = (input) => {
  return input
    .split("_") // Split the input string by underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(""); // Join the words back together
};
