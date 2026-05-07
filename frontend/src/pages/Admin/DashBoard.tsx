import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  Building2,
  BriefcaseBusiness,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const quickStats = [
    {
      label: "Colleges",
      value: 10,
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      label: "Companies",
      value: 30,
      icon: BriefcaseBusiness,
      color: "bg-green-600",
    },
    {
      label: "Courses",
      value: "03",
      icon: BookOpen,
      color: "bg-green-600",
    },
    {
      label: "Students",
      value: 4523,
      icon: GraduationCap,
      color: "bg-green-600",
    },
  ];

  const recentActivities = [
    {
      user: "Admin",
      activity: "Added new courses",
      time: "2 hours ago",
    },
    {
      user: "Admin",
      activity: "Added new college",
      time: "Yesterday",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-xl bg-gradient-hero flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <a href="#" className="text-blue-500 text-sm font-medium">
            View All
          </a>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 font-bold text-lg">User</th>
                <th className="py-2 px-4 font-bold text-lg">Activity</th>
                <th className="py-2 px-4 font-bold text-lg">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 px-4">{activity.user}</td>
                  <td className="py-2 px-4">{activity.activity}</td>
                  <td className="py-2 px-4">{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;