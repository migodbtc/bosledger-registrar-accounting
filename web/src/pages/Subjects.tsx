import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faBookOpen,
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
import RowModal from "@/components/RowModal";
import CreateModal from "@/components/CreateModal";

const Subjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
          .from("subjects")
          .select(
            "id, course_id, subject_code, subject_name, units, semester, created_at",
            { count: "exact" }
          )
          .range(from, to);

        if (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
          setTotal(0);
        } else {
          setSubjects((data ?? []) as any[]);
          setTotal(typeof count === "number" ? count : 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [currentPage, pageSize, searchTerm]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const openModalFor = (row: any) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <DashboardLayout
      title="Subject Management"
      subtitle="Manage individual subjects and curriculum components"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faBookOpen} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Subjects
              </h2>
              <p className="text-sm text-muted-foreground">
                Lists the individual subjects available for enlistment
              </p>
            </div>
          </div>
          <Button
            className="hypatia-gradient-bg"
            onClick={() => setCreateOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Register Subject
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Subject Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input placeholder="Search subjects..." className="pl-10" />
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
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Semester</TableHead>
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
                        Loading subjects...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && subjects.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="p-4 text-sm text-muted-foreground"
                      >
                        No subjects found
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    subjects.map((subj: any) => (
                      <TableRow key={subj.id}>
                        <TableCell className="font-medium">
                          {subj.subject_code ?? "-"}
                        </TableCell>
                        <TableCell>{subj.subject_name ?? "-"}</TableCell>
                        <TableCell>
                          {subj.units ? (
                            <Badge>{String(subj.units)}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {subj.semester ? (
                            <Badge>{String(subj.semester)}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModalFor(subj)}
                              aria-label={`Edit subject ${subj.id}`}
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
          entity="subjects"
          row={selectedRow}
          onSaved={() => {
            setCurrentPage((p) => p);
          }}
          onDeleted={() => {
            setCurrentPage(1);
          }}
        />
        <CreateModal
          open={createOpen}
          onOpenChange={(v) => setCreateOpen(v)}
          entity="subjects"
          onCreated={() => setCurrentPage(1)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Subjects;
