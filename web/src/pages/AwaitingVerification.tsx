import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AwaitingVerification = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <DashboardLayout
      title="Awaiting Verification"
      subtitle="Account pending verification"
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Account Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Thank you for registering. Your account currently has the role
              "user" which means it requires verification by an administrator
              before you can access student or administrative features.
            </p>

            <p className="text-sm text-muted-foreground mb-4">
              What you can do now:
            </p>
            <ul className="list-disc pl-5 text-sm mb-4">
              <li>
                Review and update your profile information in the Profile tab.
              </li>
              <li>
                Wait for an administrator to verify your account. You will be
                notified by email.
              </li>
            </ul>

            <div className="flex gap-2">
              <Button onClick={() => navigate("/profile")}>
                Go to Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AwaitingVerification;
