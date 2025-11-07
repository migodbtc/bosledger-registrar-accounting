import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faHome,
  faUsers,
  faGraduationCap,
  faBookOpen,
  faUserGraduate,
  faCreditCard,
  faMoneyBill,
  faUser,
  faHourglass,
  faChevronRight,
  faSignOut,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: faHome },
      {
        title: "My Dashboard",
        url: "/dashboard/student",
        icon: faUserGraduate,
      },
      { title: "Students", url: "/students", icon: faUsers },
    ],
  },
  {
    title: "Academic Management",
    items: [
      { title: "Courses", url: "/courses", icon: faGraduationCap },
      { title: "Subjects", url: "/subjects", icon: faBookOpen },
      { title: "Enrollments", url: "/enrollments", icon: faUserGraduate },
      { title: "My Enrollments", url: "/my/enrollments", icon: faBook },
    ],
  },
  {
    title: "Financial Management",
    items: [
      { title: "Payments", url: "/payments", icon: faCreditCard },
      { title: "Balances", url: "/balances", icon: faMoneyBill },
      { title: "My Payments", url: "/my/payments", icon: faCreditCard },
      { title: "My Balances", url: "/my/balances", icon: faMoneyBill },
    ],
  },
  {
    title: "System Management",

    items: [
      { title: "Admin Manager", url: "/admins", icon: faUser },
      { title: "Role Manager", url: "/roles", icon: faUser },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/profile", icon: faUser },
      {
        title: "Verification",
        url: "/verification",
        icon: faHourglass,
      },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { userProfile } = useAuth();
  const role: string | null = userProfile?.role ?? null;

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      // suppress ProtectedRoute's access-denied toast which would trigger
      // after signOut clears the user session
      try {
        sessionStorage.setItem("suppressProtectedToast", "1");
      } catch (err) {
        // ignore
      }
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const isActive = (path: string) => currentPath === path;

  const filterItemsByRole = (items: any[]) => {
    // role rules (summary):
    // - all users can see Profile
    // - users: only Profile and Verification (this is the literal 'user' role used for unverified accounts)
    // - students: see student dashboard (/dashboard/student) and personal routes (/my/*)
    // - registrar: see shared dashboard (/dashboard) and academic/registrar features; DO NOT see student personal routes (/my/*) or student dashboard
    // - accounting: see shared dashboard (/dashboard) and accounting features; DO NOT see student personal routes (/my/*) or student dashboard
    // - admin/superadmin: full access

    // Verification should ONLY be visible for the literal 'user' role.
    const showVerification = role === "user";
    // Start with a base items list where verification is removed unless the role is exactly 'user'.
    const baseItems = showVerification
      ? items
      : items.filter((it) => (it && it.url) !== "/verification");

    if (!role) return baseItems; // unauthenticated or unknown role -> show default (without verification)

    const isAdmin = role === "admin" || role === "superadmin";
    // Admins: full functional access except student personal routes (/my/*)
    if (isAdmin) {
      // For admin vs superadmin we need slightly different rules for the
      // "System Management" section. Admin (role === 'admin') should only
      // see the Role Manager (/roles). Superadmin keeps full access (but we
      // still hide student personal routes and student dashboard).
      return baseItems.filter((i) => {
        const u = (i && i.url) || "";
        // Always block student personal routes and the student dashboard
        if (u.startsWith("/my") || u === "/dashboard/student") return false;

        if (role === "admin") {
          // Admin: only allow role manager under system management
          // We'll allow other non-system-management items as before.
          // If this item is part of system management (admins, roles, e2e-runner),
          // only allow /roles.
          if (u === "/admins" || u === "/e2e-runner") return false;
          return true;
        }

        // superadmin: allow everything (except student personal routes/student dashboard handled above)
        return true;
      });
    }

    // If the role is the initial 'user' (registered but not verified), show
    // only the Profile and Verification pages under Account.
    if (role === "user") {
      // For the literal 'user' role allow only profile and verification
      return baseItems.filter((it) =>
        ["/profile", "/verification"].includes(it.url)
      );
    }

    return baseItems.filter((item) => {
      const url: string = item.url;
      // allow profile for all authenticated roles
      if (url === "/profile") return true;

      // Student: only their personal pages and their student dashboard
      if (role === "student") {
        return url.startsWith("/my") || url === "/dashboard/student";
      }

      // Registrar: show shared dashboard and academic/registrar features.
      // Block accounting and any personal student routes.
      if (role === "registrar") {
        if (url.startsWith("/my")) return false; // personal student-only routes
        if (
          url.startsWith("/payments") ||
          url.startsWith("/balances") ||
          url.startsWith("/reports")
        )
          return false; // block accounting
        // explicitly block student-dashboard route
        if (url === "/dashboard/student") return false;
        // Registrar should NOT see system management routes (admins/roles/e2e-runner)
        if (url === "/admins" || url === "/roles" || url === "/e2e-runner")
          return false;
        return true;
      }

      // Accounting: show shared dashboard and accounting features only
      // NOTE: Reports are admin-only now, so do not include '/reports' here.
      if (role === "accounting") {
        if (url === "/dashboard") return true;
        if (url.startsWith("/payments") || url.startsWith("/balances"))
          return true;
        // allow viewing student list for accounting when needed
        if (url === "/students") return true;
        // block student personal and student dashboard routes and other sections
        return false;
      }

      // fallback: hide by default
      return false;
    });
  };

  return (
    <Sidebar
      className={`border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`p-4 ${collapsed ? "px-2" : "px-6"}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-10 h-10 rounded-xl hypatia-gradient-bg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faBook} className="text-white text-lg" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-xl font-bold text-foreground">Bosledger</h1>
              <p className="text-xs text-muted-foreground">
                Registrar & Accounting
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <SidebarContent className={`${collapsed ? "px-2" : "px-4"}`}>
        {navigationItems.map((group, groupIndex) => {
          const filtered = { ...group, items: filterItemsByRole(group.items) };
          if (!filtered.items || filtered.items.length === 0) return null;
          const groupToRender = filtered;
          return (
            <SidebarGroup key={group.title} className="mb-2">
              {!collapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {groupToRender.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {groupToRender.items.map((item: any) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`w-full ${
                          collapsed ? "justify-center p-2" : "justify-start p-3"
                        } rounded-lg transition-all duration-200 ${
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {/* If the item is the generic dashboard link, point it to the
                              role-specific default if the current user is a student. */}
                        <NavLink
                          to={
                            item.url === "/dashboard"
                              ? role === "student"
                                ? "/dashboard/student"
                                : "/dashboard"
                              : item.url
                          }
                          className={`flex items-center ${
                            collapsed ? "justify-center" : "space-x-3"
                          } relative group`}
                          title={collapsed ? item.title : undefined}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className="text-base flex-shrink-0"
                          />
                          {!collapsed && (
                            <motion.span
                              className="font-medium"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item.title}
                            </motion.span>
                          )}
                          {!collapsed && isActive(item.url) && (
                            <motion.div
                              className="ml-auto"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FontAwesomeIcon
                                icon={faChevronRight}
                                className="text-xs"
                              />
                            </motion.div>
                          )}
                          {/* Tooltip for collapsed state */}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              {item.title}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t ${collapsed ? "px-2" : ""}`}>
        <button
          type="button"
          onClick={handleSignOut}
          className={`flex items-center ${
            collapsed ? "justify-center p-2" : "space-x-3 p-3"
          } w-full rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 group relative`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <FontAwesomeIcon
            icon={faSignOut}
            className="text-base flex-shrink-0"
          />
          {!collapsed && (
            <motion.span
              className="font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              Sign Out
            </motion.span>
          )}
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </Sidebar>
  );
}
