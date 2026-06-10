import { useState } from "react";
import { css } from "./profileStyles.js";

export function Toggle({ value, onChange, disabled = false }) {
  return (
    <div
      role="switch"
      aria-checked={!!value}
      style={{ ...css.toggle(!!value), opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={() => {
        if (disabled) return;
        onChange(!value);
      }}
    >
      <div style={css.toggleKnob(!!value)} />
    </div>
  );
}

// Label + control + inline error wrapper.
export function Field({ label, required = false, error = "", hint = "", full = false, children }) {
  return (
    <div style={full ? css.fieldFull : css.field}>
      {label && (
        <label style={css.label}>
          {label}
          {required && <span style={css.reqMark}>*</span>}
        </label>
      )}
      {children}
      {error ? <span style={css.errorText}>{error}</span> : hint ? <span style={css.hint}>{hint}</span> : null}
    </div>
  );
}

// Comma/Enter-separated tag editor backed by an array of strings.
export function TagInput({ values = [], onChange, disabled = false, placeholder = "Type and press Enter", max = 30 }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value.slice(0, 40)]);
    setDraft("");
  };

  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div style={{ ...css.tagContainer, opacity: disabled ? 0.6 : 1 }}>
      {values.map((v, idx) => (
        <span key={`${v}-${idx}`} style={css.tag}>
          {v}
          {!disabled && (
            <span style={css.tagRemove} onClick={() => remove(idx)} aria-label={`Remove ${v}`}>
              ×
            </span>
          )}
        </span>
      ))}
      {!disabled && values.length < max && (
        <input
          style={css.tagInput}
          value={draft}
          placeholder={values.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && values.length) {
              remove(values.length - 1);
            }
          }}
          onBlur={commit}
        />
      )}
    </div>
  );
}

// Standard Edit / Save+Discard action row for a section header.
export function SectionActions({ editing, canEdit, onEdit, onSave, onDiscard, saving = false, saveLabel = "Save Changes" }) {
  if (!editing) {
    return (
      <button
        type="button"
        style={{ ...css.btnPrimary, opacity: canEdit ? 1 : 0.5, cursor: canEdit ? "pointer" : "not-allowed" }}
        disabled={!canEdit}
        onClick={onEdit}
        title={canEdit ? "" : "Finish editing the current section first"}
      >
        Edit
      </button>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button type="button" style={css.btnSecondary} onClick={onDiscard} disabled={saving}>
        Discard
      </button>
      <button type="button" style={css.btnSuccess} onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}
