// Centralized field-level validators + length caps for the Agent Profile module.
// Every validator returns an error string, or "" when the value is acceptable.
// Empty values are treated as valid here; use `required()` to enforce presence.

export const LIMITS = {
  name: 60,
  shortText: 80,
  text: 120,
  longText: 2000,
  email: 120,
  url: 200,
  phone: 14, // formatted "(604) 555-0123"
  postal: 7, // "A1A 1A1"
  number: 6,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CA_RE = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;
// Accepts http(s) URLs as well as bare domains like "example.com/page".
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

export function required(value) {
  const v = typeof value === "string" ? value.trim() : value;
  return v === "" || v === null || v === undefined ? "This field is required." : "";
}

export function email(value) {
  if (!value) return "";
  return EMAIL_RE.test(String(value).trim()) ? "" : "Enter a valid email address.";
}

export function url(value) {
  if (!value) return "";
  return URL_RE.test(String(value).trim()) ? "" : "Enter a valid URL.";
}

export function postalCA(value) {
  if (!value) return "";
  return POSTAL_CA_RE.test(String(value).trim()) ? "" : "Use a valid postal code (A1A 1A1).";
}

export function phone(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11 ? "" : "Enter a valid phone number.";
}

export function date(value, { maxToday = false, minToday = false } = {}) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Enter a valid date.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (maxToday && d > today) return "Date cannot be in the future.";
  if (minToday && d < today) return "Date cannot be in the past.";
  return "";
}

export function number(value, { min, max } = {}) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "Enter a valid number.";
  if (min !== undefined && n < min) return `Must be at least ${min}.`;
  if (max !== undefined && n > max) return `Must be at most ${max}.`;
  return "";
}

export function maxLen(value, limit) {
  if (!value) return "";
  return String(value).length > limit ? `Must be ${limit} characters or fewer.` : "";
}

// --- Formatters -------------------------------------------------------------

export function normalizePhoneDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

export function formatUsCaPhone(value) {
  const raw = normalizePhoneDigits(value);
  const digits = raw.length === 11 && raw.startsWith("1") ? raw.slice(1) : raw;
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function formatPostalCA(value) {
  const clean = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

// Runs a map of { fieldKey: errorString } and returns true if all are empty.
export function isClean(errorMap) {
  return Object.values(errorMap || {}).every((e) => !e);
}
