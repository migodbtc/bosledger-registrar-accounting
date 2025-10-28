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
import { supabase } from "@/utils/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faLockOpen,
  faSave,
  faTrash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

type EntityType =
  | "courses"
  | "subjects"
  | "enrollments"
  | "balances"
  | "payments";

type RowModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity: EntityType;
  row: any | null;
  onSaved?: () => void;
  onDeleted?: () => void;
  readOnly?: boolean;
};

const RowModal: React.FC<RowModalProps> = ({
  open,
  onOpenChange,
  entity,
  row,
  onSaved,
  onDeleted,
  readOnly = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setForm(row ? { ...row } : {});
    // when opening in readOnly mode, keep inputs locked
    setEditing(false);
    setSaving(false);
    setDeleting(false);
  }, [row, open]);

  const fields = useMemo(() => {
    switch (entity) {
      case "courses":
        return [
          { key: "name", label: "Course Code" },
          { key: "title", label: "Title" },
          { key: "years", label: "Years" },
          { key: "department", label: "Department" },
        ];
      case "subjects":
        return [
          { key: "subject_code", label: "Code" },
          { key: "subject_name", label: "Name" },
          { key: "units", label: "Units" },
          { key: "semester", label: "Semester" },
        ];
      case "enrollments":
        return [
          { key: "student_profile_id", label: "Student Profile ID" },
          { key: "course_id", label: "Course ID" },
          { key: "year_level", label: "Year Level" },
          { key: "semester", label: "Semester" },
          { key: "school_year", label: "School Year" },
          { key: "section", label: "Section" },
          { key: "status", label: "Status" },
        ];
      case "balances":
        return [
          { key: "student_profile_id", label: "Student Profile ID" },
          { key: "amount_due", label: "Amount Due" },
          { key: "due_date", label: "Due Date" },
        ];
      case "payments":
        return [
          { key: "student_profile_id", label: "Student Profile ID" },
          { key: "balance_id", label: "Balance ID" },
          { key: "amount_paid", label: "Amount Paid" },
          { key: "payment_date", label: "Payment Date" },
          { key: "payment_method", label: "Payment Method" },
          { key: "reference_number", label: "Reference Number" },
        ];
      default:
        return [];
    }
  }, [entity]);

  const handleChange = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!row) return;
    setSaving(true);
    try {
      const payload: any = {};
      fields.forEach((f) => {
        // only send changed fields
        if (String(form[f.key]) !== String(row[f.key]))
          payload[f.key] = form[f.key];
      });

      if (Object.keys(payload).length === 0) {
        // nothing to save
        setEditing(false);
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from(entity)
        .update(payload)
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Changes saved successfully." });
      onSaved && onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: String((err as any)?.message ?? err),
        variant: "destructive",
      });
      console.error("Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!row) return;
    if (
      !confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    )
      return;
    setDeleting(true);
    try {
      const { error } = await supabase.from(entity).delete().eq("id", row.id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Record deleted successfully." });
      onDeleted && onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: String((err as any)?.message ?? err),
        variant: "destructive",
      });
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!row) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            {entity.charAt(0).toUpperCase() + entity.slice(1, -1)} Details
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? "This is a read-only view. Editing and deletion are not available here."
                : "You can view or edit this record. Unlock inputs to make changes; saving will overwrite the changed fields only."}
            </p>
            <div className="flex items-center space-x-2 ml-2">
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
            {fields.map((f) => {
              const isIdField = /id/i.test(f.key);
              const disabled = readOnly || !editing || isIdField;
              return (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={form[f.key] ?? ""}
                    onChange={(e: any) => handleChange(f.key, e.target.value)}
                    disabled={disabled}
                  />
                  {isIdField && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This ID field cannot be edited from the UI.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!readOnly && (
            <div className="text-sm text-muted-foreground">
              Editing will only overwrite the fields you change. If you leave a
              field untouched it will remain as-is in the database.
            </div>
          )}
        </div>

        <ModalFooter>
          <div className="flex items-center justify-end space-x-2 w-full">
            {readOnly ? (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
                <Button onClick={handleSave} disabled={!editing || saving}>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
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

export default RowModal;
