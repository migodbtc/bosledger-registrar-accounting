import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
  faUser,
  faUserGraduate,
  faUserTie,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "student" | "registrar" | "accounting" | "admin";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as UserRole,
  });
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const roleIcons = {
    student: faUserGraduate,
    registrar: faUserTie,
    accounting: faUserTie,
    admin: faUserShield,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    setSubmitting(true);
    try {
      // Call AuthContext signUp — do not pass userData here per instructions
      const { error } = await signUp(formData.email, formData.password);
      if (!error) {
        // AuthContext already shows a success toast. Redirect user to login.
        navigate("/login");
      }
      // if there's an error, AuthContext shows a toast; keep on the form
    } finally {
      setSubmitting(false);
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
                Sign Up
              </CardTitle>
              <p className="text-muted-foreground">
                Make an account for Bosledger
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                {/* Only email, password and confirm password are supported in this form */}

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

                {/* role removed — form only collects email and passwords */}

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
                      placeholder="Create password"
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

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-foreground font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full hypatia-gradient-bg text-white font-medium py-3"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in
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

      {/* Right Side - Welcome Message */}
      <div className="flex-1 hypatia-gradient-bg flex flex-col items-center justify-center p-8 text-white">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon
                icon={faUserGraduate}
                className="text-6xl text-white"
              />
            </div>
            <h2 className="text-4xl font-bold mb-4">Join Bosledger</h2>
            <p className="text-xl text-white/90 mb-6">
              Create your account and start managing registrar and accounting
              operations efficiently.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
