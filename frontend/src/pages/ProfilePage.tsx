import { useState, useEffect, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, updateEducation, updateOrgClgBranch } from "@/api/authApi";
import { CollegeContext } from "@/context/CollegeContext"; // Import CollegeContext
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Building2,
  GraduationCap,
  Loader2
} from "lucide-react";

interface ProfileFormData {
  email: string;
  name: string;
  phone: string;
  dob: string;
  branch: string;
  yearOfStudy: string;
  college: string;
  programInterested: string;
}

const ProfilePage = () => {
  const { user, loading, checkAuth } = useAuth();
  const { colleges, branches } = useContext(CollegeContext) || { colleges: [], branches: [] };
  const [formData, setFormData] = useState<ProfileFormData>({
    email: "",
    name: "",
    phone: "",
    dob: "",
    branch: "",
    yearOfStudy: "",
    college: "",
    programInterested: ""
  });

  console.log(user);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (user && !hasLoadedData) {
      setFormData({
        email: user.email || "",
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob || "",
        branch: user.branchId ?? "", // <-- use ?? for null fallback
        yearOfStudy: user.yearOfStudy !== undefined && user.yearOfStudy !== null
          ? user.yearOfStudy.toString()
          : user.yearOfEducation !== undefined && user.yearOfEducation !== null
            ? user.yearOfEducation.toString()
            : "",
        college: user.collegeId ?? "",
        programInterested: user.programInterested ?? ""
      });
      setHasLoadedData(true);
    }
  }, [user, loading, hasLoadedData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      // 1. Update basic profile information
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob
      });


      // 2. Update education information
      await updateEducation({
        yearOfEducation: parseInt(formData.yearOfStudy) || 0,
        yearOfStudy: parseInt(formData.yearOfStudy) || 0,
        programInterested: formData.programInterested
      });

      // 3. Update organization/college/branch information
      await updateOrgClgBranch({
        orgId: "ORG456", // Make dynamic if needed
        collegeId: formData.college,
        branchId: formData.branch
      });

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);

      // Refresh user data to show updated information
      await checkAuth();
    } catch (error: unknown) {
      let errorMsg = "Failed to update profile.";
      if (typeof error === "object" && error !== null) {
        if (
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } }).response === "object"
        ) {
          errorMsg = (error as { response?: { data?: { error?: string } } }).response?.data?.error || errorMsg;
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }
      }
      setSaveMessage(`Failed to update profile: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        email: user.email || "",
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob || "",
        branch: user.branchId ?? "",
        yearOfStudy: user.yearOfStudy !== undefined && user.yearOfStudy !== null
          ? user.yearOfStudy.toString()
          : user.yearOfEducation !== undefined && user.yearOfEducation !== null
            ? user.yearOfEducation.toString()
            : "",
        college: user.collegeId ?? "",
        programInterested: user.programInterested ?? ""
      });
    }
    setIsEditing(false);
    setSaveMessage("");
  };

  if (loading && !user) {
    return (
      <section className="section-padding bg-gradient-subtle py-4">
        <div className="container-ngo max-w-4xl mx-auto flex justify-center items-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#177385]" />
            <p className="mt-2 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section-padding bg-gradient-subtle py-4">
        <div className="container-ngo max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No User Data</h2>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-gradient-subtle py-4">
      <div className="container-ngo max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Student Profile
          </h2>
          <p className="text-gray-600 mt-1">Manage your profile information</p>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-md ${saveMessage.includes("success")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
            }`}>
            {saveMessage}
          </div>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#177385] flex items-center justify-center text-white">
            <User className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">
            {user.name}
          </h3>
        </div>

        <div className="flex justify-between">
        <div className="bg-[#177385]/10 text-[#177385] text-sm font-medium px-4 py-2 rounded-full inline-block mb-6">
          {user.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account` : "Student Account"}
        </div>
        <div className="flex justify-end gap-4">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#177385] text-white hover:bg-[#135f6e]"
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#177385] text-white hover:bg-[#135f6e]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </>
          )}
        </div>
        </div>
        

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-[#177385]" /> Email Address
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-[#177385]" /> Full Name
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-[#177385]" /> Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-[#177385]" /> Date of Birth
              </Label>
              <Input
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <BookOpen className="h-4 w-4 text-[#177385]" /> Branch / Stream
              </Label>
              <Input
                value={formData.branch}
                onChange={e => handleInputChange('branch', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter Branch / Stream"
                className="w-full border rounded px-2 py-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <GraduationCap className="h-4 w-4 text-[#177385]" /> Year of Study
              </Label>
              <Input
                value={formData.yearOfStudy}
                onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                disabled={!isEditing}
                placeholder="Final Year"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Building2 className="h-4 w-4 text-[#177385]" /> College / Organization
              </Label>
              {/* Must be a select bound to clgId — the College Admin dashboard
                  matches student.collegeId against admin.college_id, so a
                  free-text college name would never aggregate correctly. */}
              <select
                value={formData.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded px-2 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-700"
              >
                <option value="">-- Select your college --</option>
                {colleges.map((c) => (
                  <option key={c.clgId} value={c.clgId}>
                    {c.clgName} ({c.clgId})
                  </option>
                ))}
                {/* If the saved value isn't in the list (legacy free-text data),
                    keep it visible so the student knows what was there before
                    they had to pick a real one. */}
                {formData.college &&
                  !colleges.some((c) => c.clgId === formData.college) && (
                    <option value={formData.college}>
                      {formData.college} (not in list — please reselect)
                    </option>
                  )}
              </select>
              {isEditing && colleges.length === 0 && (
                <p className="text-xs text-amber-700">
                  No colleges loaded. Ask the admin to add your college first.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-[#177385]" /> Program Interested
              </Label>
              <Input
                value={formData.programInterested}
                onChange={(e) => handleInputChange('programInterested', e.target.value)}
                disabled={!isEditing}
                placeholder="Elite AI Residency"
              />
            </CardContent>
          </Card>
        </div>

        
      </div>
    </section>
  );
};

export default ProfilePage;