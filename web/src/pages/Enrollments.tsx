import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUserGraduate,
  faEdit,
  faTrash,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/utils/supabaseClient";

const Enrollments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getStatusBadge = (status: any) => {
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
      : "-";

    // If status is falsy, return a simple dash for clarity
    if (!status) return <span className="text-muted-foreground">-</span>;

    // cast variant to any because the Badge component's variant union is narrower
    // than the semantic status mapping we use here (keeps visual intent)
    return (
      <Badge
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variant={variants[String(status) as keyof typeof variants]}
      >
        {label}
      </Badge>
    );
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        // select enrollments with nested student_profile -> users and course name
        const { data, error, count } = await supabase
          .from("enrollments")
          .select(
            "id, student_profile_id, course_id, year_level, semester, school_year, status, section, created_at, student_profile(id, user_id, users(id, student_number, first_name, last_name, email)), courses(name)",
            { count: "exact" }
          )
          .range(from, to);

        if (error) {
          console.error("Error fetching enrollments:", error);
          setEnrollments([]);
          setTotal(0);
        } else {
          setEnrollments((data ?? []) as any[]);
          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [currentPage, pageSize, searchTerm]);

  return (
    <DashboardLayout
      title="Enrollment Management"
      subtitle="Track student enrollments, grades, and academic progress"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faUserGraduate} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Enrollments
              </h2>
              <p className="text-sm text-muted-foreground">
                {total} total enrollments
              </p>
            </div>
          </div>
          <Button className="hypatia-gradient-bg">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Enrollment
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Enrollment Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input placeholder="Search enrollments..." className="pl-10" />
              </div>
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
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>School Year</TableHead>
                    <TableHead>Status</TableHead>
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
                        Loading enrollments...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && enrollments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        No enrollments found
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    enrollments.map((enr: any) => (
                      <TableRow key={enr.id}>
                        <TableCell>
                          {enr.student_profile?.users
                            ? `${enr.student_profile.users.first_name ?? ""} ${
                                enr.student_profile.users.last_name ?? ""
                              }`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {enr.student_profile?.users?.student_number ?? "-"}
                        </TableCell>
                        <TableCell>
                          {enr.courses?.name ? (
                            <Badge>{enr.courses.name}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{enr.year_level ?? "-"}</TableCell>
                        <TableCell>{enr.semester ?? "-"}</TableCell>
                        <TableCell>{enr.school_year ?? "-"}</TableCell>
                        <TableCell>{getStatusBadge(enr.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
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
      </div>
    </DashboardLayout>
  );
};

export default Enrollments;
