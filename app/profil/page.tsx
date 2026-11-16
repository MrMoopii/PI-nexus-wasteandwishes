import { Suspense } from "react";
import ProfilContent from "@/components/profile/ProfilContent";
import ProfilKerangka from "@/components/profile/ProfilKerangka";

export default function ProfilPage() {
  return (
    <Suspense fallback={<ProfilKerangka />}>
      <ProfilContent />
    </Suspense>
  );
}
