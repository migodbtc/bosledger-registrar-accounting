import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faGraduationCap,
  faCreditCard,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faBookOpen,
  faMoneyBill,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  // placeholder for stats; moved below state so it can reference dynamic state

  const formatLargeCurrency = (value: number) => {
    if (!isFinite(value) || value === 0) return `₱0.00`;
    // millions shorthand
    if (Math.abs(value) >= 1_000_000) {
      return `₱${(value / 1_000_000).toFixed(2)}M`;
    }
    // thousands shorthand
    if (Math.abs(value) >= 1_000) {
      return `₱${(value / 1_000).toFixed(2)}K`;
    }
    return `₱${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Local state: simplified student list + loading/total used by fetchStudents
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  // enrollments summary for dashboard
  const [enrollmentsCount, setEnrollmentsCount] = useState<number>(0);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(false);
  // pending balances (due today or in the future)
  const [pendingBalancesCount, setPendingBalancesCount] = useState<number>(0);
  const [pendingBalancesLoading, setPendingBalancesLoading] =
    useState<boolean>(false);
  // payments this month
  const [monthlyPaymentsTotal, setMonthlyPaymentsTotal] = useState<number>(0);
  const [monthlyPaymentsLoading, setMonthlyPaymentsLoading] =
    useState<boolean>(false);

  const stats = [
    {
      title: "Total Students",
      // show formatted total while not loading; show a small skeleton text while loading
      value: loading ? "..." : total.toLocaleString(),
      icon: faUsers,
      color: "text-blue-600",
    },
    {
      title: "Active Enrollments",
      value: enrollmentsLoading ? "..." : enrollmentsCount.toLocaleString(),
      icon: faGraduationCap,
      color: "text-green-600",
    },
    {
      title: "Pending Payments",
      value: pendingBalancesLoading
        ? "..."
        : pendingBalancesCount.toLocaleString(),
      icon: faCreditCard,
      color: "text-orange-600",
    },
    {
      title: "Revenue This Month",
      value: monthlyPaymentsLoading
        ? "..."
        : `${formatLargeCurrency(monthlyPaymentsTotal)}
          `,
      icon: faChartLine,
      color: "text-purple-600",
    },
  ];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        // Fetch only student_profile rows. Keep query minimal and return exact count.
        const { data, error, count } = await supabase
          .from("student_profile")
          .select(
            "id, status, created_at, users(id, student_number, first_name, last_name, email)",
            { count: "exact" }
          );

        if (error) {
          console.error("Error fetching students:", error);
          setStudents([]);
          setTotal(0);
          return;
        }

        const raw = (data ?? []) as any[];
        setStudents(raw);
        setTotal(typeof count === "number" ? count : raw.length);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // fetch enrolled students for the 2024-2025 school year
  useEffect(() => {
    const fetchEnrolled2024 = async () => {
      try {
        setEnrollmentsLoading(true);

        // count only enrollments matching the criteria for performance
        const { data, error, count } = await supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("status", "enrolled")
          .eq("school_year", "2024-2025");

        if (error) {
          console.error("Error fetching enrollments (2024-2025):", error);
          setEnrollmentsCount(0);
          return;
        }

        // prefer exact count when available
        if (typeof count === "number") {
          setEnrollmentsCount(count);
        } else {
          const raw = (data ?? []) as any[];
          setEnrollmentsCount(raw.length);
        }
      } finally {
        setEnrollmentsLoading(false);
      }
    };

    fetchEnrolled2024();
  }, []);

  // fetch pending balances where due_date is today or in the future
  useEffect(() => {
    const fetchPendingBalances = async () => {
      try {
        setPendingBalancesLoading(true);

        const today = new Date();
        // use YYYY-MM-DD which matches Postgres date comparison
        const todayStr = today.toISOString().slice(0, 10);

        // fetch balances due today or later
        const { data: balData, error: balErr } = await supabase
          .from("balances")
          .select("id, amount_due, due_date")
          .gte("due_date", todayStr);

        if (balErr) {
          console.error("Error fetching balances due today+:", balErr);
          setPendingBalancesCount(0);
          return;
        }

        const balances = (balData ?? []) as any[];
        const balanceIds = balances.map((b) => b.id).filter(Boolean);

        if (balanceIds.length === 0) {
          setPendingBalancesCount(0);
          return;
        }

        // fetch payments for these balances and sum amounts per balance
        const { data: pData, error: pErr } = await supabase
          .from("payments")
          .select("balance_id, amount_paid")
          .in("balance_id", balanceIds);

        if (pErr) {
          console.error("Error fetching payments for balances:", pErr);
          // fallback: consider all fetched balances as pending
          setPendingBalancesCount(balances.length);
          return;
        }

        const payments = (pData ?? []) as any[];
        const sums: Record<string, number> = payments.reduce(
          (acc: Record<string, number>, cur: any) => {
            const id = String(cur.balance_id);
            acc[id] = (acc[id] || 0) + Number(cur.amount_paid || 0);
            return acc;
          },
          {}
        );

        // count balances where paid < amount_due
        const pendingCount = balances.reduce((cnt, b) => {
          const paid = sums[String(b.id)] || 0;
          const due = Number(b.amount_due ?? 0);
          return cnt + (paid < due ? 1 : 0);
        }, 0);

        setPendingBalancesCount(pendingCount);
      } finally {
        setPendingBalancesLoading(false);
      }
    };

    fetchPendingBalances();
  }, []);

  // fetch payments for the current month and compute total amount_paid
  useEffect(() => {
    const fetchMonthlyPayments = async () => {
      try {
        setMonthlyPaymentsLoading(true);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        );
        const startStr = startOfMonth.toISOString().slice(0, 10);
        const nextStr = startOfNextMonth.toISOString().slice(0, 10);

        // fetch payments where payment_date is in [startOfMonth, startOfNextMonth)
        const { data, error } = await supabase
          .from("payments")
          .select("amount_paid")
          .gte("payment_date", startStr)
          .lt("payment_date", nextStr);

        if (error) {
          console.error("Error fetching monthly payments:", error);
          setMonthlyPaymentsTotal(0);
          return;
        }

        const payments = (data ?? []) as any[];
        const total = payments.reduce(
          (acc, p) => acc + Number(p.amount_paid || 0),
          0
        );
        setMonthlyPaymentsTotal(total);
      } finally {
        setMonthlyPaymentsLoading(false);
      }
    };

    fetchMonthlyPayments();
  }, []);

  // Experimental: fetch 2 latest updated rows from each table and merge
  const [recentChanges, setRecentChanges] = useState<any[]>([]);

  const { userProfile } = useAuth();
  const role: string | null = userProfile?.role ?? null;
  const navigate = useNavigate();

  const formatRelative = (iso?: string | null) => {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return `yesterday`;
    if (days < 7) return `${days}d ago`;
    // fallback to locale date for older items
    return new Date(iso).toLocaleDateString();
  };

  useEffect(() => {
    const tables = [
      "balances",
      "courses",
      "enlisted_subjects",
      "enlistments",
      "enrollments",
      "payments",
      "student_profile",
      "subjects",
      "users",
    ];

    const fetchRecent = async () => {
      try {
        const all: any[] = [];
        await Promise.all(
          tables.map(async (t) => {
            try {
              const { data, error } = await supabase
                .from(t)
                .select("*, created_at, updated_at")
                .order("updated_at", { ascending: false })
                .limit(2);
              if (error) {
                console.error("Error fetching recent rows for", t, error);
                return;
              }
              const rows = (data ?? []) as any[];
              // attach a __table property so we know the origin
              rows.forEach((r) => (r.__table = t));
              all.push(...rows);
            } catch (e) {
              console.error("fetchRecent error for table", t, e);
            }
          })
        );

        // helper lookup caches
        const userCache: Record<string, any> = {};
        const courseCache: Record<string, any> = {};
        const subjectCache: Record<string, any> = {};
        const profileCache: Record<string, any> = {};

        // enrich each row with a friendly message and detail
        const enriched = await Promise.all(
          all.map(async (r: any) => {
            const table = r.__table;
            const updated_at = r.updated_at ?? r.created_at ?? null;
            const id = r.id ?? null;

            const getUserByProfileId = async (
              profileId: string | undefined
            ) => {
              if (!profileId) return null;
              if (profileCache[profileId]) return profileCache[profileId];
              const { data: spData, error: spErr } = await supabase
                .from("student_profile")
                .select("id, user_id")
                .eq("id", profileId)
                .maybeSingle();
              if (spErr || !spData) return null;
              profileCache[profileId] = spData;
              const userId = spData.user_id;
              if (!userId) return null;
              if (userCache[userId]) return userCache[userId];
              const { data: uData } = await supabase
                .from("users")
                .select("id, first_name, last_name, email")
                .eq("id", userId)
                .maybeSingle();
              userCache[userId] = uData ?? null;
              return userCache[userId];
            };

            const getUserByUserId = async (userId: string | undefined) => {
              if (!userId) return null;
              if (userCache[userId]) return userCache[userId];
              const { data: uData } = await supabase
                .from("users")
                .select("id, first_name, last_name, email")
                .eq("id", userId)
                .maybeSingle();
              userCache[userId] = uData ?? null;
              return userCache[userId];
            };

            const getCourse = async (courseId: string | undefined) => {
              if (!courseId) return null;
              if (courseCache[courseId]) return courseCache[courseId];
              const { data: cData } = await supabase
                .from("courses")
                .select("id, name, title, department")
                .eq("id", courseId)
                .maybeSingle();
              courseCache[courseId] = cData ?? null;
              return courseCache[courseId];
            };

            const getSubject = async (subjectId: string | undefined) => {
              if (!subjectId) return null;
              if (subjectCache[subjectId]) return subjectCache[subjectId];
              const { data: sData } = await supabase
                .from("subjects")
                .select("id, subject_name, subject_code")
                .eq("id", subjectId)
                .maybeSingle();
              subjectCache[subjectId] = sData ?? null;
              return subjectCache[subjectId];
            };

            // build messages depending on table
            let message = "";
            let detail = "";

            if (table === "balances") {
              const student = await getUserByProfileId(r.student_profile_id);
              const last =
                student?.last_name ?? student?.first_name ?? "Student";
              message = `Balance for ${last} updated`;
              detail = `Current balance of student: ₱${Number(
                r.amount_due ?? 0
              ).toFixed(2)}`;
            } else if (table === "courses") {
              const dept = r.department ?? "Department";
              message = `A ${dept} course has been updated`;
              detail = r.title ?? r.name ?? "(no title)";
            } else if (table === "enlisted_subjects") {
              // r.enlistment_id -> enlistments.student_id -> student_profile -> user
              let studentLast = "Student";
              try {
                if (r.enlistment_id) {
                  const { data: enlistData } = await supabase
                    .from("enlistments")
                    .select("student_id")
                    .eq("id", r.enlistment_id)
                    .maybeSingle();
                  if (enlistData?.student_id) {
                    const { data: sp } = await supabase
                      .from("student_profile")
                      .select("user_id")
                      .eq("id", enlistData.student_id)
                      .maybeSingle();
                    if (sp?.user_id) {
                      const u = await getUserByUserId(sp.user_id);
                      studentLast = u?.last_name ?? u?.first_name ?? "Student";
                    }
                  }
                }
              } catch (e) {
                /* ignore */
              }
              const subject = await getSubject(r.subject_id);
              message = `Recent enlistment for ${studentLast} updated`;
              detail = `${
                subject?.subject_name ?? subject?.subject_code ?? "subject"
              } has been included in the enlistment`;
            } else if (table === "enlistments") {
              let studentName = "Student";
              try {
                if (r.student_id) {
                  const { data: sp } = await supabase
                    .from("student_profile")
                    .select("user_id")
                    .eq("id", r.student_id)
                    .maybeSingle();
                  if (sp?.user_id) {
                    const u = await getUserByUserId(sp.user_id);
                    studentName = u
                      ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                      : "Student";
                  }
                }
              } catch (e) {}
              message = `Recent enlistment for ${studentName} updated`;
              detail = `Enlistment associated with ${studentName}`;
            } else if (table === "enrollments") {
              let studentName = "Student";
              let courseTitle = "Course";
              try {
                if (r.student_profile_id) {
                  const u = await getUserByProfileId(r.student_profile_id);
                  studentName = u
                    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                    : studentName;
                }
                if (r.course_id) {
                  const c = await getCourse(r.course_id);
                  courseTitle = c?.title ?? c?.name ?? courseTitle;
                }
              } catch (e) {}
              message = `An enrollment by ${studentName} has been updated`;
              detail = `A ${r.status ?? ""} enrollment for the year ${
                r.year_level ?? ""
              } for ${courseTitle}`;
            } else if (table === "payments") {
              let studentLast = "Student";
              try {
                if (r.student_profile_id) {
                  const u = await getUserByProfileId(r.student_profile_id);
                  studentLast = u?.last_name ?? u?.first_name ?? studentLast;
                }
              } catch (e) {}
              message = `Payment recorded for ${studentLast}`;
              detail = `₱${Number(r.amount_paid ?? 0).toFixed(2)} (${
                r.reference_number ?? "-"
              })`;
            } else if (table === "student_profile") {
              const u = await getUserByUserId(r.user_id);
              const name = u
                ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                : "Student";
              message = `Student profile for ${name} updated`;
              detail = `Status: ${r.status ?? "-"}`;
            } else if (table === "subjects") {
              message = `Subject updated`;
              detail = r.subject_name ?? r.subject_code ?? "-";
            } else if (table === "users") {
              const name =
                `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() ||
                r.email ||
                "User";
              message = `User ${name} updated`;
              detail = r.email ?? "";
            } else {
              message = `${table} updated`;
              detail = JSON.stringify(r).slice(0, 80);
            }

            return {
              updated_at,
              table,
              id,
              message,
              detail,
            };
          })
        );

        // sort merged results by updated_at desc
        enriched.sort((a: any, b: any) => {
          const ad = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bd = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bd - ad;
        });

        setRecentChanges(enriched);
      } catch (e) {
        console.error("Error fetching recent changes:", e);
      }
    };

    fetchRecent();
  }, []);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening at Don Bosco Technical College"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="shadow-soft hover:shadow-medium transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p
                        className={`${
                          stat.title === "Revenue This Month"
                            ? "text-xl"
                            : "text-3xl"
                        } font-bold text-foreground mt-2`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl hypatia-gradient-subtle flex items-center justify-center ${stat.color}`}
                    >
                      <FontAwesomeIcon icon={stat.icon} className="text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChanges.slice(0, 6).map((c: any, i: number) => (
                    <div
                      key={`${c.table}-${c.id ?? i}`}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-2 h-2 rounded-full hypatia-gradient-bg mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {c.message}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {c.detail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.updated_at
                            ? formatRelative(
                                new Date(c.updated_at).toLocaleString()
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/**
                   * Define available quick actions and filter them by role.
                   * Rules roughly mirror `AppSidebar`:
                   * - admin/superadmin: full access except student-personal (/my/*)
                   * - registrar: academic features, students; block accounting and /my/*
                   * - accounting: payments, balances, students; block /my/* and academic-only pages
                   * - student: only personal pages (/my/*) and student dashboard
                   * - unauthenticated (no role): show a safe default (all non-admin-only)
                   */}
                  {[
                    // Shared: Add student (visible to registrar, accounting, admin)
                    {
                      title: "Add Student",
                      href: "/students",
                      icon: faUsers,
                      roles: ["registrar", "accounting", "admin", "superadmin"],
                    },

                    // Accounting-focused actions (as requested)
                    {
                      title: "Manage Payments",
                      href: "/payments",
                      icon: faCreditCard,
                      roles: ["accounting", "admin", "superadmin"],
                    },
                    {
                      title: "Manage Balances",
                      href: "/balances",
                      icon: faMoneyBill,
                      roles: ["accounting", "admin", "superadmin"],
                    },
                    {
                      title: "View Profile",
                      href: "/profile",
                      icon: faUser,
                      // make profile available broadly (accounting requested it)
                      roles: [
                        "accounting",
                        "registrar",
                        "student",
                        "admin",
                        "superadmin",
                      ],
                    },

                    // Registrar-focused actions (as requested)
                    {
                      title: "Manage Courses",
                      href: "/courses",
                      icon: faGraduationCap,
                      roles: ["registrar", "admin", "superadmin"],
                    },
                    {
                      title: "Manage Subjects",
                      href: "/subjects",
                      icon: faBookOpen,
                      roles: ["registrar", "admin", "superadmin"],
                    },
                    {
                      title: "Manage Enrollments",
                      href: "/enrollments",
                      icon: faUsers,
                      roles: ["registrar", "admin", "superadmin"],
                    },
                  ]
                    .filter((a) => {
                      // no role: show safe subset (all actions except admin-only '/reports')
                      if (!role)
                        return (
                          a.roles.includes("registrar") ||
                          a.roles.includes("accounting") ||
                          a.roles.includes("student") ||
                          a.roles.includes("admin")
                        );

                      const isAdmin = role === "admin" || role === "superadmin";
                      if (isAdmin) {
                        // Admins: full functional access except student personal routes (/my/*)
                        if (a.href.startsWith("/my")) return false;
                        if (a.href === "/dashboard/student") return false;
                        return true;
                      }

                      if (role === "student") {
                        // Student: only their personal pages
                        return (
                          a.href.startsWith("/my") ||
                          a.href === "/dashboard/student"
                        );
                      }

                      if (role === "registrar") {
                        // Registrar: block accounting and any personal student routes
                        if (a.href.startsWith("/my")) return false;
                        if (
                          a.href.startsWith("/payments") ||
                          a.href.startsWith("/balances") ||
                          a.href.startsWith("/reports")
                        )
                          return false;
                        return (
                          a.roles.includes("registrar") ||
                          a.roles.includes("admin")
                        );
                      }

                      if (role === "accounting") {
                        // Accounting: show payments, balances, students and dashboard
                        if (a.href === "/dashboard") return true;
                        if (
                          a.href.startsWith("/payments") ||
                          a.href.startsWith("/balances")
                        )
                          return true;
                        if (a.href === "/students") return true;
                        // Explicitly block registrar-only pages even if role lists change
                        if (
                          a.href.startsWith("/courses") ||
                          a.href.startsWith("/subjects") ||
                          a.href.startsWith("/enrollments")
                        )
                          return false;

                        return (
                          a.roles.includes("accounting") ||
                          a.roles.includes("admin")
                        );
                      }

                      // fallback: only show if action explicitly includes the role
                      return a.roles.includes(role);
                    })
                    .map((action, index) => (
                      <motion.button
                        key={action.title}
                        onClick={() => navigate(action.href)}
                        className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={action.title}
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-lg hypatia-gradient-subtle flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                            <FontAwesomeIcon
                              icon={action.icon}
                              className="text-primary"
                            />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {action.title}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
