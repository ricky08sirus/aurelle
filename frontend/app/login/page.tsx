import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Login to your Aurelle account.">
      <LoginForm />
    </AuthCard>
  );
}