export function PagePlaceholder({
  title,
  text = "Coming Soon",
}: {
  title: string;
  text?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-5xl text-navy sm:text-6xl">{title}</h1>
      <p className="mt-4 text-sm text-neutral-500">{text}</p>
    </main>
  );
}