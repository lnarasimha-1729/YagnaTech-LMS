// import { useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Tabs, TabsContent } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import Logo from "@/assets/yagnatech.png";
// import Overview from "./Overview";
// import Assessment from "./Assesments";
// import Certificate from "./Certificate";
// import ProfilePage from "./ProfilePage";
// import SectionHeader from "./SectionHeader";
// import ProgramsPage from "./Programspage";

// import {
//   BookOpen,
//   Trophy,
//   Clock,
//   User,
//   GraduationCap,
//   CreditCard,
//   Bell,
//   LogOut,
//   Target,
//   Menu,
//   X,
// } from "lucide-react";






// const StudentDashboard = () => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const studentData = {
//     name: "Sai Charan SampathiRao",
//     // avatar: "https://i.pravatar.cc/150?img=3",
//   };


//   const tabs = [
//     { value: "overview", label: "Overview", icon: BookOpen },
//     { value: "courses", label: "My Programs", icon: GraduationCap },
//     { value: "assessments", label: "Assessments", icon: Clock },
//     { value: "certificates", label: "Certificates", icon: Trophy },
//     { value: "profile", label: "Profile", icon: User },
//     // { value: "payments", label: "Payments", icon: CreditCard },
//   ];

//   return (
//     <div className="min-h-screen flex flex-col md:flex-row bg-background">
//       {/* Sidebar - Desktop */}
//         <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 border-r bg-card z-40">
//         <div className="flex items-center gap-2 p-4 border-b">
//           <img src={Logo} alt="Logo" className="w-15 h-15 rounded-lg object-cover" />
//           {/* <h2 className="font-bold text-lg">Student Portal</h2> */}
//         </div>
//         <nav className="flex-1 p-4 space-y-2">
//           {tabs.map((tab) => (
//             <Button
//               key={tab.value}
//                className={`w-full justify-start text-black bg-transparent border border-black/2 ${
//     activeTab === tab.value
//       ? "bg-[#177385] text-white hover:bg-gradient-hero"
//       : "hover:bg-gradient-hero"
//   }`}
//   onClick={() => setActiveTab(tab.value)}
//             >
//               <tab.icon className="h-4 w-4 mr-2" />
//               {tab.label}
//             </Button>
//           ))}
//         </nav>
//         <div className="p-4 border-t">
//           <Button variant="outline" className="w-full mb-2 hover:bg-gradient-hero">
//             <Bell className="h-4 w-4 mr-2" /> Notifications
//           </Button>
//           <Button variant="destructive" className="w-full">
//             <LogOut className="h-4 w-4 mr-2" /> Logout
//           </Button>
//         </div>
//       </aside>

//      {/* Mobile Header */}
// <header className="md:hidden flex items-center justify-between p-4 border-b bg-card relative">
//   {/* Left: Hamburger */}
//   <Button
//     variant="ghost"
//     size="icon"
//     onClick={() => setSidebarOpen(true)}
//     className="absolute left-4"
//   >
//     <Menu className="h-10 w-10" />
//   </Button>

//   {/* Center: Logo */}
//   <div className="flex justify-center w-full">
//     <img
//       src={Logo}
//       alt="Logo"
//       className="h-15 w-15 rounded-lg object-cover"
//     />
//   </div>

//   {/* Right: Notifications */}
//   {/* <Button
//     variant="ghost"
//     size="icon"
//     className="absolute right-4"
//   >
//     <Bell className="h-10 w-10" />
//   </Button> */}
// </header>

// {/* Mobile Sidebar (Drawer) */}
// {sidebarOpen && (
//   <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
//     <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r shadow-xl flex flex-col rounded-r-2xl">
//       {/* Sidebar Header with Close Button */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <img
//           src={Logo}
//           alt="Logo"
//           className="h-15 w-15 rounded-lg object-cover"
//         />
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => setSidebarOpen(false)}
//           className="hover:bg-red-100"
//         >
//           <X className="h-10 w-10 text-[#177385]-500" />
//         </Button>
//       </div>

//       {/* Nav Items */}
//       <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
//         {tabs.map((tab) => (
//           <Button
//               key={tab.value}
//                className={`w-full justify-start text-black bg-transparent border border-black/2 ${
//     activeTab === tab.value
//       ? "bg-[#177385] text-white hover:bg-gradient-hero"
//       : "hover:bg-gradient-hero"
//   }`}
//             onClick={() => {
//               setActiveTab(tab.value);
//               setSidebarOpen(false);
//             }}
//           >
//             <tab.icon className="h-4 w-4 mr-2" />
//             {tab.label}
//           </Button>
//         ))}
//       </nav>

//       {/* Bottom Actions */}
//       <div className="p-4 border-t space-y-2">
//         <Button variant="outline" className="w-full">
//           <Bell className="h-4 w-4 mr-2" /> Notifications
//         </Button>
//         <Button variant="destructive" className="w-full">
//           <LogOut className="h-4 w-4 mr-2" /> Logout
//         </Button>
//       </div>
//     </aside>
//   </div>
// )}

//       {/* Main Content */}
//      <main className="flex-1 md:ml-64 p-4 md:p-8">
//   <Tabs value={activeTab} onValueChange={setActiveTab}>
//     <TabsContent value="overview">
//       <SectionHeader title="Dashboard" student={studentData} />
//       <Overview />
//     </TabsContent>

