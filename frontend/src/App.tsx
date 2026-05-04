import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { CollegeProvider } from "./context/CollegeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Register from "./pages/RegisterForm";
import FAQs from "./pages/FAQs";
import Students from "./pages/Students";
import Colleges from "./pages/Colleges";
import Companies from "./pages/Companies";
import StudentDashboard from "./pages/StudentDashboard";
import ProgramsPage from "./pages/Programspage";
import ProgramSelect from "./pages/ProgramSelect";
import CoursePrograms from "./pages/CoursePrograms";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import CoursePlayer from "./pages/CoursePlayer";
import ProgramDetailPage from "./pages/ProgramDetailPage";
import PreAssessmentPage from "./pages/PreAssessmentPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AssessmentDetails from "./pages/PreAssessment";
import PreAssessment from "./pages/PreAssessment";
import PostAssessmentPage from "./pages/PostAssessmentPage";
import PostAssessment from "./pages/PostAssessment";

// Admin section (copied from mern-admin/frontend, talks to admin-service on :4000)
import AdminAppLayout from "./admin/layouts/AdminLayout";
import AdminDash from "./admin/pages/dashboard/Index";
import AdminCategoryIndex from "./admin/pages/category/Index";
import AdminCourseIndex from "./admin/pages/course/Index";
import AdminCourseCreate from "./admin/pages/course/Create";
import AdminCourseEdit from "./admin/pages/course/Edit";
import AdminCouponIndex from "./admin/pages/coupon/Index";
import AdminCertificateIndex from "./admin/pages/certificate/Index";
import AdminCollegeDashboard from "./admin/pages/college/Dashboard";
import AdminCertificateSettings from "./admin/pages/certificate/Settings";
import AdminCertificateBuilder from "./admin/pages/certificate/Builder";
import CertificateDownloadPage from "./admin/pages/certificate/Download";
import AdminStudentIndex from "./admin/pages/student/Index";
import AdminStudentCreate from "./admin/pages/student/Create";
import AdminListIndex from "./admin/pages/admin/Index";
import AdminCreate from "./admin/pages/admin/Create";
import AdminEditPage from "./admin/pages/admin/Edit";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <AuthProvider>
          <CollegeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/faqs" element={<Layout><FAQs /></Layout>} />
            <Route path="/students" element={<Layout><Students /></Layout>} />
            <Route path="/colleges" element={<Layout><Colleges /></Layout>} />
            <Route path="/companies" element={<Layout><Companies /></Layout>} />

            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admindashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Admin section — talks to admin-service (port 4000) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDash />} />
              <Route path="dashboard" element={<AdminDash />} />
              <Route path="college" element={<AdminCollegeDashboard />} />
              <Route path="categories" element={<AdminCategoryIndex />} />
              <Route path="courses" element={<AdminCourseIndex />} />
              <Route path="course/create" element={<AdminCourseCreate />} />
              <Route path="course/edit/:id" element={<AdminCourseEdit />} />
              <Route path="coupons" element={<AdminCouponIndex />} />
              <Route path="certificates" element={<AdminCertificateIndex />} />
              <Route path="certificate" element={<AdminCertificateSettings />} />
              <Route path="students" element={<AdminStudentIndex />} />
              <Route path="students/create" element={<AdminStudentCreate />} />
              <Route path="admins" element={<AdminListIndex />} />
              <Route path="admins/create" element={<AdminCreate />} />
              <Route path="admins/edit/:id" element={<AdminEditPage />} />
            </Route>

            {/* Certificate builder — full screen, no admin chrome (mirrors admin/certificate/builder.blade.php) */}
            <Route
              path="/admin/certificate/builder"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCertificateBuilder />
                </ProtectedRoute>
              }
            />

            {/* Public certificate download (mirrors curriculum/certificate/download.blade.php) */}
            <Route path="/certificate/:identifier" element={<CertificateDownloadPage />} />
            <Route
              path="/preassessment"
              element={
                <ProtectedRoute>
                  <PreAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/postassessment"
              element={
                <ProtectedRoute>
                  <PostAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/preassessment/:assessmentId"
              element={
                <ProtectedRoute>
                  <PreAssessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/postassessment/:assessmentId"
              element={
                <ProtectedRoute>
                  <PostAssessment />
                </ProtectedRoute>
              }
            />


            <Route
              path="/programs"
              element={
                <ProtectedRoute>
                  <ProgramsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programs/select"
              element={
                <ProtectedRoute>
                  <StudentDashboard contentOverride={{ title: "Programs", node: <ProgramSelect /> }} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/programs"
              element={
                <ProtectedRoute>
                  <CoursePrograms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/programs/course-details"
              element={
                <ProtectedRoute>
                  <CourseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/programs/course-details/play/:slug"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/programs/course-details/play/:slug/:lessonId"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/programdetail"
              element={
                <ProtectedRoute>
                  <ProgramDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CollegeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;