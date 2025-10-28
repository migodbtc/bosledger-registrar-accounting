import React, { useEffect, useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "@/components/ui/badge";
import {
  faUser,
  faEnvelope,
  faPhone,
  faIdBadge,
  faEdit,
  faTrash,
  faSort,
  faSortUp,
  faSortDown,
  faPlus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import {
  faVenusMars,
  faBirthdayCake,
  faGlobe,
  faChurch,
  faMapMarker,
  faUserGraduate,
  faUserTie,
  faCalculator,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { faUserSlash, faUserShield } from "@fortawesome/free-solid-svg-icons";

type UserRow = {
  id: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email: string;
  student_number?: string | null;
  mobile_number?: string | null;
  created_at?: string | null;
  role?: string | null;
  gender: string | null;
  birthday: string | null; // ISO date string
  citizenship: string | null;
  religion: string | null;
  street_address: string | null;
};

const roleDescriptions: Record<string, string> = {
  student: "Revoke elevated privileges; user will be a regular student.",
  registrar:
    "Grants registrar privileges to manage enrollments, sections, and student records.",
  accounting: "Grants accounting privileges to manage balances and payments.",
};

const AdminManager: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  // Card-grid pagination (client-side)
  const [cardPage, setCardPage] = useState(1);
  const cardPageSize = 8;
  // Selected user for detail column
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        // Map sort field to actual DB column name
        const { data, error, count } = await supabase
          .from("users")
          .select(
            "id, first_name, middle_name, last_name, email, student_number, mobile_number, created_at, role, gender, birthday, citizenship, religion, street_address",
            { count: "exact" }
          )
          .range(from, to);

        if (error) {
          console.error("fetch users error", error);
          setUsers([]);
          setTotal(0);
        } else {
          setUsers((data ?? []) as UserRow[]);
          setTotal(typeof count === "number" ? count : data ?? []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, pageSize, sortDirection]);

  const formatName = (u: UserRow) => {
    const parts = [u.first_name, u.middle_name, u.last_name].filter(Boolean);
    return parts.length ? parts.join(" ") : u.email;
  };

  const truncate = (v: string | undefined | null, n: number) => {
    if (!v) return "";
    return v.length > n ? `${v.slice(0, n)}...` : v;
  };

  const formatDateString = (v: string | null | undefined) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString();
  };

  const titleCase = (s: string | null | undefined) => {
    if (!s) return "-";
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      return (
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.first_name ?? "").toLowerCase().includes(q) ||
        (u.last_name ?? "").toLowerCase().includes(q) ||
        (u.student_number ?? "").toLowerCase().includes(q) ||
        (u.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const updateUserRole = async (userId: string, newRole: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) {
        console.error("update role error", error);
        toast({
          title: `⚠️ Failed to update role`,
          description: error.message ?? "See console for details.",
          variant: "destructive",
        });
        return false;
      }
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...(selectedUser as UserRow), role: newRole });
      }
      toast({
        title: `✅ Role updated`,
        description: `User role set to ${titleCase(newRole)}. ${
          roleDescriptions[newRole]
        }`,
      });
      return true;
    } finally {
      setLoading(false);
    }
  };

  const { userProfile: currentUserProfile } = useAuth();

  const cardTotalPages = Math.max(1, Math.ceil(filtered.length / cardPageSize));

  // Reset card page when filter/search changes
  useEffect(() => {
    setCardPage(1);
  }, [filtered.length]);

  // Clear selection if selected user was removed from list
  useEffect(() => {
    if (selectedUser && !users.find((u) => u.id === selectedUser.id)) {
      setSelectedUser(null);
    }
  }, [users, selectedUser]);

  return (
    <DashboardLayout
      title="Admin Manager"
      subtitle="Promote users to admin and manage admin assignments"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* Introductory Row */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Admin</h2>
              <p className="text-sm text-muted-foreground">
                Manage the administrative roles of the system here
              </p>
            </div>
          </div>
          {/* Main Body */}
        </div>

        {/* Grid: left 2 columns = card grid, right column = detail placeholder */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left area: spans 2 columns */}
          <div className="col-span-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {users.length} loaded users
                </div>
              </CardHeader>

              <CardContent>
                {/* Search + controls row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search email, name, student no, or role..."
                      value={search}
                      onChange={(e: any) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearch("");
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Paginated 4x2 layout: 4 rows x 2 columns = 8 cards per page */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {filtered
                      .slice(
                        (cardPage - 1) * cardPageSize,
                        cardPage * cardPageSize
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          tabIndex={0}
                          onClick={() => setSelectedUser(u)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              setSelectedUser(u);
                          }}
                          className={`rounded-lg border p-4 flex flex-col items-start justify-between bg-card cursor-pointer ${
                            selectedUser?.id === u.id
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                          role="button"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 rounded-full hypatia-gradient-bg flex items-center justify-center text-white">
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div>
                              <div className="font-semibold">
                                {formatName(u)}
                              </div>

                              {u.role ? (
                                // Map certain roles to a single 'Non-Admin' label
                                // Non-admin roles per enums.md: user, student, registrar, accounting
                                (() => {
                                  const roleStr = String(u.role || "");
                                  const nonAdminRoles = new Set([
                                    "user",
                                    "student",
                                    "registrar",
                                    "accounting",
                                  ]);

                                  if (nonAdminRoles.has(roleStr)) {
                                    return (
                                      <Badge className="bg-slate-200 text-slate-800">
                                        Non-Admin
                                      </Badge>
                                    );
                                  }

                                  // Keep admin and superadmin distinct colors
                                  if (roleStr === "superadmin") {
                                    return (
                                      <Badge className="bg-amber-600 text-white">
                                        Superadmin
                                      </Badge>
                                    );
                                  }

                                  // default: admin or any other elevated role
                                  return (
                                    <Badge className="bg-emerald-600 text-white">
                                      {roleStr
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (c) =>
                                          c.toUpperCase()
                                        )}
                                    </Badge>
                                  );
                                })()
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-full">
                            <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                              <div
                                className="flex items-center"
                                title={u.email}
                              >
                                <FontAwesomeIcon
                                  icon={faEnvelope}
                                  className="mr-2 w-3 h-3 text-muted-foreground"
                                />
                                {truncate(u.email, 24)}
                              </div>

                              {u.student_number && (
                                <div
                                  className="flex items-center"
                                  title={u.student_number}
                                >
                                  <FontAwesomeIcon
                                    icon={faIdBadge}
                                    className="mr-2 w-3 h-3 text-muted-foreground"
                                  />
                                  {truncate(u.student_number, 20)}
                                </div>
                              )}

                              {u.mobile_number && (
                                <div
                                  className="flex items-center"
                                  title={u.mobile_number}
                                >
                                  <FontAwesomeIcon
                                    icon={faPhone}
                                    className="mr-2 w-3 h-3 text-muted-foreground"
                                  />
                                  {truncate(u.mobile_number, 20)}
                                </div>
                              )}
                            </div>

                            <div className="w-full border-t my-2" />

                            <div className="text-xs text-muted-foreground">
                              Joined:{" "}
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString()
                                : "-"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Pagination controls for the card grid (client-side) */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {cardPage} of {cardTotalPages}
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardPage(1)}
                        disabled={cardPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                        disabled={cardPage === 1}
                      >
                        Prev
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCardPage((p) => Math.min(cardTotalPages, p + 1))
                        }
                        disabled={cardPage === cardTotalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardPage(cardTotalPages)}
                        disabled={cardPage === cardTotalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right area: selected user detail card */}
          <div>
            <Card className="shadow-soft h-full">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedUser ? (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    Click a user card to view details
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full hypatia-gradient-bg flex items-center justify-center text-white">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {formatName(selectedUser)}
                        </div>
                        <div className="text-sm text-muted-foreground text-justify break-words">
                          {selectedUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="text-sm text-muted-foreground mt-2 mb-4 flex items-center">
                        {selectedUser.role ? (
                          // reuse the same badge mapping as above
                          (() => {
                            const roleStr = String(selectedUser.role || "");
                            const nonAdminRoles = new Set([
                              "user",
                              "student",
                              "registrar",
                              "accounting",
                            ]);
                            if (nonAdminRoles.has(roleStr)) {
                              return (
                                <Badge className="mr-2 bg-slate-200 text-slate-800">
                                  Non-Admin
                                </Badge>
                              );
                            }
                            if (roleStr === "superadmin") {
                              return (
                                <Badge className="mr-2 bg-amber-600 text-white">
                                  Superadmin
                                </Badge>
                              );
                            }
                            return (
                              <Badge className="mr-2 bg-emerald-600 text-white">
                                {roleStr
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </Badge>
                            );
                          })()
                        ) : (
                          <span className="mr-2 text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Joined:{" "}
                          {selectedUser.created_at
                            ? new Date(
                                selectedUser.created_at
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>

                      <div className="text-sm text-black font-semibold">
                        User Information
                      </div>
                      {selectedUser.student_number && (
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faIdBadge}
                            className="mr-2 w-3 h-3"
                          />
                          {selectedUser.student_number}
                        </div>
                      )}
                      {selectedUser.mobile_number && (
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faPhone}
                            className="mr-2 w-3 h-3"
                          />
                          {selectedUser.mobile_number}
                        </div>
                      )}

                      {/* Additional profile fields */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faVenusMars}
                            className="mr-2 w-3 h-3 text-muted-foreground"
                          />
                          <span>{titleCase(selectedUser.gender)}</span>
                        </div>

                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faBirthdayCake}
                            className="mr-2 w-3 h-3 text-muted-foreground"
                          />
                          <span>{formatDateString(selectedUser.birthday)}</span>
                        </div>

                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faGlobe}
                            className="mr-2 w-3 h-3 text-muted-foreground"
                          />
                          <span>{selectedUser.citizenship ?? "-"}</span>
                        </div>

                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faChurch}
                            className="mr-2 w-3 h-3 text-muted-foreground"
                          />
                          <span>{selectedUser.religion ?? "-"}</span>
                        </div>

                        <div className="flex items-start">
                          <FontAwesomeIcon
                            icon={faMapMarker}
                            className="mr-2 w-3 h-3 text-muted-foreground mt-1"
                          />
                          <span>{selectedUser.street_address ?? "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                      <div>
                        <div className="text-sm font-semibold">
                          Role Appointment
                        </div>
                      </div>

                      {/* Only superadmin may edit roles; never allow editing of a Superadmin account */}
                      {selectedUser?.role === "superadmin" ? (
                        <div className="flex items-start space-x-3">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="w-4 h-4 text-yellow-500 mt-1"
                          />
                          <div className="text-sm">
                            <div className="">Superadmin account</div>
                            <div className="text-xs text-muted-foreground">
                              This account is a Superadmin and cannot be
                              modified.
                            </div>
                          </div>
                        </div>
                      ) : currentUserProfile?.role !== "superadmin" ? (
                        <div className="flex items-start space-x-3">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="w-4 h-4 text-yellow-500 mt-1"
                          />
                          <div className="text-sm">
                            <div className="">Administrative account</div>
                            <div className="text-xs text-muted-foreground">
                              Only a Superadmin may modify user roles. Contact a
                              Superadmin to change this user's role.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          {/* Demote to User */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                disabled={
                                  loading || selectedUser?.role === "user"
                                }
                                className={
                                  loading || selectedUser?.role === "user"
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faUserSlash}
                                  className="mr-2 w-3 h-3"
                                />
                                Demote to User
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm demotion
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Demoting to non-admin means stripping the
                                  admin role and granting them the role of
                                  "user".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    if (!selectedUser) return;
                                    await updateUserRole(
                                      selectedUser.id,
                                      "user"
                                    );
                                  }}
                                >
                                  Demote
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <div className="text-xs text-muted-foreground mt-1">
                            Demoting to non-admin means stripping of the admin
                            role and instead granting them the role of user.
                          </div>

                          {/* Promote to Admin */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                disabled={
                                  loading || selectedUser?.role === "admin"
                                }
                                className={
                                  loading || selectedUser?.role === "admin"
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faUserShield}
                                  className="mr-2 w-3 h-3"
                                />
                                Promote to Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm promotion
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Promoting to admin will grant this user
                                  administrative privileges regardless of their
                                  current role (user, student, accounting,
                                  registrar).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    if (!selectedUser) return;
                                    await updateUserRole(
                                      selectedUser.id,
                                      "admin"
                                    );
                                  }}
                                >
                                  Promote
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <div className="text-xs text-muted-foreground mt-1">
                            Promoting to admin means this user will be granted
                            administrative privileges.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminManager;
