import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Formato versionado: "v1:<ivBase64>:<tagBase64>:<ciphertextBase64>"
// Permite distinguir valores cifrados de filas legacy en texto plano.
const PREFIX = 'v1:'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY no está configurada')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY debe ser una clave de 32 bytes en base64 (openssl rand -base64 32)')
  return key
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivB64, tagB64, dataB64] = ciphertext.slice(PREFIX.length).split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function looksEncrypted(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

/** Descifra si corresponde, si no intenta parsear como JSON legacy en texto plano. */
export function parseCredenciales(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    const json = looksEncrypted(raw) ? decrypt(raw) : raw
    return JSON.parse(json)
  } catch {
    return null
  }
}
