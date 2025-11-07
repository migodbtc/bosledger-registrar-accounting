import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogFooter as ModalFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faTrash,
  faTimes,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: any | null; // expected shape: student_profile row with nested users and courses
  onSaved?: () => void;
  onDeleted?: () => void;
  readOnly?: boolean;
};

const StudentRowModal: React.FC<Props> = ({
  open,
  onOpenChange,
  row,
  onSaved,
  onDeleted,
  readOnly = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>({});
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    setForm(() => {
      // flatten into an editable shape: user.* and profile.*
      return {
        student_number: row?.users?.student_number ?? "",
        first_name: row?.users?.first_name ?? "",
        middle_name: row?.users?.middle_name ?? "",
        last_name: row?.users?.last_name ?? "",
        email: row?.users?.email ?? "",
        gender: row?.users?.gender ?? "",
        birthday: row?.users?.birthday
          ? row.users.birthday?.slice?.(0, 10)
          : "",
        mobile_number: row?.users?.mobile_number ?? "",
        course_id: row?.course_id ?? row?.courses?.id ?? null,
        status: row?.status ?? "",
        enrollment_date: row?.enrollment_date
          ? row.enrollment_date?.slice?.(0, 10)
          : "",
      };
    });
    setEditing(false);
    setSaving(false);
    setDeleting(false);
  }, [row, open]);

  const formatDisplayValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    if (/date|birthday|enrollment_date/i.test(key)) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      } catch (_) {
        return String(value);
      }
    }
    return String(value);
  };

  useEffect(() => {
    // preload courses (for course_id select)
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("courses")
          .select("id,title,name")
          .limit(500);
        setCourses(data ?? []);
      } catch (e) {
        console.warn("Could not load courses for StudentRowModal", e);
      }
    };
    fetch();
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!row) return;
    setSaving(true);
    try {
      // update users table if any user fields changed
      const userPayload: any = {};
      const userKeys = [
        "student_number",
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "gender",
        "birthday",
        "mobile_number",
      ];
      for (const k of userKeys) {
        const old = row.users?.[k];
        const nv = form[k];
        if (String(old ?? "") !== String(nv ?? "")) userPayload[k] = nv ?? null;
      }

      if (Object.keys(userPayload).length > 0) {
        if (!row.users?.id) throw new Error("Missing users.id for update");
        const { error: uErr } = await supabase
          .from("users")
          .update(userPayload)
          .eq("id", row.users.id);
        if (uErr) throw uErr;
      }

      // update student_profile fields
      const profilePayload: any = {};
      if (String(row.status ?? "") !== String(form.status ?? ""))
        profilePayload.status = form.status || null;
      if (
        String(row.course_id ?? row.courses?.id ?? "") !==
        String(form.course_id ?? "")
      )
        profilePayload.course_id = form.course_id || null;
      if (
        String(row.enrollment_date ?? "") !== String(form.enrollment_date ?? "")
      )
        profilePayload.enrollment_date = form.enrollment_date || null;

      if (Object.keys(profilePayload).length > 0) {
        const { error: pErr } = await supabase
          .from("student_profile")
          .update(profilePayload)
          .eq("id", row.id);
        if (pErr) throw pErr;
      }

      toast({ title: "Saved", description: "Student updated successfully." });
      onSaved && onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error("Student save error:", err);
      toast({
        title: "Error",
        description: String((err as any)?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!row) return;
    if (
      !confirm(
        "Delete student profile? This will remove the student_profile record (users row will remain). Continue?"
      )
    )
      return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("student_profile")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Student profile deleted." });
      onDeleted && onDeleted();
      onOpenChange(false);
    } catch (err) {
      console.error("Student delete error:", err);
      toast({
        title: "Error",
        description: String((err as any)?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!row) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Student Details</ModalTitle>
        </ModalHeader>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? "Read-only view of student details."
                : "Unlock to edit fields; saving updates the user and profile records."}
            </p>
            <div className="flex items-center space-x-2">
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing((s) => !s)}
                >
                  <FontAwesomeIcon
                    icon={editing ? faLockOpen : faLock}
                    className="mr-2"
                  />
                  {editing ? "Unlock" : "Lock"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Render read-only text when requested to match MyPayments style */}
            <div>
              <Label className="text-xs">Student Number</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("student_number", form.student_number)}
                </div>
              ) : (
                <Input
                  value={form.student_number ?? ""}
                  onChange={(e: any) =>
                    handleChange("student_number", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">First Name</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("first_name", form.first_name)}
                </div>
              ) : (
                <Input
                  value={form.first_name ?? ""}
                  onChange={(e: any) =>
                    handleChange("first_name", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Middle Name</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("middle_name", form.middle_name)}
                </div>
              ) : (
                <Input
                  value={form.middle_name ?? ""}
                  onChange={(e: any) =>
                    handleChange("middle_name", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Last Name</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("last_name", form.last_name)}
                </div>
              ) : (
                <Input
                  value={form.last_name ?? ""}
                  onChange={(e: any) =>
                    handleChange("last_name", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("email", form.email)}
                </div>
              ) : (
                <Input
                  value={form.email ?? ""}
                  onChange={(e: any) => handleChange("email", e.target.value)}
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Mobile</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("mobile_number", form.mobile_number)}
                </div>
              ) : (
                <Input
                  value={form.mobile_number ?? ""}
                  onChange={(e: any) =>
                    handleChange("mobile_number", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Gender</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("gender", form.gender)}
                </div>
              ) : (
                <Input
                  value={form.gender ?? ""}
                  onChange={(e: any) => handleChange("gender", e.target.value)}
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Birthday</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("birthday", form.birthday)}
                </div>
              ) : (
                <Input
                  type="date"
                  value={form.birthday ?? ""}
                  onChange={(e: any) =>
                    handleChange("birthday", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Course</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {courses.find((c) => c.id === form.course_id)?.title ||
                    courses.find((c) => c.id === form.course_id)?.name ||
                    "-"}
                </div>
              ) : (
                <Select
                  value={form.course_id ?? ""}
                  onValueChange={(v) => handleChange("course_id", v || null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-xs">Status</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("status", form.status)}
                </div>
              ) : (
                <Select
                  value={form.status ?? ""}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-xs">Enrollment Date</Label>
              {readOnly ? (
                <div className="py-2 font-medium text-foreground">
                  {formatDisplayValue("enrollment_date", form.enrollment_date)}
                </div>
              ) : (
                <Input
                  type="date"
                  value={form.enrollment_date ?? ""}
                  onChange={(e: any) =>
                    handleChange("enrollment_date", e.target.value)
                  }
                  disabled={!editing}
                />
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <div className="flex items-center justify-end space-x-2 w-full">
            {readOnly ? (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                <FontAwesomeIcon icon={faTimes} className="mr-2" /> Close
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />{" "}
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
                <Button onClick={handleSave} disabled={!editing || saving}>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />{" "}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StudentRowModal;
