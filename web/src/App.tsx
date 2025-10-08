import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import Subjects from "./pages/Subjects";
import Enrollments from "./pages/Enrollments";
import MyEnrollments from "./pages/MyEnrollments";
import Payments from "./pages/Payments";
import Balances from "./pages/Balances";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RoleSwitcherOverlay from "@/components/RoleSwitcherOverlay";
import MyPayments from "./pages/MyPayments";
import MyBalances from "./pages/MyBalances";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard and protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Dashboard />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <StudentDashboard />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Students />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Courses />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Subjects />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollments"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Enrollments />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/enrollments"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <MyEnrollments />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Payments />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/balances"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Balances />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/payments"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <MyPayments />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/balances"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <MyBalances />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Reports />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Profile />
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {import.meta.env.DEV && <RoleSwitcherOverlay />}
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
