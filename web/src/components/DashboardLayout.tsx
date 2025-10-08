import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { userProfile, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure when user role is student they land on /dashboard/student and
  // non-students land on /dashboard. This runs when role or path changes.
  useEffect(() => {
    if (!userProfile) return;
    const role = userProfile.role ?? null;
    const current = location.pathname;
    if (role === "student") {
      // if on generic dashboard or elsewhere at /dashboard, redirect to student dashboard
      if (current === "/dashboard" || current === "/dashboard/") {
        navigate("/dashboard/student", { replace: true });
      }
    } else {
      // non-students should use generic dashboard route
      if (current === "/dashboard/student") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [userProfile, location.pathname, navigate]);

  const getDisplayName = () => {
    if (userProfile) {
      const first = userProfile.first_name ?? userProfile.firstName ?? "";
      const last = userProfile.last_name ?? userProfile.lastName ?? "";
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if (userProfile.email) return userProfile.email;
    }
    if (user?.email) return user.email;
    return "Guest";
  };

  const getRoleLabel = () => {
    const role = userProfile?.role ?? null;
    if (!role) return "User";
    // simple capitalization
    return String(role)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };
  return (
    <>
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <SidebarTrigger className="flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faBars}
                  className="text-muted-foreground"
                />
              </SidebarTrigger>
              <div>
                {title && (
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Profile with Rank */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-foreground">
                    {getDisplayName()}
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    {getRoleLabel()}
                  </span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hypatia-gradient-bg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
