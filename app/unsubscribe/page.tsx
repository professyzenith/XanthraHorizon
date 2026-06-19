import { Suspense } from "react";
import UnsubscribeContent from "./UnsubscribeContent";

export const metadata = {
  title: "Unsubscribe — Xanthra Horizon",
  description: "Manage your Xanthra Horizon subscription.",
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#060504] flex items-center justify-center px-6">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#52473a] text-sm">Processing…</p>
        </div>
      }>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
