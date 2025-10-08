import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import {
  faBookOpen,
  faGraduationCap,
  faClock,
  faChartLine,
  faBook,
  faCreditCard,
  faFileText,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faUser,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const studentStats = [
  {
    title: "Enrolled Courses",
    value: "6",
    change: "+2",
    trend: "up",
    icon: faBookOpen,
    description: "Active this semester",
  },
  {
    title: "Account Balance",
    value: "$2,450",
    change: "-$800",
    trend: "down",
    icon: faCreditCard,
    description: "Outstanding amount",
  },
  {
    title: "Pending Payments",
    value: "2",
    change: "0",
    trend: "neutral",
    icon: faClock,
    description: "Due this month",
  },
  {
    title: "Credits Completed",
    value: "84",
    change: "+12",
    trend: "up",
    icon: faChartLine,
    description: "Out of 120 total",
  },
];

// payments fetched from Supabase (last 4)

const quickActions = [
  {
    title: "View Balances",
    icon: faCreditCard,
    description: "Check account balance",
    path: "/my/balances",
  },
  {
    title: "Payment History",
    icon: faFileText,
    description: "View transaction records",
    path: "/my/payments",
  },
  {
    title: "Check Enrollments",
    icon: faBookOpen,
    description: "View your enrollments",
    path: "/my/enrollments",
  },
  {
    title: "View Profile",
    icon: faUser,
    description: "View or edit profile",
    path: "/profile",
  },
];

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const navigate = useNavigate();
  const [enrolledSemesters, setEnrolledSemesters] = useState<number>(0);
  const [completedEnrollmentsCount, setCompletedEnrollmentsCount] =
    useState<number>(0);
  const [totalUnitsCompleted, setTotalUnitsCompleted] = useState<number>(0);
  const [currentEnrollmentUnits, setCurrentEnrollmentUnits] =
    useState<number>(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [paymentsTotalAmount, setPaymentsTotalAmount] = useState<number>(0);
  const [paymentsTotalCount, setPaymentsTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchRecentPayments = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        setLoadingPayments(true);
        const { data, error } = await supabase
          .from("payments")
          .select("*", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .order("payment_date", { ascending: false })
          .range(0, 3);

        if (error) {
          console.error("Error fetching recent payments:", error);
          setPayments([]);
        } else {
          const rows = data ?? [];
          setPayments(rows as any[]);
          // compute totals for the fetched payments (dashboard shows recent page sum)
          const sum = (rows as any[]).reduce((acc: number, p: any) => {
            const v =
              typeof p.amount_paid === "number"
                ? p.amount_paid
                : Number(p.amount_paid) || 0;
            return acc + v;
          }, 0);
          setPaymentsTotalAmount(sum);
          // count for this student (exact count returned by supabase when using {count:'exact'})
          // supabase returns count in result.meta?.count for JS client v2; but we used the object form and didn't capture count — to be safe, fetch total count separately below
        }
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchRecentPayments();
  }, [userProfile]);

  // fetch total payments count (exact) for this student
  useEffect(() => {
    const fetchPaymentsCount = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        const { count, error } = await supabase
          .from("payments")
          .select("id", { count: "exact" })
          .eq("student_profile_id", sp.id);
        if (!error) {
          setPaymentsTotalCount(typeof count === "number" ? count : 0);
        }
      } catch (err) {
        console.error("Error fetching payments count:", err);
      }
    };
    fetchPaymentsCount();
  }, [userProfile]);

  // fetch balances to compute totalDue similar to MyBalances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        const { data, error } = await supabase
          .from("balances")
          .select("*")
          .eq("student_profile_id", sp.id);
        if (error) {
          console.error("Error fetching balances for dashboard:", error);
          setTotalDue(0);
        } else {
          const rows = (data ?? []) as any[];
          const sum = rows.reduce(
            (acc: number, b: any) => acc + (Number(b.amount_due) || 0),
            0
          );
          setTotalDue(sum);
        }
      } catch (err) {
        console.error("Error computing total due:", err);
        setTotalDue(0);
      }
    };
    fetchBalances();
  }, [userProfile]);

  // fetch enrollments info: distinct semesters, completed count, and total units
  useEffect(() => {
    const fetchEnrollmentStats = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        // fetch total enrollments for this student (match MyEnrollments behaviour)
        const { count: enrollCount, error: enrollCountErr } = await supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("student_profile_id", sp.id);
        if (!enrollCountErr) {
          setEnrolledSemesters(
            typeof enrollCount === "number" ? enrollCount : 0
          );
        }

        // completed count
        const { count, error } = await supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .eq("status", "completed");
        if (!error)
          setCompletedEnrollmentsCount(typeof count === "number" ? count : 0);

        // total units (sum of enlisted_subjects -> subjects.units)
        const { data: unitsData, error: unitsErr } = await supabase
          .from("enlisted_subjects")
          .select("subjects(units), enlistments(student_id)")
          .eq("enlistments.student_id", sp.id);
        if (!unitsErr) {
          const items = unitsData ?? [];
          const sumUnits = items.reduce((acc: number, row: any) => {
            const u = row?.subjects?.units;
            const n = typeof u === "number" ? u : Number(u) || 0;
            return acc + n;
          }, 0);
          setTotalUnitsCompleted(sumUnits);
        }

        // current enrollment units: find enrollments with status 'enrolled' (current) and sum their enlisted_subjects units
        try {
          const { data: currentEnrollments, error: ceErr } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_profile_id", sp.id)
            .eq("status", "enrolled");
          if (!ceErr && currentEnrollments && currentEnrollments.length > 0) {
            const enrollmentIds = currentEnrollments.map((r: any) => r.id);
            // fetch enlistment rows that reference those enrollment ids
            const { data: enlistmentRows, error: enlistErr } = await supabase
              .from("enlistments")
              .select("id")
              .in("enrollment_id", enrollmentIds as any);

            if (!enlistErr && enlistmentRows && enlistmentRows.length > 0) {
              const enlistmentIds = enlistmentRows.map((e: any) => e.id);
              const { data: ceUnitsData, error: ceUnitsErr } = await supabase
                .from("enlisted_subjects")
                .select("subjects(units)")
                .in("enlistment_id", enlistmentIds as any);

              if (!ceUnitsErr) {
                const ceItems = ceUnitsData ?? [];
                const ceSum = ceItems.reduce((acc: number, row: any) => {
                  const u = row?.subjects?.units;
                  const n = typeof u === "number" ? u : Number(u) || 0;
                  return acc + n;
                }, 0);
                setCurrentEnrollmentUnits(ceSum);
              } else {
                setCurrentEnrollmentUnits(0);
              }
            } else {
              setCurrentEnrollmentUnits(0);
            }
          } else {
            setCurrentEnrollmentUnits(0);
          }
        } catch (err) {
          console.error("Error fetching current enrollment units:", err);
          setCurrentEnrollmentUnits(0);
        }
      } catch (err) {
        console.error("Error fetching enrollment stats:", err);
      }
    };
    fetchEnrollmentStats();
  }, [userProfile]);

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle="Welcome back! Here's your academic overview"
    >
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36 }}
      >
        {/* Stats Cards (dynamic) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Enrolled Semesters */}
          <div>
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Enrolled Semesters
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                    className="h-4 w-4 text-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrolledSemesters}</div>
                <div className="text-sm text-muted-foreground">
                  Distinct semesters enrolled
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Balance */}
          <div>
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Account Balance
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="h-4 w-4 text-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱ {totalDue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Outstanding amount
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Previous Payments */}
          <div>
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Previous Payments
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faFileText}
                    className="h-4 w-4 text-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paymentsTotalCount ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total records — ₱ {paymentsTotalAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credits Completed */}
          <div>
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="h-4 w-4 text-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold">
                    {totalUnitsCompleted}
                  </div>
                  {currentEnrollmentUnits > 0 && (
                    <div className="flex items-center text-sm text-green-600">
                      <FontAwesomeIcon
                        icon={faArrowUp}
                        className="mr-1 h-3 w-3"
                      />
                      <span>+{currentEnrollmentUnits}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Sum of completed enrollment units
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faClipboardList} className="h-5 w-5" />
                  <span>Payment History</span>
                </CardTitle>
                <CardDescription>Recent account transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPayments && (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}

                {!loadingPayments && payments.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">
                    No recent payments
                  </div>
                )}

                {!loadingPayments &&
                  payments.map((payment, index) => {
                    const getIcon = () => {
                      const m = (payment.payment_method || "").toString();
                      if (/card|credit|debit/i.test(m)) return faCreditCard;
                      if (/scholarship|award/i.test(m)) return faChartLine;
                      if (/book|course|enroll|fee/i.test(payment.reason || ""))
                        return faBookOpen;
                      return faFileText;
                    };

                    const timeAgo = (d: string | null | undefined) => {
                      if (!d) return "-";
                      const date = new Date(d);
                      const diff = Date.now() - date.getTime();
                      const minutes = Math.floor(diff / (1000 * 60));
                      if (minutes < 1) return "just now";
                      if (minutes < 60) return `${minutes}m ago`;
                      const hours = Math.floor(minutes / 60);
                      if (hours < 24) return `${hours}h ago`;
                      const days = Math.floor(hours / 24);
                      if (days < 30) return `${days}d ago`;
                      return date.toLocaleDateString();
                    };

                    const icon = getIcon();
                    const title = payment.reason || "Payment";
                    const description =
                      payment.description ||
                      (payment.amount_paid
                        ? `₱ ${
                            typeof payment.amount_paid === "number"
                              ? payment.amount_paid.toFixed(2)
                              : payment.amount_paid
                          }`
                        : "-");
                    const time = payment.payment_date || payment.created_at;

                    return (
                      <div
                        key={payment.id ?? index}
                        className="flex items-start space-x-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon
                            icon={icon}
                            className="h-3 w-3 text-primary"
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(time)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/my/payments")}
                  >
                    View All Payments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Financial and enrollment tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.title}
                    className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 group w-full text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (action.path) navigate(action.path);
                    }}
                  >
                    <div className="text-left">
                      <div className="w-10 h-10 rounded-lg hypatia-gradient-subtle flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                        <FontAwesomeIcon
                          icon={action.icon}
                          className="text-primary"
                        />
                      </div>
                      <div className="font-medium text-center">
                        {action.title}
                      </div>
                      <div className="text-sm text-muted-foreground text-center">
                        {action.description}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
