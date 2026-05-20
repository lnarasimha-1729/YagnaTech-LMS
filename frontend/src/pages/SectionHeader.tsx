import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { toast } from "react-toastify";
import {
  getMyProgramRequest,
  respondToProgramRequest,
  type ProgramRequest,
} from "@/api/programRequestApi";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const SectionHeader = ({ title, student }) => {
  const navigate = useNavigate();
  const unreadCount = useUnreadNotifications();
  // Program request an admin sent this student, awaiting accept/reject.
  const [request, setRequest] = useState<ProgramRequest | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyProgramRequest()
      .then((r) => { if (alive) setRequest(r); })
      .catch(() => { /* no banner if it can't load */ });
    return () => { alive = false; };
  }, []);

  const respond = async (action: "accept" | "reject") => {
    if (responding) return;
    setResponding(true);
    try {
      await respondToProgramRequest(action);
      setRequest(null); // banner clears once responded
      toast.success(
        action === "accept"
          ? "You accepted the program. Our team will reach out."
          : "You declined the program request."
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Could not submit your response");
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b pb-3 mb-6">
      {/* Left Title */}
      <h1 className="text-2xl font-bold">{title}</h1>

      {/* Right user info */}
      <div className="flex items-center gap-4">
        {/* Program eligibility banner — beside the bell/profile */}
        {request && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-sm text-green-800 m-0">
              🎉 You are eligible for{" "}
              <span className="font-semibold">{request.program}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={responding}
                onClick={() => respond("accept")}
                className="px-3 py-1 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {responding ? "…" : "Accept"}
              </button>
              <button
                type="button"
                disabled={responding}
                onClick={() => respond("reject")}
                className="px-3 py-1 text-sm rounded-md border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Notification Bell — opens the dashboard Notifications tab.
            Shows an unread count badge when there are unseen updates. */}
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          title="Notifications"
          onClick={() => navigate("/dashboard?tab=notifications")}
          className="relative bg-transparent border-0 p-0 cursor-pointer"
        >
          <Bell className="h-5 w-5 text-gray-600 hover:text-green-600 transition" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px] text-center"
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Student Profile */}
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 ring-2 ring-green-500">
            {student.avatar ? (
              <AvatarImage src={student.avatar} />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6 text-black-500" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="hidden sm:block">
            <p className="font-medium">{student.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
