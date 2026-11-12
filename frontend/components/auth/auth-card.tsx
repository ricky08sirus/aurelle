import { Input } from "@/components/ui/input";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-heading text-3xl text-navy">{title}</h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500">{subtitle}</p>
      {children}
    </main>
  );
}

export function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <Input className="h-11" {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}