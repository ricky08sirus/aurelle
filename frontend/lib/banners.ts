import type { BannerSlide } from "@/components/sections/hero-carousel";

/**
 * Home page carousel slides, shown in this order.
 * Put the images in frontend/public/banners/ and list them here.
 *
 * image        desktop and tablet banner, 1920 × 600 px
 * mobileImage  optional phone banner, 1200 × 900 px (without it, the desktop image is cropped to fit)
 * alt          what the banner says, for screen readers and Google
 * href         optional page to open when the banner is clicked
 */
export const banners: BannerSlide[] = [
  {
    image: "/banners/banner-1.png",
    alt: "Aurelle Diwali Dhamaka Sale, up to 50% off on protein powders",
    href: "/products",
  },
  {
    image: "/banners/banner-2.jpg",
    alt: "Aurelle Whey Isolate: 26 g protein per scoop",
    href: "/products",
  },
  {
    image: "/banners/banner-3.jpg",
    alt: "Aurelle Plant Protein: dairy-free protein from pea and brown rice",
    href: "/products",
  },
];