import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Search, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchTreks } from "@/lib/trek-search";

const SummitSky = lazy(() => import("@/components/summit-sky"));

/* ---------- deterministic ridge generator ---------- */
function ridge(seed: number, peaks: number, top: number, amp: number) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts: string[] = ["0,400"];
  const steps = peaks * 4;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 1440;
    const wave = Math.sin((i / steps) * Math.PI * peaks) * 0.5 + 0.5;
    const y = top + (1 - wave) * amp + rnd() * amp * 0.35;
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  pts.push("1440,400");
  return pts.join(" ");
}

const LAYERS = [
  { seed: 3, peaks: 3, top: 40, amp: 140, color: "var(--ridge-1)", speed: 0.15 },
  { seed: 7, peaks: 4, top: 110, amp: 120, color: "var(--ridge-2)", speed: 0.3 },
  { seed: 11, peaks: 5, top: 170, amp: 110, color: "var(--ridge-3)", speed: 0.45 },
  { seed: 19, peaks: 6, top: 230, amp: 90, color: "var(--ridge-4)", speed: 0.65 },
  { seed: 23, peaks: 8, top: 280, amp: 70, color: "var(--ridge-5)", speed: 0.85 },
  { seed: 31, peaks: 11, top: 330, amp: 50, color: "var(--ridge-6)", speed: 1.1 },
];

const TREKS = [
  { name: "Kedarkantha", days: 6, alt: 3810, level: 2, price: "₹9,500", season: "Dec – Apr" },
  { name: "Har Ki Dun", days: 7, alt: 3566, level: 2, price: "₹11,200", season: "Mar – Jun" },
  { name: "Rupin Pass", days: 8, alt: 4650, level: 4, price: "₹16,800", season: "May – Jun" },
  {
    name: "Kashmir Great Lakes",
    days: 8,
    alt: 4200,
    level: 3,
    price: "₹18,500",
    season: "Jul – Sep",
  },
  { name: "Pin Parvati", days: 11, alt: 5319, level: 5, price: "₹27,000", season: "Aug – Sep" },
];

const STORIES = [
  { who: "Riya, Pune", text: "Day 4, we woke above the clouds. I'd never been so quiet." },
  {
    who: "Arjun, Delhi",
    text: "Our guide knew every stone on that pass. Felt safe the whole way.",
  },
  { who: "Meera, Bengaluru", text: "First trek ever. Already planning the next one." },
  { who: "Kabir, Mumbai", text: "Stars at 4,000m hit different. Book the summit night." },
];

