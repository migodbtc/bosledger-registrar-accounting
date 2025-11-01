import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faUser,
  faEdit,
  faGraduationCap,
  faCreditCard,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import {
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogFooter as ModalFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

const Profile = () => {
  const { userProfile, refreshProfile } = useAuth();

  // determine whether current session belongs to a student
  // Respect dev role override stored in sessionStorage (used by RoleSwitcherOverlay)
  const getEffectiveRole = () => {
    try {
      const override =
        typeof window !== "undefined"
          ? sessionStorage.getItem("devRoleOverride")
          : null;
      if (override) return String(override).toLowerCase();
    } catch (err) {
      console.error("Error reading role override from sessionStorage", err);
    }
    return String(userProfile?.role ?? "").toLowerCase();
  };

  const effectiveRole = getEffectiveRole();

  const isStudent = Boolean(
    (effectiveRole && effectiveRole === "student") ||
      Boolean(userProfile?.role === "student")
  );

  // Local editable state initialized from userProfile
  const [first_name, setFirstName] = useState("");
  const [middle_name, setMiddleName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [student_number, setStudentNumber] = useState("");
  const [role, setRole] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [mobile_number, setMobileNumber] = useState("");
  const [street_address, setStreetAddress] = useState("");
  const [country, setCountry] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [civil_status, setCivilStatus] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  // Father information
  const [father_last_name, setFatherLastName] = useState("");
  const [father_first_name, setFatherFirstName] = useState("");
  const [father_middle_name, setFatherMiddleName] = useState("");
  const [father_residential_address, setFatherResidentialAddress] =
    useState("");
  const [father_citizenship, setFatherCitizenship] = useState("");
  const [father_email, setFatherEmail] = useState("");
  const [father_mobile_number, setFatherMobileNumber] = useState("");
  const [father_landline_number, setFatherLandlineNumber] = useState("");
  // Mother information
  const [mother_last_name, setMotherLastName] = useState("");
  const [mother_first_name, setMotherFirstName] = useState("");
  const [mother_middle_name, setMotherMiddleName] = useState("");
  const [mother_residential_address, setMotherResidentialAddress] =
    useState("");
  const [mother_citizenship, setMotherCitizenship] = useState("");
  const [mother_email, setMotherEmail] = useState("");
  const [mother_mobile_number, setMotherMobileNumber] = useState("");
  const [mother_landline_number, setMotherLandlineNumber] = useState("");

  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setFirstName(userProfile.first_name ?? "");
    setMiddleName(userProfile.middle_name ?? "");
    setLastName(userProfile.last_name ?? "");
    setEmail(userProfile.email ?? "");
    setStudentNumber(userProfile.student_number ?? "");
    setRole(userProfile.role ?? "");
    // student_profile may be nested
    const sp = Array.isArray(userProfile.student_profile)
      ? userProfile.student_profile[0]
      : userProfile.student_profile;
    if (sp) {
      setProgram(sp.course_id ?? "");
      setEnrollmentStatus(sp.status ?? "");
    }
    setMobileNumber(userProfile.mobile_number ?? "");
    setStreetAddress(userProfile.street_address ?? "");
    setCountry(userProfile.country ?? "");
    setCitizenship(userProfile.citizenship ?? "");
    setCivilStatus(userProfile.civil_status ?? "");
    setBirthday(userProfile.birthday ?? "");
    setGender(userProfile.gender ?? "");
    setBalance((userProfile as any).balance ?? null);
    // father
    setFatherLastName(userProfile.father_last_name ?? "");
    setFatherFirstName(userProfile.father_first_name ?? "");
    setFatherMiddleName(userProfile.father_middle_name ?? "");
    setFatherResidentialAddress(userProfile.father_residential_address ?? "");
    setFatherCitizenship(userProfile.father_citizenship ?? "");
    setFatherEmail(userProfile.father_email ?? "");
    setFatherMobileNumber(userProfile.father_mobile_number ?? "");
    setFatherLandlineNumber(userProfile.father_landline_number ?? "");
    // mother
    setMotherLastName(userProfile.mother_last_name ?? "");
    setMotherFirstName(userProfile.mother_first_name ?? "");
    setMotherMiddleName(userProfile.mother_middle_name ?? "");
    setMotherResidentialAddress(userProfile.mother_residential_address ?? "");
    setMotherCitizenship(userProfile.mother_citizenship ?? "");
    setMotherEmail(userProfile.mother_email ?? "");
    setMotherMobileNumber(userProfile.mother_mobile_number ?? "");
    setMotherLandlineNumber(userProfile.mother_landline_number ?? "");
    // take a lightweight snapshot of the original values to compare on Review
    setInitialValues({
      first_name: userProfile.first_name ?? "",
      middle_name: userProfile.middle_name ?? "",
      last_name: userProfile.last_name ?? "",
      email: userProfile.email ?? "",
      student_number: userProfile.student_number ?? "",
      mobile_number: userProfile.mobile_number ?? "",
      birthday: userProfile.birthday ?? "",
      gender: userProfile.gender ?? "",
      civil_status: userProfile.civil_status ?? "",
      street_address: userProfile.street_address ?? "",
      country: userProfile.country ?? "",
      citizenship: userProfile.citizenship ?? "",
      father_last_name: userProfile.father_last_name ?? "",
      father_first_name: userProfile.father_first_name ?? "",
      father_middle_name: userProfile.father_middle_name ?? "",
      father_residential_address: userProfile.father_residential_address ?? "",
      father_citizenship: userProfile.father_citizenship ?? "",
      father_email: userProfile.father_email ?? "",
      father_mobile_number: userProfile.father_mobile_number ?? "",
      father_landline_number: userProfile.father_landline_number ?? "",
      mother_last_name: userProfile.mother_last_name ?? "",
      mother_first_name: userProfile.mother_first_name ?? "",
      mother_middle_name: userProfile.mother_middle_name ?? "",
      mother_residential_address: userProfile.mother_residential_address ?? "",
      mother_citizenship: userProfile.mother_citizenship ?? "",
      mother_email: userProfile.mother_email ?? "",
      mother_mobile_number: userProfile.mother_mobile_number ?? "",
      mother_landline_number: userProfile.mother_landline_number ?? "",
    });
    // fetch current enrollment's enlisted subjects and academic info
    if (!sp || !sp.id) return;
  }, [userProfile]);

  // fetch balances for this student's profile and compute total due (inspired by MyBalances.tsx)
  useEffect(() => {
    const fetchBalances = async () => {
      if (!userProfile) return;
      // only fetch balances for student profiles
      if (!isStudent) {
        setBalance(null);
        return;
      }
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        const { data, error } = await supabase
          .from("balances")
          .select("*")
          .eq("student_profile_id", sp.id);
        if (error) {
          console.error("Error fetching balances for profile:", error);
          setBalance(null);
        } else {
          const rows = (data ?? []) as any[];
          const sum = rows.reduce(
            (acc: number, b: any) => acc + (Number(b.amount_due) || 0),
            0
          );
          setBalance(sum);
        }
      } catch (err) {
        console.error("Error computing profile balance:", err);
        setBalance(null);
      }
    };

    fetchBalances();
  }, [userProfile]);

  const navigate = useNavigate();

  // modal open state for editing profile
  const [editOpen, setEditOpen] = useState(false);
  // modal pagination state (1-based index)
  const [modalStep, setModalStep] = useState(1);

  // snapshot of initial values (used for review comparison)
  const [initialValues, setInitialValues] = useState<Record<string, string>>(
    {}
  );

  const stepTitles = [
    "Personal (1)",
    "Personal (2)",
    "Father",
    "Mother",
    "Review",
  ];

  // reset to first step when opening
  useEffect(() => {
    if (editOpen) setModalStep(1);
  }, [editOpen]);

  const [savingProfile, setSavingProfile] = useState(false);

  // helper to display values in Title Case for nicer UI (e.g. 'male' -> 'Male')
  const titleCase = (v?: string) => {
    if (!v) return "";
    return v
      .toString()
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  // reusable renderer for whole profile form/cards.
  // When `editable` is false it will render static text.
  // When `editable` is true and `step` is provided (>0) the renderer will
  // only render the requested page (so the modal can paginate). If `step` is
  // 0 (default) it renders the full form (used for page view).
  const RenderProfileForm = ({
    editable,
    step = 0,
  }: {
    editable: boolean;
    step?: number;
  }) => (
    <>
      <div className={editable ? "space-y-2" : "space-y-4"}>
        {/* Personal - part 1 (names, email, student number) */}
        {(step === 0 || step === 1) && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  {editable ? (
                    <Input
                      id="first_name"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {first_name || "—"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Middle Name</Label>
                  {editable ? (
                    <Input
                      id="middle_name"
                      value={middle_name}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {middle_name || "—"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  {editable ? (
                    <Input
                      id="last_name"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {last_name || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <Label className="text-muted-foreground">Email Address</Label>
                  {editable ? (
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {email || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Student Number
                  </Label>
                  {editable ? (
                    <Input
                      id="student_number"
                      value={student_number}
                      className="mt-1 py-1"
                      disabled
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {student_number || "—"}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal - part 2 (contacts, demographics, address) */}
        {(step === 0 || step === 2) && (
          <Card className="shadow-soft mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-primary" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Mobile Number</Label>
                  {editable ? (
                    <Input
                      id="mobile_number"
                      value={mobile_number}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {mobile_number || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Birthday</Label>
                  {editable ? (
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {birthday || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  {editable ? (
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {gender ? titleCase(gender) : "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Civil Status</Label>
                  {editable ? (
                    <Input
                      id="civil_status"
                      value={civil_status}
                      onChange={(e) => setCivilStatus(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {civil_status ? titleCase(civil_status) : "—"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Street Address</Label>
                {editable ? (
                  <Input
                    id="street_address"
                    value={street_address}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="mt-1 py-1"
                  />
                ) : (
                  <div className="mt-1 font-medium text-black text-sm">
                    {street_address || "—"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  {editable ? (
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {country || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Citizenship</Label>
                  {editable ? (
                    <Input
                      id="citizenship"
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                      className="mt-1 py-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black text-sm">
                      {citizenship || "—"}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Father Information */}
        {(step === 0 || step === 3) && (
          <Card className="shadow-soft mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-primary" />
                Father Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  {editable ? (
                    <Input
                      id="father_last_name"
                      value={father_last_name}
                      onChange={(e) => setFatherLastName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_last_name || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  {editable ? (
                    <Input
                      id="father_first_name"
                      value={father_first_name}
                      onChange={(e) => setFatherFirstName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_first_name || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Middle Name</Label>
                  {editable ? (
                    <Input
                      id="father_middle_name"
                      value={father_middle_name}
                      onChange={(e) => setFatherMiddleName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_middle_name || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">
                    Residential Address
                  </Label>
                  {editable ? (
                    <Input
                      id="father_residential_address"
                      value={father_residential_address}
                      onChange={(e) =>
                        setFatherResidentialAddress(e.target.value)
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_residential_address || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Citizenship</Label>
                  {editable ? (
                    <Input
                      id="father_citizenship"
                      value={father_citizenship}
                      onChange={(e) => setFatherCitizenship(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_citizenship || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  {editable ? (
                    <Input
                      id="father_email"
                      value={father_email}
                      onChange={(e) => setFatherEmail(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_email || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Mobile Number</Label>
                  {editable ? (
                    <Input
                      id="father_mobile_number"
                      value={father_mobile_number}
                      onChange={(e) => setFatherMobileNumber(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_mobile_number || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Landline</Label>
                  {editable ? (
                    <Input
                      id="father_landline_number"
                      value={father_landline_number}
                      onChange={(e) => setFatherLandlineNumber(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {father_landline_number || "—"}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mother Information */}
        {(step === 0 || step === 4) && (
          <Card className="shadow-soft mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-primary" />
                Mother Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  {editable ? (
                    <Input
                      id="mother_last_name"
                      value={mother_last_name}
                      onChange={(e) => setMotherLastName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_last_name || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  {editable ? (
                    <Input
                      id="mother_first_name"
                      value={mother_first_name}
                      onChange={(e) => setMotherFirstName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_first_name || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Middle Name</Label>
                  {editable ? (
                    <Input
                      id="mother_middle_name"
                      value={mother_middle_name}
                      onChange={(e) => setMotherMiddleName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_middle_name || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">
                    Residential Address
                  </Label>
                  {editable ? (
                    <Input
                      id="mother_residential_address"
                      value={mother_residential_address}
                      onChange={(e) =>
                        setMotherResidentialAddress(e.target.value)
                      }
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_residential_address || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Citizenship</Label>
                  {editable ? (
                    <Input
                      id="mother_citizenship"
                      value={mother_citizenship}
                      onChange={(e) => setMotherCitizenship(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_citizenship || "—"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  {editable ? (
                    <Input
                      id="mother_email"
                      value={mother_email}
                      onChange={(e) => setMotherEmail(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_email || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Mobile Number</Label>
                  {editable ? (
                    <Input
                      id="mother_mobile_number"
                      value={mother_mobile_number}
                      onChange={(e) => setMotherMobileNumber(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_mobile_number || "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Landline</Label>
                  {editable ? (
                    <Input
                      id="mother_landline_number"
                      value={mother_landline_number}
                      onChange={(e) => setMotherLandlineNumber(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-black">
                      {mother_landline_number || "—"}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review step (modal step 5) - dynamic diff list */}
        {step === 5 && (
          <div className="mt-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Review Changes</CardTitle>
              </CardHeader>
              <CardContent className="p-3 max-h-[48vh] overflow-y-auto">
                {/* build a list of fields and only render those that changed */}
                {(() => {
                  const fieldLabels: Record<string, string> = {
                    first_name: "First name",
                    middle_name: "Middle name",
                    last_name: "Last name",
                    email: "Email",
                    student_number: "Student number",
                    mobile_number: "Mobile number",
                    birthday: "Birthday",
                    gender: "Gender",
                    civil_status: "Civil status",
                    street_address: "Street address",
                    country: "Country",
                    citizenship: "Citizenship",
                    father_last_name: "Father - Last name",
                    father_first_name: "Father - First name",
                    father_middle_name: "Father - Middle name",
                    father_residential_address: "Father - Address",
                    father_citizenship: "Father - Citizenship",
                    father_email: "Father - Email",
                    father_mobile_number: "Father - Mobile",
                    father_landline_number: "Father - Landline",
                    mother_last_name: "Mother - Last name",
                    mother_first_name: "Mother - First name",
                    mother_middle_name: "Mother - Middle name",
                    mother_residential_address: "Mother - Address",
                    mother_citizenship: "Mother - Citizenship",
                    mother_email: "Mother - Email",
                    mother_mobile_number: "Mother - Mobile",
                    mother_landline_number: "Mother - Landline",
                  };

                  const current: Record<string, string> = {
                    first_name,
                    middle_name,
                    last_name,
                    email,
                    student_number,
                    mobile_number,
                    birthday,
                    gender,
                    civil_status,
                    street_address,
                    country,
                    citizenship,
                    father_last_name,
                    father_first_name,
                    father_middle_name,
                    father_residential_address,
                    father_citizenship,
                    father_email,
                    father_mobile_number,
                    father_landline_number,
                    mother_last_name,
                    mother_first_name,
                    mother_middle_name,
                    mother_residential_address,
                    mother_citizenship,
                    mother_email,
                    mother_mobile_number,
                    mother_landline_number,
                  };

                  const changes: Array<{
                    key: string;
                    label: string;
                    before: string;
                    after: string;
                  }> = [];
                  for (const key of Object.keys(fieldLabels)) {
                    const before = (initialValues[key] ?? "").toString();
                    const after = (current[key] ?? "").toString();
                    if (before !== after) {
                      changes.push({
                        key,
                        label: fieldLabels[key],
                        before,
                        after,
                      });
                    }
                  }

                  if (changes.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        No changes detected.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {changes.map((c) => (
                        <div key={c.key} className="p-2 bg-muted/40 rounded">
                          <div className="text-xs text-muted-foreground">
                            {c.label}
                          </div>
                          <div className="flex items-start gap-4 mt-1">
                            <div className="text-xs text-muted-foreground w-1/2">
                              Previous
                              <div className="font-medium text-sm text-muted-foreground mt-1">
                                {c.key === "gender" || c.key === "civil_status"
                                  ? titleCase(c.before) || "—"
                                  : c.before || "—"}
                              </div>
                            </div>
                            <div className="text-xs w-1/2">
                              Current
                              <div className="font-medium text-sm text-black mt-1">
                                {c.key === "gender" || c.key === "civil_status"
                                  ? titleCase(c.after) || "—"
                                  : c.after || "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );

  // recent payments will be fetched from Supabase for the student's profile
  useEffect(() => {
    const fetchRecentPayments = async () => {
      if (!userProfile) return;
      if (!isStudent) {
        setPayments([]);
        return;
      }
      const sp = Array.isArray(userProfile.student_profile)
        ? userProfile.student_profile[0]
        : userProfile.student_profile;
      if (!sp || !sp.id) return;

      try {
        setLoadingPayments(true);
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("student_profile_id", sp.id)
          .order("payment_date", { ascending: false })
          .range(0, 3);
        if (error) {
          console.error("Error fetching recent payments:", error);
          setPayments([]);
        } else {
          setPayments((data ?? []) as any[]);
        }
      } catch (err) {
        console.error("Error loading recent payments:", err);
        setPayments([]);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchRecentPayments();
  }, [userProfile]);

  return (
    <DashboardLayout
      title="Profile Settings"
      subtitle="Manage your account information and preferences"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full hypatia-gradient-bg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faUser}
                className="text-white text-lg sm:text-2xl"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{`${first_name} ${middle_name} ${last_name}`}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {student_number}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            className="hypatia-gradient-bg w-full sm:w-auto"
            onClick={() => setEditOpen(true)}
          >
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Edit Profile Modal — reuses the same form but in editable mode (paginated) */}
        <Modal open={editOpen} onOpenChange={(v) => setEditOpen(v)}>
          <ModalContent className="max-w-2xl overflow-hidden rounded-lg">
            <ModalHeader>
              <div className="w-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faSave} />
                  </div>
                  <ModalTitle className="text-lg">Edit Profile</ModalTitle>
                </div>

                {/* Stepper indicator */}
                <div className="flex items-center gap-3 px-1">
                  {stepTitles.map((t, i) => {
                    const idx = i + 1;
                    const active = modalStep === idx;
                    const done = modalStep > idx;
                    return (
                      <div className="flex items-center w-full" key={t}>
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                            active || done
                              ? "hypatia-gradient-bg text-white"
                              : "bg-muted/20 text-muted-foreground border"
                          }`}
                          aria-current={active ? "step" : undefined}
                        >
                          {idx}
                        </div>

                        {i < stepTitles.length - 1 && (
                          <div
                            className={`flex-1 h-1 mx-2 rounded ${
                              modalStep > idx
                                ? "hypatia-gradient-bg"
                                : "bg-muted/30"
                            }`}
                            aria-hidden
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ModalHeader>

            {/* inner scroll container is clipped by ModalContent's overflow-hidden so scrollbar stays inside rounded corners */}
            <div className="p-0">
              <div className="p-3 max-h-[72vh] overflow-y-auto pr-4">
                {RenderProfileForm({ editable: true, step: modalStep })}
              </div>
            </div>

            <ModalFooter>
              <div className="w-full flex items-center">
                <div className="flex-1 flex items-left justify-start">
                  {/* Page indicator centered */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">
                      {modalStep} / {stepTitles.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stepTitles[modalStep - 1]}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-end space-x-2">
                  {/* Prev on the right group */}
                  <Button
                    variant="outline"
                    className="w-28"
                    disabled={modalStep <= 1}
                    onClick={() => setModalStep((s) => Math.max(1, s - 1))}
                  >
                    Prev
                  </Button>

                  {/* Next (or Save on final step) */}
                  {modalStep < stepTitles.length ? (
                    <Button
                      variant="outline"
                      className="w-28"
                      onClick={() =>
                        setModalStep((s) => Math.min(stepTitles.length, s + 1))
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        // persist changed profile fields to Supabase
                        if (!userProfile || !userProfile.id) {
                          // fallback: just close
                          setEditOpen(false);
                          return;
                        }
                        setSavingProfile(true);
                        try {
                          const payload: Record<string, any> = {
                            first_name,
                            middle_name,
                            last_name,
                            email,
                            mobile_number,
                            birthday,
                            gender,
                            civil_status,
                            street_address,
                            country,
                            citizenship,
                            father_last_name,
                            father_first_name,
                            father_middle_name,
                            father_residential_address,
                            father_citizenship,
                            father_email,
                            father_mobile_number,
                            father_landline_number,
                            mother_last_name,
                            mother_first_name,
                            mother_middle_name,
                            mother_residential_address,
                            mother_citizenship,
                            mother_email,
                            mother_mobile_number,
                            mother_landline_number,
                          };

                          // Only send keys that actually changed compared to initialValues
                          const changed: Record<string, any> = {};
                          for (const k of Object.keys(payload)) {
                            const before = (initialValues[k] ?? "").toString();
                            const after = (payload as any)[k] ?? "";
                            if (String(after) !== String(before)) {
                              changed[k] = after;
                            }
                          }

                          // if nothing changed just close
                          if (Object.keys(changed).length === 0) {
                            setEditOpen(false);
                            setSavingProfile(false);
                            return;
                          }

                          const { error } = await supabase
                            .from("users")
                            .update(changed)
                            .eq("id", userProfile.id);
                          if (error) throw error;

                          // refresh the global profile and update snapshot
                          await refreshProfile();
                          setInitialValues((prev) => ({ ...prev, ...changed }));
                          // show success and close modal
                          const { toast } = await import(
                            "@/components/ui/use-toast"
                          );
                          toast({
                            title: "Saved",
                            description: "Profile updated.",
                          });
                          setEditOpen(false);
                        } catch (err) {
                          const { toast } = await import(
                            "@/components/ui/use-toast"
                          );
                          toast({
                            title: "Error",
                            description: String((err as any)?.message ?? err),
                            variant: "destructive",
                          });
                          console.error("Error saving profile:", err);
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                    >
                      {savingProfile ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <div
          className={`grid grid-cols-1 ${
            isStudent ? "lg:grid-cols-3" : "lg:grid-cols-1"
          } gap-6`}
        >
          {/* Personal Information */}
          <div className={isStudent ? "lg:col-span-2" : "lg:col-span-1"}>
            {/* Render the non-editable form on the page; the modal will render editable=true */}
            {RenderProfileForm({ editable: false })}
          </div>

          {/* Financial Information Sidebar (only visible for students) */}
          {isStudent && (
            <div className="space-y-6">
              {/* Balance Card */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FontAwesomeIcon
                      icon={faMoneyBill}
                      className="text-primary"
                    />
                    Account Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {typeof balance === "number"
                        ? `₱${balance.toLocaleString()}`
                        : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Outstanding Balance
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/my/payments")}
                    >
                      <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                      Pay Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FontAwesomeIcon
                      icon={faCreditCard}
                      className="text-primary"
                    />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loadingPayments && (
                      <div className="p-3 text-sm text-muted-foreground">
                        Loading...
                      </div>
                    )}

                    {!loadingPayments && payments.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">
                        No recent payments
                      </div>
                    )}

                    {!loadingPayments &&
                      payments.map((payment: any, index: number) => (
                        <div
                          key={payment.id ?? index}
                          className="p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                ₱
                                {(
                                  Number(payment.amount_paid) ||
                                  Number(payment.amount) ||
                                  0
                                ).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.description ||
                                  payment.reason ||
                                  "Payment"}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {payment.payment_date
                                ? new Date(
                                    payment.payment_date
                                  ).toLocaleDateString()
                                : payment.created_at
                                ? new Date(
                                    payment.created_at
                                  ).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                          <p className="text-xs text-primary mt-1">
                            {payment.reference || payment.id || "-"}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
