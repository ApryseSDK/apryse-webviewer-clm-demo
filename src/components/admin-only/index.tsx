import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { useRole } from "../../contexts/role";

// Routes inside this wrapper are for the Admin view only.
export const AdminOnly = () => {
  const { isAdmin } = useRole();
  return isAdmin ? <Outlet /> : <Navigate to="/agreements" replace />;
};

// A signer can only open their own agreements.
export const useOwnerGuard = (ownerId: string | undefined) => {
  const { isAdmin, role } = useRole();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAdmin && ownerId && ownerId !== role) navigate("/agreements", { replace: true });
  }, [isAdmin, role, ownerId, navigate]);
};