function Peaks({ n }: { n: number }) {
  return (
    <div className="flex gap-1" aria-label={`Difficulty ${n} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="12" viewBox="0 0 14 12">
          <path d="M7 0 L14 12 L0 12 Z" fill={i < n ? "var(--marigold)" : "oklch(1 0 0 / 18%)"} />
        </svg>
      ))}
    </div>
  );
}

function Index() {
  const root = useRef<HTMLDivElement>(null);
  const [alt, setAlt] = useState(1800);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const matches = searchTreks(TREKS, query);
  const goToTrek = (name: string) => {
    setSearchOpen(false);
    const track = document.querySelector<HTMLElement>("#trek-track");
    const section = document.querySelector<HTMLElement>("#treks");
    const card = document.getElementById(`trek-${TREKS.findIndex((t) => t.name === name)}`);
    if (!track || !section || !card) return;
    const offset = card.offsetLeft - track.offsetLeft;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travel = Math.max(1, track.scrollWidth - window.innerWidth + 64);
    const scrollOffset = reduced ? 0 : (offset * track.scrollWidth) / travel;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY + scrollOffset,
      behavior: reduced ? "instant" : "smooth",
    });
    if (reduced) track.scrollTo({ left: offset });
  };

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const Lenis = (await import("lenis")).default;
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lenis = new Lenis({ duration: 1.4, smoothWheel: !reduce });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const ctx = gsap.context(() => {
        // altitude meter
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => setAlt(Math.round(1800 + self.progress * 4200)),
        });

        if (reduce) return;

        // hero parallax ridges
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const sp = parseFloat(el.dataset["speed"] || "0");
          gsap.to(el, {
            yPercent: sp * 40,
            ease: "none",
            scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
          });
        });
        gsap.to("#hero-title", {
          yPercent: -120,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "60% top", scrub: true },
        });
        gsap.from("#hero-title > *", {
          yPercent: 110,
          opacity: 0,
          stagger: 0.12,
          duration: 1.4,
          ease: "expo.out",
        });

        // reveal blocks
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 80,
            opacity: 0,
            rotate: el.dataset["reveal"] === "sign" ? -6 : 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        // foreground pines move faster
        gsap.to("#pines", {
          yPercent: -60,
          ease: "none",
          scrollTrigger: { trigger: "#why", start: "top bottom", end: "bottom top", scrub: true },
        });

        // horizontal treks
        const track = document.querySelector<HTMLElement>("#trek-track");
        if (track) {
          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth + 64),
            ease: "none",
            scrollTrigger: {
              trigger: "#treks",
              start: "top top",
              end: () => `+=${track.scrollWidth}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        // cloud transitions
        gsap.utils.toArray<HTMLElement>("[data-cloud]").forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: -20, opacity: 0 },
            {
              xPercent: 20,
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        // summit stars fade in
        gsap.from(".star", {
          opacity: 0,
          stagger: 0.01,
          scrollTrigger: { trigger: "#summit", start: "top 70%", end: "top 10%", scrub: true },
        });
      }, root);

      cleanup = () => {
        ctx.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const nav = ["Base", "Treks", "Stories", "Summit"];

  return (
    <div ref={root} className="grain relative">
      {/* top nav */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
        <a href="#hero" className="font-display text-2xl font-black uppercase tracking-wider">
          AORBO Treks
        </a>
        <nav className="hidden gap-8 font-mono text-xs uppercase tracking-[0.2em] md:flex">
          {nav.map((n) => (
            <a
              key={n}
              href={`#${n === "Base" ? "hero" : n.toLowerCase()}`}
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              {n}
            </a>
          ))}
        </nav>
        <Button
          asChild
          className="rounded-full px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-transform hover:scale-105"
        >
          <a href="#summit">Book a trek</a>
        </Button>
      </header>

      {/* altitude meter */}
      <aside className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60 [writing-mode:vertical-rl]">
          Altitude
        </span>
        <div className="relative h-48 w-px bg-border">
          <div
            className="absolute bottom-0 w-px bg-primary"
            style={{ height: `${((alt - 1800) / 4200) * 100}%` }}
          />
        </div>
        <span className="font-mono text-sm font-semibold text-primary">
          {alt.toLocaleString()}m
        </span>
      </aside>

      {/* HERO */}
      <section id="hero" className="relative h-[110vh] overflow-hidden bg-sky-dawn">
        <div
          className="absolute left-1/2 top-[22%] h-40 w-40 -translate-x-1/2 rounded-full bg-glacier/80 blur-[2px]"
          data-speed="0.05"
        />
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`hero-cloud hero-cloud-${n}`} aria-hidden="true" />
        ))}
        {[0, 1, 2].map((f) => (
          <div key={f} className={`bird-flock bird-flock-${f}`} aria-hidden="true">
            {Array.from({ length: 5 + f * 2 }).map((_, i) => (
              <svg key={i} className={`bird bird-${i}`} viewBox="0 0 40 20">
                <path className="bird-wing-left" d="M20 14 Q10 1 1 8" />
                <path className="bird-wing-right" d="M20 14 Q30 1 39 8" />
              </svg>
            ))}
          </div>
        ))}
        <div id="hero-title" className="absolute inset-x-0 top-[26%] z-30 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-night/70">
            Base camp · 1,800m
          </p>
          <h1 className="mt-4 font-display text-[18vw] font-black uppercase leading-[0.8] text-glacier md:text-[13vw]">
            Find your
          </h1>
          <h1 className="font-display text-[18vw] font-black uppercase leading-[0.8] text-outline md:text-[13vw]">
            altitude
          </h1>
          <div className="trek-search mx-auto mt-7 w-[min(86%,26rem)] text-left">
            <form
              className="trek-search-bar"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                if (matches[0]) goToTrek(matches[0].name);
              }}
            >
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search your trek"
                placeholder="Search your trek"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                }}
                aria-expanded={searchOpen}
                aria-controls="trek-search-results"
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X />
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                aria-label="Find trek"
                disabled={matches.length === 0}
              >
                <ArrowUpRight />
              </Button>
            </form>
            {searchOpen && (
              <div id="trek-search-results" className="trek-search-results">
                {matches.length ? (
                  matches.map((t) => (
                    <Button
                      key={t.name}
                      variant="ghost"
                      className="flex w-full justify-between rounded-none px-4 py-3"
                      onClick={() => goToTrek(t.name)}
                    >
                      <span>{t.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.days} days <ArrowUpRight className="ml-2 inline" />
                      </span>
                    </Button>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No treks found.</p>
                )}
              </div>
            )}
          </div>
        </div>
        {LAYERS.map((l, i) => (
          <svg
            key={i}
            data-speed={l.speed}
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-[65vh] w-full"
            style={{ zIndex: i < 2 ? 5 : 20 + i }}
          >
            <polygon points={ridge(l.seed, l.peaks, l.top, l.amp)} fill={l.color} />
          </svg>
        ))}
        <div className="mist animate-drift absolute bottom-[18vh] left-0 z-[24] h-40 w-[120%]" />
        <div className="absolute inset-x-0 bottom-10 z-40 text-center font-mono text-[10px] uppercase tracking-[0.4em] opacity-70">
          Scroll to climb ↓
        </div>
      </section>

      {/* WHY — treeline */}
      <section id="why" className="contours relative overflow-hidden bg-pine px-6 py-40 md:px-24">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-marigold">
          Treeline · 3,000m
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-6xl font-black uppercase leading-[0.9] md:text-8xl">
          Every step, <br /> accounted for.
        </h2>
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            { k: "12,000+", v: "trekkers guided safely" },
            { k: "1 : 6", v: "guide to trekker ratio" },
            { k: "Certified", v: "mountaineers & first-aid" },
          ].map((s) => (
            <div
              key={s.v}
              data-reveal="sign"
              className="relative border-l-2 border-marigold bg-night/30 p-8 backdrop-blur"
            >
              <div className="font-display text-5xl font-black">{s.k}</div>
              <div className="mt-2 font-mono text-xs uppercase tracking-widest opacity-70">
                {s.v}
              </div>
            </div>
          ))}
        </div>
        <svg
          id="pines"
          viewBox="0 0 1440 300"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-20 left-0 h-72 w-full"
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const x = i * 54 + (i % 3) * 10;
            const h = 140 + ((i * 37) % 120);
            return (
              <polygon
                key={i}
                points={`${x},300 ${x + 24},${300 - h} ${x + 48},300`}
                fill="var(--night)"
                opacity={0.85}
              />
            );
          })}
        </svg>
      </section>

      <div data-cloud className="mist relative z-10 -my-24 h-48 w-full" />

      {/* TREKS — horizontal pass */}
      <section
        id="treks"
        className="relative flex h-screen flex-col justify-center overflow-hidden bg-slate"
      >
        <div className="px-6 md:px-24">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-marigold">
            The pass · 4,200m
          </p>
          <h2 className="mt-3 font-display text-6xl font-black uppercase md:text-7xl">
            Choose your line
          </h2>
        </div>
        <div id="trek-track" className="mt-12 flex gap-6 pl-6 md:pl-24">
          {TREKS.map((t, i) => (
            <article
              key={t.name}
              id={`trek-${i}`}
              className="group relative flex h-[55vh] w-[78vw] shrink-0 flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-7 md:w-[26rem]"
            >
              <svg
                viewBox="0 0 400 200"
                className="absolute inset-x-0 bottom-0 w-full transition-transform duration-700 group-hover:scale-110"
                preserveAspectRatio="none"
              >
                <polygon
                  points={ridge(41 + i * 5, 3, 30 + t.level * -4, 120)}
                  fill="var(--ridge-3)"
                  transform="scale(0.28,0.5)"
                />
                <polygon
                  points={ridge(13 + i * 3, 4, 120, 80)}
                  fill="var(--ridge-5)"
                  transform="scale(0.28,0.5)"
                />
              </svg>
              <div className="relative flex items-start justify-between">
                <span className="font-mono text-xs opacity-60">0{i + 1}</span>
                <Peaks n={t.level} />
              </div>
              <div className="relative">
                <h3 className="font-display text-5xl font-black uppercase leading-none">
                  {t.name}
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px] uppercase tracking-wider">
                  <div>
                    <div className="opacity-60">Days</div>
                    <div className="text-base font-semibold">{t.days}</div>
                  </div>
                  <div>
                    <div className="opacity-60">Max</div>
                    <div className="text-base font-semibold">{t.alt}m</div>
                  </div>
                  <div>
                    <div className="opacity-60">From</div>
                    <div className="text-base font-semibold text-marigold">{t.price}</div>
                  </div>
                </div>
                <div className="mt-4 font-mono text-[11px] uppercase tracking-widest opacity-60">
                  Season · {t.season}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* STORIES — high camp */}
      <section id="stories" className="contours relative bg-night px-6 py-40 md:px-24">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-marigold">
          High camp · 5,000m
        </p>
        <h2 className="mt-3 font-display text-6xl font-black uppercase md:text-7xl">
          Notes from the tent
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STORIES.map((s, i) => (
            <figure
              key={s.who}
              data-reveal
              className="bg-glacier p-5 pb-8 text-night shadow-2xl"
              style={{ transform: `rotate(${[-3, 2, -1.5, 3][i]}deg)` }}
            >
              <div className="h-40 bg-sky-dawn" />
              <blockquote className="mt-5 font-sans text-base leading-snug">"{s.text}"</blockquote>
              <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-widest opacity-60">
                — {s.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* SUMMIT */}
      <section
        id="summit"
        className="relative min-h-screen overflow-hidden bg-sky-night px-6 pb-24 pt-40 md:px-24"
      >
        {mounted && (
          <Suspense fallback={null}>
            <SummitSky />
          </Suspense>
        )}
        {Array.from({ length: 90 }).map((_, i) => (
          <span
            key={i}
            className="star absolute h-0.5 w-0.5 rounded-full bg-glacier"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 29) % 60}%`,
              animationDelay: `${(i % 7) * 0.4}s`,
            }}
          />
        ))}
        <div className="absolute inset-x-0 top-24 flex justify-center gap-3">
          {[
            "var(--marigold)",
            "var(--glacier)",
            "var(--dusk)",
            "var(--moss)",
            "var(--slate)",
            "var(--marigold)",
            "var(--glacier)",
          ].map((c, i) => (
            <span
              key={i}
              className="flag block h-8 w-10"
              style={{ background: c, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto mt-20 max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-marigold">
            Summit · 6,000m
          </p>
          <h2 className="mt-4 font-display text-7xl font-black uppercase leading-[0.85] md:text-9xl">
            Book your <br /> summit
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-14 grid max-w-2xl gap-3 rounded-lg border border-border bg-card/60 p-4 backdrop-blur md:grid-cols-[1fr_1fr_auto_auto]"
          >
            <select
              className="rounded-md border border-input bg-transparent px-4 py-3 font-mono text-sm"
              aria-label="Trek"
            >
              {TREKS.map((t) => (
                <option key={t.name} className="bg-night">
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Start date"
              className="rounded-md border border-input bg-transparent px-4 py-3 font-mono text-sm"
            />
            <input
              type="number"
              min={1}
              defaultValue={2}
              aria-label="People"
              className="w-24 rounded-md border border-input bg-transparent px-4 py-3 font-mono text-sm"
            />
            <Button className="h-auto rounded-md px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest transition-transform hover:scale-105">
              Climb →
            </Button>
          </form>
        </div>
        <svg
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-56 w-full"
        >
          <polygon points={ridge(5, 2, 60, 200)} fill="var(--night)" />
        </svg>
      </section>

      <footer className="relative bg-night px-6 py-12 font-mono text-xs uppercase tracking-widest opacity-60 md:px-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <span>© 2026 AORBO Treks</span>
          <span>Base camp → Summit · Uttarakhand · Himachal · Kashmir</span>
        </div>
      </footer>
    </div>
  );
}

export default Index;
