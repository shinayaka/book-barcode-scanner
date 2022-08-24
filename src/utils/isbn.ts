export function isIsbn(code: string): boolean {
  if (!parseInt(code)) return false;
  const splitCode = code.split("");
  let sum = 0;
  splitCode.forEach((char, index) => {
    const num = parseInt(char);
    sum += num * (index % 2 === 0 ? 1 : 3);
  });
  return sum % 10 === 0;
}
