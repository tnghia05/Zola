"use client";

import { Suspense } from "react";
import OTPVerification from "@zola/app/features/auth/OTPVerification.web";

function OTPVerificationContent() {
  return <OTPVerification />;
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#e4e6eb' }}>Đang tải...</div>}>
      <OTPVerificationContent />
    </Suspense>
  );
}