//     <TabsContent value="courses">
//       <SectionHeader title="My Programs" student={studentData} />
//      < ProgramsPage />
//     </TabsContent>

//     <TabsContent value="assessments">
//       <SectionHeader title="Assessments" student={studentData} />
//       < Assessment />
//     </TabsContent>

//     <TabsContent value="certificates">
//       <SectionHeader title="Certificates" student={studentData} />
//         < Certificate />
//     </TabsContent>

//     <TabsContent value="profile">
//       <SectionHeader title="Profile" student={studentData} />
//         < ProfilePage />
//     </TabsContent>

//   </Tabs>
// </main>
//     </div>
//   );
// };

// export default StudentDashboard;

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "@/assets/yagnatech.png";
import Overview from "./Overview";
import Assessment from "./Assesments";
import Certificate from "./Certificate";
import ProfilePage from "./ProfilePage";
import SectionHeader from "./SectionHeader";
import ProgramsPage from "./Programspage";

import {
  BookOpen,
  Trophy,
  Clock,
  User,
  GraduationCap,
  CreditCard,
  Bell,
  LogOut,
  Target,
  Menu,
  X,
} from "lucide-react";

const tabs = [
  { value: "overview", label: "Overview", icon: BookOpen },
  { value: "assessments", label: "Assessments", icon: Clock },
  { value: "courses", label: "My Programs", icon: GraduationCap },
  
  { value: "certificates", label: "Certificates", icon: Trophy },
  { value: "profile", label: "Profile", icon: User },
  // { value: "payments", label: "Payments", icon: CreditCard },
];

interface StudentDashboardProps {
  contentOverride?: { title: string; node: React.ReactNode };
}

const VALID_TABS = ["overview", "assessments", "courses", "certificates", "profile"] as const;

const StudentDashboard = ({ contentOverride }: StudentDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial tab precedence: ?tab=… in the URL > contentOverride mode > overview.
  // The query-param hook lets pages like PreAssessment deep-link the user
  // straight to "Profile" when their profile is incomplete.
  const initialTab = (() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl && (VALID_TABS as readonly string[]).includes(fromUrl)) return fromUrl;
    return contentOverride ? "courses" : "overview";
  })();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutUser, loading } = useAuth();
  const navigate = useNavigate();

  const goToTab = (value: string) => {
    setActiveTab(value);
    setSidebarOpen(false);
    // Clear the ?tab= param after consuming it so a later browser refresh
    // doesn't keep snapping the user back to the deep-linked tab.
    if (searchParams.has("tab")) {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    }
    if (contentOverride) navigate("/dashboard");
  };

  // Get display name - fallback to email if name doesn't exist
  const getDisplayName = () => {
    if (!user) return "Student";
    return user.name || user.email || "Student";
  };


  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const studentData = {
    name: getDisplayName(),
    // email: getDisplayEmail(),
    // avatar: user?.avatar || "https://i.pravatar.cc/150?img=3",
  };

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 border-r bg-card z-40">
        <div className="flex items-center gap-2 p-4 border-b">
          <Link to="/" aria-label="Go to home">
            <img src={Logo} alt="Logo" className="w-15 h-15 rounded-lg object-cover" />
          </Link>
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
              onClick={() => goToTab(tab.value)}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </nav>
        
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full mb-2 hover:bg-gradient-hero">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </Button>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4"
        >
          <Menu className="h-10 w-10" />
        </Button>

        <div className="flex justify-center w-full">
          <Link to="/" aria-label="Go to home">
            <img
              src={Logo}
              alt="Logo"
              className="h-15 w-15 rounded-lg object-cover"
            />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r shadow-xl flex flex-col rounded-r-2xl">
            {/* Sidebar Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" aria-label="Go to home" onClick={() => setSidebarOpen(false)}>
                <img
                  src={Logo}
                  alt="Logo"
                  className="h-15 w-15 rounded-lg object-cover"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-red-100"
              >
                <X className="h-10 w-10 text-[#177385]-500" />
              </Button>
            </div>

            {/* User Info - Mobile */}
            <div className="p-4 border-b">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm truncate">{studentData.name}</h3>
                {/* <p className="text-xs text-muted-foreground truncate">{studentData.email}</p> */}
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  className={`w-full justify-start text-black bg-transparent border border-black/2 ${
                    activeTab === tab.value
                      ? "bg-[#177385] text-white hover:bg-gradient-hero"
                      : "hover:bg-gradient-hero"
                  }`}
                  onClick={() => goToTab(tab.value)}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t space-y-2">
              <Button variant="outline" className="w-full">
                <Bell className="h-4 w-4 mr-2" /> Notifications
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {contentOverride ? (
          <>
            <SectionHeader title={contentOverride.title} student={studentData} />
            {contentOverride.node}
          </>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            <SectionHeader title="Dashboard" student={studentData} />
            <Overview />
          </TabsContent>

          <TabsContent value="courses">
            <SectionHeader title="My Programs" student={studentData} />
            <ProgramsPage />
          </TabsContent>

          <TabsContent value="assessments">
            <SectionHeader title="Assessments" student={studentData} />
            <Assessment />
          </TabsContent>

          <TabsContent value="certificates">
            <SectionHeader title="Certificates" student={studentData} />
            <Certificate />
          </TabsContent>

          <TabsContent value="profile">
            <SectionHeader title="Profile" student={studentData} />
            <ProfilePage />
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;