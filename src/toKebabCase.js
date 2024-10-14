// Function to convert a string to KebabCase
export const toKebabCase = (str) => {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim() // Trim whitespace from both ends
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase
};

// Function to remove a prefix and convert to KebabCase
export const removePrefixAndToKebabCase = (name, prefix) => {
  if (name.startsWith(prefix)) {
    name = name.slice(prefix.length); // Remove the prefix
  }
  return toKebabCase(name); // Convert to KebabCase
};
