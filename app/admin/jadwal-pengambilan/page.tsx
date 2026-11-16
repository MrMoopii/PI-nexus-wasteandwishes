"use client";

import { Suspense } from "react";
import SchedulesManagementContent from "./SchedulesManagementContent";

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );
}

export default function SchedulesManagement() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SchedulesManagementContent />
    </Suspense>
  );
}
