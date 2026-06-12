import { css } from "./profileStyles.js";
import { Field } from "./profileWidgets.jsx";

// Read-only Licensing view for the agent. Licence details come from onboarding;
// provinces, carriers, CE credits and renewals are managed by the admin.
function renewalBadge(expiry) {
  if (!expiry) return { label: "Not set", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return { label: "Not set", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  if (days <= 60) return { label: `Expiring in ${days}d`, bg: "#fffbeb", color: "#b45309", border: "#fcd34d" };
  return { label: "Valid", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

// Read-only status presentation for the admin-managed APEXA contract.
const APEXA_STATUS = {
  draft: { label: "Draft", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  submitted: { label: "Submitted to APEXA", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  under_review: { label: "Under Review", bg: "#fffbeb", color: "#b45309", border: "#fcd34d" },
  approved: { label: "Approved", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  rejected: { label: "Rejected", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

const ro = { ...css.input, ...css.inputReadonly };

function Pill({ info }) {
  return <span style={css.badge(info.bg, info.color, info.border)}>{info.label}</span>;
}

export default function LicensingSection({ agentData }) {
  const lic = agentData?.documents?.licensing || {};
  const provinces = Array.isArray(lic.provinces) ? lic.provinces : [];
  const carriers = Array.isArray(lic.carriers) ? lic.carriers : [];
  const ceCredits = Array.isArray(lic.ceCredits) ? lic.ceCredits : [];
  const renewal = lic.renewal || {};
  const totalCE = ceCredits.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const apexa = agentData?.documents?.apexaContract || null;
  const apexaInfo = apexa ? APEXA_STATUS[apexa.status] || APEXA_STATUS.draft : null;

  const licence = {
    number: agentData?.agentId || "",
    type: agentData?.licenceType || "",
    company: agentData?.insuranceCompany || "",
    expiry: renewal.licenceExpiry || agentData?.licenceExpiryDate || "",
    eoNumber: agentData?.eoPolicyNumber || "",
    eoCompany: agentData?.eoPolicyCompany || "",
    eoExpiry: renewal.eoExpiry || agentData?.eoPolicyExpiryDate || "",
  };

  return (
    <div>
      <div style={css.panel}>
        <div style={css.panelTitle}>Licence Information</div>
        <div style={css.panelSub}>Read-only — captured during your onboarding and managed by your administrator.</div>
        <div style={css.formGrid(3)}>
          <Field label="Licence Number"><input style={ro} value={licence.number} disabled readOnly /></Field>
          <Field label="Licence Type"><input style={ro} value={licence.type} disabled readOnly /></Field>
          <Field label="Insurance Company"><input style={ro} value={licence.company} disabled readOnly /></Field>
          <Field label="E&O Policy Number"><input style={ro} value={licence.eoNumber} disabled readOnly /></Field>
          <Field label="E&O Company"><input style={ro} value={licence.eoCompany} disabled readOnly /></Field>
        </div>
        <div style={{ ...css.formGrid(2), marginTop: 16 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={css.label}>Licence Renewal</span>
              <Pill info={renewalBadge(licence.expiry)} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{fmtDate(licence.expiry)}</div>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={css.label}>E&O Renewal</span>
              <Pill info={renewalBadge(licence.eoExpiry)} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{fmtDate(licence.eoExpiry)}</div>
          </div>
        </div>
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Licensed Provinces / Territories</div>
        {provinces.length === 0 ? (
          <div style={css.emptyState}>No provinces assigned yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {provinces.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#334155" }}>{p.code || "—"}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name || p.code}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Expiry: {fmtDate(p.expiry)}</div>
                  </div>
                </div>
                <Pill info={renewalBadge(p.expiry)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Carrier Authorization & Selling Codes</div>
        {carriers.length === 0 ? (
          <div style={css.emptyState}>No carrier authorizations yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {carriers.map((c, i) => {
              const inactive = c.status === "Inactive";
              const pill = inactive
                ? { label: "Inactive", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" }
                : c.code
                  ? { label: "Authorized", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }
                  : { label: "Not Authorized", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name || "Carrier"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Selling code: <span style={{ fontFamily: "monospace" }}>{c.code || "—"}</span>
                      {c.effectiveDate ? ` · Effective ${fmtDate(c.effectiveDate)}` : ""}
                    </div>
                  </div>
                  <Pill info={pill} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>APEXA Contract</div>
        <div style={css.panelSub}>Managed by your administrator — tracks your MGA contract submission in APEXA.</div>
        {!apexa ? (
          <div style={css.emptyState}>Your APEXA contract workflow begins after your account is activated.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>APEXA Reference #</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{apexa.referenceNumber || "Not assigned yet"}</div>
              </div>
              <Pill info={apexaInfo} />
            </div>
            <div style={css.formGrid(2)}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <span style={css.label}>Submitted to APEXA</span>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{fmtDate(apexa.submittedAt)}</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <span style={css.label}>Decision Date</span>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{fmtDate(apexa.decidedAt)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={css.panel}>
        <div style={css.panelTitle}>Continuing Education (CE) Credits · {totalCE} total</div>
        {ceCredits.length === 0 ? (
          <div style={css.emptyState}>No CE credits recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ceCredits.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.course || "CE course"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.provider || "—"} · {fmtDate(c.date)}</div>
                </div>
                <span style={css.badge("#eff6ff", "#1d4ed8", "#bfdbfe")}>{Number(c.credits) || 0} credits</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
