import { randomBytes } from 'crypto'

export function nanoid(size = 21): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'
  const bytes = randomBytes(size)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}
