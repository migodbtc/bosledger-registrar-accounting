import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMoneyBill,
  faSearch,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabaseClient";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import RowModal from "@/components/RowModal";

type SortField = never;

const Balances = () => {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // sorting removed: table shows server-paginated data and client-side search only

  const formatLabel = (val: string | null | undefined) => {
    if (!val) return "";
    return String(val)
      .replace(/_/g, " ")
      .split(" ")
      .map((w) =>
        w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");
  };

  const statusVariant = (status: string | null | undefined) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "paid") return "paid";
    if (s === "pending") return "secondary";
    if (s === "overdue") return "destructive";
    if (s === "cancelled") return "default";
    if (s === "partial") return "outline";
    return "default";
  };

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
          .from("balances")
          .select("id, student_profile_id, amount_due, due_date, created_at", {
            count: "exact",
          })
          .range(from, to);

        if (error) {
          console.error("Error fetching balances:", error);
          setBalances([]);
          setTotal(0);
          return;
        }

        const raw = (data ?? []) as any[];

        const profileIds = Array.from(
          new Set(raw.map((r) => r.student_profile_id).filter(Boolean))
        );

        let studentProfiles: any[] = [];
        if (profileIds.length > 0) {
          const { data: spData, error: spErr } = await supabase
            .from("student_profile")
            .select("id, user_id, course_id")
            .in("id", profileIds);
          if (spErr) {
            console.error("Error fetching student profiles:", spErr);
          } else {
            studentProfiles = spData ?? [];
          }
        }

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
          if (uErr) console.error("Error fetching users:", uErr);
          else users = uData ?? [];
        }

        let courses: any[] = [];
        if (courseIds.length > 0) {
          const { data: cData, error: cErr } = await supabase
            .from("courses")
            .select("id, name, title")
            .in("id", courseIds);
          if (cErr) console.error("Error fetching courses:", cErr);
          else courses = cData ?? [];
        }

        // fetch payments sums for these balances
        const balanceIds = raw.map((r) => r.id).filter(Boolean);
        let paymentsByBalance = new Map<string, number>();
        if (balanceIds.length > 0) {
          const { data: pData, error: pErr } = await supabase
            .from("payments")
            .select("balance_id, amount_paid")
            .in("balance_id", balanceIds);
          if (pErr)
            console.error("Error fetching payments for balances:", pErr);
          else {
            const sums = (pData ?? []).reduce((acc: any, cur: any) => {
              acc[cur.balance_id] =
                (acc[cur.balance_id] || 0) + Number(cur.amount_paid || 0);
              return acc;
            }, {} as Record<string, number>);
            paymentsByBalance = new Map(Object.entries(sums));
          }
        }

        const usersMap = new Map(users.map((u: any) => [u.id, u]));
        const profilesMap = new Map(studentProfiles.map((s: any) => [s.id, s]));
        const coursesMap = new Map(courses.map((c: any) => [c.id, c]));

        const normalized = raw.map((r) => {
          const profile = profilesMap.get(r.student_profile_id) ?? null;
          const user = profile ? usersMap.get(profile.user_id) : null;
          const course = profile ? coursesMap.get(profile.course_id) : null;
          const paid = paymentsByBalance.get(r.id) ?? 0;
          const status =
            paid >= Number(r.amount_due || 0)
              ? "paid"
              : paid > 0
              ? "partial"
              : "pending";
          return {
            id: r.id,
            student_profile_id: r.student_profile_id,
            amount_due: Number(r.amount_due ?? 0),
            due_date: r.due_date,
            created_at: r.created_at,
            user,
            course,
            paid,
            status,
          };
        });

        setBalances(normalized);
        setTotal(typeof count === "number" ? count : 0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [currentPage, pageSize, searchTerm]);

  const sorted = useMemo(() => {
    // no sorting: return fetched balances as-is
    return balances ?? [];
  }, [balances]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const displayed = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return sorted;
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter((b) => {
      const sn = b.user?.student_number ?? "";
      const fn = b.user?.first_name ?? "";
      const ln = b.user?.last_name ?? "";
      const cr = b.course?.name ?? "";
      return (
        sn.toLowerCase().includes(q) ||
        fn.toLowerCase().includes(q) ||
        ln.toLowerCase().includes(q) ||
        cr.toLowerCase().includes(q)
      );
    });
  }, [sorted, searchTerm]);

  return (
    <DashboardLayout
      title="Balance Management"
      subtitle="Monitor outstanding balances and due dates"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faMoneyBill} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Balances
              </h2>
              <p className="text-sm text-muted-foreground">
                Outstanding amounts
              </p>
            </div>
          </div>
          <Button className="hypatia-gradient-bg">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Balance
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Balance Overview</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search balances..."
                  className="pl-10"
                />
              </div>
              <div>
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPageSize(v);
                    // reset to first page to avoid out-of-range pages
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
                    <TableHead className="w-56">Student</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {b.user
                              ? `${b.user.first_name} ${b.user.last_name}`
                              : "-"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {b.user?.student_number ?? ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.due_date
                          ? new Date(b.due_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {`₱ ${Number(b.amount_due ?? 0).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(b.status)}>
                          {formatLabel(b.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-start space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModalFor(b)}
                            aria-label={`Edit balance ${b.id}`}
                          >
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
              entity="balances"
              row={selectedRow}
              onSaved={() => setCurrentPage((p) => p)}
              onDeleted={() => setCurrentPage(1)}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing page {currentPage} of {totalPages}
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

                  {/* rows-per-page select restored to header */}

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

export default Balances;
