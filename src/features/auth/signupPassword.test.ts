import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE,
  SIGNUP_PASSWORD_WEAK_WARNING,
  SIGNUP_TICKET_INVALID_MESSAGE,
  canSubmitSignupPassword,
  classifySignupCompleteError,
  isSignupPasswordWeak,
  meetsSignupPasswordMinLength
} from "./signupPassword.ts";

describe("signup password mandatory length", () => {
  it("rejects empty and 1–5 character passwords", () => {
    assert.equal(meetsSignupPasswordMinLength(""), false);
    assert.equal(meetsSignupPasswordMinLength("1"), false);
    assert.equal(meetsSignupPasswordMinLength("12345"), false);
    assert.equal(canSubmitSignupPassword("", ""), false);
    assert.equal(canSubmitSignupPassword("12345", "12345"), false);
  });

  it("allows a 6-character password when confirmation matches", () => {
    assert.equal(meetsSignupPasswordMinLength("123456"), true);
    assert.equal(canSubmitSignupPassword("ab12cd", "ab12cd"), true);
  });
});

describe("signup password weak warning (non-blocking)", () => {
  it("marks 123456 as weak but still submittable", () => {
    assert.equal(isSignupPasswordWeak("123456"), true);
    assert.equal(canSubmitSignupPassword("123456", "123456"), true);
    assert.equal(SIGNUP_PASSWORD_WEAK_WARNING.includes("ساده"), true);
  });

  it("marks abcdef as weak but still submittable", () => {
    assert.equal(isSignupPasswordWeak("abcdef"), true);
    assert.equal(canSubmitSignupPassword("abcdef", "abcdef"), true);
  });

  it("removes the weak flag for a stronger mixed password", () => {
    assert.equal(isSignupPasswordWeak("garden42"), false);
    assert.equal(canSubmitSignupPassword("garden42", "garden42"), true);
  });

  it("updates while typing: short → weak → stronger", () => {
    const sequence = ["12", "123456", "garden42"];
    assert.deepEqual(
      sequence.map((value) => ({
        blocking: !meetsSignupPasswordMinLength(value),
        weak: isSignupPasswordWeak(value)
      })),
      [
        { blocking: true, weak: false },
        { blocking: false, weak: true },
        { blocking: false, weak: false }
      ]
    );
  });

  it("treats digits-only, letters-only, and repeated characters as weak when long enough", () => {
    assert.equal(isSignupPasswordWeak("99999999"), true);
    assert.equal(isSignupPasswordWeak("abcdefgh"), true);
    assert.equal(isSignupPasswordWeak("aaaaaaaa"), true);
    assert.equal(isSignupPasswordWeak("qwerty"), true);
    assert.equal(isSignupPasswordWeak("password"), true);
  });
});

describe("signup complete error classification", () => {
  it("shows backend password field errors under the password input", () => {
    const classified = classifySignupCompleteError({
      status: 400,
      data: { password: ["This password is too common."] }
    });
    assert.equal(classified.kind, "password");
    assert.equal(classified.message, "This password is too common.");
  });

  it("maps a short-password backend validation to the same minimum-length message", () => {
    const classified = classifySignupCompleteError({
      status: 400,
      data: { password: ["This password is too short. It must contain at least 6 characters."] }
    });
    assert.equal(classified.kind, "password");
    assert.equal(classified.message, SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE);
  });

  it("does not treat a password validation 400 as an invalid signup ticket", () => {
    const classified = classifySignupCompleteError({
      status: 400,
      data: { password: ["Password confirmation mismatch."] }
    });
    assert.notEqual(classified.kind, "ticket");
    assert.notEqual(classified.message, SIGNUP_TICKET_INVALID_MESSAGE);
  });

  it("still restarts on a real invalid-ticket response", () => {
    const byField = classifySignupCompleteError({
      status: 400,
      data: { signup_ticket: ["Invalid or expired signup ticket."] }
    });
    assert.equal(byField.kind, "ticket");
    assert.equal(byField.message, SIGNUP_TICKET_INVALID_MESSAGE);

    const byDetail = classifySignupCompleteError({
      status: 400,
      data: { detail: "Signup ticket expired." }
    });
    assert.equal(byDetail.kind, "ticket");
    assert.equal(byDetail.message, SIGNUP_TICKET_INVALID_MESSAGE);
  });

  it("does not render raw HTML responses", () => {
    const html =
      "<!DOCTYPE html><html><body>CSRF verification failed. Origin checking failed.</body></html>";
    const classified = classifySignupCompleteError(
      { status: 403, data: html },
      "تکمیل ثبت‌نام ناموفق بود."
    );
    assert.equal(classified.kind, "form");
    assert.equal(classified.message.includes("<html"), false);
    assert.equal(classified.message.includes("CSRF verification failed"), false);
  });
});
