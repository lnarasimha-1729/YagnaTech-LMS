import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/yagnatech.png";
import Dashboard from "./DashBoard";
import Colleges from "./Colleges";
import Companies from "./Companies";
import Courses from "./Courses";
import Students from "./Students";
import Setting from "./Settings";
import Logout from "./Logout";
import SectionHeader from "./ADSectionHeader";

import {
  BookOpen,
  LogOut,
  Menu,
  X,
  Home,
  Building2,
  BriefcaseBusiness,
  GraduationCapIcon,
  Settings,
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminData = {
    name: "Sai Charan SampathiRao",
    // avatar: "https://i.pravatar.cc/150?img=3",
  };

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: Home },
    { value: "colleges", label: "Colleges", icon: Building2 },
    { value: "companies", label: "Companies", icon: BriefcaseBusiness },
    { value: "courses", label: "Courses", icon: BookOpen },
    { value: "students", label: "Students", icon: GraduationCapIcon },
    // { value: "payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 border-r bg-card z-40">
        <div className="flex items-center gap-2 p-4 border-b">
          <img src={Logo} alt="Logo" className="w-15 h-15 rounded-lg object-cover" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              className={`w-full justify-start text-black bg-transparent border border-black/2 ${
                activeTab === tab.value
                  ? "bg-[#177385] text-white hover:bg-gradient-hero"
                  : "hover:bg-gradient-hero"
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t">
          {/* Settings button (Desktop sidebar) */}
          <Button
            variant="outline"
            className="w-full mb-2 hover:bg-gradient-hero"
            onClick={() => setActiveTab("setting")}
          >
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button variant="outline" className="w-full"
          onClick={() => setActiveTab("logout")}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card relative">
        {/* Left: Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4"
        >
          <Menu className="h-10 w-10" />
        </Button>

        {/* Center: Logo */}
        <div className="flex justify-center w-full">
          <img
            src={Logo}
            alt="Logo"
            className="h-15 w-15 rounded-lg object-cover"
          />
        </div>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r shadow-xl flex flex-col rounded-r-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <img
                src={Logo}
                alt="Logo"
                className="h-15 w-15 rounded-lg object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-red-100"
              >
                <X className="h-10 w-10 text-[#177385]-500" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  className={`w-full justify-start text-black bg-transparent border border-black/2 ${
                    activeTab === tab.value
                      ? "bg-[#177385] text-white hover:bg-gradient-hero"
                      : "hover:bg-gradient-hero"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setSidebarOpen(false);
                  }}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </nav>
            <div className="p-4 border-t space-y-2">
              {/* Settings button (Mobile sidebar) */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveTab("setting");
                  setSidebarOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-2" /> Settings
              </Button>
              <Button variant="outline" className="w-full"
              onClick={() => {
                setActiveTab("logout");
                setSidebarOpen(false);
              }}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="dashboard">
            <SectionHeader title="Admin Dashboard" admin={adminData} />
            <Dashboard />
          </TabsContent>
          <TabsContent value="companies">
            <SectionHeader title="Companies" admin={adminData} />
            <Companies />
          </TabsContent>
          <TabsContent value="colleges">
            <SectionHeader title="Colleges" admin={adminData} />
            <Colleges />
          </TabsContent>
          <TabsContent value="courses">
            <SectionHeader title="Courses" admin={adminData} />
            <Courses />
          </TabsContent>
          <TabsContent value="students">
            <SectionHeader title="Students" admin={adminData} />
            <Students />
          </TabsContent>
          {/* Settings Tab Content */}
          <TabsContent value="setting">
            <SectionHeader title="Settings" admin={adminData} />
            <Setting />
          </TabsContent>
          <TabsContent value="logout">
            <SectionHeader title="Logout - YagnaTech Admin" admin={adminData} />
            <Logout />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
