import { Suspense } from "react";
import RegisterForm from "@/app/auth/register/register-form";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
