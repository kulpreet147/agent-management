// Shared inline-style object for the Agent Profile module.
// Extracted from the original AgentProfile.jsx and extended for the
// Tier / Personal / Business / Online / System Settings sections.
export const css = {
  page: { minHeight: "100vh", background: "#eef3f8", color: "#020617", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  pageHeader: { padding: "28px 36px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  pageTitle: { fontSize: 38, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 },
  pageSub: { fontSize: 12, color: "#64748b", marginTop: 8, fontWeight: 600 },
  tabsBar: { display: "flex", padding: "20px 36px 0", borderBottom: "1px solid #cbd5e1", marginBottom: 20, flexWrap: "wrap" },
  tab: (active) => ({ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: active ? "#1d4ed8" : "#64748b", cursor: "pointer", borderBottom: `2px solid ${active ? "#1d4ed8" : "transparent"}`, marginBottom: -1, transition: "all 0.15s" }),
  content: { padding: "0 36px 28px", flex: 1, minHeight: 0, overflowY: "auto" },

  panel: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 22, marginBottom: 18, boxShadow: "0 1px 2px rgba(15,23,42,0.06)" },
  panelTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 },
  panelSub: { fontSize: 12, color: "#64748b", marginBottom: 18 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" },

  avatarUpload: { display: "flex", alignItems: "center", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" },
  avatarLarge: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, position: "relative", flexShrink: 0, color: "#fff" },
  avatarBadge: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "#2563eb", borderRadius: "50%", border: "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, cursor: "pointer", color: "#fff" },
  uploadBtn: { marginTop: 8, fontSize: 12, color: "#2563eb", cursor: "pointer", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", display: "inline-block" },

  formGrid: (cols = 2) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }),
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldFull: { display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" },
  label: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 },
  reqMark: { color: "#dc2626", marginLeft: 2 },
  input: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", fontWeight: 500, boxSizing: "border-box" },
  inputError: { borderColor: "#dc2626", background: "#fef2f2" },
  inputReadonly: { background: "#eef2f7", color: "#64748b", cursor: "not-allowed" },
  select: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", appearance: "auto", fontWeight: 500, boxSizing: "border-box" },
  textarea: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80, fontWeight: 500, boxSizing: "border-box" },
  errorText: { fontSize: 11, color: "#dc2626", fontWeight: 600 },
  hint: { fontSize: 11, color: "#94a3b8", fontWeight: 500 },

  tagContainer: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 40 },
  tag: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 12, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 },
  tagRemove: { cursor: "pointer", fontWeight: 700, lineHeight: 1 },
  tagInput: { border: "none", outline: "none", background: "transparent", fontSize: 12.5, flex: 1, minWidth: 80, fontFamily: "inherit", color: "#0f172a" },

  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e2e8f0" },
  toggle: (on) => ({ width: 42, height: 24, borderRadius: 12, background: on ? "#2563eb" : "#cbd5e1", border: `1px solid ${on ? "#2563eb" : "#94a3b8"}`, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }),
  toggleKnob: (on) => ({ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }),

  btnRow: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  btnPrimary: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#4f8ef7", color: "white", border: "none", fontFamily: "inherit" },
  btnSecondary: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#ffffff", color: "#334155", border: "1px solid #cbd5e1", fontFamily: "inherit" },
  btnSuccess: { padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "#15803d", color: "white", border: "none", fontFamily: "inherit" },
  btnDanger: { padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontFamily: "inherit" },
  btnGhost: { padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", fontFamily: "inherit" },

  // Dirty/save bar shown when a section has unsaved changes
  saveBar: { position: "sticky", bottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#0f172a", color: "#e2e8f0", borderRadius: 10, padding: "12px 18px", marginTop: 18, boxShadow: "0 8px 24px rgba(15,23,42,0.25)" },

  // Tier cards
  tierGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 4 },
  tierCard: (active, highlight) => ({ border: `2px solid ${active ? "#2563eb" : highlight ? "#c4b5fd" : "#e2e8f0"}`, borderRadius: 12, padding: 18, background: active ? "#eff6ff" : "#ffffff", position: "relative", display: "flex", flexDirection: "column", gap: 10 }),
  tierName: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 },
  featureRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569" },
  badge: (bg, color, border) => ({ display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${border}`, background: bg, color, borderRadius: 999, padding: "2px 10px", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 }),

  socialRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #e2e8f0" },
  socialIcon: (bg, color) => ({ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, color }),

  emptyState: { textAlign: "center", padding: "28px 16px", color: "#94a3b8", fontSize: 13, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10 },
};

export const tierMeta = {
  "Free Trial": { icon: "⏳", style: { background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" } },
  Silver: { icon: "🥈", style: { background: "#f8fafc", color: "#475569", borderColor: "#cbd5e1" } },
  Gold: { icon: "🥇", style: { background: "#fffbeb", color: "#b45309", borderColor: "#fcd34d" } },
  Platinum: { icon: "💎", style: { background: "#f5f3ff", color: "#6d28d9", borderColor: "#c4b5fd" } },
};
