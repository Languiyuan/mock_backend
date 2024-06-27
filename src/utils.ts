import * as crypto from 'crypto';

export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function getType(variable) {
  const type = typeof variable;

  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'function':
      return type;
    case 'object':
      if (variable === null) {
        return 'null';
      } else if (Array.isArray(variable)) {
        return 'array';
      } else {
        return 'object';
      }
    default:
      return 'unknown';
  }
}
