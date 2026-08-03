/**
 * Centralized base64url ↔ ArrayBuffer helpers for WebAuthn ceremonies.
 * Do not use ordinary base64 for WebAuthn fields.
 */

function normalizeBase64url(input: string): string {
  const trimmed = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (trimmed.length % 4)) % 4;
  return trimmed + "=".repeat(pad);
}

export function base64urlToUint8Array(value: string): Uint8Array {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid base64url value");
  }
  const binary = atob(normalizeBase64url(value));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64urlToArrayBuffer(value: string): ArrayBuffer {
  const bytes = base64urlToUint8Array(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function bufferToBase64url(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export type ServerPublicKeyCredentialCreationOptions = Omit<
  PublicKeyCredentialCreationOptions,
  "challenge" | "user" | "excludeCredentials"
> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, "id"> & { id: string };
  excludeCredentials?: Array<
    Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }
  >;
};

export type ServerPublicKeyCredentialRequestOptions = Omit<
  PublicKeyCredentialRequestOptions,
  "challenge" | "allowCredentials"
> & {
  challenge: string;
  allowCredentials?: Array<
    Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }
  >;
};

export function creationOptionsFromServer(
  options: ServerPublicKeyCredentialCreationOptions
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64urlToArrayBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64urlToArrayBuffer(options.user.id)
    },
    excludeCredentials: (options.excludeCredentials ?? []).map((item) => ({
      ...item,
      id: base64urlToArrayBuffer(item.id),
      type: item.type ?? "public-key"
    }))
  };
}

export function requestOptionsFromServer(
  options: ServerPublicKeyCredentialRequestOptions
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64urlToArrayBuffer(options.challenge),
    allowCredentials: (options.allowCredentials ?? []).map((item) => ({
      ...item,
      id: base64urlToArrayBuffer(item.id),
      type: item.type ?? "public-key"
    }))
  };
}

export type SerializedPublicKeyCredential = {
  id: string;
  rawId: string;
  type: string;
  authenticatorAttachment?: string;
  response: Record<string, string | string[] | undefined>;
  clientExtensionResults?: AuthenticationExtensionsClientOutputs;
};

export function serializeRegistrationCredential(
  credential: PublicKeyCredential
): SerializedPublicKeyCredential {
  const response = credential.response as AuthenticatorAttestationResponse;
  const transports =
    typeof response.getTransports === "function" ? response.getTransports() : undefined;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject),
      ...(transports?.length ? { transports } : {})
    },
    clientExtensionResults: credential.getClientExtensionResults()
  };
}

export function serializeAuthenticationCredential(
  credential: PublicKeyCredential
): SerializedPublicKeyCredential {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      ...(response.userHandle
        ? { userHandle: bufferToBase64url(response.userHandle) }
        : {})
    },
    clientExtensionResults: credential.getClientExtensionResults()
  };
}
