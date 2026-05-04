import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {User} from "lucide-react";

const SectionHeader = ({ title, student }) => {
  return (
    <div className="flex items-center justify-between border-b pb-3 mb-6">
      {/* Left Title */}
      <h1 className="text-2xl font-bold">{title}</h1>

      {/* Right user info */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Bell className="h-5 w-5 cursor-pointer hover:text-green-600 transition" />

        {/* Student Profile */}
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 ring-2 ring-green-500">
            {/* <AvatarImage src={student.avatar} />
            <AvatarFallback>{student.name[0]}</AvatarFallback> */}
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
