import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCreditCard,
  faMoneyBill,
  faChartLine,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  faSort,
  faSortUp,
  faSortDown,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import RowModal from "@/components/RowModal";
import CreateModal from "@/components/CreateModal";

const MyPayments = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>("payment_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchPayments = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        setLoading(true);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("payments")
          .select("*", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .range(from, to);

        if (sortBy) {
          query = query.order(sortBy, { ascending: sortDir === "asc" });
        }

        const { data, error, count } = await query;
        if (error) {
          console.error("Error fetching payments:", error);
          setPayments([]);
          setTotal(0);
        } else {
          const items = data ?? [];
          // Log fetched payments for debugging
          console.log("Payments for student_profile_id", sp.id, items);
          setPayments(items as any[]);
          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [userProfile, page, pageSize, sortBy, sortDir]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // derived statistics based on fetched payments (current page)
  const paymentsOnPage = payments.length;
  const totalPaymentsCount = total;
  const totalAmountOnPage = React.useMemo(() => {
    return payments.reduce((acc: number, p: any) => {
      const v =
        typeof p.amount_paid === "number"
          ? p.amount_paid
          : Number(p.amount_paid) || 0;
      return acc + v;
    }, 0);
  }, [payments]);

  const latestPaymentDate = React.useMemo(() => {
    const dates = payments
      .map((p) =>
        p.payment_date
          ? new Date(p.payment_date)
          : p.created_at
          ? new Date(p.created_at)
          : null
      )
      .filter(Boolean) as Date[];
    if (dates.length === 0) return null;
    return dates.reduce((a, b) => (a > b ? a : b));
  }, [payments]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <DashboardLayout
      title="My Payments"
      subtitle="Your payment history and actions"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faCreditCard} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                My Payments
              </h2>
              <p className="text-sm text-muted-foreground">
                Payment history and quick actions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="hypatia-gradient-bg"
              onClick={() => setCreateOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Make Payment
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payments on Page
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentsOnPage}</div>
              <div className="text-sm text-muted-foreground">
                Rows on current page
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payments
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPaymentsCount ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Total payment records
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount (page)
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faMoneyBill}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱ {totalAmountOnPage.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Sum of amounts on page
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Payment
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
                {latestPaymentDate
                  ? latestPaymentDate.toLocaleDateString()
                  : "-"}
              </div>
              <div className="text-sm text-muted-foreground">
                Most recent payment date
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Payments Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  Loading payments...
                </p>
              </div>
            )}

            {/* If there are no payments, show the original empty-state inside the card */}
            {!loading && payments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full hypatia-gradient-subtle flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="text-2xl text-primary"
                  />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  No payments found
                </p>
                <p className="text-muted-foreground mb-4">
                  You don't have any recorded payments yet.
                </p>
                <Button className="hypatia-gradient-bg">
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Make Payment
                </Button>
              </div>
            )}

            {/* Mini stat cards and table only when payments exist */}
            {!loading && payments.length > 0 && (
              <>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          onClick={() => handleSort("payment_date")}
                          className="cursor-pointer"
                        >
                          Payment Date
                          <FontAwesomeIcon
                            icon={
                              sortBy === "payment_date"
                                ? sortDir === "asc"
                                  ? faSortUp
                                  : faSortDown
                                : faSort
                            }
                            className="ml-2"
                          />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("amount_paid")}
                          className="cursor-pointer"
                        >
                          Amount
                          <FontAwesomeIcon
                            icon={
                              sortBy === "amount_paid"
                                ? sortDir === "asc"
                                  ? faSortUp
                                  : faSortDown
                                : faSort
                            }
                            className="ml-2"
                          />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("payment_method")}
                          className="cursor-pointer"
                        >
                          Method
                          <FontAwesomeIcon
                            icon={
                              sortBy === "payment_method"
                                ? sortDir === "asc"
                                  ? faSortUp
                                  : faSortDown
                                : faSort
                            }
                            className="ml-2"
                          />
                        </TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.payment_date
                              ? new Date(p.payment_date).toLocaleDateString()
                              : p.created_at
                              ? new Date(p.created_at).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {typeof p.amount_paid === "number"
                              ? `₱ ${p.amount_paid.toFixed(2)}`
                              : `₱ ${p.amount_paid}`}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const m = (p.payment_method || "").toString();
                              let variant: any = "outline";
                              switch (m) {
                                case "cash":
                                  variant = "secondary";
                                  break;
                                case "credit_card":
                                case "debit_card":
                                  variant = "default";
                                  break;
                                case "bank_transfer":
                                  variant = "secondary";
                                  break;
                                case "online":
                                  variant = "default";
                                  break;
                                case "check":
                                  variant = "outline";
                                  break;
                                case "scholarship":
                                  variant = "default";
                                  break;
                                default:
                                  variant = "outline";
                              }
                              const label = m
                                ? m
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase())
                                : "-";
                              return <Badge variant={variant}>{label}</Badge>;
                            })()}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {p.reason ?? "-"}
                          </TableCell>
                          <TableCell className="max-w-lg truncate">
                            {p.description ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                onClick={() => openModalFor(p)}
                                aria-label={`View payment ${p.id}`}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing page {page} of {totalPages} — {total} total
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Prev
                      </Button>

                      <select
                        value={page}
                        onChange={(e) => setPage(Number(e.target.value))}
                        className="border rounded-md px-3 py-1 text-sm"
                        title="Jump to page"
                      >
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="outline"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <RowModal
        open={modalOpen}
        onOpenChange={(v) => setModalOpen(v)}
        entity="payments"
        row={selectedRow}
        onSaved={() => console.log("payment saved")}
        onDeleted={() => console.log("payment deleted")}
        readOnly={true}
      />
      <CreateModal
        open={createOpen}
        onOpenChange={(v) => setCreateOpen(v)}
        entity="payments"
        onCreated={(created) => {
          // If the modal returns the created payment row, prepend it so the UI updates immediately.
          if (created) {
            setPayments((prev) => [created, ...prev]);
            setTotal((t) => t + 1);
            setPage(1);
          } else {
            setPage(1);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default MyPayments;
