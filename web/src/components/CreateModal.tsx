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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faArrowRight } from "@fortawesome/free-solid-svg-icons";

type EntityType =
  | "enrollments"
  | "payments"
  | "students"
  | "courses"
  | "subjects";

type CreateModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity: EntityType;
  onCreated?: () => void;
};

// A friendly, multi-step creation modal used for enrollments and payments.
// It's intentionally non-technical and focuses on a modern UX: stepper, simple selects, and review screen.
const CreateModal: React.FC<CreateModalProps> = ({
  open,
  onOpenChange,
  entity,
  onCreated,
}) => {
  const { userProfile } = useAuth();
  const sp = useMemo(() => {
    if (!userProfile) return null;
    return Array.isArray(userProfile.student_profile)
      ? userProfile.student_profile[0]
      : userProfile.student_profile;
  }, [userProfile]);

  // current academic year range for non-admin students (immutable)
  const academicYearRange = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }, []);

  // stepper: 1 = details, 2 = review
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // enrollment fields
  const [courseId, setCourseId] = useState<string | null>(null);
  const [yearLevel, setYearLevel] = useState<string>("1");
  const [semester, setSemester] = useState<string>("1");
  const [schoolYear, setSchoolYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [section, setSection] = useState<string>("A");
  const [status, setStatus] = useState<string>("pending");
  // admin-specific enrollment: optional student_profile selection
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);

  // payment fields
  const [balanceId, setBalanceId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [courses, setCourses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  // admin helper lists
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);

  // course creation fields
  const [courseName, setCourseName] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseYears, setCourseYears] = useState<number>(4);
  const [courseDepartment, setCourseDepartment] = useState<string>("");

  // subject creation fields
  const [subjectCode, setSubjectCode] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("");
  const [subjectUnits, setSubjectUnits] = useState<number>(3);
  const [subjectSemester, setSubjectSemester] = useState<string>("1");

  // student creation fields
  const [studentNumber, setStudentNumber] = useState<string>("");
  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string>("");

  useEffect(() => {
    // If the signed-in user has a student profile, make it the default and
    // treat the student as immutable in the creation modal (no dropdown).
    if (sp && sp.id) {
      setStudentProfileId(sp.id);
    }

    // preload helper data to make the UX smooth
    const fetch = async () => {
      try {
        // include `years` so we can limit year-level choices per course
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id,name,title,years")
          .limit(200);
        setCourses(coursesData ?? []);
      } catch (err) {
        console.warn("Could not preload courses", err);
      }

      // preload student profiles for admin creation flows
      try {
        const { data: spData } = await supabase
          .from("student_profile")
          .select("id,users(id,student_number,first_name,last_name,email)")
          .limit(500);
        setStudentProfiles(spData ?? []);
      } catch (err) {
        console.warn("Could not preload student profiles", err);
      }

      if (sp && sp.id) {
        try {
          const { data: balancesData } = await supabase
            .from("balances")
            .select("id,amount_due")
            .eq("student_profile_id", sp.id)
            .limit(200);
          setBalances(balancesData ?? []);
          // if this modal is for payments and there's at least one balance, default to the first
          if (
            entity === "payments" &&
            balancesData &&
            balancesData.length > 0
          ) {
            setBalanceId(balancesData[0].id);
          }
        } catch (err) {
          console.warn("Could not preload balances", err);
        }
      }
    };
    fetch();
  }, [sp]);

  useEffect(() => {
    if (!open) {
      // reset when closed
      setStep(1);
      setCourseId(null);
      setYearLevel("1");
      setSemester("1");
      setSchoolYear(new Date().getFullYear().toString());
      setSection("");
      setStatus("pending");
      setBalanceId(balances.length > 0 ? balances[0].id : null);
      setAmountPaid("");
      setPaymentMethod("cash");
      setReferenceNumber("");
      setReason("");
    } else {
      // when opening the modal, ensure paymentDate is set to today
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  // whenever balances change, ensure a default for payments
  useEffect(() => {
    if (entity === "payments") {
      if (!balanceId && balances.length > 0) {
        setBalanceId(balances[0].id);
      }
    }
  }, [balances, entity]);

  // clamp year level when course changes
  useEffect(() => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    const maxYears = (course && Number(course.years)) || 4;
    const yl = Number(yearLevel) || 1;
    if (yl > maxYears) setYearLevel(String(maxYears));
    if (yl < 1) setYearLevel("1");
  }, [courseId, courses]);

  // helper to reset inputs without closing the modal
  const resetInputs = () => {
    setStep(1);
    setCourseId(null);
    setYearLevel("1");
    setSemester("1");
    setSchoolYear(new Date().getFullYear().toString());
    setSection("A");
    setStatus("pending");
    setBalanceId(balances.length > 0 ? balances[0].id : null);
    setAmountPaid("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setReason("");
  };

  // compute selected balance amount and validate amountPaid against it
  const selectedBalanceAmount = useMemo(() => {
    const b = balances.find((bb) => bb.id === balanceId);
    return b ? Number(b.amount_due) : null;
  }, [balances, balanceId]);

  const amountPaidNum = useMemo(() => Number(amountPaid || 0), [amountPaid]);

  const amountWithinBalance = useMemo(() => {
    // if there's no selected balance, allow any amount (server-side should validate further)
    if (selectedBalanceAmount === null || selectedBalanceAmount === undefined)
      return true;
    return amountPaidNum <= selectedBalanceAmount;
  }, [selectedBalanceAmount, amountPaidNum]);

  // Placeholder for transaction handling: update the associated balance after a payment is recorded.
  // TODO: implement actual transactional logic (e.g., DB transaction, ledger entries, notifications)
  const updateAssociatedBalanceTransaction = async (
    paymentId: string | number | null,
    balanceIdParam: string | null,
    paidAmount: number
  ) => {
    // Safely update the associated balance after a payment is created.
    // Steps:
    // 1) Verify the balance exists in the DB
    // 2) Validate paidAmount is positive and does not exceed current amount_due
    // 3) Update the balance.amount_due = amount_due - paidAmount
    // NOTE: For full transactional safety you should implement this as a DB-side
    // transaction (stored procedure / RPC). This client-side flow attempts to
    // be defensive and surfaces errors cleanly.
    if (!balanceIdParam) {
      // nothing to do
      return true;
    }

    try {
      // 1) fetch balance
      const { data: balanceRow, error: fetchErr } = await supabase
        .from("balances")
        .select("id, amount_due")
        .eq("id", balanceIdParam)
        .single();
      if (fetchErr) {
        console.error("Failed to fetch balance", fetchErr);
        throw fetchErr;
      }
      if (!balanceRow) {
        throw new Error("Associated balance not found");
      }

      const currentDue = Number(balanceRow.amount_due || 0);
      const paid = Number(paidAmount || 0);

      // 2) validate
      if (paid <= 0) {
        throw new Error("Invalid paid amount");
      }
      if (paid > currentDue) {
        // This should have been caught earlier on the client; double-check here
        throw new Error("Paid amount exceeds balance amount_due");
      }

      const newDue = Number((currentDue - paid).toFixed(2));

      // 3) update the balance row
      const { data: updated, error: updateErr } = await supabase
        .from("balances")
        .update({ amount_due: newDue, updated_at: new Date().toISOString() })
        .eq("id", balanceIdParam)
        .select("id, amount_due")
        .single();

      if (updateErr) {
        console.error("Failed to update balance", updateErr);
        throw updateErr;
      }

      // Optionally, you could insert an audit/log row linking paymentId -> balance here.
      return true;
    } catch (e) {
      console.error("updateAssociatedBalanceTransaction error:", e);
      // bubble up so callers can decide how to handle failure
      throw e;
    }
  };

  const canProceed = useMemo(() => {
    if (entity === "enrollments") {
      // require a selected course and a year level within the course's allowed years
      // allow either a signed-in student profile (sp) or an admin-selected studentProfileId
      if (!(sp || studentProfileId) || !courseId) return false;
      const course = courses.find((c) => c.id === courseId);
      const maxYears = (course && Number(course.years)) || 4;
      const yl = Number(yearLevel) || 1;
      return yl >= 1 && yl <= maxYears;
    }
    // for payments require an associated balance and an amount
    // if the user has balances, ensure we have linked one; otherwise allow payment without balances
    if (balances.length > 0) {
      // require signed-in student, amount, a linked balance, and that the amount
      // does not exceed the selected balance's amount_due
      return !!sp && !!amountPaid && !!balanceId && amountWithinBalance;
    }
    // if no balances are present, allow payment as long as there's a student and an amount
    return !!sp && !!amountPaid && amountWithinBalance;
  }, [entity, sp, courseId, amountPaid]);

  const handleSubmit = async () => {
    // Admin flows may not require the current signed-in student profile.
    // For student- or payment-specific creation when a student profile is needed,
    // prefer using the selected `studentProfileId` (admin) or the signed-in `sp`.
    const targetProfileId = studentProfileId || sp?.id;
    if ((entity === "enrollments" || entity === "payments") && !targetProfileId)
      return toast({
        title: "No student",
        description:
          "You must select or be signed in as a student to create this record.",
        variant: "destructive",
      });
    setSubmitting(true);
    try {
      if (entity === "enrollments") {
        // turn numbers for year level and semester into strings
        // year level string should be 1st Year, 2nd Year, etc up to 5th Year
        // semester string should be 1st Semester, 2nd Semester
        const year_level_string = (() => {
          const n = Number(yearLevel) || 1;
          const suffix =
            n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
          return `${n}${suffix} Year`;
        })();

        const semester_string =
          semester === "1" ? "1st Semester" : "2nd Semester";

        const payload = {
          student_profile_id: targetProfileId,
          course_id: courseId,
          year_level: year_level_string,
          semester: semester_string,
          // if signed-in student, enforce the immutable current academic year range
          school_year: sp && sp.id ? academicYearRange : schoolYear,
          section: section || null,
          status: status || "pending",
        } as any;

        const { error } = await supabase
          .from("enrollments")
          .insert(payload)
          .select("id");
        if (error) throw error;
      } else if (entity === "students") {
        // create student_profile and user record in users (minimal)
        // Note: in this project users and student_profile are related; here we insert a minimal student_profile row and rely on DB triggers or separate flows to create full user records.
        const payload = {
          // if your schema requires a users row first, handle that elsewhere; this creates only a student_profile entry
          // For now, try to create a users row and student_profile atomically if possible
          // We'll attempt to create a users record and then the student_profile
        } as any;
        // create users
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .insert({
            student_number: studentNumber,
            first_name: studentFirstName,
            last_name: studentLastName,
            email: studentEmail,
          })
          .select("id")
          .single();
        if (userErr) throw userErr;
        const userId = (userData as any)?.id;
        const { error: spErr } = await supabase
          .from("student_profile")
          .insert({ user_id: userId })
          .select();
        if (spErr) throw spErr;
      } else if (entity === "courses") {
        const payload = {
          name: courseName,
          title: courseTitle,
          years: courseYears,
          department: courseDepartment || null,
        } as any;
        const { error } = await supabase
          .from("courses")
          .insert(payload)
          .select("id");
        if (error) throw error;
      } else if (entity === "payments") {
        // Build payload without reference_number. Prefer DB-side auto-generation.
        const payload = {
          student_profile_id: targetProfileId,
          balance_id: balanceId || null,
          amount_paid: Number(amountPaid) || 0,
          payment_date: paymentDate || new Date().toISOString().slice(0, 10),
          payment_method: paymentMethod,
          reason: reason || null,
        } as any;

        // validate amount against balance before attempting insert
        if (!amountWithinBalance) {
          setSubmitting(false);
          return toast({
            title: "Invalid amount",
            description: "The payment amount cannot exceed the linked balance.",
            variant: "destructive",
          });
        }

        // Try insert without reference_number first. If DB requires it and
        // returns a NOT NULL / constraint error, generate a client-side
        // reference and retry once.
        let insertResult = await supabase
          .from("payments")
          .insert(payload)
          .select("id");

        if (insertResult.error) {
          const msg = String(
            (insertResult.error as any)?.message || ""
          ).toLowerCase();
          const needsRef =
            msg.includes("reference_number") ||
            msg.includes("not null") ||
            msg.includes("null value");
          if (needsRef) {
            const genRef = `REF-${Date.now()
              .toString(36)
              .toUpperCase()}-${Math.random()
              .toString(36)
              .slice(2, 8)
              .toUpperCase()}`;
            const payloadWithRef = {
              ...payload,
              reference_number: genRef,
            } as any;
            const retry = await supabase
              .from("payments")
              .insert(payloadWithRef)
              .select("id");
            if (retry.error) throw retry.error;
            insertResult = retry;
          } else {
            throw insertResult.error;
          }
        }

        // At this point the payment has been created. Optionally update linked balance.
        const createdId =
          insertResult.data && insertResult.data[0]
            ? insertResult.data[0].id
            : null;
        try {
          await updateAssociatedBalanceTransaction(
            createdId,
            balanceId,
            amountPaidNum
          );
        } catch (upErr) {
          console.warn(
            "Failed to update associated balance (placeholder)",
            upErr
          );
        }

        toast({
          title: "Created",
          description: `New ${entity.slice(0, -1)} created successfully.`,
        });
        onCreated && onCreated();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Create error:", err);
      toast({
        title: "Error",
        description: String((err as any)?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg hypatia-gradient-bg flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
            <ModalTitle className="text-lg">
              {entity === "enrollments"
                ? "Enroll in a Course"
                : "Record a Payment"}
            </ModalTitle>
          </div>
        </ModalHeader>

        <div className="p-4">
          {/* soft stepper indicator */}
          <div className="flex items-center mb-4">
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                step === 1
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Details
            </div>
            <div className="mx-2 text-muted-foreground">→</div>
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                step === 2
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Review
            </div>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entity === "enrollments" ? (
                <>
                  <div>
                    <Label>Course</Label>
                    <Select
                      value={courseId ?? ""}
                      onValueChange={(v) => setCourseId(v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Courses</SelectLabel>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title || c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Year Level</Label>
                    {(() => {
                      const course = courses.find((c) => c.id === courseId);
                      const maxYears = (course && Number(course.years)) || 4;
                      const options = Array.from({ length: maxYears }, (_, i) =>
                        String(i + 1)
                      );
                      return (
                        <Select
                          value={yearLevel}
                          onValueChange={(v) => setYearLevel(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Year Level</SelectLabel>
                              {options.map((o) => {
                                const n = Number(o);
                                const suffix = (n) =>
                                  n === 1
                                    ? "st"
                                    : n === 2
                                    ? "nd"
                                    : n === 3
                                    ? "rd"
                                    : "th";
                                return (
                                  <SelectItem key={o} value={o}>
                                    {`${o}${suffix(n)} Year`}
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>

                  <div>
                    <Label>School Year</Label>
                    {sp && sp.id ? (
                      <>
                        <div className="font-medium">{academicYearRange}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          School year is automatically set to the current
                          academic year and cannot be changed from this modal.
                        </p>
                      </>
                    ) : (
                      <Input
                        value={schoolYear}
                        onChange={(e: any) => setSchoolYear(e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Section</Label>
                    <Select
                      value={section || "A"}
                      onValueChange={(v) => setSection(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Section</SelectLabel>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={semester}
                      onValueChange={(v) => setSemester(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Semester</SelectLabel>
                          <SelectItem value="1">1st Semester</SelectItem>
                          <SelectItem value="2">2nd Semester</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {sp && sp.id ? (
                      <>
                        <Label>Student</Label>
                        <div className="font-medium">
                          {userProfile.first_name} {userProfile.middle_name[0]}.{" "}
                          {userProfile.last_name}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This record will be created for the signed-in student
                          and cannot be changed here.
                        </p>
                      </>
                    ) : (
                      <>
                        <Label>Student (admin)</Label>
                        <Select
                          value={studentProfileId ?? ""}
                          onValueChange={(v) => setStudentProfileId(v || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select student (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Students</SelectLabel>
                              {studentProfiles.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.users?.student_number} -{" "}
                                  {s.users?.first_name} {s.users?.last_name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  {/* status is forced to pending for new enrollments */}
                </>
              ) : entity === "payments" ? (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Linked Balance
                    </div>
                    <div className="font-medium">
                      {balances.length > 0
                        ? `₱ ${Number(
                            (
                              balances.find((b) => b.id === balanceId) ||
                              balances[0]
                            ).amount_due
                          ).toFixed(2)}`
                        : "No balances"}
                    </div>
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <Input
                      value={amountPaid}
                      onChange={(e: any) => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                    />
                    {!amountWithinBalance && (
                      <p className="text-xs text-destructive mt-1">
                        Amount exceeds the linked balance. Please enter a lower
                        amount.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Payment Date</Label>
                    {sp && sp.id ? (
                      <div className="mt-2">
                        <div className="text-sm font-medium">{paymentDate}</div>
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e: any) => setPaymentDate(e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Method</SelectLabel>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="credit_card">
                            Credit Card
                          </SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    {/* Reference numbers are autogenerated by the system/back-end when possible.
                        We don't show a reference input for normal flows to avoid users entering
                        potentially conflicting values. If the DB requires a reference and does
                        not auto-generate it, the client will attempt a single retry with a
                        generated reference. */}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Reason</Label>
                    <Input
                      className="mt-2"
                      value={reason}
                      onChange={(e: any) => setReason(e.target.value)}
                      placeholder="Optional reason or description"
                    />
                  </div>
                </>
              ) : entity === "students" ? (
                <>
                  <div>
                    <Label>Student Number</Label>
                    <Input
                      value={studentNumber}
                      onChange={(e: any) => setStudentNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={studentFirstName}
                      onChange={(e: any) => setStudentFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={studentLastName}
                      onChange={(e: any) => setStudentLastName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={studentEmail}
                      onChange={(e: any) => setStudentEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : entity === "courses" ? (
                <>
                  <div>
                    <Label>Course Code</Label>
                    <Input
                      value={courseName}
                      onChange={(e: any) => setCourseName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={courseTitle}
                      onChange={(e: any) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Years</Label>
                    <Input
                      type="number"
                      value={String(courseYears)}
                      onChange={(e: any) =>
                        setCourseYears(Number(e.target.value || 1))
                      }
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={courseDepartment}
                      onChange={(e: any) => setCourseDepartment(e.target.value)}
                    />
                  </div>
                </>
              ) : entity === "subjects" ? (
                <>
                  <div>
                    <Label>Subject Code</Label>
                    <Input
                      value={subjectCode}
                      onChange={(e: any) => setSubjectCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Subject Name</Label>
                    <Input
                      value={subjectName}
                      onChange={(e: any) => setSubjectName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Units</Label>
                    <Input
                      type="number"
                      value={String(subjectUnits)}
                      onChange={(e: any) =>
                        setSubjectUnits(Number(e.target.value || 0))
                      }
                    />
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={subjectSemester}
                      onValueChange={(v) => setSubjectSemester(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Semester</SelectLabel>
                          <SelectItem value="1">1st Semester</SelectItem>
                          <SelectItem value="2">2nd Semester</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Review</h3>
              {entity === "enrollments" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Course</div>
                    <div className="font-medium">
                      {(courses.find((c) => c.id === courseId) || {}).title ||
                        courseId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Year</div>
                    <div className="font-medium">
                      {(() => {
                        const n = Number(yearLevel) || 1;
                        const suffix =
                          n === 1
                            ? "st"
                            : n === 2
                            ? "nd"
                            : n === 3
                            ? "rd"
                            : "th";
                        return `${n}${suffix} Year`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Semester
                    </div>
                    <div className="font-medium">
                      {semester === "1" ? "1st Semester" : "2nd Semester"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      School Year
                    </div>
                    <div className="font-medium">{schoolYear}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Section</div>
                    <div className="font-medium">{section || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">{status}</div>
                  </div>
                  {studentProfileId && (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Student
                      </div>
                      <div className="font-medium">
                        {sp && studentProfileId === sp.id
                          ? `${sp.users?.student_number || sp.id} - ${
                              sp.users?.first_name || ""
                            } ${sp.users?.last_name || ""}`
                          : (
                              studentProfiles.find(
                                (s) => s.id === studentProfileId
                              ) || {}
                            ).users?.student_number || studentProfileId}
                      </div>
                    </div>
                  )}
                </div>
              ) : entity === "payments" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-medium">
                      ₱ {Number(amountPaid || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="font-medium">{paymentDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Method</div>
                    <div className="font-medium">{paymentMethod}</div>
                  </div>
                  {/* Reference removed from preview - managed by backend or stored separately */}
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">Reason</div>
                    <div className="font-medium">{reason || "-"}</div>
                  </div>
                </div>
              ) : entity === "students" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Student Number
                    </div>
                    <div className="font-medium">{studentNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">
                      {studentFirstName} {studentLastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium">{studentEmail || "-"}</div>
                  </div>
                </div>
              ) : entity === "courses" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Code</div>
                    <div className="font-medium">{courseName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Title</div>
                    <div className="font-medium">{courseTitle || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Years</div>
                    <div className="font-medium">{courseYears}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Department
                    </div>
                    <div className="font-medium">{courseDepartment || "-"}</div>
                  </div>
                </div>
              ) : entity === "subjects" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Code</div>
                    <div className="font-medium">{subjectCode || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">{subjectName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Units</div>
                    <div className="font-medium">{subjectUnits}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Semester
                    </div>
                    <div className="font-medium">{subjectSemester}</div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <div />
            <div className="flex items-center space-x-2">
              {step === 1 ? (
                <>
                  <Button variant="ghost" onClick={() => resetInputs()}>
                    Cancel
                  </Button>
                  <Button onClick={() => setStep(2)} disabled={!canProceed}>
                    Continue{" "}
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Creating..." : "Create"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateModal;
