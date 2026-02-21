<script lang="ts">
  import { goto } from "$app/navigation";
  import { motion, useSpring, type Variants } from "@humanspeak/svelte-motion";
  import {
    Link2,
    Palette,
    BarChart3,
    Calendar,
    Zap,
    Globe,
    ArrowRight,
    Check,
    X,
    Loader2,
    Star,
    Twitter,
    Instagram,
    Layout,
    Type,
    LayoutDashboard,
    Sparkles,
    CheckCircle2,
  } from "@lucide/svelte";
  import { validateHandle } from "$lib/utils/handle.js";
  import { debounce } from "$lib/utils/helpers.js";
  import ProfileMockup from "$lib/components/landing/ProfileMockup.svelte";

  let { data } = $props();

  // ── Handle state ──────────────────────────────────────────────
  let handle = $state("");
  let error = $state("");
  let checking = $state(false);
  let available = $state<boolean | null>(null);
  let suggestions = $state<string[]>([]);

  const canClaim = $derived(
    handle.length >= 3 && available === true && !checking,
  );

  // ── Section visibility ────────────────────────────────────────
  let statsVisible = $state(false);
  let featuresVisible = $state(false);
  let themesVisible = $state(false);
  let stepsVisible = $state(false);
  let testimonialsVisible = $state(false);
  let pricingVisible = $state(false);
  let ctaVisible = $state(false);

  // ── Animated counters ─────────────────────────────────────────
  const creatorsSpring = useSpring(0, { stiffness: 28, damping: 11 });
  const profilesSpring = useSpring(0, { stiffness: 28, damping: 11 });
  const clicksSpring = useSpring(0, { stiffness: 28, damping: 11 });

  $effect(() => {
    if (statsVisible) {
      creatorsSpring.set(50000);
      profilesSpring.set(200000);
      clicksSpring.set(12000000);
    }
  });

  // ── Pricing toggle ────────────────────────────────────────────
  let billingAnnual = $state(false);
  const proMonthlyPrice = $derived(billingAnnual ? "$7" : "$9");
  const proBilling = $derived(billingAnnual ? "/mo · billed annually" : "/mo");

  function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K+`;
    return String(Math.round(n));
  }

  // ── Handle check ──────────────────────────────────────────────
  function generateSuggestions(h: string): string[] {
    return [`${h}1`, `${h}hq`, `the${h}`, `${h}links`, `i${h}`]
      .filter((s) => s.length >= 3 && s.length <= 24)
      .slice(0, 3);
  }

  const checkAvailability = debounce(async (h: string) => {
    const v = validateHandle(h);
    if (!v.valid) {
      error = v.error!;
      available = null;
      checking = false;
      suggestions = [];
      return;
    }
    checking = true;
    error = "";
    suggestions = [];
    try {
      const res = await fetch(
        `/api/handle/check?handle=${encodeURIComponent(h)}`,
      );
      const json = await res.json();
      available = json.available;
      if (!json.available) suggestions = generateSuggestions(h);
    } catch {
      error = "Error checking availability";
    } finally {
      checking = false;
    }
  }, 300);

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    handle = input.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    available = null;
    error = "";
    suggestions = [];
    if (handle.length > 0) {
      checking = true;
      checkAvailability(handle);
    }
  }

  function claimHandle(h = handle) {
    if (available === false) return;
    const v = validateHandle(h);
    if (!v.valid) {
      error = v.error!;
      return;
    }
    if (data.user) goto(`/app/onboarding/confirm?handle=${h}`);
    else goto(`/auth/signup?handle=${h}`);
  }

  function tryHandle(s: string) {
    handle = s;
    available = null;
    error = "";
    suggestions = [];
    checking = true;
    checkAvailability(s);
  }

  // ── Viewport action ───────────────────────────────────────────
  function viewport(node: HTMLElement, cb: () => void) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          cb();
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  // ── Motion variants ───────────────────────────────────────────
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "tween", duration: 0.44, ease: "easeOut" },
    },
  };
  const floatA: Variants = {
    float: {
      y: [-8, 8, -8],
      rotate: [-1, 1, -1],
      transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
    },
  };
  const floatB: Variants = {
    float: {
      y: [7, -7, 7],
      transition: {
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.2,
      },
    },
  };
  const floatC: Variants = {
    float: {
      y: [-5, 5, -5],
      transition: {
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      },
    },
  };
  const ht = { type: "tween", duration: 0.12, ease: "easeOut" };
  const tt = { type: "tween", duration: 0.08, ease: "easeOut" };
  const het = { type: "tween", duration: 0.15, ease: "easeOut" };

  // ── Data ─────────────────────────────────────────────────────
  const features = [
    {
      icon: Link2,
      label: "Unlimited Links",
      desc: "Add all your destinations — social, shop, music, events — no limits ever.",
      badge: "Free",
    },
    {
      icon: Palette,
      label: "Beautiful Themes",
      desc: "Dozens of curated themes. Customise every detail with Pro.",
      badge: "Free",
    },
    {
      icon: BarChart3,
      label: "Real Analytics",
      desc: "Track clicks, views, and devices. Know exactly what moves your audience.",
      badge: "Free",
    },
    {
      icon: Calendar,
      label: "Link Scheduling",
      desc: "Schedule links for product drops, events, and campaigns.",
      badge: "Pro",
    },
    {
      icon: Layout,
      label: "Grid Layouts",
      desc: "Show content in image-rich grid layouts, not just a boring list.",
      badge: "Pro",
    },
    {
      icon: Type,
      label: "Custom Fonts",
      desc: "50+ premium fonts. Typography that's unmistakably you.",
      badge: "Pro",
    },
    {
      icon: Globe,
      label: "SEO Optimised",
      desc: "Built-in OG images, meta tags, and structured data for max reach.",
      badge: "Free",
    },
    {
      icon: Zap,
      label: "Blazing Fast",
      desc: "Sub-second load times worldwide. Your audience will not wait.",
      badge: "Free",
    },
  ] as const;

  const themes = [
    {
      name: "Midnight",
      badge: "Free",
      bg: "#0a0a14",
      accent: "#8b5cf6",
      links: ["#1a0030", "#100020", "#0c001a"],
    },
    {
      name: "Aurora",
      badge: "Pro",
      bg: "#0a1a1f",
      accent: "#06b6d4",
      links: ["#003040", "#002535", "#00202c"],
    },
    {
      name: "Rose",
      badge: "Free",
      bg: "#fff0f5",
      accent: "#ec4899",
      links: ["#ffe0ec", "#ffd0e4", "#ffc8de"],
    },
    {
      name: "Desert",
      badge: "Pro",
      bg: "#1a1208",
      accent: "#f59e0b",
      links: ["#2a1e08", "#221808", "#1c1406"],
    },
    {
      name: "Ocean",
      badge: "Free",
      bg: "#0a1628",
      accent: "#3b82f6",
      links: ["#0c2040", "#0a1c38", "#081830"],
    },
    {
      name: "Forest",
      badge: "Pro",
      bg: "#081410",
      accent: "#10b981",
      links: ["#0a1e14", "#081a10", "#06160c"],
    },
    {
      name: "Cloud",
      badge: "Free",
      bg: "#f5f8ff",
      accent: "#6366f1",
      links: ["#eef1ff", "#e8ebff", "#e4e8ff"],
    },
    {
      name: "Neon",
      badge: "Pro",
      bg: "#050508",
      accent: "#f0abfc",
      links: ["#180020", "#120018", "#0e0014"],
    },
  ];

  const steps = [
    {
      n: "01",
      title: "Pick your handle",
      desc: "Claim your unique lnksy.com/you URL. It's yours forever.",
    },
    {
      n: "02",
      title: "Build your page",
      desc: "Add links, pick a theme, upload a photo, write a bio.",
    },
    {
      n: "03",
      title: "Share and grow",
      desc: "Drop it in your bio and watch engagement flow in.",
    },
  ];

  const testimonials = [
    {
      name: "Maya Chen",
      role: "Content Creator · 1.2M",
      text: "Replaced my Linktree in a day. The themes are stunning and the analytics finally tell me something useful.",
      stars: 5,
    },
    {
      name: "Jamal Torres",
      role: "Musician & Producer",
      text: "Perfect for dropping new music, merch, and tour dates all at once. Scheduling is a game-changer.",
      stars: 5,
    },
    {
      name: "Priya Patel",
      role: "Lifestyle Blogger",
      text: "My page loads instantly now. Engagement went up 40% after switching. Should have done this sooner.",
      stars: 5,
    },
    {
      name: "Alex Kim",
      role: "Photographer",
      text: "The grid layout makes my portfolio pop. Finally a link-in-bio that gets visual creators.",
      stars: 5,
    },
    {
      name: "Zoe Williams",
      role: "Fitness Coach",
      text: "Easy to set up and gorgeous to look at. My clients always comment on how polished my profile is.",
      stars: 5,
    },
    {
      name: "Diego Fernández",
      role: "Digital Artist",
      text: "The dark themes are perfection. It matches my aesthetic completely — my followers actually compliment it.",
      stars: 5,
    },
  ];

  const freeFeatures = [
    "1 unique handle",
    "Up to 25 links",
    "8 free themes",
    "Basic analytics",
    "Lnksy branding",
  ];
  const proFeatures = [
    "Unlimited links",
    "All premium themes",
    "Image grid layouts",
    "Link scheduling",
    "Advanced analytics",
    "Custom fonts",
    "Remove branding",
    "Priority support",
  ];
</script>

<!-- ─────────────────── SEO ─────────────────── -->
<svelte:head>
  <title>Lnksy — One link for everything you create</title>
  <meta
    name="description"
    content="Create a stunning link-in-bio page in seconds. Unlimited links, beautiful themes, real analytics. Trusted by 50,000+ creators."
  />
  <meta
    property="og:title"
    content="Lnksy — One link for everything you create"
  />
  <meta
    property="og:description"
    content="Create a stunning link-in-bio page in seconds."
  />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="page-shell">
  <!-- ════════════ NAVBAR ════════════ -->
  <motion.nav
    initial={{ y: -16, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 130, damping: 22 }}
    class="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4"
  >
    <div class="nav-pill">
      <motion.a
        href="/"
        whileHover={{ scale: 1.03, transition: ht }}
        transition={het}
        class="flex items-center gap-2 font-semibold no-underline nav-logo"
      >
        <div class="nav-logo-mark">
          <Zap size={13} />
        </div>
        Lnksy
      </motion.a>

      <div class="hidden md:flex items-center gap-1">
        {#each [["Features", "#features"], ["Templates", "#themes"], ["Pricing", "#pricing"]] as [label, href]}
          <a {href} class="nav-link">{label}</a>
        {/each}
      </div>

      <div class="flex items-center gap-2">
        {#if data.user}
          <motion.a
            href="/app"
            whileHover={{ scale: 1.03, transition: ht }}
            whileTap={{ scale: 0.97, transition: tt }}
            transition={het}
            class="hidden sm:flex items-center gap-1.5 nav-btn-ghost"
          >
            <LayoutDashboard size={14} /> Studio
          </motion.a>
        {:else}
          <motion.a
            href="/auth/login"
            whileHover={{ scale: 1.03, transition: ht }}
            whileTap={{ scale: 0.97, transition: tt }}
            transition={het}
            class="hidden sm:flex nav-btn-ghost">Sign in</motion.a
          >
        {/if}
        <motion.a
          href="#hero-input"
          whileHover={{ scale: 1.03, transition: ht }}
          whileTap={{ scale: 0.97, transition: tt }}
          transition={het}
          class="nav-btn-primary">Create your Lnksy</motion.a
        >
      </div>
    </div>
  </motion.nav>

  <!-- ════════════ HERO ════════════ -->
  <section
    class="hero-section relative overflow-hidden pt-24 pb-16 lg:pt-28 lg:pb-24"
  >
    <div class="grid-bg absolute inset-0 pointer-events-none"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-20 gap-12"
      >
        <!-- Left: copy + input -->
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          class="flex-1 max-w-xl"
        >
          <motion.div variants={item}>
            <span class="hero-badge">
              <Sparkles size={12} />
              The link-in-bio for serious creators
            </span>
          </motion.div>

          <motion.h1 variants={item} class="hero-h1">
            One link.<br />
            <em class="accent-text not-italic">Everything</em><br />
            you create.
          </motion.h1>

          <motion.p variants={item} class="hero-sub">
            Beautiful link pages trusted by 50,000+ creators worldwide. Set up
            in 60 seconds, customise forever.
          </motion.p>

          <!-- Handle input block -->
          <motion.div variants={item} id="hero-input">
            <div
              class="handle-input"
              style="
                border-color: {available === true
                ? '#6EE7B7'
                : available === false
                  ? '#FCA5A5'
                  : checking
                    ? '#A5B4FC'
                    : '#E2E2EE'};
                box-shadow: {available === true
                ? '0 0 0 3px rgba(110,231,183,0.18)'
                : available === false
                  ? '0 0 0 3px rgba(252,165,165,0.15)'
                  : checking
                    ? '0 0 0 3px rgba(165,180,252,0.18)'
                    : 'none'};
              "
            >
              <span class="handle-prefix">lnksy.com/</span>
              <input
                type="text"
                value={handle}
                oninput={onInput}
                onkeydown={(e) => e.key === "Enter" && claimHandle()}
                placeholder="your-name"
                maxlength="24"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                aria-label="Choose your Lnksy handle"
                aria-describedby="handle-feedback"
                class="handle-text-input"
              />
              <div class="pr-4 flex items-center" style="min-width: 26px;">
                {#if checking}
                  <Loader2
                    size={14}
                    class="animate-spin"
                    style="color: #A5B4FC;"
                  />
                {:else if available === true}
                  <Check size={14} style="color: #10B981;" />
                {:else if available === false}
                  <X size={14} style="color: #EF4444;" />
                {/if}
              </div>
            </div>

            <!-- Status feedback -->
            <div
              id="handle-feedback"
              role="status"
              aria-live="polite"
              class="h-5 mt-2 flex items-center gap-1.5"
              style="font-size: 12px;"
            >
              {#if checking}
                <span style="color: #9CA3AF;">Checking availability…</span>
              {:else if available === true}
                <span class="flex items-center gap-1" style="color: #059669;">
                  <Check size={11} /> /{handle} is available!
                </span>
              {:else if available === false}
                <span class="flex items-center gap-1" style="color: #DC2626;">
                  <X size={11} /> That handle is already taken
                </span>
              {:else if error}
                <span style="color: #D97706;">{error}</span>
              {/if}
            </div>

            <!-- Suggestions -->
            {#if suggestions.length > 0}
              <div class="flex items-center gap-2 flex-wrap mt-2">
                <span style="font-size: 11px; color: #9CA3AF;"
                  >Try instead:</span
                >
                {#each suggestions as s}
                  <motion.button
                    onclick={() => tryHandle(s)}
                    whileHover={{ scale: 1.05, transition: ht }}
                    whileTap={{ scale: 0.96, transition: tt }}
                    transition={het}
                    class="suggestion-chip">{s}</motion.button
                  >
                {/each}
              </div>
            {/if}

            <p class="mt-3" style="font-size: 11px; color: #9CA3AF;">
              Your handle can't be changed later — choose wisely.
            </p>

            <!-- CTA -->
            <motion.button
              onclick={() => claimHandle()}
              whileHover={canClaim
                ? { scale: 1.015, y: -1, transition: ht }
                : {}}
              whileTap={canClaim ? { scale: 0.985, transition: tt } : {}}
              transition={het}
              class="cta-btn mt-4"
              style={canClaim
                ? "background: #4F46E5; color: white; box-shadow: 0 6px 24px rgba(79,70,229,0.22); cursor: pointer;"
                : "background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; border: 1px solid #E5E7EB;"}
              aria-disabled={!canClaim}
            >
              {data.user ? "Claim this handle" : "Get started free"}
              <ArrowRight size={17} />
            </motion.button>

            <!-- Social proof -->
            <div class="flex items-center gap-3 mt-5">
              <div class="flex -space-x-2">
                {#each [0, 1, 2, 3, 4] as i}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    class="w-8 h-8 rounded-full bg-white"
                    style="border: 2px solid #F3F4F6; box-shadow: 0 1px 4px rgba(0,0,0,0.07);"
                  ></motion.div>
                {/each}
              </div>
              <p style="font-size: 13px; color: #9CA3AF;">
                Join <span style="color: #374151; font-weight: 600;"
                  >50,000+</span
                > creators on Lnksy
              </p>
            </div>
          </motion.div>
        </motion.div>

        <!-- Right: phone mockup -->
        <div class="hidden lg:flex flex-1 justify-center items-center relative">
          <motion.div
            variants={floatA}
            animate="float"
            class="absolute top-0 -left-8 z-20"
          >
            <div class="float-badge">42 clicks today</div>
          </motion.div>
          <motion.div
            variants={floatB}
            animate="float"
            class="absolute bottom-16 -right-4 z-20"
          >
            <div class="float-badge">Live in 60 seconds</div>
          </motion.div>
          <motion.div
            variants={floatC}
            animate="float"
            class="absolute top-1/3 -right-14 z-20"
          >
            <div class="float-badge" style="color: #059669;">
              Handle available
            </div>
          </motion.div>
          <ProfileMockup />
        </div>
      </div>
    </div>
  </section>

  <!-- ════════════ STATS ════════════ -->
  <section
    use:viewport={() => (statsVisible = true)}
    class="stats-section py-14"
  >
    <div class="max-w-4xl mx-auto px-4">
      <div class="flex flex-wrap justify-center gap-10 sm:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={statsVisible ? { opacity: 1, y: 0 } : {}}
          transition={{
            delay: 0,
            duration: 0.45,
            type: "tween",
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.05, y: -2, transition: ht }}
          class="text-center cursor-default"
        >
          <div class="stat-number">{fmt($creatorsSpring)}</div>
          <div class="stat-label">Creators</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={statsVisible ? { opacity: 1, y: 0 } : {}}
          transition={{
            delay: 0.12,
            duration: 0.45,
            type: "tween",
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.05, y: -2, transition: ht }}
          class="text-center cursor-default"
        >
          <div class="stat-number">{fmt($profilesSpring)}</div>
          <div class="stat-label">Profiles created</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={statsVisible ? { opacity: 1, y: 0 } : {}}
          transition={{
            delay: 0.24,
            duration: 0.45,
            type: "tween",
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.05, y: -2, transition: ht }}
          class="text-center cursor-default"
        >
          <div class="stat-number">{fmt($clicksSpring)}</div>
          <div class="stat-label">Monthly clicks</div>
        </motion.div>
      </div>
    </div>
  </section>

  <!-- ════════════ FEATURES ════════════ -->
  <section
    id="features"
    use:viewport={() => (featuresVisible = true)}
    class="py-24 px-4"
  >
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <motion.span
          initial={{ opacity: 0 }}
          animate={featuresVisible ? { opacity: 1 } : {}}
          class="eyebrow">Features</motion.span
        >
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08 }}
          class="section-h2">Everything your page needs</motion.h2
        >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.14 }}
          class="section-sub"
          >Free to start. Powerful when you're ready to grow.</motion.p
        >
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate={featuresVisible ? "visible" : "hidden"}
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {#each features as f}
          <motion.div
            variants={item}
            whileHover={{ y: -4, transition: ht }}
            transition={het}
            class="feature-card"
          >
            <motion.div
              whileHover={{ rotate: 6, scale: 1.08, transition: ht }}
              transition={het}
              class="feature-icon"
            >
              {@const Icon = f.icon}
              <Icon size={18} style="color: #4F46E5;" />
            </motion.div>
            <div class="flex items-start justify-between gap-2 mt-4 mb-1.5">
              <h3 class="feature-title">{f.label}</h3>
              <span
                class="feature-badge"
                style={f.badge === "Pro"
                  ? "background: #EEF2FF; border: 1px solid #E0E7FF; color: #4F46E5;"
                  : "background: #F3F4F6; border: 1px solid #E5E7EB; color: #9CA3AF;"}
                >{f.badge}</span
              >
            </div>
            <p class="feature-desc">{f.desc}</p>
          </motion.div>
        {/each}
      </motion.div>
    </div>
  </section>

  <!-- ════════════ THEMES ════════════ -->
  <section
    id="themes"
    use:viewport={() => (themesVisible = true)}
    class="py-24 px-4 themes-section"
  >
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <span class="eyebrow">Templates</span>
        <h2 class="section-h2">Themes built for creators</h2>
        <p class="section-sub">Pick one in a tap. Every detail crafted.</p>
      </div>

      <div
        class="flex sm:grid sm:grid-cols-4 gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {#each themes as theme, i}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={themesVisible ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: i * 0.06,
              duration: 0.4,
              type: "tween",
              ease: "easeOut",
            }}
            whileHover={{ y: -5, scale: 1.02, transition: ht }}
            class="theme-card shrink-0 w-[150px] sm:w-auto snap-start cursor-default"
          >
            <div
              class="relative rounded-[14px] overflow-hidden mb-3"
              style="height: 110px; background: {theme.bg}; border: 1px solid rgba(0,0,0,0.08);"
            >
              <div
                class="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
                style="background: {theme.accent}; opacity: 0.9;"
              ></div>
              <div
                class="absolute top-11 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full"
                style="background: {theme.accent}; opacity: 0.4;"
              ></div>
              <div
                class="absolute top-14 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                style="background: {theme.accent}; opacity: 0.2;"
              ></div>
              {#each [0, 1, 2] as j}
                <div
                  class="absolute left-3 right-3 h-[10px] rounded-[4px]"
                  style="top: {66 + j * 14}px; background: {j === 0
                    ? theme.accent
                    : (theme.links[j] ?? theme.bg)}; opacity: {j === 0
                    ? 0.65
                    : 0.3};"
                ></div>
              {/each}
            </div>
            <div class="flex items-center justify-between px-0.5">
              <span class="theme-name">{theme.name}</span>
              <span
                class="theme-badge"
                style={theme.badge === "Pro"
                  ? "background:#EEF2FF; border-color:#E0E7FF; color:#4F46E5;"
                  : "background:#F3F4F6; border-color:#E5E7EB; color:#9CA3AF;"}
                >{theme.badge}</span
              >
            </div>
          </motion.div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ════════════ HOW IT WORKS ════════════ -->
  <section use:viewport={() => (stepsVisible = true)} class="py-24 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <span class="eyebrow">How it works</span>
        <h2 class="section-h2">Up and running in minutes</h2>
        <p class="section-sub">No design skills needed. Seriously.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate={stepsVisible ? "visible" : "hidden"}
        class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative"
      >
        <!-- Connector (desktop) -->
        <div
          class="hidden sm:block absolute top-9 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px"
          style="background: #E0E7FF;"
        ></div>

        {#each steps as step}
          <motion.div
            variants={item}
            whileHover={{ y: -5, transition: ht }}
            transition={het}
            class="step-card"
          >
            <div class="step-num">{step.n}</div>
            <h4 class="step-title">{step.title}</h4>
            <p class="step-desc">{step.desc}</p>
          </motion.div>
        {/each}
      </motion.div>
    </div>
  </section>

  <!-- ════════════ TESTIMONIALS ════════════ -->
  <section
    use:viewport={() => (testimonialsVisible = true)}
    class="py-24 px-4 testimonials-section"
  >
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <span class="eyebrow">Testimonials</span>
        <h2 class="section-h2">Loved by creators worldwide</h2>
        <p class="section-sub">Real people, real results.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate={testimonialsVisible ? "visible" : "hidden"}
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {#each testimonials as t}
          {@const initials = t.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)}
          <motion.div
            variants={item}
            whileHover={{ y: -4, transition: ht }}
            transition={het}
            class="testimonial-card"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="testimonial-avatar shrink-0">{initials}</div>
              <div>
                <div class="testimonial-name">{t.name}</div>
                <div class="testimonial-role">{t.role}</div>
              </div>
            </div>
            <p class="testimonial-text">"{t.text}"</p>
            <div class="flex gap-0.5 mt-4">
              {#each Array(t.stars) as _}
                <Star size={13} style="color: #FBBF24;" fill="#FBBF24" />
              {/each}
            </div>
          </motion.div>
        {/each}
      </motion.div>
    </div>
  </section>

  <!-- ════════════ PRICING ════════════ -->
  <section
    id="pricing"
    use:viewport={() => (pricingVisible = true)}
    class="py-24 px-4"
  >
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <span class="eyebrow">Pricing</span>
        <h2 class="section-h2">Start free. Grow on your terms.</h2>
        <p class="section-sub">No hidden fees. Cancel anytime.</p>

        <!-- Toggle -->
        <div class="flex items-center justify-center gap-3 mt-6">
          <span
            class="text-sm"
            style="color: {billingAnnual
              ? '#9CA3AF'
              : '#374151'}; font-weight: {billingAnnual ? '400' : '500'};"
            >Monthly</span
          >
          <button
            onclick={() => (billingAnnual = !billingAnnual)}
            class="billing-toggle"
            role="switch"
            aria-checked={billingAnnual}
            aria-label="Toggle annual billing"
          >
            <div
              class="billing-thumb"
              style="transform: translateX({billingAnnual ? '20px' : '2px'});"
            ></div>
          </button>
          <span
            class="text-sm flex items-center gap-1.5"
            style="color: {billingAnnual
              ? '#374151'
              : '#9CA3AF'}; font-weight: {billingAnnual ? '500' : '400'};"
          >
            Annual
            <span class="save-badge">Save 22%</span>
          </span>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate={pricingVisible ? "visible" : "hidden"}
        class="grid grid-cols-1 md:grid-cols-2 gap-5 items-start"
      >
        <!-- Free -->
        <motion.div
          variants={item}
          whileHover={{ y: -3, transition: ht }}
          transition={het}
          class="pricing-card"
        >
          <div class="pricing-plan">Free</div>
          <div class="pricing-price">
            $0 <span class="pricing-period">/forever</span>
          </div>
          <p class="pricing-desc">
            Everything to get started and build your online presence.
          </p>
          <ul class="space-y-2.5 my-6">
            {#each freeFeatures as feat}
              <li
                class="flex items-center gap-2.5 text-sm"
                style="color: #6B7280;"
              >
                <CheckCircle2
                  size={14}
                  style="color: #D1D5DB; flex-shrink: 0;"
                />
                {feat}
              </li>
            {/each}
          </ul>
          <motion.a
            href="/auth/signup"
            whileHover={{ scale: 1.015, transition: ht }}
            whileTap={{ scale: 0.985, transition: tt }}
            transition={het}
            class="pricing-btn-free">Get started free</motion.a
          >
        </motion.div>

        <!-- Pro -->
        <motion.div
          variants={item}
          whileHover={{ y: -3, transition: ht }}
          transition={het}
          class="pricing-card pricing-card-pro relative"
        >
          <div
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 popular-badge"
          >
            Most popular
          </div>
          <div class="pricing-plan" style="color: #4F46E5;">Pro</div>
          <div class="pricing-price">
            {proMonthlyPrice} <span class="pricing-period">{proBilling}</span>
          </div>
          <p class="pricing-desc">
            For creators serious about their audience and brand.
          </p>
          <ul class="space-y-2.5 my-6">
            {#each proFeatures as feat}
              <li
                class="flex items-center gap-2.5 text-sm"
                style="color: #374151;"
              >
                <CheckCircle2
                  size={14}
                  style="color: #4F46E5; flex-shrink: 0;"
                />
                {feat}
              </li>
            {/each}
          </ul>
          <motion.a
            href="/auth/signup?plan=pro"
            whileHover={{ scale: 1.015, y: -1, transition: ht }}
            whileTap={{ scale: 0.985, transition: tt }}
            transition={het}
            class="pricing-btn-pro">Go Pro <ArrowRight size={15} /></motion.a
          >
        </motion.div>
      </motion.div>
    </div>
  </section>

  <!-- ════════════ FINAL CTA ════════════ -->
  <section
    use:viewport={() => (ctaVisible = true)}
    class="py-24 px-4 cta-section relative overflow-hidden"
  >
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, type: "tween", ease: "easeOut" }}
      class="max-w-lg mx-auto text-center"
    >
      <h2 class="cta-h2">
        Your audience is one <span class="accent-text">link away.</span>
      </h2>
      <p class="cta-sub">
        Start free. Upgrade anytime. No credit card required.
      </p>

      <div class="mt-8 text-left">
        <div
          class="handle-input"
          style="border-color: {available === true
            ? '#6EE7B7'
            : available === false
              ? '#FCA5A5'
              : '#E2E2EE'};"
        >
          <span class="handle-prefix">lnksy.com/</span>
          <input
            type="text"
            value={handle}
            oninput={onInput}
            onkeydown={(e) => e.key === "Enter" && claimHandle()}
            placeholder="your-name"
            maxlength="24"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck={false}
            aria-label="Choose your Lnksy handle"
            class="handle-text-input"
          />
          <div class="pr-4 flex items-center" style="min-width: 26px;">
            {#if checking}
              <Loader2 size={14} class="animate-spin" style="color: #A5B4FC;" />
            {:else if available === true}
              <Check size={14} style="color: #10B981;" />
            {:else if available === false}
              <X size={14} style="color: #EF4444;" />
            {/if}
          </div>
        </div>

        <motion.button
          onclick={() => claimHandle()}
          whileHover={canClaim ? { scale: 1.015, y: -1, transition: ht } : {}}
          whileTap={canClaim ? { scale: 0.985, transition: tt } : {}}
          transition={het}
          class="cta-btn mt-3"
          style={canClaim
            ? "background: #4F46E5; color: white; box-shadow: 0 6px 24px rgba(79,70,229,0.22); cursor: pointer;"
            : "background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; border: 1px solid #E5E7EB;"}
          aria-disabled={!canClaim}
        >
          {data.user ? "Go to your Studio" : "Create your Lnksy — it's free"}
          <ArrowRight size={17} />
        </motion.button>
      </div>
    </motion.div>
  </section>

  <!-- ════════════ FOOTER ════════════ -->
  <footer class="border-t px-4 pt-10 pb-8" style="border-color: #F0F0F5;">
    <div class="max-w-6xl mx-auto">
      <div
        class="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8"
      >
        <motion.a
          href="/"
          whileHover={{ scale: 1.04, transition: ht }}
          transition={het}
          class="flex items-center gap-2 font-semibold no-underline nav-logo"
        >
          <div class="nav-logo-mark"><Zap size={12} /></div>
          Lnksy
        </motion.a>

        <div class="flex gap-5 text-sm" style="color: #9CA3AF;">
          {#each [["Terms", "/terms"], ["Privacy", "/privacy"], ["Support", "/support"], ["Status", "/status"]] as [label, href]}
            <a
              {href}
              class="no-underline transition-colors hover:text-gray-700"
              style="color: #9CA3AF;">{label}</a
            >
          {/each}
        </div>

        <div class="flex gap-2">
          <motion.a
            href="#"
            aria-label="Twitter"
            whileHover={{ y: -2, transition: ht }}
            transition={het}
            class="footer-social"><Twitter size={15} /></motion.a
          >
          <motion.a
            href="#"
            aria-label="Instagram"
            whileHover={{ y: -2, transition: ht }}
            transition={het}
            class="footer-social"><Instagram size={15} /></motion.a
          >
        </div>
      </div>

      <p
        class="text-center text-xs"
        style="color: #D1D5DB; letter-spacing: 0.03em;"
      >
        Made for creators, by creators. · © {new Date().getFullYear()} Lnksy. All
        rights reserved.
      </p>
    </div>
  </footer>
</div>

<!-- ════════════ STYLES ════════════ -->
<style>
  :global(body) {
    overflow-x: hidden;
  }

  :global {
    /* ── Base ── */
    .page-shell {
      background: #f8f7f4;
      color: #1c1c27;
      font-family: "Figtree", ui-sans-serif, system-ui, sans-serif;
      min-height: 100vh;
    }

    /* ── Grid texture ── */
    .grid-bg {
      background-image:
        linear-gradient(rgba(0, 0, 0, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.025) 1px, transparent 1px);
      background-size: 56px 56px;
    }

    /* ── Flat accent text ── */
    .accent-text {
      color: #4f46e5;
    }

    /* ── Hero ── */
    .hero-section {
      background: #f8f7f4;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 100px;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      color: #4338ca;
      font-size: 12.5px;
      font-weight: 500;
      margin-bottom: 22px;
    }
    .hero-h1 {
      font-size: clamp(2.5rem, 6vw, 4.2rem);
      font-weight: 800;
      line-height: 0.97;
      letter-spacing: -0.03em;
      color: #111118;
      margin-bottom: 18px;
    }
    .hero-sub {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.65;
      max-width: 390px;
      margin-bottom: 28px;
    }

    /* ── Navbar ── */
    .nav-pill {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 18px;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 900px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.07);
    }
    .nav-logo {
      color: #111118;
      font-size: 15px;
      letter-spacing: -0.01em;
    }
    .nav-logo-mark {
      background: #4f46e5;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-link {
      padding: 7px 12px;
      border-radius: 10px;
      font-size: 13.5px;
      color: #6b7280;
      text-decoration: none;
      transition:
        color 0.15s,
        background 0.15s;
    }
    .nav-link:hover {
      color: #111118;
      background: #f3f4f6;
    }
    .nav-btn-ghost {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #6b7280;
      padding: 7px 13px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      text-decoration: none;
      transition:
        color 0.15s,
        background 0.15s;
    }
    .nav-btn-ghost:hover {
      color: #111118;
      background: #f3f4f6;
    }
    .nav-btn-primary {
      background: #4f46e5;
      color: white;
      padding: 8px 15px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(79, 70, 229, 0.2);
      transition:
        box-shadow 0.2s,
        background 0.2s;
    }
    .nav-btn-primary:hover {
      background: #4338ca;
      box-shadow: 0 4px 18px rgba(79, 70, 229, 0.3);
    }

    /* ── Handle input ── */
    .handle-input {
      display: flex;
      align-items: center;
      border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid #e2e2ee;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      transition:
        border-color 0.22s,
        box-shadow 0.22s;
    }
    .handle-prefix {
      padding-left: 16px;
      padding-right: 4px;
      font-size: 13.5px;
      font-family: "SFMono-Regular", "Consolas", monospace;
      color: #9ca3af;
      white-space: nowrap;
      user-select: none;
      flex-shrink: 0;
    }
    .handle-text-input {
      flex: 1;
      padding: 14px 8px;
      background: transparent;
      color: #111118;
      font-size: 14px;
      font-family: "SFMono-Regular", "Consolas", monospace;
      outline: none;
    }
    .handle-text-input::placeholder {
      color: #d1d5db;
    }

    /* ── Chips ── */
    .suggestion-chip {
      font-size: 11px;
      padding: 3px 11px;
      border-radius: 100px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      cursor: pointer;
      transition:
        color 0.12s,
        background 0.12s,
        border-color 0.12s;
    }
    .suggestion-chip:hover {
      color: #111118;
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    /* ── CTA button ── */
    .cta-btn {
      width: 100%;
      padding: 15px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition:
        box-shadow 0.2s,
        background 0.2s;
      border: none;
      font-family: "Figtree", sans-serif;
    }

    /* ── Float badges ── */
    .float-badge {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
    }

    /* ── Stats ── */
    .stats-section {
      background: #ffffff;
      border-top: 1px solid #f0f0f5;
      border-bottom: 1px solid #f0f0f5;
    }
    .stat-number {
      font-size: clamp(1.9rem, 5vw, 2.8rem);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.02em;
      color: #4f46e5;
    }
    .stat-label {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 4px;
    }

    /* ── Section typography ── */
    .eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 10px;
    }
    .section-h2 {
      font-size: clamp(1.7rem, 4vw, 2.4rem);
      font-weight: 800;
      color: #111118;
      letter-spacing: -0.025em;
      line-height: 1.12;
      margin-bottom: 10px;
    }
    .section-sub {
      font-size: 15px;
      color: #9ca3af;
      max-width: 400px;
      margin: 0 auto;
    }

    /* ── Features ── */
    .feature-card {
      background: #ffffff;
      border: 1px solid #ebebf5;
      border-radius: 18px;
      padding: 20px;
      transition:
        box-shadow 0.2s,
        transform 0.2s;
    }
    .feature-card:hover {
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
    }
    .feature-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #111118;
    }
    .feature-desc {
      font-size: 12.5px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .feature-badge {
      font-size: 9.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 100px;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }

    /* ── Themes section ── */
    .themes-section {
      background: #fafaf8;
    }
    .theme-card {
      background: #ffffff;
      border: 1px solid #ebebf5;
      border-radius: 14px;
      padding: 10px;
      transition: box-shadow 0.18s;
    }
    .theme-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
    }
    .theme-name {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .theme-badge {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 100px;
      border: 1px solid;
      letter-spacing: 0.03em;
    }

    /* ── Steps ── */
    .step-card {
      background: #ffffff;
      border: 1px solid #ebebf5;
      border-radius: 18px;
      padding: 24px;
      text-align: center;
      transition: box-shadow 0.2s;
    }
    .step-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.02em;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      color: #4f46e5;
      margin-bottom: 16px;
    }
    .step-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #111118;
      margin-bottom: 5px;
    }
    .step-desc {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.6;
    }

    /* ── Testimonials ── */
    .testimonials-section {
      background: #fafaf8;
      border-top: 1px solid #f0f0f5;
      border-bottom: 1px solid #f0f0f5;
    }
    .testimonial-card {
      background: #ffffff;
      border: 1px solid #ebebf5;
      border-radius: 18px;
      padding: 20px;
      transition: box-shadow 0.18s;
    }
    .testimonial-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
    }
    .testimonial-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      color: #4f46e5;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .testimonial-name {
      font-size: 13px;
      font-weight: 700;
      color: #111118;
    }
    .testimonial-role {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 1px;
    }
    .testimonial-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.65;
    }

    /* ── Pricing ── */
    .pricing-card {
      background: #ffffff;
      border: 1px solid #ebebf5;
      border-radius: 22px;
      padding: 28px;
      transition: box-shadow 0.2s;
    }
    .pricing-card:hover {
      box-shadow: 0 6px 28px rgba(0, 0, 0, 0.07);
    }
    .pricing-card-pro {
      border-color: #e0e7ff;
      box-shadow:
        0 0 0 1px #eef2ff,
        0 8px 40px rgba(79, 70, 229, 0.07);
    }
    .pricing-plan {
      font-size: 17px;
      font-weight: 700;
      color: #111118;
      margin-bottom: 6px;
    }
    .pricing-price {
      font-size: 38px;
      font-weight: 800;
      color: #111118;
      line-height: 1;
      margin-bottom: 10px;
      letter-spacing: -0.03em;
    }
    .pricing-period {
      font-size: 13px;
      font-weight: 400;
      color: #9ca3af;
      letter-spacing: 0;
    }
    .pricing-desc {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .pricing-btn-free {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px;
      border-radius: 11px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s;
      font-family: "Figtree", sans-serif;
    }
    .pricing-btn-free:hover {
      background: #f3f4f6;
    }
    .pricing-btn-pro {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      width: 100%;
      padding: 12px;
      border-radius: 11px;
      background: #4f46e5;
      color: white;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 18px rgba(79, 70, 229, 0.22);
      transition:
        background 0.2s,
        box-shadow 0.2s;
      font-family: "Figtree", sans-serif;
    }
    .pricing-btn-pro:hover {
      background: #4338ca;
      box-shadow: 0 6px 24px rgba(79, 70, 229, 0.32);
    }

    .popular-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #4f46e5;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 100px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.22);
    }

    /* ── Billing toggle ── */
    .billing-toggle {
      width: 44px;
      height: 24px;
      background: #e5e7eb;
      border: 1px solid #d1d5db;
      border-radius: 100px;
      cursor: pointer;
      position: relative;
      transition:
        background 0.2s,
        border-color 0.2s;
    }
    .billing-toggle[aria-checked="true"] {
      background: #4f46e5;
      border-color: #4f46e5;
    }
    .billing-thumb {
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    }
    .save-badge {
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      color: #4f46e5;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 100px;
    }

    /* ── Final CTA ── */
    .cta-section {
      background: #ffffff;
      border-top: 1px solid #f0f0f5;
    }
    .cta-h2 {
      font-size: clamp(1.9rem, 5vw, 3rem);
      font-weight: 800;
      color: #111118;
      letter-spacing: -0.03em;
      line-height: 1.08;
      margin-bottom: 12px;
    }
    .cta-sub {
      font-size: 15px;
      color: #9ca3af;
    }

    /* ── Footer ── */
    .footer-social {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      color: #9ca3af;
      text-decoration: none;
      transition:
        background 0.15s,
        color 0.15s;
    }
    .footer-social:hover {
      background: #f3f4f6;
      color: #374151;
    }
  } /* end :global */

  /* ── Focus rings ── */
  :global(button:focus-visible),
  :global(a:focus-visible),
  :global(input:focus-visible) {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }
  :global(.handle-text-input:focus-visible) {
    outline: none;
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
