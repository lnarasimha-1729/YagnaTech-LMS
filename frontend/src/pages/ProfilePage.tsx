import { useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, updateEducation, updateOrgClgBranch } from "@/api/authApi";
import { getMyPreAssessmentRegistration } from "@/api/preAssessmentRegistrationApi";
import { CollegeContext } from "@/context/CollegeContext"; // Import CollegeContext
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Building2,
  GraduationCap,
  Loader2,
  Search,
  Check,
  X
} from "lucide-react";
import type { College } from "@/context/CollegeContext";

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

// Date-of-Birth picker. Backend persists DOB as a DATEONLY column
// (YYYY-MM-DD), so the picker's external value stays in that wire format and
// only the rendered text is humanized. Year/month dropdowns make picking a
// birth year practical without hammering the prev-month arrow.
function DobPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const minDate = new Date(1900, 0, 1);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  // Friendly "27 years old" hint — only when a valid past date is set.
  const ageHint = (() => {
    if (!selected) return null;
    const now = today;
    let years = now.getFullYear() - selected.getFullYear();
    const m = now.getMonth() - selected.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < selected.getDate())) years -= 1;
    return years >= 0 && years < 130 ? `${years} years old` : null;
  })();

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      {/* Style the month/year <select> dropdowns rendered by
          react-day-picker's caption_dropdowns layout. The shadcn Calendar
          wrapper doesn't expose a className hook for these, so we scope
          rules to .dob-popover and they don't leak elsewhere. */}
      <style>{`
        .dob-popover .rdp-dropdown {
          appearance: none;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--input));
          border-radius: 0.375rem;
          padding: 0.25rem 1.75rem 0.25rem 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23177385' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
        }
        .dob-popover .rdp-dropdown:focus {
          outline: none;
          border-color: #177385;
          box-shadow: 0 0 0 2px rgba(23, 115, 133, 0.25);
        }
        .dob-popover .rdp-dropdown_year { min-width: 5rem; }
        .dob-popover .rdp-dropdown_month { min-width: 7rem; }
        .dob-popover .rdp-caption_dropdowns {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
      `}</style>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group relative flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left transition-colors",
            "hover:border-[#177385]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#177385]/40 focus-visible:border-[#177385]",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-input",
            open && "border-[#177385] ring-2 ring-[#177385]/30"
          )}
          aria-label="Select date of birth"
        >
          <Calendar
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              selected ? "text-[#177385]" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "flex-1 truncate",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? format(selected, "PPP") : "Select your date of birth"}
          </span>
          {ageHint && (
            <span className="hidden sm:inline-block text-xs text-muted-foreground bg-[#177385]/10 text-[#177385] px-2 py-0.5 rounded-full">
              {ageHint}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 rounded-lg shadow-lg border-border dob-popover"
        align="start"
        sideOffset={6}
      >
        <CalendarPicker
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "");
            if (d) setOpen(false);
          }}
          defaultMonth={selected ?? new Date(2000, 0, 1)}
          disabled={(date) => date > today || date < minDate}
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={today.getFullYear()}
          initialFocus
          className="p-0"
          classNames={{
            caption: "flex justify-center pt-1 pb-2 relative items-center",
            caption_label: "hidden",
            caption_dropdowns: "flex gap-2 items-center",
            vhidden: "hidden",
            nav: "space-x-1 flex items-center",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-10 font-medium text-[0.75rem]",
            row: "flex w-full mt-1",
            cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-10 w-10 p-0 font-normal rounded-md hover:bg-[#177385]/10 aria-selected:opacity-100",
            day_selected:
              "bg-[#177385] text-white hover:bg-[#177385] hover:text-white focus:bg-[#177385] focus:text-white",
            day_today:
              "border border-[#177385]/60 text-[#177385] font-semibold",
            day_outside: "text-muted-foreground/40",
            day_disabled: "text-muted-foreground/30 cursor-not-allowed",
          }}
        />
        <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-border/60">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            disabled={!selected}
          >
            Clear
          </button>
          <button
            type="button"
            className="text-xs font-medium text-[#177385] hover:underline px-2 py-1"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// College picker driven by yagId. The student types their college's 4-char
// public code; only colleges whose yagId matches the typed text are shown, and
// selecting one stores its clgId (what the rest of the app keys on). When no
// code is typed nothing is listed, and a non-matching code shows a clear
// "no college found" message rather than the full list.
function CollegeYagIdPicker({
  colleges,
  value,
  onChange,
  disabled,
}: {
  colleges: College[];
  value: string; // selected clgId
  onChange: (clgId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = colleges.find((c) => c.clgId === value) || null;

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Match by the full yagId only, case-insensitive: the college surfaces once
  // the entire 4-char code is entered and matches exactly. A partial code shows
  // nothing yet. Trimmed so stray spaces don't break it.
  const query = term.trim().toUpperCase();
  const matches = query
    ? colleges.filter((c) => (c.yagId || "").toUpperCase() === query)
    : [];

  const pick = (c: College) => {
    onChange(c.clgId);
    setTerm("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {selected && !open ? (
        // Compact summary of the chosen college; click to change (when editing).
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setTerm(""); setOpen(true); } }}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left",
            "hover:border-[#177385]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#177385]/40",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-700"
          )}
        >
          <span className="flex-1 truncate">
            {selected.clgName}
            {selected.yagId && (
              <span className="ml-2 text-xs font-semibold text-[#177385]">
                {selected.yagId}
              </span>
            )}
          </span>
          {!disabled && (
            <X
              className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            />
          )}
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            disabled={disabled}
            maxLength={4}
            placeholder="Enter your college code (e.g. AB12)"
            className="h-11 pl-9 uppercase placeholder:text-gray-400 placeholder:normal-case"
            onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-white shadow-lg">
          {matches.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1 text-sm">
              {matches.map((c) => (
                <li key={c.clgId}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#177385]/10"
                  >
                    <span className="flex-1 truncate">
                      <span className="text-dark">{c.clgName}</span>
                      <span className="ml-1 text-xs text-gray-500">({c.clgId})</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#177385]">
                      {c.yagId}
                      {c.clgId === value && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-xs text-amber-700">
              {query.length === 0
                ? "Type your 4-character college code to find your college."
                : query.length < 4
                  ? "Keep typing your 4-character college code…"
                  : "No college found for this code. Check it with your college admin."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const ProfilePage = () => {
  const { user, loading, checkAuth } = useAuth();
  const collegeCtx = useContext(CollegeContext);
  const { colleges, branches, refresh: refreshColleges } = collegeCtx || { colleges: [], branches: [] };

  // CollegeProvider caches the colleges/branches list at the app root and only
  // fetches once on mount. So when an admin deletes a college on another tab
  // (or in another browser session) the profile dropdown keeps the stale row
  // until full page reload. Refresh every time the profile page mounts so the
  // dropdown always reflects current DB state.
  useEffect(() => {
    refreshColleges?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Program the student picked during pre-assessment registration. When this
  // exists it overrides users.programInterested so the profile mirrors the
  // selection on file, and the field switches to read-only.
  const [registeredProgram, setRegisteredProgram] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyPreAssessmentRegistration();
        const reg = res.data?.data;
        if (!cancelled && reg?.selectedProgram) {
          setRegisteredProgram(reg.selectedProgram);
        }
      } catch {
        // No registration on file or service unreachable — fall back silently
        // to whatever users.programInterested held.
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        programInterested: registeredProgram ?? user.programInterested ?? ""
      });
      setHasLoadedData(true);
    }
  }, [user, loading, hasLoadedData, registeredProgram]);

  // Once the pre-registration program arrives (after first form hydration),
  // back-fill the field so the user sees the registered program even if it
  // wasn't on users.programInterested yet.
  useEffect(() => {
    if (registeredProgram) {
      setFormData((prev) => ({ ...prev, programInterested: registeredProgram }));
    }
  }, [registeredProgram]);

  // Persist the registration's program to users.programInterested whenever
  // the two are out of sync. The field is read-only in the UI, so without
  // this the column would never catch up to the registered selection.
  // Fires once per (user, registeredProgram) pair — guarded by both values
  // being present and different from the current DB row.
  const [didSyncRegProgram, setDidSyncRegProgram] = useState(false);
  useEffect(() => {
    if (
      user &&
      registeredProgram &&
      registeredProgram !== (user.programInterested ?? "") &&
      !didSyncRegProgram
    ) {
      setDidSyncRegProgram(true);
      (async () => {
        try {
          // Only programInterested — backend uses `?? user.x` for the other
          // optional fields, so omitting them leaves the row untouched.
          await updateEducation({ programInterested: registeredProgram });
          await checkAuth();
        } catch {
          // Silent — the next manual Save Changes will retry the write.
          setDidSyncRegProgram(false);
        }
      })();
    }
  }, [user, registeredProgram, didSyncRegProgram, checkAuth]);

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
        programInterested: registeredProgram ?? user.programInterested ?? ""
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
              <DobPicker
                value={formData.dob}
                disabled={!isEditing}
                onChange={(v) => handleInputChange('dob', v)}
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
                className="w-full border rounded px-2 py-2 placeholder:text-gray-400"
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
                className="placeholder:text-gray-400"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Building2 className="h-4 w-4 text-[#177385]" /> College / Organization
              </Label>
              {/* Bound to clgId — the College Admin dashboard matches
                  student.collegeId against admin.college_id, so a free-text
                  college name would never aggregate. Students find their
                  college by entering its 4-char yagId code. */}
              <CollegeYagIdPicker
                colleges={colleges}
                value={
                  // If the saved college no longer exists in the DB (admin
                  // deleted it), don't render the orphan id so the user is
                  // prompted to pick a valid current option.
                  formData.college && colleges.some((c) => c.clgId === formData.college)
                    ? formData.college
                    : ''
                }
                onChange={(clgId) => handleInputChange('college', clgId)}
                disabled={!isEditing}
              />
              {isEditing &&
                formData.college &&
                !colleges.some((c) => c.clgId === formData.college) && (
                  <p className="text-xs text-amber-700">
                    Your previous college is no longer available. Please pick a new one.
                  </p>
                )}
              {/* "Others" college: the student typed a free-text college name at
                  signup (no YagnaTech ID / collegeId). Show it so their entry is
                  visible; they can still pick a listed college above to link one. */}
              {!formData.college && user?.collegeName && (
                <p className="text-sm text-gray-700">
                  College (entered): <span className="font-medium">{user.collegeName}</span>
                </p>
              )}
              {isEditing && colleges.length === 0 && !formData.college && (
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
                // When the student already picked a program during
                // pre-assessment registration, that selection is the source of
                // truth — lock the field so the two records can't drift.
                disabled={!isEditing || !!registeredProgram}
                placeholder="Elite AI Residency"
                className="placeholder:text-gray-400"
              />
              {registeredProgram && (
                <p className="text-xs text-gray-500">
                  Selected during pre-assessment registration.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        
      </div>
    </section>
  );
};

export default ProfilePage;