import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

// "View as" demo roles. This is NOT security: there is no login and everything
// lives in the browser. It only shows how the WebViewer UI and the app can
// change depending on who is using it.
//   "admin"  -> full access (templates, signers, all agreements, full viewer)
//   <user id> -> a signer who sees only their own agreements and a simplified viewer
export const ADMIN = "admin";
export const ROLE_STORAGE_KEY = "webviewer-clm-role";

const readRole = (): string => {
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) || ADMIN;
  } catch {
    return ADMIN;
  }
};

type RoleContextValue = {
  /** "admin" or the id of the signer being viewed as. */
  role: string;
  isAdmin: boolean;
  setRole: (role: string) => void;
};

const RoleContext = createContext<RoleContextValue>({
  role: ADMIN,
  isAdmin: true,
  setRole: () => undefined,
});

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<string>(readRole);
  const navigate = useNavigate();

  const setRole = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable (private windows); the choice just won't persist.
      }
      setRoleState(next);
      // Every role can see the agreements list, so land there.
      navigate("/agreements");
    },
    [navigate]
  );

  const value = useMemo(() => ({ role, isAdmin: role === ADMIN, setRole }), [role, setRole]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);
