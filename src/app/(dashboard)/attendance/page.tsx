import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AttendanceHub } from "@/components/attendance/AttendanceHub";

export default async function AttendancePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Attendance & Check-in"
        subtitle="Dynamic QR codes, numeric passcodes, presence auditing, and justifications"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <AttendanceHub currentUser={user} />
      </div>
    </div>
  );
}
