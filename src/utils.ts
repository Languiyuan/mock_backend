import * as crypto from 'crypto';

export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function getType(variable) {
  if (variable === null) return 'null';
  if (Array.isArray(variable)) return 'array';
  return typeof variable;
}

export function delay(s: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), s * 1000));
}
