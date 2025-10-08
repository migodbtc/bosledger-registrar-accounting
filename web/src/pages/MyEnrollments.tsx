import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUserGraduate,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
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
  faBookOpen,
  faCreditCard,
  faClock,
  faChartLine,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";

const MyEnrollments = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) {
        console.warn(
          "No student_profile found for authenticated user:",
          userProfile
        );
        return;
      }

      try {
        setLoading(true);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // select enrollments and join course title
        let query = supabase
          .from("enrollments")
          .select("*, courses(title)", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .range(from, to);

        // apply server-side ordering for enrollment columns (not for course name)
        if (sortBy && sortBy !== "course") {
          query = query.order(sortBy, { ascending: sortDir === "asc" });
        }

        const { data, error, count } = await query;
        if (error) {
          console.error("Error fetching enrollments:", error);
          setEnrollments([]);
          setTotal(0);
        } else {
          const items = data ?? [];
          // if sorting by course name, sort client-side within the fetched page
          if (sortBy === "course") {
            items.sort((a: any, b: any) => {
              const an = (a.courses && a.courses.title) || "";
              const bn = (b.courses && b.courses.title) || "";
              if (an < bn) return sortDir === "asc" ? -1 : 1;
              if (an > bn) return sortDir === "asc" ? 1 : -1;
              return 0;
            });
          }
          console.log("Enrollments for student_profile_id", sp.id, items);
          setEnrollments(items as any[]);
          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [userProfile, page, pageSize, sortBy, sortDir]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    // when sorting, reset to first page
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // delete action removed — table is read-only in this view

  const [completedCount, setCompletedCount] = useState<number | null>(null);

  const [totalUnits, setTotalUnits] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCompletedCount = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        // request an exact count of enrollments with status 'completed' for this student
        const { count, error } = await supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .eq("status", "completed");
        if (!error) {
          setCompletedCount(typeof count === "number" ? count : 0);
        }
      } catch (err) {
        console.error("Error fetching completed enrollments count:", err);
      }
    };

    fetchCompletedCount();
  }, [userProfile, total]);

  useEffect(() => {
    const fetchTotalUnits = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        // select enlisted_subjects joined to enlistments and subjects, filter enlistments for this student
        const { data, error } = await supabase
          .from("enlisted_subjects")
          .select("subjects(units), enlistments(student_id)")
          .eq("enlistments.student_id", sp.id);
        if (error) {
          console.error("Error fetching enlisted subjects:", error);
          setTotalUnits(0);
          return;
        }
        const items = data ?? [];
        const sum = items.reduce((acc: number, row: any) => {
          const u = row?.subjects?.units;
          const n = typeof u === "number" ? u : Number(u) || 0;
          return acc + n;
        }, 0);
        setTotalUnits(sum);
      } catch (err) {
        console.error("Error computing total units:", err);
        setTotalUnits(0);
      }
    };

    fetchTotalUnits();
  }, [userProfile, total]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!userProfile) return;
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        const { count, error } = await supabase
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("student_profile_id", sp.id)
          .eq("status", "pending");
        if (!error) {
          setPendingCount(typeof count === "number" ? count : 0);
        }
      } catch (err) {
        console.error("Error fetching pending enrollments count:", err);
        setPendingCount(0);
      }
    };

    fetchPendingCount();
  }, [userProfile, total]);

  return (
    <DashboardLayout title="My Enrollments" subtitle="Your current enrollments">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faUserGraduate} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                My Enrollments
              </h2>
              <p className="text-sm text-muted-foreground">
                Your active enrollments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md px-3 py-1 text-sm"
              title="Rows per page"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <Button className="hypatia-gradient-bg">
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Enroll
            </Button>
          </div>
        </div>

        {/* If there are no enrollments, show the original card layout (empty-state) */}
        {!loading && enrollments.length === 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Enrollment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full hypatia-gradient-subtle flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon
                    icon={faUserGraduate}
                    className="text-2xl text-primary"
                  />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  Your Enrollment List
                </p>
                <p className="text-muted-foreground mb-4">
                  View and manage your enrollments, courses, and academic
                  progress.
                </p>
                <Button className="hypatia-gradient-bg">
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mini stat cards (placeholders) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Previous Enrollments
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <div className="text-sm text-muted-foreground">
                Previously enrolled courses
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Enrollments
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">
                Courses you've completed
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Units Enlisted
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits ?? 0}</div>
              <div className="text-sm text-muted-foreground">
                Sum of enlisted units
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Enrollments
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="h-4 w-4 text-primary"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">
                Enrollments awaiting processing
              </div>
            </CardContent>
          </Card>
        </div>

        {/* If loading, show a simple loading indicator */}
        {loading && (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading enrollments...
            </p>
          </div>
        )}

        {/* If there are enrollments, render them in a table */}
        {!loading && enrollments.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Your Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("course")}
                      className="cursor-pointer"
                    >
                      Course
                      <FontAwesomeIcon
                        icon={
                          sortBy === "course"
                            ? sortDir === "asc"
                              ? faSortUp
                              : faSortDown
                            : faSort
                        }
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("year_level")}
                      className="cursor-pointer"
                    >
                      Year Level
                      <FontAwesomeIcon
                        icon={
                          sortBy === "year_level"
                            ? sortDir === "asc"
                              ? faSortUp
                              : faSortDown
                            : faSort
                        }
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("semester")}
                      className="cursor-pointer"
                    >
                      Semester
                      <FontAwesomeIcon
                        icon={
                          sortBy === "semester"
                            ? sortDir === "asc"
                              ? faSortUp
                              : faSortDown
                            : faSort
                        }
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("school_year")}
                      className="cursor-pointer"
                    >
                      School Year
                      <FontAwesomeIcon
                        icon={
                          sortBy === "school_year"
                            ? sortDir === "asc"
                              ? faSortUp
                              : faSortDown
                            : faSort
                        }
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead
                      onClick={() => handleSort("status")}
                      className="cursor-pointer"
                    >
                      Status
                      <FontAwesomeIcon
                        icon={
                          sortBy === "status"
                            ? sortDir === "asc"
                              ? faSortUp
                              : faSortDown
                            : faSort
                        }
                        className="ml-2"
                      />
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium max-w-[300px]">
                        <div
                          className="truncate max-w-full"
                          title={(e.courses && e.courses.title) || e.course_id}
                        >
                          {(e.courses && e.courses.title) || e.course_id}
                        </div>
                      </TableCell>
                      <TableCell>{e.year_level}</TableCell>
                      <TableCell>{e.semester}</TableCell>
                      <TableCell>{e.school_year}</TableCell>
                      <TableCell>{e.section ?? "-"}</TableCell>
                      <TableCell>
                        {(() => {
                          const s = (e.status || "").toString();
                          let variant: any = "outline";
                          switch (s) {
                            case "pending":
                              variant = "secondary";
                              break;
                            case "enrolled":
                              variant = "default";
                              break;
                            case "dropped":
                              variant = "destructive";
                              break;
                            case "completed":
                              variant = "default";
                              break;
                            case "failed":
                              variant = "destructive";
                              break;
                            case "withdrawn":
                              variant = "outline";
                              break;
                            default:
                              variant = "outline";
                          }
                          const label =
                            s.charAt(0).toUpperCase() +
                            s.slice(1).toLowerCase();
                          return <Badge variant={variant}>{label}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            onClick={() => console.log("View", e.id)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
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
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyEnrollments;
