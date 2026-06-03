import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { login as adminLogin } from "@/admin/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BookOpen, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  ArrowLeft,
  Users,
  Award,
  Globe
} from "lucide-react";
import Logo from "@/assets/YagnaTechWM.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { loginUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Two account stores:
    //   1. auth-service (lucy_devdb.users) — students + admins that signed up via the public form.
    //   2. admin-service (lms_admin.users) — admins created by root via the Add New Admin page.
    //
    // Old behaviour was to try auth-service first, then fall back to admin-service.
    // For root admins (admin-service-only) that meant *every* login waited for an
    // auth-service 401 round-trip before the real call fired. Visible as
    // noticeably slower admin login vs student login.
    //
    // Now we fire both in parallel and use whichever succeeds. The losing call's
    // failure is silently ignored. Students see no extra latency (auth-service
    // answers first or admin-service silently 401s in the background); admins
    // are no longer gated on auth-service's rejection.
    const authPromise = loginUser({ email, password }).then(
      (user) => ({ kind: 'auth' as const, user }),
      (err) => Promise.reject({ kind: 'auth' as const, err })
    );
    const adminPromise = adminLogin(email, password).then(
      (bridge) => ({ kind: 'admin' as const, bridge }),
      (err) => Promise.reject({ kind: 'admin' as const, err })
    );

    let winner:
      | { kind: 'auth'; user: Awaited<ReturnType<typeof loginUser>> }
      | { kind: 'admin'; bridge: Awaited<ReturnType<typeof adminLogin>> }
      | null = null;
    let authError: unknown = null;
    let adminError: unknown = null;

    try {
      // Promise.any resolves with the first fulfilled value; if both reject it
      // throws an AggregateError we surface below.
      winner = await Promise.any([authPromise, adminPromise]);
    } catch (aggErr) {
      const errs = (aggErr as AggregateError).errors || [];
      for (const e of errs) {
        if (e?.kind === 'auth') authError = e.err;
        if (e?.kind === 'admin') adminError = e.err;
      }
    }

    if (winner?.kind === 'auth') {
      const loggedInUser = winner.user;

      // Instructors land on the admin shell with a restricted sidebar
      // (course management only). They have no admin-service login — their
      // auth-service accessToken doubles as the admin_token (both services
      // sign JWTs with the same JWT_SECRET, so admin-service's `auth`
      // middleware verifies the token fine). The admin axios client reads
      // from localStorage 'admin_token' — copy the accessToken there, and
      // populate 'admin_user' so AdminLayout's role-gating works.
      if (loggedInUser.role === "instructor") {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) localStorage.setItem("admin_token", accessToken);
        localStorage.setItem(
          "admin_user",
          JSON.stringify({
            id: loggedInUser.userId,
            userId: loggedInUser.userId,
            email: loggedInUser.email,
            name: loggedInUser.name,
            role: "instructor",
            is_root_admin: false,
          })
        );
        navigate("/admin/courses", { replace: true });
        return;
      }

      // The race might have lost on the admin side — but if this user is an
      // admin we still need a valid admin_token for /admin/* pages. Try the
      // admin bridge in the background; non-fatal if it fails.
      let bridgedAdmin: { role?: string; college_id?: string | null; is_root_admin?: boolean } | null = null;
      if (loggedInUser.role === "admin") {
        try {
          const bridge = await adminLogin(email, password);
          bridgedAdmin = bridge?.user || null;
        } catch (bridgeErr) {
          console.warn("[Login] admin-service bridge failed (college admin?):", bridgeErr);
          if (loggedInUser.collegeId) {
            localStorage.setItem("admin_user", JSON.stringify({
              role: "admin",
              college_id: loggedInUser.collegeId,
              userId: loggedInUser.userId,
              email: loggedInUser.email,
              name: loggedInUser.name,
              // auth-service-only admins are college admins, never root (root
              // lives exclusively in admin-service with role==='root').
              is_root_admin: false,
            }));
          }
        }
      }

      // role==='root' is the source of truth; is_root_admin kept as a fallback
      // for older tokens. (auth-service winners are college admins anyway.)
      const isRootAdmin =
        bridgedAdmin?.role === "root" || bridgedAdmin?.is_root_admin === true;
      const adminLandingPath = isRootAdmin ? "/admin/dashboard" : "/admin/college";
      navigate(loggedInUser.role === "admin" ? adminLandingPath : "/dashboard", { replace: true });
      return;
    }

    if (winner?.kind === 'admin') {
      const adminUser: { college_id?: string | null; role?: string; is_root_admin?: boolean } =
        winner.bridge?.user || {};
      const isRootAdmin = adminUser.role === "root" || adminUser.is_root_admin === true;
      const landing = isRootAdmin ? "/admin/dashboard" : "/admin/college";
      navigate(landing, { replace: true });
      return;
    }

    // Both rejected — surface the most useful message. Prefer auth-service's
    // error since the majority of users come through that path.
    console.error("[Login] both auth-service and admin-service rejected:", { authError, adminError });
    const errAny = (authError ?? adminError) as { response?: { data?: { message?: string; error?: string } } } | undefined;
    setApiError(
      errAny?.response?.data?.message ||
      errAny?.response?.data?.error ||
      "Login failed. Please check your credentials and try again."
    );
  };

  const benefits = [
    {
      icon: BookOpen,
      title: "Access All Courses",
      description: "Unlock our complete library of professional development courses"
    },
    {
      icon: Award,
      title: "Earn Certificates",
      description: "Get recognized certificates upon course completion"
    },
    {
      icon: Users,
      title: "Join Community",
      description: "Connect with fellow learners and mentors worldwide"
    },
    {
      icon: Globe,
      title: "Learn Anywhere",
      description: "Study at your own pace from any device, anywhere"
    }
  ];

   return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container-ngo py-8">
        {/* Back to Home */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="w-3/4 mx-auto">
  <img
    src= {Logo} // replace with your actual image path
    alt="Learning Journey"
    className="w-80 h-auto rounded-lg  object-contain "
  />
</div>
          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="card-ngo border-0 shadow-lg">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        disabled={loading}
                      />
                      <Label htmlFor="remember" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="text-sm p-0 h-auto"
                      disabled={loading}
                      asChild
                    >
                      <Link to="/forgot-password">Forgot password?</Link>
                    </Button>
                  </div>

                  {apiError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {apiError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-hero border-0" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button variant="link" className="p-0 h-auto" asChild disabled={loading}>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;