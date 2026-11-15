"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export type BannerSlide = {
  image: string;
  mobileImage?: string;
  alt: string;
  href?: string;
};

/** How long each slide stays on screen */
const SLIDE_MS = 5000;

/** True when the visitor has asked their device to reduce motion */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function HeroCarousel({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  const count = slides.length;
  const multiple = count > 1;
  // Auto-play stops on hover/focus, when paused, and for reduced-motion visitors
  const autoplay = multiple && !reducedMotion && !userPaused;
  const running = autoplay && !interacting;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  if (count === 0) return null;

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative mx-auto w-full max-w-[1920px] overflow-hidden bg-neutral-100"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setInteracting(false);
      }}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides are stacked; the active one fades in while slowly zooming out */}
      <div className="relative aspect-[4/3] w-full md:aspect-[16/5]" aria-live={running ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          const picture = (
            <>
              {slide.mobileImage && (
                <Image
                  src={slide.mobileImage}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover md:hidden"
                />
              )}
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className={`object-cover ${slide.mobileImage ? "hidden md:block" : ""}`}
              />
            </>
          );

          return (
            <div
              key={slide.image}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
                active ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
            >
              <div
                className={`absolute inset-0 transition-transform ease-out motion-reduce:scale-100 motion-reduce:transition-none ${
                  active ? "scale-100 duration-[6000ms]" : "scale-110 duration-0"
                }`}
              >
                {slide.href ? (
                  <Link href={slide.href} className="absolute inset-0 block" tabIndex={active ? 0 : -1}>
                    {picture}
                  </Link>
                ) : (
                  picture
                )}
              </div>
            </div>
          );
        })}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute top-1/2 left-3 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-navy shadow-sm backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none sm:block md:left-6"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-navy shadow-sm backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none sm:block md:right-6"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm md:bottom-5">
            {slides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${slide.alt}`}
                aria-current={i === index}
                className={`relative h-1.5 overflow-hidden rounded-full bg-white/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  i === index ? "w-8" : "w-1.5 hover:bg-white/80"
                }`}
              >
                {i === index && (
                  <span
                    // The bar fills over SLIDE_MS; when it finishes, the next slide shows.
                    // Pausing freezes the bar, so the slide resumes exactly where it stopped.
                    key={index}
                    className="absolute inset-0 origin-left rounded-full bg-white"
                    style={
                      autoplay
                        ? {
                            animation: `banner-progress ${SLIDE_MS}ms linear forwards`,
                            animationPlayState: running ? "running" : "paused",
                          }
                        : undefined
                    }
                    onAnimationEnd={next}
                  />
                )}
              </button>
            ))}
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                className="ml-1 rounded-full p-0.5 text-white/90 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                {userPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}