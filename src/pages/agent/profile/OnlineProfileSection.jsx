import { useState } from "react";
import { useToast } from "../../../hooks/useToast.js";
import { css } from "./profileStyles.js";
import { Field, SectionActions } from "./profileWidgets.jsx";
import * as V from "./profileValidation.js";

const LINKS = [
  { key: "linkedin", name: "LinkedIn", icon: "in", bg: "rgba(10,102,194,0.15)", color: "#0a66c2", placeholder: "linkedin.com/in/yourprofile" },
  { key: "facebook", name: "Facebook", icon: "f", bg: "rgba(24,119,242,0.12)", color: "#1877f2", placeholder: "facebook.com/yourpage" },
  { key: "instagram", name: "Instagram", icon: "IG", bg: "rgba(225,48,108,0.12)", color: "#e1306c", placeholder: "instagram.com/yourhandle" },
  { key: "twitter", name: "X (Twitter)", icon: "X", bg: "rgba(0,0,0,0.12)", color: "#0f172a", placeholder: "x.com/yourhandle" },
  { key: "youtube", name: "YouTube", icon: "▶", bg: "rgba(255,0,0,0.12)", color: "#ff0000", placeholder: "youtube.com/@yourchannel" },
  { key: "tiktok", name: "TikTok", icon: "♪", bg: "rgba(0,0,0,0.12)", color: "#0f172a", placeholder: "tiktok.com/@yourhandle" },
  { key: "website", name: "Personal Website", icon: "W", bg: "rgba(16,185,129,0.12)", color: "#0f766e", placeholder: "youragencysite.com" },
  { key: "otherProfiles", name: "Other Profile", icon: "★", bg: "rgba(99,102,241,0.12)", color: "#4f46e5", placeholder: "any other professional profile" },
  { key: "bookingLink", name: "Booking / Calendar", icon: "📅", bg: "rgba(245,158,11,0.12)", color: "#b45309", placeholder: "calendly.com/yourname" },
];

export default function OnlineProfileSection({ ctx }) {
  const toast = useToast();
  const [attempted, setAttempted] = useState(false);
  const { draft, update, editing, canEdit, saving, onEdit, onDiscard, onSave } = ctx;
  const online = draft.online;
  const ro = !editing;

  const setOnline = (patch) => update((d) => ({ ...d, online: { ...d.online, ...patch } }));

  const errors = LINKS.reduce((acc, l) => {
    acc[l.key] = V.url(online[l.key]) || V.maxLen(online[l.key], V.LIMITS.url);
    return acc;
  }, {});
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = () => {
    if (hasErrors) {
      setAttempted(true);
      toast.error("One or more links are not valid URLs.");
      return;
    }
    setAttempted(false);
    onSave();
  };
  const handleDiscard = () => { setAttempted(false); onDiscard(); };

  return (
    <div>
      <div style={css.panel}>
        <div style={css.sectionHeader}>
          <div>
            <div style={css.panelTitle}>Online Profile</div>
            <div style={css.panelSub}>Links to your social, web and booking presence. URLs are validated on save.</div>
          </div>
          <SectionActions editing={editing} canEdit={canEdit} onEdit={onEdit} onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
        </div>

        {LINKS.map((l, index) => {
          const err = attempted ? errors[l.key] : "";
          return (
            <div key={l.key} style={{ ...css.socialRow, ...(index === LINKS.length - 1 ? { borderBottom: "none" } : {}), alignItems: "flex-start" }}>
              <div style={{ ...css.socialIcon(l.bg, l.color), marginTop: 2 }}>{l.icon}</div>
              <div style={{ fontSize: 13, color: "#475569", width: 130, flexShrink: 0, marginTop: 8, fontWeight: 600 }}>{l.name}</div>
              <div style={{ flex: 1 }}>
                <input
                  type="url"
                  style={{ ...css.input, ...(err ? css.inputError : {}), ...(ro ? css.inputReadonly : {}) }}
                  maxLength={V.LIMITS.url}
                  disabled={ro}
                  value={online[l.key] || ""}
                  placeholder={l.placeholder}
                  onChange={(e) => setOnline({ [l.key]: e.target.value })}
                />
                {err ? <span style={css.errorText}>{err}</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div style={css.saveBar}>
          <span style={{ fontSize: 13 }}>You're editing your Online Profile. Save or discard to continue.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={css.btnSecondary} onClick={handleDiscard} disabled={saving}>Discard</button>
            <button type="button" style={css.btnSuccess} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
