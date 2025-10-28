import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCreditCard,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// sorting removed: no sort icons imported
import RowModal from "@/components/RowModal";

type SortField =
  | "payment_date"
  | "reference_number"
  | "student_number"
  | "student_last_name"
  | "amount_paid"
  | "payment_method";
type SortDirection = "asc" | "desc";

const Payments = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("payment_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    return sortDirection === "asc" ? faSortUp : faSortDown;
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length && payments.length > 0) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map((p) => p.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatLabel = (val: string | null | undefined) => {
    if (!val) return "";
    // Replace underscores with spaces, split words, capitalize each
    return String(val)
      .replace(/_/g, " ")
      .split(" ")
      .map((w) =>
        w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");
  };

  const methodVariant = (method: string | null | undefined) => {
    if (!method) return "default";
    const m = String(method).toLowerCase();
    // Map to variants supported by Badge's type in this project.
    if (m.includes("cash")) return "paid"; // green-like
    if (m.includes("credit") || m.includes("debit")) return "secondary";
    if (m.includes("check")) return "secondary";
    if (m.includes("bank") || m.includes("transfer")) return "default";
    if (m.includes("refund") || m.includes("reversed")) return "destructive";
    if (m.includes("online") || m.includes("e-pay") || m.includes("epay"))
      return "outline";
    return "default";
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        // Simpler approach: fetch payments page first, then fetch related balances,
        // student_profile rows, users and courses in follow-up queries. This avoids
        // complex PostgREST select syntax that can produce parsing errors (PGRST100).
        let query = supabase
          .from("payments")
          .select(
            "id, payment_date, amount_paid, payment_method, reference_number, reason, description, created_at, updated_at, student_profile_id, balance_id",
            { count: "exact" }
          );

        // apply server-side ordering when it maps directly to payments table columns
        if (sortField === "payment_date") {
          query = query.order("payment_date", {
            ascending: sortDirection === "asc",
          });
        } else if (sortField === "amount_paid") {
          query = query.order("amount_paid", {
            ascending: sortDirection === "asc",
          });
        } else if (sortField === "reference_number") {
          query = query.order("reference_number", {
            ascending: sortDirection === "asc",
          });
        } else if (sortField === "payment_method") {
          query = query.order("payment_method", {
            ascending: sortDirection === "asc",
          });
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error("Error fetching payments:", error);
          setPayments([]);
          setTotal(0);
        } else {
          const raw = (data ?? []) as any[];

          // collect related ids
          const profileIds = Array.from(
            new Set(raw.map((r) => r.student_profile_id).filter(Boolean))
          );
          const balanceIds = Array.from(
            new Set(raw.map((r) => r.balance_id).filter(Boolean))
          );

          // fetch balances
          let balances: any[] = [];
          if (balanceIds.length > 0) {
            const { data: bData, error: bErr } = await supabase
              .from("balances")
              .select("id, student_profile_id, amount_due, due_date")
              .in("id", balanceIds);
            if (bErr) {
              console.error("Error fetching balances:", bErr);
            } else {
              balances = bData ?? [];
            }
          }

          // fetch student_profiles
          let studentProfiles: any[] = [];
          if (profileIds.length > 0) {
            const { data: spData, error: spErr } = await supabase
              .from("student_profile")
              .select("id, user_id, course_id")
              .in("id", profileIds);
            if (spErr) {
              console.error("Error fetching student_profile rows:", spErr);
            } else {
              studentProfiles = spData ?? [];
            }
          }

          // fetch users and courses referenced by those profiles
          const userIds = Array.from(
            new Set(studentProfiles.map((s) => s.user_id).filter(Boolean))
          );
          const courseIds = Array.from(
            new Set(studentProfiles.map((s) => s.course_id).filter(Boolean))
          );

          let users: any[] = [];
          if (userIds.length > 0) {
            const { data: uData, error: uErr } = await supabase
              .from("users")
              .select("id, student_number, first_name, last_name, email")
              .in("id", userIds);
            if (uErr) {
              console.error("Error fetching users:", uErr);
            } else {
              users = uData ?? [];
            }
          }

          let courses: any[] = [];
          if (courseIds.length > 0) {
            const { data: cData, error: cErr } = await supabase
              .from("courses")
              .select("id, name, title")
              .in("id", courseIds);
            if (cErr) {
              console.error("Error fetching courses:", cErr);
            } else {
              courses = cData ?? [];
            }
          }

          // build lookup maps (normalize keys to strings to avoid type-mismatch)
          const balancesMap = new Map(
            (balances ?? []).map((b: any) => [String(b.id), b])
          );
          const profilesMap = new Map(
            (studentProfiles ?? []).map((s: any) => [String(s.id), s])
          );
          const usersMap = new Map(
            (users ?? []).map((u: any) => [String(u.id), u])
          );
          const coursesMap = new Map(
            (courses ?? []).map((c: any) => [String(c.id), c])
          );

          let normalized = raw.map((r) => {
            const profile = r.student_profile_id
              ? profilesMap.get(String(r.student_profile_id))
              : null;
            const user = profile ? usersMap.get(String(profile.user_id)) : null;
            const course = profile
              ? coursesMap.get(String(profile.course_id))
              : null;
            const balance = r.balance_id
              ? balancesMap.get(String(r.balance_id))
              : null;
            return {
              id: r.id,
              payment_date: r.payment_date,
              amount_paid: r.amount_paid,
              payment_method: r.payment_method,
              reference_number: r.reference_number,
              reason: r.reason,
              description: r.description,
              created_at: r.created_at,
              student_profile_id: r.student_profile_id,
              balance: balance,
              user: user,
              course: course,
              payment_status: null,
            };
          });

          // if sorting by enriched fields (student_number or student_last_name), perform a client-side sort
          if (sortField === "student_number") {
            normalized = normalized.sort((a: any, b: any) => {
              const av = (a.user?.student_number ?? "")
                .toString()
                .toLowerCase();
              const bv = (b.user?.student_number ?? "")
                .toString()
                .toLowerCase();
              if (av < bv) return sortDirection === "asc" ? -1 : 1;
              if (av > bv) return sortDirection === "asc" ? 1 : -1;
              return 0;
            });
          }
          if (sortField === "student_last_name") {
            normalized = normalized.sort((a: any, b: any) => {
              const av = (a.user?.last_name ?? "").toString().toLowerCase();
              const bv = (b.user?.last_name ?? "").toString().toLowerCase();
              if (av < bv) return sortDirection === "asc" ? -1 : 1;
              if (av > bv) return sortDirection === "asc" ? 1 : -1;
              return 0;
            });
          }

          setPayments(normalized);
          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  const sorted = useMemo(() => payments ?? [], [payments]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const displayed = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return sorted;
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter((p: any) => {
      const ref = p.reference_number ?? "";
      const sn = p.user?.student_number ?? "";
      const fn = p.user?.first_name ?? "";
      const ln = p.user?.last_name ?? "";
      const em = p.user?.email ?? "";
      const cr = p.course?.name ?? "";
      return (
        ref.toLowerCase().includes(q) ||
        sn.toLowerCase().includes(q) ||
        fn.toLowerCase().includes(q) ||
        ln.toLowerCase().includes(q) ||
        em.toLowerCase().includes(q) ||
        cr.toLowerCase().includes(q)
      );
    });
  }, [sorted, searchTerm]);

  return (
    <DashboardLayout
      title="Payment Management"
      subtitle="Track tuition payments, receipts, and payment history"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faCreditCard} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Payments
              </h2>
              <p className="text-sm text-muted-foreground">{total} payments</p>
            </div>
          </div>
          <Button className="hypatia-gradient-bg">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Record Payment
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Payment Tracking</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payments..."
                  className="pl-10"
                />
              </div>
              <div>
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPageSize(v);
                    setCurrentPage(1);
                  }}
                  className="w-[100px]"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedPayments.length === payments.length &&
                          payments.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("payment_date")}
                      className="cursor-pointer"
                    >
                      Date{" "}
                      <FontAwesomeIcon
                        icon={getSortIcon("payment_date")}
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("reference_number")}
                      className="cursor-pointer"
                    >
                      Reference{" "}
                      <FontAwesomeIcon
                        icon={getSortIcon("reference_number")}
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("student_last_name")}
                      className="cursor-pointer"
                    >
                      Student{" "}
                      <FontAwesomeIcon
                        icon={getSortIcon("student_last_name")}
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("amount_paid")}
                      className="cursor-pointer"
                    >
                      Amount{" "}
                      <FontAwesomeIcon
                        icon={getSortIcon("amount_paid")}
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(p.id)}
                          onChange={() => handleSelect(p.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString()
                          : p.created_at
                          ? new Date(p.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{p.reference_number ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {(() => {
                            const first = p.user?.first_name ?? "";
                            const last = p.user?.last_name ?? "";
                            const email = p.user?.email ?? "";
                            const hasName =
                              (first && first.trim()) || (last && last.trim());
                            const displayName = hasName
                              ? `${first} ${last}`.trim()
                              : email || "-";
                            return (
                              <>
                                <span className="font-medium">
                                  {displayName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {p.user?.student_number ?? ""}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        ₱{Number(p.amount_paid ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {p.payment_method ? (
                          <Badge variant={methodVariant(p.payment_method)}>
                            {formatLabel(p.payment_method)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-start space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openModalFor(p)} aria-label={`Edit payment ${p.id}`}>
                            <FontAwesomeIcon
                              icon={faEdit}
                              className="w-4 h-4"
                            />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="w-4 h-4"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <RowModal
              open={modalOpen}
              onOpenChange={(v) => setModalOpen(v)}
              entity="payments"
              row={selectedRow}
              onSaved={() => setCurrentPage((p) => p)}
              onDeleted={() => setCurrentPage(1)}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing page {currentPage} of {totalPages} — {total} total
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((s) => Math.max(1, s - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>

                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="border rounded-md px-3 py-1 text-sm"
                    title="Jump to page"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      )
                    )}
                  </select>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((s) => Math.min(totalPages, s + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
