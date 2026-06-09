import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CollegeContext } from "@/context/CollegeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ArrowLeft, Users, Award, Globe } from "lucide-react";
import Logo from "@/assets/YagnaTechWM.png";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Academic Information (all optional)
    educationLevel: "",
    branch: "",
    collegeName: "",
    graduationYear: "",
    collegeCode: ""
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  // College entry: by default the student types their YagnaTech ID, which we
  // resolve to a college as they type. If they have none, they switch to
  // "Others" and type a college name. isOther toggles between the two modes.
  const [isOther, setIsOther] = useState(false);

  const collegeCtx = useContext(CollegeContext);
  const colleges = collegeCtx?.colleges ?? [];

  const { registerUser, loading } = useAuth();
  const navigate = useNavigate();

  // The college whose YagnaTech ID (yagId) exactly matches what was typed
  // (case-insensitive). null while typing / no match.
  const matchedCollege = (() => {
    const code = formData.collegeCode.trim().toUpperCase();
    if (!code) return null;
    return colleges.find((c) => (c.yagId || "").toUpperCase() === code) || null;
  })();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setApiError("Password must be at least 8 characters long.");
      return;
    }

    // Light validation for optional academic fields (only validate if filled)
    if (formData.graduationYear && !/^\d{4}$/.test(formData.graduationYear.trim())) {
      setApiError("Year of Study / Graduation must be a 4-digit year.");
      return;
    }

    // Resolve the college entry into what the backend expects:
    //  - YagnaTech ID mode -> send the typed code as collegeCode; the backend
    //    links collegeId + canonical name. Adopt the matched name if resolved.
    //  - Others -> send the typed collegeName, no code.
    let collegeCode = "";
    let collegeName = "";
    if (isOther) {
      collegeName = formData.collegeName.trim();
      if (!collegeName) {
        setApiError("Please enter your college name (or enter your YagnaTech ID).");
        return;
      }
    } else {
      collegeCode = formData.collegeCode.trim();
      if (!collegeCode) {
        setApiError("Please enter your YagnaTech ID, or choose Others to type your college name.");
        return;
      }
      collegeName = matchedCollege?.clgName || "";
    }

    try {
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        phone: "1234567890", // temporary default
        dob: "2000-01-01",   // temporary default
        gender: "male",       // temporary default
        // Academic Information — send only non-empty values
        ...(formData.educationLevel && { educationLevel: formData.educationLevel }),
        ...(formData.branch.trim() && { branch: formData.branch.trim() }),
        ...(collegeName && { collegeName }),
        ...(formData.graduationYear.trim() && { graduationYear: formData.graduationYear.trim() }),
        ...(collegeCode && { collegeCode })
      };

      await registerUser(payload);
      setApiSuccess("Account created successfully! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const errorObj = err as { response?: { data?: { error?: string; message?: string } } };
        setApiError(
          errorObj.response?.data?.error ||
          errorObj.response?.data?.message ||
          "Signup failed"
        );
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Signup failed");
      }
    }
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

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="w-3/4 mx-auto">
            <img
              src={Logo}
              alt="Learning Journey"
              className="w-80 h-auto rounded-lg object-contain"
            />
          </div>


          {/* Right Side - Signup Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="card-ngo border-0 shadow-lg">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="firstName"
                          placeholder="First name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="lastName"
                          placeholder="Last name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
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
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
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
                        tabIndex={-1}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* === Academic Information (all fields optional) === */}
                  <div className="space-y-4 pt-2 border-t">
                    <h3 className="text-sm font-semibold text-foreground pt-2">
                      Academic Information <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="educationLevel">Current Education Level</Label>
                      <Select
                        value={formData.educationLevel}
                        onValueChange={(value) => handleInputChange("educationLevel", value)}
                        disabled={loading}
                      >
                        <SelectTrigger id="educationLevel">
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inter">Intermediate</SelectItem>
                          <SelectItem value="bachelor">Bachelor's</SelectItem>
                          <SelectItem value="master">Master's</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch / Stream</Label>
                      <Input
                        id="branch"
                        placeholder="e.g. Computer Science"
                        value={formData.branch}
                        onChange={(e) => handleInputChange("branch", e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {!isOther ? (
                      <div className="space-y-2">
                        <Label htmlFor="collegeCode">YagnaTech ID</Label>
                        <Input
                          id="collegeCode"
                          placeholder="Enter your YagnaTech ID (e.g. AB12)"
                          maxLength={4}
                          value={formData.collegeCode}
                          onChange={(e) => handleInputChange("collegeCode", e.target.value.toUpperCase())}
                          disabled={loading}
                          className="uppercase placeholder:normal-case"
                        />
                        {/* Resolve + show the matched college name as they type. */}
                        {formData.collegeCode.trim() && (
                          matchedCollege ? (
                            <p className="text-xs font-medium text-[#177385]">
                              ✓ {matchedCollege.clgName}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600">
                              No college found for this YagnaTech ID.
                            </p>
                          )
                        )}
                        <button
                          type="button"
                          className="text-xs text-[#177385] underline underline-offset-2"
                          onClick={() => { setIsOther(true); handleInputChange("collegeCode", ""); }}
                          disabled={loading}
                        >
                          Don't have a YagnaTech ID? Choose Others
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="collegeName">College Name (Others)</Label>
                        <Input
                          id="collegeName"
                          placeholder="College / Institution name"
                          value={formData.collegeName}
                          onChange={(e) => handleInputChange("collegeName", e.target.value)}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="text-xs text-[#177385] underline underline-offset-2"
                          onClick={() => { setIsOther(false); handleInputChange("collegeName", ""); }}
                          disabled={loading}
                        >
                          Have a YagnaTech ID? Enter it instead
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Year of Study / Graduation</Label>
                      <Input
                        id="graduationYear"
                        placeholder="e.g. 2026"
                        inputMode="numeric"
                        maxLength={4}
                        value={formData.graduationYear}
                        onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                        className="mt-1"
                        disabled={loading}
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed">
                        I agree to the{" "}
                        <Button variant="link" className="p-0 h-auto text-sm" disabled={loading}>
                          Terms of Service
                        </Button>{" "}
                        and{" "}
                        <Button variant="link" className="p-0 h-auto text-sm" disabled={loading}>
                          Privacy Policy
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {apiError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {apiError}
                    </div>
                  )}
                  {apiSuccess && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                      {apiSuccess}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-hero border-0" 
                    size="lg"
                    disabled={!agreeToTerms || loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Free Account"
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0 h-auto" asChild disabled={loading}>
                      <Link to="/login">Sign in here</Link>
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Questions about signing up?{" "}
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <Link to="/contact">Get Help</Link>
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;