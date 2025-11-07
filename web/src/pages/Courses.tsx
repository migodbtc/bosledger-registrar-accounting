import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faGraduationCap,
  faEdit,
  faTrash,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabaseClient";
import RowModal from "@/components/RowModal";
import CreateModal from "@/components/CreateModal";
import { toast } from "@/components/ui/use-toast";

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const displayed = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return courses ?? [];
    const q = searchTerm.trim().toLowerCase();
    return (courses ?? []).filter((c: any) => {
      const name = (c.name || "").toString().toLowerCase();
      const title = (c.title || "").toString().toLowerCase();
      const dept = (c.department || "").toString().toLowerCase();
      return name.includes(q) || title.includes(q) || dept.includes(q);
    });
  }, [courses, searchTerm]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const isSearching = !!(searchTerm && searchTerm.trim() !== "");
        const MAX_SEARCH_FETCH = 1000;
        const from = isSearching ? 0 : (currentPage - 1) * pageSize;
        const to = isSearching
          ? Math.min(MAX_SEARCH_FETCH - 1, 9999)
          : from + pageSize - 1;

        const { data, error, count } = await supabase
          .from("courses")
          .select("id, name, title, years, department, created_at", {
            count: "exact",
          })
          .range(from, to);

        if (error) {
          console.error("Error fetching courses:", error);
          setCourses([]);
          setTotal(0);
        } else {
          const fetched = (data ?? []) as any[];
          if (isSearching && fetched.length >= MAX_SEARCH_FETCH) {
            console.warn(
              `Search fetched ${fetched.length} rows (limit ${MAX_SEARCH_FETCH}). Results may be truncated.`
            );
          }
          setCourses(fetched);
          if (isSearching) {
            setTotal(fetched.length);
            setCurrentPage(1);
          } else {
            setTotal(typeof count === "number" ? count : 0);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentPage, pageSize, searchTerm]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleDeleteCourse = (id: string) => {
    if (
      !confirm(
        "Delete course? This will remove the course record. Related subjects, enrollments, or student profiles may prevent deletion due to foreign-key constraints. This cannot be undone. Continue?"
      )
    )
      return;
    (async () => {
      try {
        const { error } = await supabase.from("courses").delete().eq("id", id);
        if (error) throw error;
        // update local state so the row disappears immediately
        setCourses((prev) => prev.filter((c) => c.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        toast({ title: "Deleted", description: "Course deleted." });
      } catch (err) {
        console.error("Delete course error:", err);
        toast({
          title: "Error",
          description: String((err as any)?.message ?? err),
          variant: "destructive",
        });
      }
    })();
  };

  // expose fetchCourses to be callable after save/delete by triggering a page refresh
  // we'll just reload the current page of data by toggling currentPage (cheap) if needed

  return (
    <DashboardLayout
      title="Course Management"
      subtitle="Manage academic programs and course offerings"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Courses</h2>
              <p className="text-sm text-muted-foreground">
                {/* description of the site like a tooltip */}
                Contains the available academic programs for enrollment
              </p>
            </div>
          </div>
          <Button
            className="hypatia-gradient-bg"
            onClick={() => setCreateOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Register Course
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Course Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search courses..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                />
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
                    <TableHead>Course Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        Loading courses...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && displayed.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        No courses found
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    displayed.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          {course.name ?? course.id}
                        </TableCell>
                        <TableCell>{course.title ?? "-"}</TableCell>
                        <TableCell>
                          {course.years
                            ? // if years is a comma-separated string, show multiple badges
                              String(course.years)
                                .split(",")
                                .map((y: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className={idx > 0 ? "ml-2" : ""}
                                  >
                                    <Badge>{y.trim()}</Badge>
                                  </span>
                                ))
                            : "-"}
                        </TableCell>
                        <TableCell>{course.department ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModalFor(course)}
                              aria-label={`Edit course ${course.id}`}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="w-4 h-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                              aria-label={`Delete course ${course.id}`}
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
        <RowModal
          open={modalOpen}
          onOpenChange={(v) => setModalOpen(v)}
          entity="courses"
          row={selectedRow}
          onSaved={() => {
            /* refresh page by reloading current page */ setCurrentPage(
              (p) => p
            );
          }}
          onDeleted={() => {
            setCurrentPage(1);
          }}
        />
        <CreateModal
          open={createOpen}
          onOpenChange={(v) => setCreateOpen(v)}
          entity="courses"
          onCreated={(created) => {
            // if the modal returned the created row, add it to local state so the
            // new course appears immediately without waiting for a refetch.
            if (created) {
              setCourses((prev) => [created, ...(prev || [])]);
              setTotal((t) => t + 1);
            }
            // keep legacy behavior: reset to first page
            setCurrentPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Courses;
