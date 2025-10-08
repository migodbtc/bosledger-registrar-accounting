import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ROLES = [
  "student",
  "registrar",
  "accounting",
  "admin",
  "superadmin",
] as const;
type Role = (typeof ROLES)[number];

const RoleSwitcherOverlay: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [override, setOverride] = useState<string | null>(null);
  const [minimized, setMinimized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem("devRoleOverride");
      setOverride(v ?? "student");
    } catch (err) {
      setOverride("student");
    }
    try {
      const m = sessionStorage.getItem("devRoleOverlayMinimized");
      setMinimized(m === "1");
    } catch (err) {
      // ignore
    }
  }, []);

  // Only show the role-switcher when someone is signed in (dev tool)
  // Guard must come after hooks so hook order is stable across renders
  if (!userProfile) return null;

  const applyOverride = (role: Role | null) => {
    try {
      if (role) sessionStorage.setItem("devRoleOverride", role);
      else sessionStorage.removeItem("devRoleOverride");
      setOverride(role);
      console.log("Session's role has been set to ", role);
      console.log(userProfile);
      // ask AuthContext to refresh profile so UI updates immediately
      refreshProfile().catch(() => {});
    } catch (err) {
      console.error("Role override error", err);
    }
  };

  const setMinimizedState = (v: boolean) => {
    try {
      sessionStorage.setItem("devRoleOverlayMinimized", v ? "1" : "0");
    } catch (err) {
      // ignore
    }
    setMinimized(v);
  };

  // Small, unobtrusive floating UI
  if (minimized) {
    return (
      <div className="fixed right-4 bottom-4 z-[9999]">
        <button
          className="w-10 h-10 rounded-full bg-white/90 border shadow flex items-center justify-center text-sm"
          title="Open Role Override"
          onClick={() => setMinimizedState(false)}
        >
          Role
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-[9999]">
      <div className="relative bg-white/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg w-80">
        <button
          className="absolute right-2 top-2 w-7 h-7 rounded text-sm flex items-center justify-center"
          title="Minimize"
          onClick={() => setMinimizedState(true)}
        >
          —
        </button>
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          Dev Role Override
        </div>
        <div className="space-y-2">
          <select
            className="w-full p-2 border rounded"
            value={override ?? "student"}
            onChange={(e) => applyOverride(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="flex-1 px-2 py-1 rounded bg-primary text-white text-sm"
              onClick={() => applyOverride("student")}
            >
              Reset to student
            </button>
            <button
              className="flex-1 px-2 py-1 rounded bg-secondary text-sm"
              onClick={() => refreshProfile()}
            >
              Refresh
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            Current role: {override ?? userProfile?.role ?? "(from DB)"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSwitcherOverlay;
