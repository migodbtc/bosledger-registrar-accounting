import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMoneyBill,
  faClock,
  faExclamationTriangle,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import RowModal from "@/components/RowModal";

type Balance = {
  id: string;
  student_profile_id: string;
  amount_due: number;
  due_date: string | null;
  // status and description are derived/removed; status is now calculated from amount_due
  created_at?: string;
  updated_at?: string;
};

const formatCurrency = (v: number) => {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
};

const MyBalances: React.FC = () => {
  const { userProfile } = useAuth();
  const capitalize = (s?: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("balances")
          .select("*")
          .eq("student_profile_id", sp.id)
          .order("due_date", { ascending: true });
        if (error) {
          console.error("Error fetching balances:", error);
          setBalances([]);
        } else {
          setBalances((data ?? []) as Balance[]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [userProfile]);

  const totalDue = useMemo(() => {
    return balances.reduce((acc, b) => acc + (Number(b.amount_due) || 0), 0);
  }, [balances]);

  const overallStatus = useMemo(() => {
    return totalDue === 0 ? "Paid" : "Pending";
  }, [totalDue]);

  const latestUpdated = useMemo(() => {
    const dates = balances
      .map((b) => (b.updated_at ? new Date(b.updated_at) : null))
      .filter(Boolean) as Date[];
    if (dates.length === 0) return null;
    return dates.reduce((a, c) => (a > c ? a : c));
  }, [balances]);

  // Expose structured parse/check info so we can show it in the UI for debugging
  const balanceChecks = useMemo(() => {
    return balances.map((b) => {
      const amtRaw = b.amount_due;
      const parsed =
        amtRaw === null || amtRaw === undefined ? NaN : Number(amtRaw);
      const status = !isNaN(parsed) && parsed === 0 ? "paid" : "pending";
      const paid = status === "paid";
      return { id: b.id, status, amount_due_raw: amtRaw, parsed, paid };
    });
  }, [balances]);

  const unpaid = useMemo(() => {
    // Debug: log parse results for each balance so we can inspect why something is marked paid
    // Use console.log (more visible) and also render `balanceChecks` in the UI below.
    console.log("[MyBalances] balance parse checks:", balanceChecks);

    const res = balances.filter((b) => {
      const amtRaw = b.amount_due;
      const amt =
        amtRaw === null || amtRaw === undefined ? NaN : Number(amtRaw);
      // unpaid if amount is NaN (unexpected) or greater than 0
      return isNaN(amt) || amt > 0;
    });
    console.log(
      "[MyBalances] unpaid ids:",
      res.map((r) => r.id)
    );
    return res;
  }, [balances]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    return unpaid.filter((b) => b.due_date && new Date(b.due_date) < today)
      .length;
  }, [unpaid]);

  const nextDueDate = useMemo(() => {
    const upcoming = unpaid
      .map((b) => (b.due_date ? new Date(b.due_date) : null))
      .filter(Boolean) as Date[];
    if (upcoming.length === 0) return null;
    const next = upcoming.reduce((a, c) => (a < c ? a : c));
    return next;
  }, [unpaid]);

  const nextPaymentAmount = useMemo(() => {
    if (!nextDueDate) return null;
    // sum unpaid balances that match the next due date (compare by date string)
    const nextDateStr = nextDueDate.toDateString();
    const items = unpaid.filter(
      (b) => b.due_date && new Date(b.due_date).toDateString() === nextDateStr
    );
    if (!items.length) return null;
    return items.reduce((acc, b) => acc + (Number(b.amount_due) || 0), 0);
  }, [unpaid, nextDueDate]);

  const handlePay = (balanceId: string) => {
    console.log("Initiate payment for", balanceId);
    // placeholder: navigate to payment flow or open modal
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <DashboardLayout title="My Balances" subtitle="Your outstanding balances">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faMoneyBill} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                My Balances
              </h2>
              <p className="text-sm text-muted-foreground">
                Outstanding amounts
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="hypatia-gradient-bg"
              onClick={() => console.log("Make payment clicked")}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Make Payment
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faMoneyBill}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalDue)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total outstanding
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balance Status
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="h-4 w-4 text-secondary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStatus}</div>
              <div className="text-sm text-muted-foreground">
                Current balance state
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Updated
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestUpdated ? latestUpdated.toLocaleDateString() : "-"}
              </div>
              <div className="text-sm text-muted-foreground">
                Most recent update
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Date</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {nextDueDate ? nextDueDate.toLocaleDateString() : "-"}
              </div>
              <div className="text-sm text-muted-foreground">
                Upcoming due date
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balances list removed per request - statistic cards retained above */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* single 1:1 balance per student profile - show the first (and only) item */}
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              (() => {
                const balance =
                  balances && balances.length > 0 ? balances[0] : null;
                if (!balance) {
                  return (
                    <div className="text-sm text-muted-foreground">
                      No balance record found for your profile.
                    </div>
                  );
                }

                const amtRaw = balance.amount_due;
                const amountNum =
                  amtRaw === null || amtRaw === undefined
                    ? NaN
                    : Number(amtRaw);
                const statusCalculated =
                  !isNaN(amountNum) && amountNum === 0 ? "paid" : "pending";
                const isPaid = statusCalculated === "paid";

                return (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        className="hypatia-gradient-bg"
                        onClick={() => handlePay(balance.id)}
                        disabled={isPaid}
                      >
                        <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
                        {isPaid ? "Paid" : "Pay Now"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModalFor(balance)}
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit
                      </Button>

                      {!isPaid && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            console.log(
                              "Remind / contact billing for",
                              balance.id
                            )
                          }
                        >
                          Send Reminder
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => console.log("View payments")}
                      >
                        View Payments
                      </Button>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        <RowModal
          open={modalOpen}
          onOpenChange={(v) => setModalOpen(v)}
          entity="balances"
          row={selectedRow}
          onSaved={() => console.log("balance saved")}
          onDeleted={() => console.log("balance deleted")}
        />
      </div>
    </DashboardLayout>
  );
};

export default MyBalances;
