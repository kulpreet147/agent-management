// Computes how complete an agent's profile is, from the saved profile object.
// Returns { percent, done, total, missing[] } so the UI can show progress and
// point the agent at the specific information that is still missing.

const filled = (v) =>
  typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined && v !== "";

export function computeProfileCompletion(profile, { hasAvatar = false } = {}) {
  const p = profile || {};
  const per = p.personal || {};
  const addr = per.address || {};
  const biz = p.business || {};
  const online = p.online || {};
  const anyLink = Object.values(online).some((v) => filled(v));

  // [label, isComplete] — keep these in sync with the "required" expectations.
  const checks = [
    ["First name", filled(per.firstName)],
    ["Last name", filled(per.lastName)],
    ["Date of birth", filled(per.dob)],
    ["Gender", filled(per.gender)],
    ["Primary phone", filled(per.primaryPhone)],
    ["Email", filled(per.email)],
    ["Street address", filled(addr.streetNumber) && filled(addr.streetName)],
    ["City", filled(addr.city)],
    ["Province", filled(addr.province)],
    ["Postal code", filled(addr.postalCode)],
    ["Profile photo", Boolean(hasAvatar)],
    ["Operating name", filled(biz.operatingName)],
    ["Years of experience", filled(biz.yearsExperience)],
    ["Professional bio", filled(biz.bio)],
    ["Areas of specialization", Array.isArray(biz.specializations) && biz.specializations.length > 0],
    ["A social / website link", anyLink],
  ];

  const total = checks.length;
  const done = checks.filter(([, ok]) => ok).length;
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return { percent, done, total, missing };
}
