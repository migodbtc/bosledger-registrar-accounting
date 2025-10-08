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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

const Profile = () => {
  const { userProfile } = useAuth();

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
    setFatherEmail(userProfile.father_email ?? "");
    setFatherMobileNumber(userProfile.father_mobile_number ?? "");
    setFatherLandlineNumber(userProfile.father_landline_number ?? "");
    // mother
    setMotherLastName(userProfile.mother_last_name ?? "");
    setMotherFirstName(userProfile.mother_first_name ?? "");
    setMotherMiddleName(userProfile.mother_middle_name ?? "");
    setMotherResidentialAddress(userProfile.mother_residential_address ?? "");
    setMotherEmail(userProfile.mother_email ?? "");
    setMotherMobileNumber(userProfile.mother_mobile_number ?? "");
    setMotherLandlineNumber(userProfile.mother_landline_number ?? "");
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
          <Button className="hypatia-gradient-bg w-full sm:w-auto">
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit Profile
          </Button>
        </div>

        <div
          className={`grid grid-cols-1 ${
            isStudent ? "lg:grid-cols-3" : "lg:grid-cols-1"
          } gap-6`}
        >
          {/* Personal Information */}
          <div className={isStudent ? "lg:col-span-2" : "lg:col-span-1"}>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={middle_name}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student_number">Student Number</Label>
                    <Input
                      id="student_number"
                      value={student_number}
                      className="mt-1"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      value={mobile_number}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 w-full border rounded-md px-2 py-1"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="civil_status">Civil Status</Label>
                    <Input
                      id="civil_status"
                      value={civil_status}
                      onChange={(e) => setCivilStatus(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    value={street_address}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Country and Citizenship in a single row (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="citizenship">Citizenship</Label>
                    <Input
                      id="citizenship"
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Father Information */}
            <Card className="shadow-soft mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-primary" />
                  Father Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="father_last_name">Last Name</Label>
                    <Input
                      id="father_last_name"
                      value={father_last_name}
                      onChange={(e) => setFatherLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="father_first_name">First Name</Label>
                    <Input
                      id="father_first_name"
                      value={father_first_name}
                      onChange={(e) => setFatherFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="father_middle_name">Middle Name</Label>
                    <Input
                      id="father_middle_name"
                      value={father_middle_name}
                      onChange={(e) => setFatherMiddleName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="father_residential_address">
                      Residential Address
                    </Label>
                    <Input
                      id="father_residential_address"
                      value={father_residential_address}
                      onChange={(e) =>
                        setFatherResidentialAddress(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="father_citizenship">Citizenship</Label>
                    <Input
                      id="father_citizenship"
                      value={father_citizenship}
                      onChange={(e) => setFatherCitizenship(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="father_email">Email</Label>
                    <Input
                      id="father_email"
                      value={father_email}
                      onChange={(e) => setFatherEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="father_mobile_number">Mobile Number</Label>
                    <Input
                      id="father_mobile_number"
                      value={father_mobile_number}
                      onChange={(e) => setFatherMobileNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="father_landline_number">Landline</Label>
                    <Input
                      id="father_landline_number"
                      value={father_landline_number}
                      onChange={(e) => setFatherLandlineNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mother Information */}
            <Card className="shadow-soft mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-primary" />
                  Mother Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mother_last_name">Last Name</Label>
                    <Input
                      id="mother_last_name"
                      value={mother_last_name}
                      onChange={(e) => setMotherLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_first_name">First Name</Label>
                    <Input
                      id="mother_first_name"
                      value={mother_first_name}
                      onChange={(e) => setMotherFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_middle_name">Middle Name</Label>
                    <Input
                      id="mother_middle_name"
                      value={mother_middle_name}
                      onChange={(e) => setMotherMiddleName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="mother_residential_address">
                      Residential Address
                    </Label>
                    <Input
                      id="mother_residential_address"
                      value={mother_residential_address}
                      onChange={(e) =>
                        setMotherResidentialAddress(e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_citizenship">Citizenship</Label>
                    <Input
                      id="mother_citizenship"
                      value={mother_citizenship}
                      onChange={(e) => setMotherCitizenship(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="mother_email">Email</Label>
                    <Input
                      id="mother_email"
                      value={mother_email}
                      onChange={(e) => setMotherEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_mobile_number">Mobile Number</Label>
                    <Input
                      id="mother_mobile_number"
                      value={mother_mobile_number}
                      onChange={(e) => setMotherMobileNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_landline_number">Landline</Label>
                    <Input
                      id="mother_landline_number"
                      value={mother_landline_number}
                      onChange={(e) => setMotherLandlineNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
