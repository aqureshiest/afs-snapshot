// c8 ignore file
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add a hyphen between lowercase and uppercase letters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .toLowerCase(); // Convert the entire string to lowercase
}