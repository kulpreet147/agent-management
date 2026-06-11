import { useState } from "react";
import { useToast } from "../../../hooks/useToast.js";
import { css } from "./profileStyles.js";
import { Field, TagInput, SectionActions } from "./profileWidgets.jsx";
import * as V from "./profileValidation.js";

export default function BusinessProfileSection({ ctx }) {
  const toast = useToast();
  const [attempted, setAttempted] = useState(false);
  const { draft, update, company, editing, canEdit, saving, onEdit, onDiscard, onSave } = ctx;
  const business = draft.business;
  const ro = !editing;

  const setBusiness = (patch) => update((d) => ({ ...d, business: { ...d.business, ...patch } }));

  const errors = {
    operatingName: V.required(business.operatingName) || V.maxLen(business.operatingName, V.LIMITS.text),
    businessEmail: V.email(business.businessEmail),
    businessPhone: V.phone(business.businessPhone),
    yearsExperience: V.number(business.yearsExperience, { min: 0, max: 70 }),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = () => {
    if (hasErrors) {
      setAttempted(true);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setAttempted(false);
    onSave();
  };
  const handleDiscard = () => { setAttempted(false); onDiscard(); };

  const showErr = (k) => (attempted ? errors[k] : "");
  const inp = (k) => ({ ...css.input, ...(showErr(k) ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) });

  return (
    <div>
      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Business Profile</div>
            <div style={css.panelSub}>Your business identity and how clients reach you.</div>
          </div>
          <SectionActions editing={editing} canEdit={canEdit} onEdit={onEdit} onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        </div>

        <div style={css.formGrid(2)}>
          <Field label="Business / Operating Name" required error={showErr("operatingName")} hint="Defaults to your name — editable.">
            <input style={inp("operatingName")} maxLength={V.LIMITS.text} disabled={ro} value={business.operatingName} onChange={(e) => setBusiness({ operatingName: e.target.value })} />
          </Field>
          <Field label="Brokerage Name" hint="Set by your brokerage — not editable.">
            <input style={{ ...css.input, ...css.inputReadonly }} disabled value={company?.brokerageName || "—"} readOnly />
          </Field>
          <Field label="Business Address" hint="Company address — not editable." full>
            <input style={{ ...css.input, ...css.inputReadonly }} disabled value={company?.businessAddress || "—"} readOnly />
          </Field>
          <Field label="Mailing Address" hint="Defaults from your residential address — editable." full>
            <input style={inp("mailingAddress")} maxLength={V.LIMITS.longText} disabled={ro} value={business.mailingAddress} onChange={(e) => setBusiness({ mailingAddress: e.target.value })} />
          </Field>
          <Field label="Business Phone" error={showErr("businessPhone")} hint="Defaults from primary phone.">
            <input style={inp("businessPhone")} inputMode="tel" maxLength={V.LIMITS.phone} disabled={ro} value={business.businessPhone} placeholder="(604) 555-0123"
              onChange={(e) => setBusiness({ businessPhone: V.formatUsCaPhone(e.target.value) })} />
          </Field>
          <Field label="Business Email" error={showErr("businessEmail")} hint="Defaults from your email.">
            <input style={inp("businessEmail")} type="email" maxLength={V.LIMITS.email} disabled={ro} value={business.businessEmail} onChange={(e) => setBusiness({ businessEmail: e.target.value })} />
          </Field>
          <Field label="Years of Industry Experience" error={showErr("yearsExperience")}>
            <input style={{ ...inp("yearsExperience"), width: 140 }} type="number" min="0" max="70" disabled={ro} value={business.yearsExperience} onChange={(e) => setBusiness({ yearsExperience: e.target.value })} />
          </Field>
        </div>
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Expertise & Coverage</div>
        <div style={css.panelSub}>Press Enter or comma to add each item.</div>
        <div style={css.formGrid(2)}>
          <Field label="Areas of Specialization">
            <TagInput values={business.specializations} disabled={ro} placeholder="e.g. Life Insurance" onChange={(v) => setBusiness({ specializations: v })} />
          </Field>
          <Field label="Insurance Products Offered">
            <TagInput values={business.productsOffered} disabled={ro} placeholder="e.g. Term Life, Critical Illness" onChange={(v) => setBusiness({ productsOffered: v })} />
          </Field>
          <Field label="Service Areas / Provinces Licensed In">
            <TagInput values={business.serviceAreas} disabled={ro} placeholder="e.g. ON, BC" onChange={(v) => setBusiness({ serviceAreas: v })} />
          </Field>
          <Field label="Languages Spoken">
            <TagInput values={business.languages} disabled={ro} placeholder="e.g. English, Punjabi" onChange={(v) => setBusiness({ languages: v })} />
          </Field>
        </div>
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>About & Credentials</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Professional Biography / About Me">
            <textarea style={{ ...css.textarea, ...(ro ? css.inputReadonly : {}) }} maxLength={V.LIMITS.longText} rows={5} disabled={ro} value={business.bio} placeholder="Tell clients about your background and approach…"
              onChange={(e) => setBusiness({ bio: e.target.value })} />
          </Field>
          <Field label="Professional Designations">
            <TagInput values={business.designations} disabled={ro} placeholder="e.g. CFP, CLU" onChange={(v) => setBusiness({ designations: v })} />
          </Field>
          <Field label="Awards and Achievements">
            <TagInput values={business.awards} disabled={ro} placeholder="e.g. Top Advisor 2024" onChange={(v) => setBusiness({ awards: v })} />
          </Field>
        </div>
      </div>

      {editing && (
        <div style={css.saveBar}>
          <span style={{ fontSize: 13 }}>You're editing your Business Profile. Save or discard to continue.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={css.btnSecondary} onClick={handleDiscard} disabled={saving}>Discard</button>
            <button type="button" style={css.btnSuccess} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
