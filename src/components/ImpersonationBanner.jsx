import { useState } from "react";
import { auth } from "../utils/auth.js";

// Sticky banner shown across the agent portal while an admin is acting on
// behalf of an agent. Reads the active session; renders nothing otherwise.
export default function ImpersonationBanner() {
  const [exiting, setExiting] = useState(false);
  const session = auth.get();
  if (!session?.impersonatedBy) return null;

  const adminName = session.impersonatedBy.name || "Admin";

  const exit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await auth.stopImpersonation();
    } finally {
      // Full reload guarantees the restored admin session is read everywhere.
      window.location.href = "/admin/agents";
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        background: "linear-gradient(90deg, #b45309, #d97706)",
        color: "#fff",
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <span>
        👤 Acting on behalf of <strong>{session.name}</strong> · delegated by {adminName}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        style={{
          background: "#fff",
          color: "#b45309",
          border: "none",
          borderRadius: 6,
          padding: "4px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: exiting ? "default" : "pointer",
          opacity: exiting ? 0.7 : 1,
        }}
      >
        {exiting ? "Returning…" : "Return to admin"}
      </button>
    </div>
  );
}
