import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { signIn, userProfile, refreshProfile, user, loading } = useAuth();

  // Redirect already-authenticated users away from auth routes
  useEffect(() => {
    if (!loading && user) {
      const role = userProfile?.role ?? null;
      if (role === "student") {
        navigate("/dashboard/student", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, userProfile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    /*...*/
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        console.log("Login failed", error);
      } else {
        // Authentication succeeded — refresh profile in AuthContext (so UI has it)
        const refreshed = await refreshProfile();

        // determine role: prefer AuthContext userProfile/refreshed if populated,
        // otherwise query the users table by auth_user_id
        let role: string | null = userProfile?.role ?? refreshed?.role ?? null;

        if (!role) {
          try {
            const { data: userSession } = await supabase.auth.getUser();
            const user = userSession.user;
            if (user?.id) {
              const { data: u, error: uErr } = await supabase
                .from("users")
                .select("role")
                .eq("auth_user_id", user.id)
                .single();
              if (!uErr && u) {
                role = (u as any).role ?? null;
              }
            }
          } catch (err) {
            console.error("Error fetching user role fallback:", err);
          }
        }

        // navigate based on role
        console.log("Login successful, user role:", role);
        if (role === "student") {
          navigate("/dashboard/student");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.log("Login error", err);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-medium pt-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                Sign In
              </CardTitle>
              <p className="text-muted-foreground">
                Access your Bosledger dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-foreground font-medium"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-foreground font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <FontAwesomeIcon
                      icon={faLock}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full hypatia-gradient-bg text-white font-medium py-3"
                  size="lg"
                >
                  Sign In
                </Button>

                <div className="text-center">
                  <span className="text-muted-foreground">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="mb-4">
            <Button variant="ghost" size="sm" className="px-3 mt-3" asChild>
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Welcome Message with Image */}
      <div className="flex-1 hypatia-gradient-bg flex flex-col items-center justify-center p-8 text-white">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faBook} className="text-6xl text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-xl text-white/90 mb-6">
              Sign in to your Bosledger account and manage registrar and
              accounting operations with ease.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
