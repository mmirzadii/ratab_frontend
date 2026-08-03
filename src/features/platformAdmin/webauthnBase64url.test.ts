import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  base64urlToArrayBuffer,
  base64urlToUint8Array,
  bufferToBase64url,
  creationOptionsFromServer,
  requestOptionsFromServer
} from "./webauthnBase64url.ts";

describe("webauthn base64url utilities", () => {
  it("round-trips binary through base64url", () => {
    const original = new Uint8Array([0, 1, 2, 250, 255, 10, 61]);
    const encoded = bufferToBase64url(original);
    assert.equal(encoded.includes("+"), false);
    assert.equal(encoded.includes("/"), false);
    assert.equal(encoded.includes("="), false);
    const decoded = base64urlToUint8Array(encoded);
    assert.deepEqual(Array.from(decoded), Array.from(original));
  });

  it("accepts padded and unpadded base64url", () => {
    const raw = bufferToBase64url(new Uint8Array([1, 2, 3]));
    const padded = raw + "===".slice((raw.length % 4 || 4) - 1);
    assert.deepEqual(
      Array.from(base64urlToUint8Array(raw)),
      Array.from(base64urlToUint8Array(padded.replace(/=+$/, "") + "=".repeat((4 - (raw.length % 4)) % 4)))
    );
  });

  it("converts creation options challenge and user.id to ArrayBuffer", () => {
    const challenge = bufferToBase64url(new Uint8Array([9, 8, 7]));
    const userId = bufferToBase64url(new Uint8Array([4, 5, 6]));
    const excludeId = bufferToBase64url(new Uint8Array([1]));
    const options = creationOptionsFromServer({
      challenge,
      rp: { name: "Ratab", id: "localhost" },
      user: { id: userId, name: "09***", displayName: "Admin" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      excludeCredentials: [{ type: "public-key", id: excludeId }]
    });
    assert.ok(options.challenge instanceof ArrayBuffer);
    assert.ok(options.user.id instanceof ArrayBuffer);
    assert.equal(bufferToBase64url(options.challenge), challenge);
    assert.equal(bufferToBase64url(options.user.id), userId);
    assert.equal(bufferToBase64url(options.excludeCredentials![0]!.id), excludeId);
  });

  it("converts request options allowCredentials ids", () => {
    const challenge = bufferToBase64url(new Uint8Array([3, 2, 1]));
    const allowId = bufferToBase64url(new Uint8Array([11, 12]));
    const options = requestOptionsFromServer({
      challenge,
      allowCredentials: [{ type: "public-key", id: allowId }]
    });
    assert.ok(options.challenge instanceof ArrayBuffer);
    assert.equal(bufferToBase64url(options.allowCredentials![0]!.id), allowId);
    assert.ok(base64urlToArrayBuffer(challenge).byteLength > 0);
  });
});
