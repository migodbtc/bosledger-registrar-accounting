import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faChartBar } from "@fortawesome/free-solid-svg-icons";

const Reports = () => {
  return (
    <DashboardLayout 
      title="Reports & Analytics" 
      subtitle="Generate comprehensive reports for registrar and accounting"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
              <FontAwesomeIcon icon={faChartBar} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Reports</h2>
              <p className="text-sm text-muted-foreground">Analytics & insights</p>
            </div>
          </div>
          <Button className="hypatia-gradient-bg">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Generate Report
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Reporting Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full hypatia-gradient-subtle flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faChartBar} className="text-2xl text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">Reports & Analytics System</p>
              <p className="text-muted-foreground mb-4">
                Generate exportable reports for registrar and accounting departments with detailed analytics.
              </p>
              <Button className="hypatia-gradient-bg">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;