import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function deriveKey(orgKey: string): Buffer {
  return Buffer.from(orgKey, "base64")
}

export function encryptEmbedding(raw: Uint8Array, orgKey: string): string {
  const key = deriveKey(orgKey)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(Buffer.from(raw)), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`
}

export function decryptEmbedding(encoded: string, orgKey: string): Uint8Array {
  const [ivB64, tagB64, dataB64] = encoded.split(".")
  const key = deriveKey(orgKey)
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const encrypted = Buffer.from(dataB64, "base64")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return new Uint8Array(Buffer.concat([decipher.update(encrypted), decipher.final()]))
}
