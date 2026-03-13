import { createHmac, timingSafeEqual } from "node:crypto";

function toSignature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function signValue(value: string, secret: string) {
  return `${value}.${toSignature(value, secret)}`;
}

export function verifySignedValue(token: string | undefined, secret: string) {
  if (!token) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const value = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = toSignature(value, secret);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  return value;
}
