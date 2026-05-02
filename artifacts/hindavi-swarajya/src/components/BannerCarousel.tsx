import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Star, Calendar, Flame } from "lucide-react";

export type Banner = {
  id: number;
  subtitle: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  position: number;
  active: boolean;
};

// ── Sanitizers — block CSS injection from DB-stored values ────────────────────
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export function safeHex(value: string, fallback: string): string {
  return HEX_RE.test(value) ? value : fallback;
}
export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value, window.location.origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Reject any URL containing characters that could break out of url()
    if (/[)"'\s\\]/.test(value)) return null;
    return u.toString();
  } catch {
    return null;
  }
}
export function bannerBackground(b: { gradientFrom: string; gradientTo: string; imageUrl: string | null }): string {
  const from = safeHex(b.gradientFrom, "#FF6F00");
  const to = safeHex(b.gradientTo, "#EA580C");
  const img = safeImageUrl(b.imageUrl);
  return img
    ? `linear-gradient(135deg, ${from}DD, ${to}EE), url("${img}") center/cover no-repeat`
    : `linear-gradient(135deg, ${from}, ${to})`;
}

type Props = {
  banners: Banner[];
  fallback?: { subtitle: string; title: string; body: string; ctaLabel: string; ctaHref: string };
  autoRotateMs?: number;
};

export function BannerCarousel({ banners, fallback, autoRotateMs = 6000 }: Props) {
  const list: Banner[] =
    banners.length > 0
      ? banners
      : fallback
      ? [
          {
            id: 0,
            subtitle: fallback.subtitle,
            title: fallback.title,
            body: fallback.body,
            ctaLabel: fallback.ctaLabel,
            ctaHref: fallback.ctaHref,
            imageUrl: null,
            gradientFrom: "#FF6F00",
            gradientTo: "#EA580C",
            position: 0,
            active: true,
          },
        ]
      : [];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = list.length;

  const goTo = useCallback(
    (i: number) => {
      if (total === 0) return;
      setIndex(((i % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || total <= 1 || autoRotateMs <= 0) return;
    const id = window.setTimeout(() => goTo(index + 1), autoRotateMs);
    return () => window.clearTimeout(id);
  }, [index, paused, total, autoRotateMs, goTo]);

  if (total === 0) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    touchStartX.current = null;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      data-testid="banner-carousel"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {list.map((b) => (
            <BannerSlide key={b.id} banner={b} />
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
            data-testid="banner-prev"
            style={{ opacity: 0.85 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all hover:scale-105"
            data-testid="banner-next"
            style={{ opacity: 0.85 }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
                data-testid={`banner-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const cta = banner.ctaLabel && banner.ctaHref ? banner : null;

  return (
    <div className="w-full shrink-0">
      <div
        className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6 min-h-[180px]"
        style={{ background: bannerBackground(banner) }}
      >
        <Flame
          className="absolute -right-4 -top-4 w-32 h-32 text-white/10"
          strokeWidth={1.25}
          aria-hidden
        />
        <div className="relative z-10 max-w-md">
          {banner.subtitle && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-3">
              <Star className="w-3 h-3 text-white" strokeWidth={2} />
              <span className="text-[10.5px] uppercase tracking-[0.1em] font-semibold text-white">
                {banner.subtitle}
              </span>
            </div>
          )}
          <h3 className="text-white font-semibold text-lg leading-tight tracking-tight">
            {banner.title}
          </h3>
          {banner.body && (
            <p className="text-white/85 text-[13px] mt-1.5 leading-relaxed">{banner.body}</p>
          )}
          {cta && <CtaButton label={cta.ctaLabel} href={cta.ctaHref} />}
        </div>
      </div>
    </div>
  );
}

function CtaButton({ label, href }: { label: string; href: string }) {
  const isExternal = /^https?:\/\//i.test(href);
  const className =
    "mt-4 inline-flex items-center gap-2 bg-white text-primary font-semibold text-[13px] px-4 py-2.5 rounded-full hover:bg-orange-50 transition-colors tap-none";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Calendar className="w-3.5 h-3.5" strokeWidth={2.25} />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <Calendar className="w-3.5 h-3.5" strokeWidth={2.25} />
      {label}
    </Link>
  );
}
