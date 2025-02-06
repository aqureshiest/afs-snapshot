// c8 ignore file
export function objToString(date) {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

export const dateTransforms = {
  objToString,
};
