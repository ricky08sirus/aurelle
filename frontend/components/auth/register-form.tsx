"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { apiFetch, endpoints } from "@/lib/api";
import { Field } from "@/components/auth/auth-card";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number"),
  password: z.string().min(8, "At least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setError("");
    try {
      await apiFetch(endpoints.register, { method: "POST", body: JSON.stringify(values) });
      router.push("/login");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Field label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
      <Field label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-navy hover:bg-navy-dark">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}