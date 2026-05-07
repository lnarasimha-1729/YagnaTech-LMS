import { useEffect, useState, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, BookOpen, FileText, Clock, ChevronRight, Activity, Star } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { AssessmentContext } from "../context/AssessmentContext";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { getProfile } from "@/api/authApi"

// Use the admin-service URL like every other public courses call. Override via
// VITE_ADMIN_API_URL if a different backend is needed.
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:4000";

const Overview = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { assessments, loading: assessmentLoading } = useContext(AssessmentContext) || {};
  const [studentName, setStudentName] = useState("Student");
  const [activePrograms, setActivePrograms] = useState([]);
  const [completedPrograms, setCompletedPrograms] = useState([]);
  const [certificates, setCertificates] = useState([]);
  // Authoritative counts for the three KPI cards. Fetched from the
  // /api/public/student/overview-stats endpoint which keys on x-user-id.
  const [stats, setStats] = useState({ active_programs: 0, completed_programs: 0, certificates: 0 });
  const [profile, setProfile] = useState(null);
const [loadingProfile, setLoadingProfile] = useState(true);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Get display name - fallback to email if name doesn't exist
  const getDisplayName = () => {
    if (!user) return "Student";
    return user.name || user.email || "Student";
  };

  useEffect(() => {
    if (location.state?.userName) {
      setStudentName(location.state.userName);
      localStorage.setItem("userName", location.state.userName);
    } else if (user) {
      setStudentName(getDisplayName());
    } else {
      const name = localStorage.getItem("userName");
      if (name) setStudentName(name);
    }
  }, [location.state, user]);

  // Fetch top courses and categorize them
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await axios.get(`${ADMIN_BASE}/api/public/courses`);
        const courses = Array.isArray(res.data?.data) ? res.data.data : [];
        setActivePrograms(courses.filter(c => Number(c.total_enrollment) > 0 && c.status === "active"));
        setCompletedPrograms(courses.filter(c => Number(c.total_enrollment) > 0 && c.status === "completed"));
        setCertificates(courses.filter(c => Number(c.total_reviews) > 0));
      } catch (err) {
        setActivePrograms([]);
        setCompletedPrograms([]);
        setCertificates([]);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
  async function fetchUserProfile() {
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }
  fetchUserProfile();
}, []);

  // Fetch the authoritative KPI counts for this student. Stored userId is the
  // same one /api/public/* endpoints key on (set by AuthProvider after login).
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    axios
      .get(`${ADMIN_BASE}/api/public/student/overview-stats`, {
        headers: { "x-user-id": userId },
      })
      .then((res) => setStats(res.data || { active_programs: 0, completed_programs: 0, certificates: 0 }))
      .catch(() => {
        // Endpoint missing or backend down — leave stats at the default zeroes.
      });
  }, []);


  // KPI counts come from /api/public/student/overview-stats (authoritative,
  // keyed on the logged-in student's userId), not from the public courses list.
  const quickStats = [
    { label: "Active Programs", value: stats.active_programs, icon: BookOpen, color: "bg-blue-500" },
    { label: "Completed Programs", value: stats.completed_programs, icon: FileText, color: "bg-green-500" },
    { label: "Certificates", value: stats.certificates, icon: Award, color: "bg-orange-500" },
  ];

  // Find pre and post assessment scores for the current user
  const preAssessment = assessments?.find(a => a.type === "pre" && user && a.setId && a.setId.toLowerCase().includes("ai"));
  const postAssessment = assessments?.find(a => a.type === "post" && user && a.setId && a.setId.toLowerCase().includes("ai"));

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-hero text-white rounded-xl p-6 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-sm opacity-90">{formattedDate}</p>
          <h2 className="text-3xl font-bold mt-2">Welcome back, {studentName}!</h2>
          <p className="text-sm opacity-90">Always stay updated in your student portal</p>
        </div>
        <div className="hidden md:block">
          <div className="w-30 h-30 bg-white/20 rounded-full flex items-center justify-center">
            <Clock className="h-20 w-auto text-white" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={stat.label} className="rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-hero">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Programs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-lg border-0 min-h">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#177385]">
                <BookOpen className="h-5 w-5 text-[#177385]" />
                Active Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activePrograms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No active programs. Enroll to start learning!</p>
                  </div>
                ) : (
                  activePrograms.map((program, index) => (
                    <div key={program.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-[#177385] rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-lg font-medium">{program.title}</p>
                        <p className="text-sm text-gray-500">{program.short_description}</p>
                      </div>
                      <p className="text-sm font-medium rounded-full px-3 py-1 border border-black/20 bg-[#177385] text-white">
                        Enrolled: {program.total_enrollment}
                      </p>
                      <ChevronRight className="h-4 w-4 text-black-400" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Completed Programs */}
          <Card className="rounded-2xl shadow-lg border-0 min-h">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <FileText className="h-5 w-5 text-green-700" />
                Completed Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedPrograms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No completed programs yet.</p>
                  </div>
                ) : (
                  completedPrograms.map((program, index) => (
                    <div key={program.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-lg font-medium">{program.title}</p>
                        <p className="text-sm text-gray-500">{program.short_description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-black-400" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="rounded-2xl shadow-lg border-0 min-h">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Award className="h-5 w-5 text-orange-700" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No certificates yet.</p>
                  </div>
                ) : (
                  certificates.map((program, index) => (
                    <div key={program.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-orange-700 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-lg font-medium">{program.title}</p>
                        <p className="text-sm text-gray-500">{program.short_description}</p>
                      </div>
                      <Button size="sm" className="bg-orange-700 text-white hover:bg-orange-800">
                        Download Certificate
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Pre-Assesment Score */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-green-700 text-base">
      <Award className="h-4 w-4" />
      Pre-Assessment Score
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-center">
      {loadingProfile ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : profile?.preScore !== null && profile?.preScore !== undefined ? (
        <>
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-gray-600">
              Score : {profile.preScore}
            </span>
          </div>
        </>
      ) : (
        <div className="text-gray-500">No Pre-Assessment score</div>
      )}
    </div>
  </CardContent>
</Card>


          {/* Post-Assesment Score */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-green-700 text-base">
      <Award className="h-4 w-4" />
      Post-Assessment Score
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-center">
      {loadingProfile ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : profile?.postScore !== undefined && profile?.postScore !== null ? (
        <>

          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-gray-600">
              Score : {profile.postScore}
            </span>
          </div>
        </>
      ) : (
        <div className="text-gray-500">No Post-Assessment score</div>
      )}
    </div>
  </CardContent>
</Card>

        </div>
      </div>
    </div>
  );
};

export default Overview;

// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { CreditCard, BarChart, Coins, Laptop, TargetIcon } from "lucide-react";
// import { BookOpen, FileText, TrendingUp } from "lucide-react";
// import { Clock, Activity, ChevronRight, Award, Star } from "lucide-react";
// import { useEffect, useState, useContext } from "react";
// import { AuthContext } from "../context/AuthContext";
// import { useLocation } from "react-router-dom";
// import axios from "axios";


// const Overview = () => {
//   const location = useLocation();
//   const { user } = useContext(AuthContext); // Get user from AuthContext
//   const [studentName, setStudentName] = useState("Student");
//   const today = new Date();
//   const formattedDate = today.toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric"
//   });

//   // Get display name - fallback to email if name doesn't exist
//   const getDisplayName = () => {
//     if (!user) return "Student";
//     return user.name || user.email || "Student";
//   };

//   useEffect(() => {
//     // Prefer name from navigation state, else from context, else from localStorage
//     if (location.state?.userName) {
//       setStudentName(location.state.userName);
//       localStorage.setItem("userName", location.state.userName);
//     } else if (user) {
//       setStudentName(getDisplayName());
//     } else {
//       const name = localStorage.getItem("userName");
//       if (name) setStudentName(name);
//     }
//   }, [location.state, user]);

//   const quickStats = [
//     { label: "Active Programs", value: 1, icon: BookOpen, color: "bg-blue-500" },
//     { label: "Completed Programs", value: 1, icon: FileText, color: "bg-green-500" },
//     { label: "Certificates", value: 1, icon: Award, color: "bg-orange-500" },
//     // { label: "My Doubts", value: 1, icon: TrendingUp, color: "bg-purple-500" },
//   ];

//   const recentActivities = [
//     { title: "Elite AI Residency", status: "In Progress" },
//     // { title: "Checked upcoming exam schedule", created_at: "2024-08-22T14:15:00Z" },
//     // { title: "Submitted Post Assignment", created_at: "2024-08-25T09:00:00Z" },
//   ];

//   const activeProgram = {
//     title: "Web Development Fundamentals",
//     progress: 75,
//     instructor: "Sarah Johnson",
//     nextClass: "2024-01-15 10:00 AM"
//   };
  

//   return (
//     <div className="p-6 space-y-6">
//       {/* Welcome Banner */}
//       <div className="bg-gradient-hero text-white rounded-xl p-6 flex items-center justify-between shadow-lg">
//         <div>
//           <p className="text-sm opacity-90">{formattedDate}</p>
//           <h2 className="text-3xl font-bold mt-2">Welcome back, {studentName}!</h2>
//           <p className="text-sm opacity-90">Always stay updated in your student portal</p>
//         </div>
//        <div className="hidden md:block">
//               <div className="w-30 h-30 bg-white/20 rounded-full flex items-center justify-center">
//                 <TargetIcon className="h-20 w-auto text-white" />
//               </div>
//             </div>
//       </div>

//        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {quickStats.map((stat, index) => (
//             <Card key={stat.label} className="rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
//                   </div>
//                   <div className="p-3 rounded-xl bg-gradient-hero">
//                     <stat.icon className="h-6 w-6 text-white" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
   
//        {/* Main Content Grid */}
// <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//   {/* Recent Activities - span 2 cols, full height */}
//   <div className="lg:col-span-2 space-y-6">
//     <Card className="rounded-2xl shadow-lg border-0 min-h">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-[#177385]">
//           <Clock className="h-5 w-5 text-[#177385]" />
//           Active Programs
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           {recentActivities.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
//               <p>No recent activities. Start by asking a doubt or checking your schedule!</p>
//             </div>
//           ) : (
//             recentActivities.map((activity, index) => (
//               <div
//                 key={index}
//                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 <div className="w-2 h-2 bg-[#177385] rounded-full"></div>
//                 <div className="flex-1">
//                   <p className="text-lg font-medium">{activity.title}</p>
                 
//                 </div>
//                  <p className="text-sm font-medium rounded-full px-3 py-1 border border-black/20 bg-[#177385] text-white">
//                      Status: {activity.status}
//                   </p>
//                 <ChevronRight className="h-4 w-4 text-black-400" />
//               </div>
//             ))
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   </div>

//   {/* Sidebar Content */}
//   <div className="space-y-6">
//     {/* Account Status */}
//     <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-green-700 text-base">
//           <Award className="h-4 w-4" />
//           Pre-Assesment Score
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="text-center">
//           <div className="text-lg font-semibold text-green-600">Passed</div>
//           <div className="text-sm text-gray-600 mt-1">Elite AI Residency Program</div>
//           <div className="flex items-center justify-center mt-2">
//             <Star className="h-4 w-4 text-yellow-500 mr-1" />
//             <span className="text-sm text-gray-600">Score : 85%</span>
//           </div>
//         </div>
//       </CardContent>
//     </Card>

//      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-green-700 text-base">
//           <Award className="h-4 w-4" />
//           Post-Assesment Score
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="text-center">
//           <div className="text-lg font-semibold text-green-600">Passed</div>
//           <div className="flex items-center justify-center mt-2">
//             <Star className="h-4 w-4 text-yellow-500 mr-1" />
//             <span className="text-sm text-gray-600">Score : 75%</span>
//           </div>
//           <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Download Certificate</button>
//         </div>
//       </CardContent>
//     </Card>
//   </div>

  
// </div>

// </div>
//   );
// };

// export default Overview;

