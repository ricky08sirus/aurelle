import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Join Aurelle in a few seconds.">
      <RegisterForm />
    </AuthCard>
  );
}
