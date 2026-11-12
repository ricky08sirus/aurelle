"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function AccountView() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="rounded-lg border border-neutral-200 p-6">
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-neutral-500">Name</dt>
          <dd className="font-medium text-neutral-900">{user.name}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Email</dt>
          <dd className="font-medium text-neutral-900">{user.email}</dd>
        </div>
      </dl>
    </div>
  );
}