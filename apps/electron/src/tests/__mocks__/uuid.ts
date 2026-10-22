/**
 * Mock CJS do uuid para Jest.
 * 
 * O uuid@14+ usa ESM puro (export statements) que o Jest/ts-jest
 * não consegue parsear em modo CommonJS. Este mock fornece uma
 * implementação simples de v4() que funciona nos testes.
 */

let counter = 0;

function v4(): string {
  counter++;
  const hex = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

function v1(): string {
  return v4();
}

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

function validate(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function version(uuid: string): number {
  return parseInt(uuid.charAt(14), 16);
}

export { v4, v1, NIL, MAX, validate, version };
export default { v4, v1, NIL, MAX, validate, version };
