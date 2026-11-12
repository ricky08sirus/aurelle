import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

type HeroBannerProps = {
  image?: string;
  alt: string;
  href?: string;
};

export function HeroBanner({ image, alt, href }: HeroBannerProps) {
  const content = (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-[1920px] overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 sm:aspect-[16/6] lg:aspect-[16/5]">
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
          <ImageIcon className="size-10" aria-hidden="true" />
          <span className="text-xs tracking-widest uppercase">
            Banner image 1920 × 600
          </span>
        </div>
      )}
    </div>
  );

  return (
    <section aria-label="Featured offer">
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </section>
  );
}