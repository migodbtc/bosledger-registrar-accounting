import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateModal from "@/components/CreateModal";
// pagination will use simple buttons (First / Prev / Next / Last) similar to MyEnrollments
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUsers,
  faEdit,
  faTrash,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { EnrollmentStatus } from "@/types/student";
import { supabase } from "@/utils/supabaseClient";

type SortField =
  | "student_id"
  | "first_name"
  | "last_name"
  | "year_level"
  | "enrollment_status"
  | "course_name";
type SortDirection = "asc" | "desc";

const Students = () => {
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("student_id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);

  // Map enrollments by student_profile_id for quick lookup when rendering rows
  const enrollmentsByProfile = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of enrollments ?? []) {
      const id = e.student_profile_id || e.student_profile_id;
      if (!id) continue;
      const arr = map.get(id) ?? [];
      arr.push(e);
      map.set(id, arr);
    }
    // sort each list by created_at desc so index 0 is the latest enrollment
    for (const [key, arr] of map.entries()) {
      arr.sort((a: any, b: any) => {
        const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      map.set(key, arr);
    }
    console.log("enrollmentsByProfile map:", map);
    return map;
  }, [enrollments]);

  // Choose a preferred enrollment per profile:
  // - prefer entries with status 'enrolled' (or 'active')
  // - among those, pick the highest numeric year_level (4th > 3rd > ...)
  // - fallback to newest by created_at
  const enrollmentsPreferred = useMemo(() => {
    const pref = new Map<string, any>();
    const parseYearNum = (val: any) => {
      if (!val) return 0;
      const m = String(val).match(/(\d+)/);
      if (m) return Number(m[1]);
      const s = String(val).toLowerCase();
      if (s.includes("graduate") || s.includes("graduated")) return 99;
      return 0;
    };

    for (const [id, arr] of enrollmentsByProfile.entries()) {
      const candidates = (arr ?? []).slice();
      if (candidates.length === 0) {
        pref.set(id, null);
        continue;
      }
      // prefer enrolled/active statuses
      const preferredStatus = candidates.filter((e: any) =>
        ["enrolled", "active"].includes(String(e.status))
      );
      const pool = preferredStatus.length > 0 ? preferredStatus : candidates;
      // sort pool by numeric year desc, then created_at desc
      pool.sort((a: any, b: any) => {
        const ay = parseYearNum(a?.year_level ?? a?.year ?? "");
        const by = parseYearNum(b?.year_level ?? b?.year ?? "");
        if (ay !== by) return by - ay;
        const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      pref.set(id, pool[0]);
    }

    return pref;
  }, [enrollmentsByProfile]);

  // server-backed pagination: total comes from Supabase count
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // `students` already holds the current page of rows from the server

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
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
    if (selectedStudents.length === students.length && students.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getStatusBadge = (status: EnrollmentStatus) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      graduated: "outline",
      withdrawn: "destructive",
      enrolled: "success",
    } as const;

    const label = status
      ? String(status).charAt(0).toUpperCase() + String(status).slice(1)
      : "";
    return <Badge variant={variants[status]}>{label}</Badge>;
  };

  // Empty handlers for now — will be implemented later
  const handleAddStudent = () => {
    // placeholder
  };

  const handleEditStudent = (id: string) => {
    // placeholder
  };

  const handleDeleteStudent = (id: string) => {
    // placeholder
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        // student data is stored across student_profile -> users and courses
        let query = supabase
          .from("student_profile")
          .select(
            "id, status, created_at, users(id, student_number, first_name, last_name, email), courses(name)",
            { count: "exact" }
          )
          .range(from, to);

        // status filter (column on student_profile is `status`)
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter as string);
        }

        // NOTE: sorting across joined columns (users.first_name, courses.title) is handled client-side

        const { data, error, count } = await query;
        if (error) {
          console.error("Error fetching students:", error);
          setStudents([]);
          setTotal(0);
        } else {
          // Use the raw student_profile rows only (no enrollment join logic)
          const raw = (data ?? []) as any[];
          setStudents(raw);

          // fetch enrollments that reference these student_profile rows
          const profileIds = raw.map((r) => r.id).filter(Boolean);
          if (profileIds.length > 0) {
            const { data: enrData, error: enrErr } = await supabase
              .from("enrollments")
              .select(
                "id, student_profile_id, course_id, year_level, semester, school_year, status, section, created_at, courses(id, title)"
              )
              .in("student_profile_id", profileIds);

            if (enrErr) {
              console.error("Error fetching enrollments for profiles:", enrErr);
              setEnrollments([]);
            } else {
              const enr = enrData ?? [];

              setEnrollments(enr);
            }
          } else {
            setEnrollments([]);
          }

          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    statusFilter,
    searchTerm,
    refreshToken,
  ]);
  // fetch enrollments for the currently loaded student_profile rows
  // (Handled inside the main fetchStudents effect so enrollments correspond to the displayed page)

  // client-side sort on the fetched page (safe because server paging is used)
  const sortedStudents = useMemo(() => {
    const copy = (students ?? []).slice();
    copy.sort((a: any, b: any) => {
      // special-case numeric sorting for year_level using enrollmentsByProfile
      if (sortField === "year_level") {
        const parseYear = (val: any) => {
          console.log("Parsing year level:", val);
          if (!val) return 0;
          // try to extract a leading number (e.g. "1st Year", "4th Year")
          const m = String(val).match(/(\d+)/);
          if (m) return Number(m[1]);
          // fallback: common words
          const s = String(val).toLowerCase();
          if (s.includes("graduate") || s.includes("graduated")) return 99;
          return 0;
        };

        const aEnroll = enrollmentsPreferred.get(a.id);
        const bEnroll = enrollmentsPreferred.get(b.id);
        const avNum = parseYear(aEnroll?.year_level ?? aEnroll?.year ?? "");
        const bvNum = parseYear(bEnroll?.year_level ?? bEnroll?.year ?? "");

        if (avNum < bvNum) return sortDirection === "asc" ? -1 : 1;
        if (avNum > bvNum) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      const get = (row: any, field: SortField) => {
        switch (field) {
          case "student_id":
            return row.users?.student_number ?? "";
          case "first_name":
            return row.users?.first_name ?? "";
          case "last_name":
            return row.users?.last_name ?? "";
          case "course_name":
            return row.courses?.name ?? "";
          case "enrollment_status":
            return row.status ?? "";
          default:
            return "";
        }
      };

      const av = String(get(a, sortField)).toLowerCase();
      const bv = String(get(b, sortField)).toLowerCase();
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [students, sortField, sortDirection, enrollmentsByProfile]);

  // apply simple client-side search across the fetched page
  const displayedStudents = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return sortedStudents;
    const q = searchTerm.trim().toLowerCase();
    return sortedStudents.filter((s: any) => {
      const sn = s.users?.student_number ?? "";
      const fn = s.users?.first_name ?? "";
      const ln = s.users?.last_name ?? "";
      const em = s.users?.email ?? "";
      const cr = s.courses?.name ?? "";
      return (
        sn.toLowerCase().includes(q) ||
        fn.toLowerCase().includes(q) ||
        ln.toLowerCase().includes(q) ||
        em.toLowerCase().includes(q) ||
        cr.toLowerCase().includes(q)
      );
    });
  }, [sortedStudents, searchTerm]);

  return (
    <DashboardLayout
      title="Student Management"
      subtitle="Manage student records, enrollments, and academic information"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Students
              </h2>
              <p className="text-sm text-muted-foreground">
                {total} total students
              </p>
            </div>
          </div>
          <Button
            className="hypatia-gradient-bg"
            onClick={() => setCreateOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Register Student
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Student Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input placeholder="Search students..." className="pl-10" />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as EnrollmentStatus | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedStudents.length === students.length &&
                          students.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("student_id")}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">Student ID</span>
                        <FontAwesomeIcon
                          icon={getSortIcon("student_id")}
                          className="w-3 h-3"
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("first_name")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Name</span>
                        <FontAwesomeIcon
                          icon={getSortIcon("first_name")}
                          className="w-3 h-3"
                        />
                      </div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("course_name")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Course</span>
                        <FontAwesomeIcon
                          icon={getSortIcon("course_name")}
                          className="w-3 h-3"
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("year_level")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Year</span>
                        <FontAwesomeIcon
                          icon={getSortIcon("year_level")}
                          className="w-3 h-3"
                        />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("enrollment_status")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        <FontAwesomeIcon
                          icon={getSortIcon("enrollment_status")}
                          className="w-3 h-3"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        Loading students...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && students.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        No students found
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    displayedStudents.map((student: any) => (
                      <TableRow
                        key={student.id}
                        data-state={
                          selectedStudents.includes(student.id)
                            ? "selected"
                            : undefined
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() =>
                              handleSelectStudent(student.id)
                            }
                          />
                        </TableCell>

                        <TableCell className="font-medium">
                          {student.users?.student_number ?? "-"}
                        </TableCell>
                        <TableCell>{`${student.users?.first_name ?? ""} ${
                          student.users?.last_name ?? ""
                        }`}</TableCell>
                        <TableCell>{student.users?.email ?? "-"}</TableCell>
                        <TableCell>
                          {student.courses?.name ? (
                            <Badge>{student.courses.name}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        {/* this is where the year level is supposed to go */}
                        <TableCell>
                          {enrollmentsByProfile.get(student.id)?.slice(-1)[0]
                            ?.year_level ?? "-"}
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(
                            enrollmentsByProfile.get(student.id)?.slice(-1)[0]
                              ?.status
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student.id)}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="w-4 h-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student.id)}
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
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
        <CreateModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          entity="students"
          onCreated={() => setRefreshToken((t) => t + 1)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Students;
