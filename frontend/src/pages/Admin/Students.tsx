import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
    BookOpen,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";

const Students: React.FC = () => {
  const quickStats = [
    {
      label: "Total Students",
      value: 2500,
      icon: Users,
    },
    {
      label: "Active Students",
      value: "2000",
      icon: CheckCircle,
    },
    {
      label: "Enrolled Students",
      value: 2500,
      icon: Users,
    },
  ];

  const allStudents = [
    {
      Name: "Student01",
      Mail: "student01@example.com",
      "Join Date": "2023-01-15",
      Progress: "Completed",
      Status: "Active",
    },
    {
      Name: "Student02",
      Mail: "student02@example.com",
      "Join Date": "2023-02-20",
      Progress: "4 modules pending",
      Status: "Active",
    },
    {
      Name: "Student03",
      Mail: "student03@example.com",
      "Join Date": "2023-03-10",
      Progress: "Not Started",
      Status: "Inactive",
    },
  
  ];

  return (
    <div className="space-y-8 px-2 md:px-0">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 py-4 md:py-6">
              <div
                className="rounded-lg p-3 flex items-center justify-center"
                style={{ backgroundColor: "#219A85" }}
              >
                <stat.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                <div className="text-muted-foreground text-sm md:text-base">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-center">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-xs md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search students..."
            className="border rounded-lg px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#219A85] bg-white"
          />
        </div>
        {/* Right Controls */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto justify-end md:ml-auto">
          {/* Status Dropdown */}
          <select
            id="status"
            className="border rounded-lg px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-[#219A85] bg-white"
            defaultValue="All"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {/* Sort By Date Dropdown */}
          <select
            id="sortDate"
            className="border rounded-lg px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-[#219A85] bg-white"
            defaultValue="sortDate"
          >
            <option value="sortDate">Sort </option>
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* All Students Table */}
      <Card className="mt-4 md:mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Name</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Mail</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Join Date</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Progress</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Status</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((activity, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2 md:px-4">{activity.Name}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Mail}</td>
                    <td className="py-2 px-2 md:px-4">{activity["Join Date"]}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Progress}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Status}</td>
                    <td className="py-2 px-2 md:px-4">
                      <div className="flex gap-2">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors">
                          Edit
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;