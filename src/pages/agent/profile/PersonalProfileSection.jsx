import { useRef, useState } from "react";
import { useToast } from "../../../hooks/useToast.js";
import { css, tierMeta } from "./profileStyles.js";
import { Field, Toggle, SectionActions } from "./profileWidgets.jsx";
import * as V from "./profileValidation.js";

const GENDERS = ["", "Male", "Female", "Non-binary", "Prefer not to say", "Other"];
const MARITAL = ["", "Single", "Married", "Common-law", "Divorced", "Widowed", "Separated"];
const PROVINCES = ["", "ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"];
const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Grandparent", "Partner", "Other"];

const emptyMember = (relationship = "") => ({
  firstName: "", lastName: "", preferredName: "", dob: "", gender: "", relationship,
  phone: "", email: "", occupation: "", notes: "",
});

export default function PersonalProfileSection({ ctx, agentName, agentEmail, tier, avatarPreview, setAvatarPreview, setAvatarFile }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [attempted, setAttempted] = useState(false);
  const { draft, update, editing, canEdit, saving, onEdit, onDiscard, onSave } = ctx;
  const personal = draft.personal;
  const family = draft.family || [];
  const ro = !editing;

  const setPersonal = (patch) => update((d) => ({ ...d, personal: { ...d.personal, ...patch } }));
  const setAddress = (patch) => update((d) => ({ ...d, personal: { ...d.personal, address: { ...d.personal.address, ...patch } } }));
  const setEmergency = (patch) => update((d) => ({ ...d, personal: { ...d.personal, emergencyContact: { ...d.personal.emergencyContact, ...patch } } }));
  const setFamily = (next) => update((d) => ({ ...d, family: typeof next === "function" ? next(d.family || []) : next }));

  // Marital status = Married auto-adds a Spouse member; leaving Married clears Spouse entries.
  const onMaritalChange = (value) => {
    update((d) => {
      const fam = d.family || [];
      let nextFam = fam;
      if (value === "Married") {
        if (!fam.some((m) => m.relationship === "Spouse")) nextFam = [emptyMember("Spouse"), ...fam];
      } else if (d.personal.maritalStatus === "Married") {
        nextFam = fam.filter((m) => m.relationship !== "Spouse");
      }
      return { ...d, personal: { ...d.personal, maritalStatus: value }, family: nextFam };
    });
  };

  const toggleSecondaryPhone = (on) => {
    // Toggling off clears the stored secondary number.
    setPersonal({ hasSecondaryPhone: on, ...(on ? {} : { secondaryPhone: "" }) });
  };

  const updateMember = (idx, patch) => setFamily((fam) => fam.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const addMember = () => setFamily((fam) => [...fam, emptyMember()]);
  const removeMember = (idx) => setFamily((fam) => fam.filter((_, i) => i !== idx));

  // --- Validation ---------------------------------------------------------
  const errors = {
    firstName: V.required(personal.firstName) || V.maxLen(personal.firstName, V.LIMITS.name),
    lastName: V.required(personal.lastName) || V.maxLen(personal.lastName, V.LIMITS.name),
    preferredName: V.maxLen(personal.preferredName, V.LIMITS.name),
    dob: V.date(personal.dob, { maxToday: true }),
    primaryPhone: V.required(personal.primaryPhone) || V.phone(personal.primaryPhone),
    secondaryPhone: personal.hasSecondaryPhone ? V.phone(personal.secondaryPhone) : "",
    email: V.required(personal.email) || V.email(personal.email),
    postalCode: V.postalCA(personal.address.postalCode),
    emPhone: V.phone(personal.emergencyContact.phone),
  };
  const familyErrors = family.map((m) => ({
    firstName: V.required(m.firstName) || V.maxLen(m.firstName, V.LIMITS.name),
    relationship: V.required(m.relationship),
    email: V.email(m.email),
    phone: V.phone(m.phone),
    dob: V.date(m.dob, { maxToday: true }),
  }));
  const hasErrors =
    Object.values(errors).some(Boolean) || familyErrors.some((e) => Object.values(e).some(Boolean));

  const handleSave = () => {
    if (hasErrors) {
      setAttempted(true);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setAttempted(false);
    onSave();
  };

  const handleDiscard = () => {
    setAttempted(false);
    onDiscard();
  };

  const showErr = (key) => (attempted ? errors[key] : "");
  const inp = (key) => ({ ...css.input, ...(showErr(key) ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) });
  const meta = tierMeta[tier] || tierMeta.Silver;

  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Personal Profile</div>
            <div style={css.panelSub}>Your personal details and contact information.</div>
          </div>
          <SectionActions editing={editing} canEdit={canEdit} onEdit={onEdit} onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        </div>

        {/* Avatar */}
        <div style={css.avatarUpload}>
          <div
            style={{
              ...css.avatarLarge,
              backgroundImage: avatarPreview ? `url(${avatarPreview})` : css.avatarLarge.background,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!avatarPreview ? (agentName || "A").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : ""}
            <button type="button" style={{ ...css.avatarBadge, opacity: ro ? 0.5 : 1 }} disabled={ro} onClick={() => fileInputRef.current?.click()}>✎</button>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{agentName}</div>
              <span style={css.badge(meta.style.background, meta.style.color, meta.style.borderColor)}>{meta.icon} {tier}</span>
            </div>
            <div style={{ fontSize: 12, color: "#9095b0", marginTop: 3 }}>{agentEmail}</div>
            <button type="button" style={{ ...css.uploadBtn, opacity: ro ? 0.6 : 1, cursor: ro ? "not-allowed" : "pointer" }} disabled={ro} onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSelectPhoto} style={{ display: "none" }} />
          </div>
        </div>

        {/* Identity */}
        <div style={css.formGrid(3)}>
          <Field label="First Name" required error={showErr("firstName")}>
            <input style={inp("firstName")} maxLength={V.LIMITS.name} disabled={ro} value={personal.firstName} onChange={(e) => setPersonal({ firstName: e.target.value })} />
          </Field>
          <Field label="Last Name" required error={showErr("lastName")}>
            <input style={inp("lastName")} maxLength={V.LIMITS.name} disabled={ro} value={personal.lastName} onChange={(e) => setPersonal({ lastName: e.target.value })} />
          </Field>
          <Field label="Preferred Name" error={showErr("preferredName")}>
            <input style={inp("preferredName")} maxLength={V.LIMITS.name} disabled={ro} value={personal.preferredName} onChange={(e) => setPersonal({ preferredName: e.target.value })} />
          </Field>
          <Field label="Date of Birth" error={showErr("dob")}>
            <input type="date" style={inp("dob")} disabled={ro} value={personal.dob || ""} onChange={(e) => setPersonal({ dob: e.target.value })} />
          </Field>
          <Field label="Gender">
            <select style={{ ...css.select, ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={personal.gender || ""} onChange={(e) => setPersonal({ gender: e.target.value })}>
              {GENDERS.map((g) => <option key={g} value={g}>{g || "Select…"}</option>)}
            </select>
          </Field>
          <Field label="Marital Status" hint={personal.maritalStatus === "Married" ? "Spouse auto-added to Family below." : ""}>
            <select style={{ ...css.select, ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={personal.maritalStatus || ""} onChange={(e) => onMaritalChange(e.target.value)}>
              {MARITAL.map((m) => <option key={m} value={m}>{m || "Select…"}</option>)}
            </select>
          </Field>
        </div>

        {/* Contact */}
        <div style={{ ...css.formGrid(3), marginTop: 16 }}>
          <Field label="Primary Phone" required error={showErr("primaryPhone")}>
            <input style={inp("primaryPhone")} inputMode="tel" maxLength={V.LIMITS.phone} disabled={ro} value={personal.primaryPhone} placeholder="(604) 555-0123"
              onChange={(e) => setPersonal({ primaryPhone: V.formatUsCaPhone(e.target.value) })} />
          </Field>
          <Field label="Email Address" required error={showErr("email")}>
            <input style={inp("email")} type="email" maxLength={V.LIMITS.email} disabled={ro} value={personal.email} onChange={(e) => setPersonal({ email: e.target.value })} />
          </Field>
          <Field label="Secondary Phone">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle value={personal.hasSecondaryPhone} disabled={ro} onChange={toggleSecondaryPhone} />
              <input
                style={{ ...inp("secondaryPhone"), flex: 1 }}
                inputMode="tel"
                maxLength={V.LIMITS.phone}
                disabled={ro || !personal.hasSecondaryPhone}
                value={personal.secondaryPhone}
                placeholder="(604) 555-0123"
                onChange={(e) => setPersonal({ secondaryPhone: V.formatUsCaPhone(e.target.value) })}
              />
            </div>
            {attempted && errors.secondaryPhone ? <span style={css.errorText}>{errors.secondaryPhone}</span> : null}
          </Field>
        </div>
      </div>

      {/* Residential Address */}
      <div style={css.panel}>
        <div style={css.panelTitle}>Residential Address</div>
        <div style={css.formGrid(3)}>
          <Field label="Unit">
            <input style={inp("unit")} maxLength={20} disabled={ro} value={personal.address.unit} onChange={(e) => setAddress({ unit: e.target.value })} />
          </Field>
          <Field label="Street Number">
            <input style={inp("streetNumber")} maxLength={20} disabled={ro} value={personal.address.streetNumber} onChange={(e) => setAddress({ streetNumber: e.target.value })} />
          </Field>
          <Field label="Street Name">
            <input style={inp("streetName")} maxLength={V.LIMITS.text} disabled={ro} value={personal.address.streetName} onChange={(e) => setAddress({ streetName: e.target.value })} />
          </Field>
          <Field label="City">
            <input style={inp("city")} maxLength={V.LIMITS.shortText} disabled={ro} value={personal.address.city} onChange={(e) => setAddress({ city: e.target.value })} />
          </Field>
          <Field label="Province">
            <select style={{ ...css.select, ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={personal.address.province || ""} onChange={(e) => setAddress({ province: e.target.value })}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p || "Select…"}</option>)}
            </select>
          </Field>
          <Field label="Postal Code" error={showErr("postalCode")}>
            <input style={inp("postalCode")} maxLength={V.LIMITS.postal} disabled={ro} value={personal.address.postalCode} placeholder="A1A 1A1"
              onChange={(e) => setAddress({ postalCode: V.formatPostalCA(e.target.value) })} />
          </Field>
          <Field label="Country">
            <input style={inp("country")} maxLength={V.LIMITS.shortText} disabled={ro} value={personal.address.country} onChange={(e) => setAddress({ country: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Emergency Contact */}
      <div style={css.panel}>
        <div style={css.panelTitle}>Emergency Contact</div>
        <div style={css.formGrid(3)}>
          <Field label="Name">
            <input style={inp("emName")} maxLength={V.LIMITS.text} disabled={ro} value={personal.emergencyContact.name} onChange={(e) => setEmergency({ name: e.target.value })} />
          </Field>
          <Field label="Phone" error={showErr("emPhone")}>
            <input style={inp("emPhone")} inputMode="tel" maxLength={V.LIMITS.phone} disabled={ro} value={personal.emergencyContact.phone} placeholder="(604) 555-0123"
              onChange={(e) => setEmergency({ phone: V.formatUsCaPhone(e.target.value) })} />
          </Field>
          <Field label="Relationship">
            <input style={inp("emRel")} maxLength={V.LIMITS.shortText} disabled={ro} value={personal.emergencyContact.relationship} placeholder="e.g. Spouse, Parent"
              onChange={(e) => setEmergency({ relationship: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Family Information */}
      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Family Information</div>
            <div style={css.panelSub}>Add spouse, children, parents or other family members.</div>
          </div>
          {editing && (
            <button type="button" style={css.btnGhost} onClick={addMember}>+ Add Family Member</button>
          )}
        </div>

        {family.length === 0 && <div style={css.emptyState}>No family members added yet.</div>}

        {family.map((m, idx) => {
          const fe = attempted ? familyErrors[idx] : {};
          return (
            <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                  Member {idx + 1}{m.relationship ? ` — ${m.relationship}` : ""}
                </div>
                {editing && <button type="button" style={css.btnDanger} onClick={() => removeMember(idx)}>Remove</button>}
              </div>
              <div style={css.formGrid(3)}>
                <Field label="First Name" required error={fe.firstName}>
                  <input style={{ ...css.input, ...(fe.firstName ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }} maxLength={V.LIMITS.name} disabled={ro} value={m.firstName} onChange={(e) => updateMember(idx, { firstName: e.target.value })} />
                </Field>
                <Field label="Last Name">
                  <input style={inp()} maxLength={V.LIMITS.name} disabled={ro} value={m.lastName} onChange={(e) => updateMember(idx, { lastName: e.target.value })} />
                </Field>
                <Field label="Preferred Name">
                  <input style={inp()} maxLength={V.LIMITS.name} disabled={ro} value={m.preferredName} onChange={(e) => updateMember(idx, { preferredName: e.target.value })} />
                </Field>
                <Field label="Date of Birth" error={fe.dob}>
                  <input type="date" style={{ ...css.input, ...(fe.dob ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={m.dob || ""} onChange={(e) => updateMember(idx, { dob: e.target.value })} />
                </Field>
                <Field label="Gender">
                  <select style={{ ...css.select, ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={m.gender || ""} onChange={(e) => updateMember(idx, { gender: e.target.value })}>
                    {GENDERS.map((g) => <option key={g} value={g}>{g || "Select…"}</option>)}
                  </select>
                </Field>
                <Field label="Relationship" required error={fe.relationship}>
                  <select style={{ ...css.select, ...(fe.relationship ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }} disabled={ro} value={m.relationship || ""} onChange={(e) => updateMember(idx, { relationship: e.target.value })}>
                    <option value="">Select…</option>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Phone (optional)" error={fe.phone}>
                  <input style={{ ...css.input, ...(fe.phone ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }} inputMode="tel" maxLength={V.LIMITS.phone} disabled={ro} value={m.phone} onChange={(e) => updateMember(idx, { phone: V.formatUsCaPhone(e.target.value) })} />
                </Field>
                <Field label="Email (optional)" error={fe.email}>
                  <input style={{ ...css.input, ...(fe.email ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }} type="email" maxLength={V.LIMITS.email} disabled={ro} value={m.email} onChange={(e) => updateMember(idx, { email: e.target.value })} />
                </Field>
                <Field label="Occupation (optional)">
                  <input style={inp()} maxLength={V.LIMITS.text} disabled={ro} value={m.occupation} onChange={(e) => updateMember(idx, { occupation: e.target.value })} />
                </Field>
                <Field label="Notes / Comments" full>
                  <textarea style={{ ...css.textarea, ...(ro ? css.inputReadonly : {}), minHeight: 60 }} maxLength={500} disabled={ro} value={m.notes} onChange={(e) => updateMember(idx, { notes: e.target.value })} />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div style={css.saveBar}>
          <span style={{ fontSize: 13 }}>You're editing your Personal Profile. Save or discard to continue.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={css.btnSecondary} onClick={handleDiscard} disabled={saving}>Discard</button>
            <button type="button" style={css.btnSuccess} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
