import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Building2,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import AddCollege from "./AddCollege";
import Edit from "./Edit";

const Colleges: React.FC = () => {
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const quickStats = [
    {
      label: "Total Colleges",
      value: 10,
      icon: Building2,
    },
    {
      label: "Active Colleges",
      value: "08",
      icon: CheckCircle,
    },
    {
      label: "Pending verification",
      value: "02",
      icon: Clock,
    },
    {
      label: "Total Students",
      value: 2500,
      icon: Users,
    },
  ];

  const allColleges = [
    {
      ID: "C2543",
      Name: "College 1",
      Location: "Hyderabad",
      Students: 1563,
      Status: "Active",
    },
    {
      ID: "C2550",
      Name: "College 2",
      Location: "Mumbai",
      Students: 2052,
      Status: "Active",
    },
    {
      ID: "C2574",
      Name: "College 3",
      Location: "Delhi",
      Students: 1756,
      Status: "Active",
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
            placeholder="Search colleges..."
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
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          {/* Sort By Date Dropdown */}
          <select
            id="sortDate"
            className="border rounded-lg px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-[#219A85] bg-white"
            defaultValue="sortDate"
          >
            <option value="sortDate">Sort by Date</option>
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
          </select>
          {/* Add College Button */}
          <button
            className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-5 py-2 rounded-lg transition-colors w-full md:w-auto"
            onClick={() => setShowAddCollege(true)}
          >
            + Add College
          </button>
          {showAddCollege && <AddCollege onClose={() => setShowAddCollege(false)} />}
        </div>
      </div>

      {/* All Colleges Table */}
      <Card className="mt-4 md:mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Colleges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">ID</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Name</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Location</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Students</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Status</th>
                  <th className="py-2 px-2 md:px-4 font-bold text-base md:text-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allColleges.map((activity, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2 md:px-4">{activity.ID}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Name}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Location}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Students}</td>
                    <td className="py-2 px-2 md:px-4">{activity.Status}</td>
                    <td className="py-2 px-2 md:px-4">
                      <div className="flex gap-2">
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                            onClick={() => setShowEdit(true)}
                        >
                            Edit
                        </button>
                        {showEdit && <Edit onClose={() => setShowEdit(false)} />}
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

export default Colleges;