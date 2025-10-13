import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faGraduationCap,
  faCreditCard,
  faChartLine,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabaseClient";

const Reports = () => {
  // State for Total Students
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalStudentsChange, setTotalStudentsChange] = useState<number>(0);
  const [totalStudentsLoading, setTotalStudentsLoading] = useState(false);

  // State for Enrollments
  const [enrollmentsThisYear, setEnrollmentsThisYear] = useState<number | null>(
    null
  );
  const [enrollmentsChange, setEnrollmentsChange] = useState<number>(0);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Pending approvals
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [pendingDocs, setPendingDocs] = useState<number | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Outstanding balances by program
  const [outstandingByProgram, setOutstandingByProgram] = useState<
    Array<{
      program: string;
      amount: number;
      amountFormatted: string;
      students: number;
    }>
  >([]);
  const [outstandingLoading, setOutstandingLoading] = useState(false);

  // Payments summary
  const [paymentsToday, setPaymentsToday] = useState<number | null>(null);
  const [paymentsMonth, setPaymentsMonth] = useState<number | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [lastPayments, setLastPayments] = useState<Array<any>>([]);
  const [lastPaymentsLoading, setLastPaymentsLoading] = useState(false);

  function formatCurrency(value: number | null | undefined) {
    if (value == null) return "—";
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });
  }

  async function fetchTotalStudents() {
    setTotalStudentsLoading(true);
    try {
      // Count from student_profile or users with role 'student'
      const { count, error } = await supabase
        .from("student_profile")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      setTotalStudents(count ?? 0);
      // Fake change percent for now (placeholder)
      setTotalStudentsChange(12);
    } catch (err) {
      console.error("fetchTotalStudents", err);
    } finally {
      setTotalStudentsLoading(false);
    }
  }

  async function fetchEnrollmentsThisYear() {
    setEnrollmentsLoading(true);
    try {
      const startOfYear = new Date(
        new Date().getFullYear(),
        0,
        1
      ).toISOString();
      const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact" })
        .gte("created_at", startOfYear);
      if (error) throw error;
      setEnrollmentsThisYear(count ?? 0);
      setEnrollmentsChange(8);
    } catch (err) {
      console.error("fetchEnrollmentsThisYear", err);
    } finally {
      setEnrollmentsLoading(false);
    }
  }

  async function fetchPending() {
    setPendingLoading(true);
    try {
      const { count: pendingCount, error: e1 } = await supabase
        .from("enrollments")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      if (e1) throw e1;
      setPendingApprovals(pendingCount ?? 0);

      const { count: docsCount, error: e2 } = await supabase
        .from("student_documents")
        .select("*", { count: "exact" })
        .eq("status", "pending");
      if (e2) {
        // If table doesn't exist, default to 0
        console.warn("student_documents query failed", e2.message || e2);
        setPendingDocs(0);
      } else {
        setPendingDocs(docsCount ?? 0);
      }
    } catch (err) {
      console.error("fetchPending", err);
      setPendingApprovals(0);
      setPendingDocs(0);
    } finally {
      setPendingLoading(false);
    }
  }

  async function fetchOutstandingByProgram() {
    setOutstandingLoading(true);
    try {
      // Simplified: assume a view/table 'student_balances' with fields program, amount_due, student_id
      const { data, error } = await supabase
        .from("student_balances")
        .select("program, amount_due, student_id");
      if (error) throw error;
      const map = new Map<string, { amount: number; students: Set<any> }>();
      (data || []).forEach((r: any) => {
        const program = r.program || "Unknown";
        const amt = Number(r.amount_due || 0);
        if (!map.has(program))
          map.set(program, { amount: 0, students: new Set() });
        const entry = map.get(program)!;
        entry.amount += amt;
        entry.students.add(r.student_id);
      });
      const arr = Array.from(map.entries()).map(([program, v]) => ({
        program,
        amount: v.amount,
        amountFormatted: formatCurrency(v.amount),
        students: v.students.size,
      }));
      setOutstandingByProgram(arr);
    } catch (err) {
      console.error("fetchOutstandingByProgram", err);
      setOutstandingByProgram([]);
    } finally {
      setOutstandingLoading(false);
    }
  }

  async function fetchPaymentsSummary() {
    setPaymentsLoading(true);
    setLastPaymentsLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );

      const { data: todayData, error: e1 } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", todayStart.toISOString());
      if (e1) throw e1;
      const todayTotal = (todayData || []).reduce(
        (s: number, r: any) => s + Number(r.amount || 0),
        0
      );
      setPaymentsToday(todayTotal);

      const { data: monthData, error: e2 } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", monthStart.toISOString());
      if (e2) throw e2;
      const monthTotal = (monthData || []).reduce(
        (s: number, r: any) => s + Number(r.amount || 0),
        0
      );
      setPaymentsMonth(monthTotal);

      const { data: lastData, error: e3 } = await supabase
        .from("payments")
        .select("id, amount, student_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (e3) throw e3;
      // try to fetch student names for each payment
      const studentIds = Array.from(
        new Set((lastData || []).map((p: any) => p.student_id).filter(Boolean))
      );
      let studentsMap: Record<string, any> = {};
      if (studentIds.length) {
        const { data: studentsData } = await supabase
          .from("student_profile")
          .select("id, full_name")
          .in("id", studentIds);
        studentsMap = (studentsData || []).reduce(
          (acc: any, s: any) => ({ ...acc, [s.id]: s.full_name }),
          {}
        );
      }
      setLastPayments(
        (lastData || []).map((p: any) => ({
          ...p,
          student_name: studentsMap[p.student_id],
        }))
      );
    } catch (err) {
      console.error("fetchPaymentsSummary", err);
      setPaymentsToday(0);
      setPaymentsMonth(0);
      setLastPayments([]);
    } finally {
      setPaymentsLoading(false);
      setLastPaymentsLoading(false);
    }
  }

  useEffect(() => {
    fetchTotalStudents();
    fetchEnrollmentsThisYear();
    fetchPending();
    fetchOutstandingByProgram();
    fetchPaymentsSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentsTodayFormatted = formatCurrency(paymentsToday);
  const paymentsMonthFormatted = formatCurrency(paymentsMonth);

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Generate comprehensive reports for registrar and accounting"
    >
      <div className="space-y-6">
        {/* Grid container: mimic Dashboard card sizing: 1 col xs, 2 sm, 3 md, 3 logical cols at lg (we use 6 for spans) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* First row: two cards occupying 1 column each in a 3-col logical layout (we use 6 cols for fine-grained spanning)
              Place 4 cards: two on first row, two on second; leave spaces as described and span accordingly */}

          {/* Report A - Total Students (KPI + Trend) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="col-span-2"
          >
            <Card className="shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Students
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {totalStudentsLoading ? "—" : totalStudents ?? 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <FontAwesomeIcon
                        icon={
                          totalStudentsChange >= 0 ? faArrowUp : faArrowDown
                        }
                        className={`text-sm mr-1 ${
                          totalStudentsChange >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          totalStudentsChange >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {totalStudentsLoading
                          ? "—"
                          : `${Math.abs(totalStudentsChange)}%`}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        vs last year
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl hypatia-gradient-subtle flex items-center justify-center text-blue-600">
                    <FontAwesomeIcon icon={faUsers} className="text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report B - Current Enrollments This Year */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="col-span-2"
          >
            <Card className="shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Enrollments (This Year)
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {enrollmentsLoading ? "—" : enrollmentsThisYear ?? 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <FontAwesomeIcon
                        icon={enrollmentsChange >= 0 ? faArrowUp : faArrowDown}
                        className={`text-sm mr-1 ${
                          enrollmentsChange >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          enrollmentsChange >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {enrollmentsLoading
                          ? "—"
                          : `${Math.abs(enrollmentsChange)}%`}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        since January
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl hypatia-gradient-subtle flex items-center justify-center text-green-600">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="text-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report B2 - Pending Approvals (Actionable) - kept smaller for layout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="col-span-2"
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {pendingLoading
                      ? "Loading…"
                      : `${
                          pendingApprovals ?? 0
                        } enrollments awaiting approval`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingLoading
                      ? "Loading…"
                      : `${pendingDocs ?? 0} document verifications pending`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Removed empty spacer so following cards align side-by-side */}

          {/* Report C - Outstanding Balance per Program */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="col-span-2 md:col-span-2 lg:col-span-2"
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">
                  Outstanding Balance — by Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outstandingLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : outstandingByProgram.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No outstanding balances
                    </p>
                  ) : (
                    outstandingByProgram.map((p) => (
                      <div
                        key={p.program}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{p.program}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.amountFormatted}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {p.students} students
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report D - Payments Summary */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="col-span-4 md:col-span-2 lg:col-span-2"
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">
                  Payments Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-lg font-bold text-foreground">
                      {paymentsLoading ? "—" : paymentsTodayFormatted}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-lg font-bold text-foreground">
                      {paymentsLoading ? "—" : paymentsMonthFormatted}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Last 5 payments:
                </div>
                <div className="mt-2 space-y-2">
                  {lastPaymentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : (
                    lastPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>{p.student_name ?? p.student ?? "Unknown"}</div>
                        <div className="text-foreground">
                          {formatCurrency(p.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Third row: create another large card that takes two spaces (col-span-4) */}
          <Card className="md:col-span-3 lg:col-span-2 row-span-2 shadow-soft">
            <CardHeader>
              <CardTitle>Report E</CardTitle>
            </CardHeader>
            <CardContent>{/* placeholder */}</CardContent>
          </Card>

          {/* Fill remaining two card spaces on third row as 1:1 */}
          <Card className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-4 row-span-2 shadow-soft">
            <CardHeader>
              <CardTitle>Report F</CardTitle>
            </CardHeader>
            <CardContent>{/* placeholder */}</CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
