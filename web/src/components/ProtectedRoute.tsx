import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // If a sign-out action explicitly suppressed the protected-route toast
      // (set by the sign-out handler), clear the flag and skip showing the toast
      // and redirect here. The sign-out handler will navigate already.
      try {
        const suppress =
          typeof window !== "undefined" &&
          sessionStorage.getItem("suppressProtectedToast") === "1";
        if (suppress) {
          sessionStorage.removeItem("suppressProtectedToast");
          return;
        }
      } catch (err) {
        // ignore sessionStorage errors
      }

      toast.error("Access denied. Please sign in to continue.");
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
