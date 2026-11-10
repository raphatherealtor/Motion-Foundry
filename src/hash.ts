import {createHash} from 'node:crypto';
export function canonical(value: unknown): string {
 if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
 if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
 if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
 if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) return '{' + Object.keys(value!).sort().map(k => JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',') + '}';
 throw new TypeError('Canonical JSON requires finite JSON values');
}
export const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
export const hash = (value: unknown) => sha256(canonical(value));
