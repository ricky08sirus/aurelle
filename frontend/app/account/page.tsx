import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AccountView } from "@/components/auth/account-view";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <AuthCard title="My account" subtitle="Your Aurelle details.">
      <AccountView />
    </AuthCard>
  );
}