import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUsers, 
  faGraduationCap, 
  faCreditCard, 
  faChartLine,
  faArrowUp,
  faArrowDown
} from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      change: "+12%",
      trend: "up",
      icon: faUsers,
      color: "text-blue-600"
    },
    {
      title: "Active Enrollments",
      value: "892",
      change: "+8%",
      trend: "up",
      icon: faGraduationCap,
      color: "text-green-600"
    },
    {
      title: "Pending Payments",
      value: "₱45,230",
      change: "-5%",
      trend: "down",
      icon: faCreditCard,
      color: "text-orange-600"
    },
    {
      title: "Revenue This Month",
      value: "₱1,234,567",
      change: "+15%",
      trend: "up",
      icon: faChartLine,
      color: "text-purple-600"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "enrollment",
      message: "New student enrolled in BSIT program",
      time: "2 minutes ago",
      student: "Maria Santos"
    },
    {
      id: 2,
      type: "payment",
      message: "Payment received for tuition fee",
      time: "15 minutes ago",
      student: "John Cruz",
      amount: "₱15,000"
    },
    {
      id: 3,
      type: "grade",
      message: "Grades updated for IT262 course",
      time: "1 hour ago",
      course: "Human Computer Interaction 2"
    },
    {
      id: 4,
      type: "enrollment",
      message: "Student transferred to BSME program",
      time: "2 hours ago",
      student: "Ana Reyes"
    }
  ];

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's what's happening at Don Bosco Technical College"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="shadow-soft hover:shadow-medium transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-2">
                        <FontAwesomeIcon 
                          icon={stat.trend === "up" ? faArrowUp : faArrowDown}
                          className={`text-sm mr-1 ${
                            stat.trend === "up" ? "text-success" : "text-destructive"
                          }`}
                        />
                        <span className={`text-sm font-medium ${
                          stat.trend === "up" ? "text-success" : "text-destructive"
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          from last month
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl hypatia-gradient-subtle flex items-center justify-center ${stat.color}`}>
                      <FontAwesomeIcon icon={stat.icon} className="text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <div className="w-2 h-2 rounded-full hypatia-gradient-bg mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        {(activity.student || activity.course) && (
                          <p className="text-sm text-muted-foreground">
                            {activity.student && `Student: ${activity.student}`}
                            {activity.course && `Course: ${activity.course}`}
                            {activity.amount && ` • Amount: ${activity.amount}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: "Add Student", icon: faUsers, href: "/students" },
                    { title: "Record Payment", icon: faCreditCard, href: "/payments" },
                    { title: "Manage Courses", icon: faGraduationCap, href: "/courses" },
                    { title: "View Reports", icon: faChartLine, href: "/reports" }
                  ].map((action, index) => (
                    <motion.button
                      key={action.title}
                      className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-lg hypatia-gradient-subtle flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200">
                          <FontAwesomeIcon icon={action.icon} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {action.title}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;