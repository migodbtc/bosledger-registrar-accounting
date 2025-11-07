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
import CreateModal from "@/components/CreateModal";
import { toast } from "@/components/ui/use-toast";

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
        const isSearching = !!(searchTerm && searchTerm.trim() !== "");
        // When searching, fetch a larger window so client-side filtering can
        // find matches across what would normally be multiple pages. This
        // avoids forcing the user to navigate pages to find a matching row.
        const MAX_SEARCH_FETCH = 1000;
        const from = isSearching ? 0 : (currentPage - 1) * pageSize;
        const to = isSearching
          ? Math.min(MAX_SEARCH_FETCH - 1, 9999)
          : from + pageSize - 1;

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

        // If we're in search mode and the fetch returned the MAX_SEARCH_FETCH
        // limit, warn in console that results may be truncated. We still
        // proceed and let the client-side filter show matching rows.
        if (isSearching && raw.length >= MAX_SEARCH_FETCH) {
          console.warn(
            `Search fetched ${raw.length} rows (limit ${MAX_SEARCH_FETCH}). Results may be truncated.`
          );
        }

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
        // When searching we don't rely on the server count for pagination;
        // instead present the number of rows we fetched so the UI shows
        // the filtered result size immediately.
        if (isSearching) {
          setTotal(normalized.length);
          // ensure UI stays on first page for search results
          setCurrentPage(1);
        } else {
          setTotal(typeof count === "number" ? count : 0);
        }
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
  const [createOpen, setCreateOpen] = useState(false);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleDeleteBalance = (id: string) => {
    if (
      !confirm(
        "Delete balance? This will remove the balance record. Payments referencing this balance may prevent deletion. This cannot be undone. Continue?"
      )
    )
      return;
    (async () => {
      try {
        const { error } = await supabase.from("balances").delete().eq("id", id);
        if (error) throw error;
        // remove from local list and update total so the UI reflects deletion immediately
        setBalances((prev) => prev.filter((b) => b.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        toast({ title: "Deleted", description: "Balance deleted." });
      } catch (err) {
        console.error("Delete balance error:", err);
        toast({
          title: "Error",
          description: String((err as any)?.message ?? err),
          variant: "destructive",
        });
      }
    })();
  };

  // Enrich a single balance row returned from a create RPC/insert so the UI
  // receives the same shape used by the table (includes user, course, paid, status)
  const enrichBalanceRow = async (r: any) => {
    try {
      let profile: any = null;
      let user: any = null;
      let course: any = null;
      let paid = 0;

      if (r?.student_profile_id) {
        const { data: spData, error: spErr } = await supabase
          .from("student_profile")
          .select("id, user_id, course_id")
          .eq("id", r.student_profile_id)
          .single();
        if (!spErr && spData) {
          profile = spData;
          if (profile?.user_id) {
            const { data: uData, error: uErr } = await supabase
              .from("users")
              .select("id, student_number, first_name, last_name, email")
              .eq("id", profile.user_id)
              .single();
            if (!uErr) user = uData;
          }
          if (profile?.course_id) {
            const { data: cData, error: cErr } = await supabase
              .from("courses")
              .select("id, name, title")
              .eq("id", profile.course_id)
              .single();
            if (!cErr) course = cData;
          }
        }
      }

      // fetch payments referencing this balance to compute 'paid'
      if (r?.id) {
        const { data: pData, error: pErr } = await supabase
          .from("payments")
          .select("amount_paid")
          .eq("balance_id", r.id);
        if (!pErr && pData) {
          paid = (pData ?? []).reduce(
            (acc: number, cur: any) => acc + Number(cur.amount_paid || 0),
            0
          );
        }
      }

      const amount_due = Number(r.amount_due ?? 0);
      const status =
        paid >= amount_due ? "paid" : paid > 0 ? "partial" : "pending";

      return {
        id: r.id,
        student_profile_id: r.student_profile_id,
        amount_due: amount_due,
        due_date: r.due_date,
        created_at: r.created_at,
        user,
        course,
        paid,
        status,
      };
    } catch (err) {
      console.error("enrichBalanceRow error:", err);
      return r;
    }
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
          <Button
            className="hypatia-gradient-bg"
            onClick={() => setCreateOpen(true)}
          >
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBalance(b.id)}
                            aria-label={`Delete balance ${b.id}`}
                          >
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

            <CreateModal
              open={createOpen}
              onOpenChange={(v) => setCreateOpen(v)}
              entity="balances"
              onCreated={async (created) => {
                if (created) {
                  const enriched = await enrichBalanceRow(created);
                  // Prepend to local balances list so UI reflects new balance immediately
                  setBalances((prev) => [enriched, ...prev]);
                  setTotal((t) => t + 1);
                  setCurrentPage(1);
                } else {
                  setCurrentPage(1);
                }
              }}
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
