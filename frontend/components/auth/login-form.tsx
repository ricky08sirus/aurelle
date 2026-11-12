"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { apiFetch, endpoints } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { Field } from "@/components/auth/auth-card";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setError("");
    try {
      await apiFetch(endpoints.login, { method: "POST", body: JSON.stringify(values) });
      await refresh();
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-navy hover:bg-navy-dark">
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        New customer?{" "}
        <Link href="/register" className="font-semibold text-navy hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}