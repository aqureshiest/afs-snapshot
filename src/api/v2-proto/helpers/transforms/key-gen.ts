// c8 ignore file
// Used to generate random keys for React components
export const keyGen = (prefix: string): string => {
  const TOKEN_LENGTH = 8;
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return prefix ? `${prefix}-${result}` : `${result}`;
};
