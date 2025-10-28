import { TestCase, Module } from "@/types/test";

export const testCasesByModule: Record<Module, TestCase[]> = {
  "Mod 1: Foundationals": [],
  "Mod 2: Basic Website Structure": [
    {
      id: "mod2-test1",
      module: "Mod 2: Basic Website Structure",
      title: "Navigate landing page with no errors",
      prerequisites: [],
      steps: ["Navigate the landing page via scrolling the page"],
      successCriteria: "The landing page is navigable, with no misrendered components or errors, and is interactable."
    }
  ],
  "Mod 3: Authentication": [
    {
      id: "mod3-test1",
      module: "Mod 3: Authentication",
      title: "Navigate authentication pages with no errors",
      prerequisites: [],
      steps: ["Navigate to both the Login and Registration pages"],
      successCriteria: "Both pages render correctly, with no visual or console errors, and all components are interactable."
    },
    {
      id: "mod3-test2",
      module: "Mod 3: Authentication",
      title: "Perform register operation with valid credentials",
      prerequisites: [],
      steps: ["Register a new account using valid and complete input fields (e.g., unique email, strong password)"],
      successCriteria: "Account is successfully created, user is redirected or shown a success message, and no backend or frontend errors appear."
    },
    {
      id: "mod3-test3",
      module: "Mod 3: Authentication",
      title: "Perform register operation with invalid credentials",
      prerequisites: [],
      steps: ["Attempt to register using invalid inputs (e.g., existing email, weak password, or blank fields)"],
      successCriteria: "Registration fails gracefully; validation errors are shown; no crashes or unexpected behavior occur."
    },
    {
      id: "mod3-test4",
      module: "Mod 3: Authentication",
      title: "Perform login operation with valid credentials",
      prerequisites: ["Existing valid account"],
      steps: ["Input correct email and password in the login form and submit"],
      successCriteria: "Successful login, user is redirected to dashboard or landing page, and session/auth token is properly generated."
    },
    {
      id: "mod3-test5",
      module: "Mod 3: Authentication",
      title: "Perform login operation with invalid credentials",
      prerequisites: [],
      steps: ["Attempt to log in using wrong email/password combinations or unregistered account"],
      successCriteria: "Login fails gracefully; user receives a proper error message; no redirection to authenticated areas; no errors or crashes occur."
    }
  ],
  "Mod 4: Student Operations": [
    {
      id: "mod4-test1",
      module: "Mod 4: Student Operations",
      title: "Navigate the student-side pages with no errors",
      prerequisites: ["Logged-in student account"],
      steps: ["Navigate through all primary student-side routes (Dashboard, My Enrollments, My Payments, My Balances)"],
      successCriteria: "All pages load successfully with no UI misrendering, console errors, or broken routes; all components are interactable."
    },
    {
      id: "mod4-test2",
      module: "Mod 4: Student Operations",
      title: "Perform quick action navigation on student dashboard",
      prerequisites: ["Logged-in student account", "Student dashboard loaded"],
      steps: ["From the student dashboard, click all quick action buttons"],
      successCriteria: "Each quick action button successfully redirects to its associated page with correct content and no errors."
    },
    {
      id: "mod4-test3",
      module: "Mod 4: Student Operations",
      title: "Complete operations within the 'My Enrollments' page",
      prerequisites: ["Logged-in student account", "Access to enrollment module"],
      steps: [
        "View existing enrollments",
        "Create a new enrollment (if applicable)"
      ],
      successCriteria: "Viewing and creation both function correctly; proper success messages appear; no unauthorized updates or deletions possible."
    },
    {
      id: "mod4-test4",
      module: "Mod 4: Student Operations",
      title: "Complete operations within the 'My Payments' page",
      prerequisites: ["Logged-in student account", "Existing payment records"],
      steps: [
        "View payment history",
        "Add or submit a payment (if supported)"
      ],
      successCriteria: "All viewing and submission operations complete successfully; no update/delete options are available; errors and permissions handled properly."
    },
    {
      id: "mod4-test5",
      module: "Mod 4: Student Operations",
      title: "Complete operations within 'My Balances' page",
      prerequisites: ["Logged-in student account with existing balance data"],
      steps: ["View current balance and related transactions"],
      successCriteria: "Balance data displays correctly with no rendering or logic errors; no unauthorized modifications allowed; data integrity maintained."
    }
  ],
  "Mod 5: Registrar Operations": [
    {
      id: "mod5-test1",
      module: "Mod 5: Registrar Operations",
      title: "Navigate the registrar-side pages with no errors",
      prerequisites: ["Logged-in registrar/staff account"],
      steps: ["Navigate through all registrar-side routes (Dashboard, Students, Courses, Subjects, Enrollments)"],
      successCriteria: "All pages load successfully with no UI or console errors, all components render properly, and navigation is smooth and responsive."
    },
    {
      id: "mod5-test2",
      module: "Mod 5: Registrar Operations",
      title: "Perform quick action navigation on the staff dashboard",
      prerequisites: ["Logged-in registrar/staff account", "Staff dashboard loaded"],
      steps: ["From the staff dashboard, click each quick action button"],
      successCriteria: "Each quick action button successfully redirects to its correct page, content loads accurately, and no visual or backend errors occur."
    },
    {
      id: "mod5-test3",
      module: "Mod 5: Registrar Operations",
      title: "Complete operations within the 'Students' page",
      prerequisites: ["Logged-in registrar/staff account"],
      steps: [
        "View student list",
        "Create a new student record",
        "Update an existing student record",
        "Delete a student record"
      ],
      successCriteria: "CRUD operations execute successfully; confirmation or success messages display; data updates persist correctly in the database; validation and permission checks are enforced."
    },
    {
      id: "mod5-test4",
      module: "Mod 5: Registrar Operations",
      title: "Complete operations within the 'Courses' page",
      prerequisites: ["Logged-in registrar/staff account"],
      steps: [
        "View existing courses",
        "Create new course entries",
        "Update course information",
        "Delete a course"
      ],
      successCriteria: "All CRUD actions complete with no errors; UI updates reflect database changes; invalid inputs trigger proper validation messages."
    },
    {
      id: "mod5-test5",
      module: "Mod 5: Registrar Operations",
      title: "Complete operations within the 'Subjects' page",
      prerequisites: ["Logged-in registrar/staff account"],
      steps: [
        "View existing subjects",
        "Create a new subject",
        "Update subject details",
        "Delete a subject"
      ],
      successCriteria: "All operations function correctly with proper data handling; UI and backend remain synchronized; permission and validation checks operate as expected."
    },
    {
      id: "mod5-test6",
      module: "Mod 5: Registrar Operations",
      title: "Complete operations within the 'Enrollments' page",
      prerequisites: ["Logged-in registrar/staff account"],
      steps: [
        "View student enrollments",
        "Create new enrollment entries",
        "Update enrollment data",
        "Delete enrollment records if necessary"
      ],
      successCriteria: "CRUD operations execute successfully; proper linkage between students, subjects, and courses is maintained; no data corruption or permission bypass occurs."
    }
  ],
  "Mod 6: Accounting Operations": [
    {
      id: "mod6-test1",
      module: "Mod 6: Accounting Operations",
      title: "Navigate the accounting-side pages with no errors",
      prerequisites: ["Logged-in accounting/staff account"],
      steps: ["Navigate through all accounting-side routes (Dashboard, Payments, Balances)"],
      successCriteria: "All pages load successfully without UI or console errors; components render correctly and are fully interactable."
    },
    {
      id: "mod6-test2",
      module: "Mod 6: Accounting Operations",
      title: "Complete operations within the 'Payments' page",
      prerequisites: ["Logged-in accounting/staff account", "Access to payment records"],
      steps: [
        "View all payment records",
        "Create or record a new payment",
        "Update payment details (if applicable)",
        "Delete a payment record (if authorized)"
      ],
      successCriteria: "All CRUD operations function correctly; updates reflect immediately on the interface and database; validation, authorization, and error handling work as expected."
    },
    {
      id: "mod6-test3",
      module: "Mod 6: Accounting Operations",
      title: "Complete operations within the 'Balances' page",
      prerequisites: ["Logged-in accounting/staff account with balance data available"],
      steps: [
        "View student balance information",
        "Update or reconcile balance entries",
        "Delete incorrect or obsolete balance records (if permitted)"
      ],
      successCriteria: "All operations complete successfully; displayed data remains accurate and synchronized; unauthorized actions are restricted; no logic, UI, or backend errors occur."
    }
  ],
  "Mod 7: Administrative Operations": [
    {
      id: "mod7-test1",
      module: "Mod 7: Administrative Operations",
      title: "Navigate the administrative-side pages with no errors",
      prerequisites: ["Logged-in administrator account"],
      steps: ["Navigate through all administrative routes (Dashboard, Role Manager, Admin Manager)"],
      successCriteria: "All pages render correctly without UI, logic, or console errors; all interface elements are functional and navigable."
    },
    {
      id: "mod7-test2",
      module: "Mod 7: Administrative Operations",
      title: "Complete operations within the 'Role Manager' page",
      prerequisites: ["Logged-in administrator account with role management privileges"],
      steps: [
        "View existing roles and permissions",
        "Create a new role",
        "Update role details or assigned permissions",
        "Delete roles as necessary"
      ],
      successCriteria: "All CRUD operations execute successfully; changes reflect across affected user accounts; permission and validation checks are enforced; no backend or interface errors occur."
    },
    {
      id: "mod7-test3",
      module: "Mod 7: Administrative Operations",
      title: "Complete operations within the 'Admin Manager' page",
      prerequisites: ["Logged-in administrator account with admin management access"],
      steps: [
        "View list of admin accounts",
        "Create or register a new admin",
        "Update existing admin information or privileges",
        "Delete an admin account (if authorized)"
      ],
      successCriteria: "All operations perform correctly; data persists accurately; permission levels are respected; UI and backend remain consistent and error-free."
    }
  ],
  "Mod 8: Polishing & Finalization": []
};

export const allModules: Module[] = [
  "Mod 1: Foundationals",
  "Mod 2: Basic Website Structure",
  "Mod 3: Authentication",
  "Mod 4: Student Operations",
  "Mod 5: Registrar Operations",
  "Mod 6: Accounting Operations",
  "Mod 7: Administrative Operations",
  "Mod 8: Polishing & Finalization"
];
