import { internalMutation } from "./_generated/server";

// =============================================================
// Lnksy — Seed Data
// Equivalente a seed.sql + migraciones 0001 y 0003
// Idempotente: verifica si los datos ya existen antes de insertar
// Ejecutar una vez con: npx convex run seed:all
// =============================================================

// ─── Helper ──────────────────────────────────────────────────

async function upsertByField(
  ctx: any,
  table: string,
  indexName: string,
  fieldName: string,
  fieldValue: string,
  data: Record<string, any>,
) {
  const existing = await ctx.db
    .query(table)
    .withIndex(indexName, (q: any) => q.eq(fieldName, fieldValue))
    .first();
  if (!existing) {
    await ctx.db.insert(table, data);
  }
}

// ─── Themes ──────────────────────────────────────────────────

export const seedThemes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const themes = [
      // ── FREE themes ───────────────────────────────────────
      {
        themeId: "default",
        name: "Default",
        isPro: false,
        tags: ["light", "minimal"],
        config: {
          bg: "#ffffff", text: "#1a1a1a",
          cardBg: "#f3f4f6", cardText: "#1a1a1a",
          cardBorder: "transparent", cardRadius: "12px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "midnight",
        name: "Midnight",
        isPro: false,
        tags: ["dark", "minimal", "cool"],
        config: {
          bg: "#0f172a", text: "#f1f5f9",
          cardBg: "#1e293b", cardText: "#f1f5f9",
          cardBorder: "#334155", cardRadius: "12px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "forest",
        name: "Forest",
        isPro: false,
        tags: ["dark", "nature", "warm"],
        config: {
          bg: "#064e3b", text: "#ecfdf5",
          cardBg: "#065f46", cardText: "#ecfdf5",
          cardBorder: "#047857", cardRadius: "16px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "slate",
        name: "Slate",
        isPro: false,
        tags: ["light", "cool", "minimal"],
        config: {
          bg: "#f8fafc", text: "#0f172a", muted: "#64748b", accent: "#6366f1",
          cardBg: "#f1f5f9", cardText: "#0f172a", cardBorder: "#e2e8f0",
          cardRadius: "10px", cardShadow: "0 1px 3px rgba(0,0,0,0.06)",
          buttonVariant: "filled", buttonRadius: "10px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "cream",
        name: "Cream",
        isPro: false,
        tags: ["light", "warm", "minimal"],
        config: {
          bg: "#fefbf3", text: "#292524", muted: "#78716c", accent: "#d97706",
          cardBg: "#fef3c7", cardText: "#292524", cardBorder: "#fde68a",
          cardRadius: "14px", cardShadow: "0 1px 4px rgba(0,0,0,0.05)",
          buttonVariant: "filled", buttonRadius: "14px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "charcoal",
        name: "Charcoal",
        isPro: false,
        tags: ["dark", "minimal"],
        config: {
          bg: "#1c1c1e", text: "#f5f5f7", muted: "#8e8e93", accent: "#0a84ff",
          cardBg: "#2c2c2e", cardText: "#f5f5f7", cardBorder: "#3a3a3c",
          cardRadius: "12px", cardShadow: "0 2px 8px rgba(0,0,0,0.3)",
          buttonVariant: "filled", buttonRadius: "12px",
          font: "Inter, sans-serif", shadowIntensity: "medium",
        },
      },
      {
        themeId: "rose",
        name: "Rose",
        isPro: false,
        tags: ["light", "warm", "pastel"],
        config: {
          bg: "#fff1f2", text: "#881337", muted: "#be123c", accent: "#e11d48",
          cardBg: "#ffe4e6", cardText: "#881337", cardBorder: "#fda4af",
          cardRadius: "16px", cardShadow: "0 1px 4px rgba(225,29,72,0.08)",
          buttonVariant: "filled", buttonRadius: "16px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "sky",
        name: "Sky",
        isPro: false,
        tags: ["light", "cool", "minimal"],
        config: {
          bg: "#f0f9ff", text: "#0c4a6e", muted: "#0369a1", accent: "#0ea5e9",
          cardBg: "#e0f2fe", cardText: "#0c4a6e", cardBorder: "#bae6fd",
          cardRadius: "14px", cardShadow: "0 1px 4px rgba(14,165,233,0.08)",
          buttonVariant: "filled", buttonRadius: "14px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },

      // ── PRO themes — seed.sql originals ───────────────────
      {
        themeId: "sunset",
        name: "Sunset",
        isPro: true,
        tags: ["gradient", "warm"],
        config: {
          bg: "linear-gradient(135deg, #f97316, #ec4899)", text: "#ffffff",
          cardBg: "rgba(255,255,255,0.15)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.25)", cardRadius: "16px",
          buttonVariant: "outline", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "ocean",
        name: "Ocean",
        isPro: true,
        tags: ["gradient", "cool"],
        config: {
          bg: "linear-gradient(180deg, #0ea5e9, #6366f1)", text: "#ffffff",
          cardBg: "rgba(255,255,255,0.12)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.2)", cardRadius: "24px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "candy",
        name: "Candy",
        isPro: true,
        tags: ["gradient", "pastel"],
        config: {
          bg: "linear-gradient(135deg, #f472b6, #a78bfa)", text: "#ffffff",
          cardBg: "rgba(255,255,255,0.2)", cardText: "#ffffff",
          cardBorder: "transparent", cardRadius: "999px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "neon",
        name: "Neon",
        isPro: true,
        tags: ["dark", "neon"],
        config: {
          bg: "#09090b", text: "#22d3ee",
          cardBg: "transparent", cardText: "#22d3ee",
          cardBorder: "#22d3ee", cardRadius: "8px",
          buttonVariant: "outline", font: "JetBrains Mono, monospace",
        },
      },
      {
        themeId: "minimal",
        name: "Minimal",
        isPro: true,
        tags: ["light", "minimal"],
        config: {
          bg: "#fafafa", text: "#171717",
          cardBg: "transparent", cardText: "#171717",
          cardBorder: "#e5e5e5", cardRadius: "0px",
          buttonVariant: "outline", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "lavender",
        name: "Lavender",
        isPro: true,
        tags: ["pastel", "light"],
        config: {
          bg: "#f5f3ff", text: "#4c1d95",
          cardBg: "#ede9fe", cardText: "#4c1d95",
          cardBorder: "#c4b5fd", cardRadius: "16px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "brutalist",
        name: "Brutalist",
        isPro: true,
        tags: ["bold", "brutalist", "warm"],
        config: {
          bg: "#fef08a", text: "#000000",
          cardBg: "#ffffff", cardText: "#000000",
          cardBorder: "#000000", cardRadius: "0px",
          buttonVariant: "filled", font: "Space Mono, monospace",
        },
      },
      {
        themeId: "glass",
        name: "Glass",
        isPro: true,
        tags: ["glass", "gradient", "cool"],
        config: {
          bg: "linear-gradient(135deg, #667eea, #764ba2)", text: "#ffffff",
          cardBg: "rgba(255,255,255,0.1)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.2)", cardRadius: "16px",
          buttonVariant: "filled", font: "Inter, sans-serif",
          backdropBlur: "12px",
        },
      },
      {
        themeId: "cherry",
        name: "Cherry",
        isPro: true,
        tags: ["dark", "warm"],
        config: {
          bg: "#1c1917", text: "#fecdd3",
          cardBg: "#292524", cardText: "#fecdd3",
          cardBorder: "#991b1b", cardRadius: "12px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },
      {
        themeId: "arctic",
        name: "Arctic",
        isPro: true,
        tags: ["pastel", "light", "cool"],
        config: {
          bg: "#f0f9ff", text: "#0c4a6e",
          cardBg: "#e0f2fe", cardText: "#0c4a6e",
          cardBorder: "#7dd3fc", cardRadius: "20px",
          buttonVariant: "filled", font: "Inter, sans-serif",
        },
      },

      // ── PRO themes — migración 0003 ───────────────────────
      {
        themeId: "aurora",
        name: "Aurora",
        isPro: true,
        tags: ["gradient", "cool", "nature"],
        config: {
          bg: "linear-gradient(135deg, #0f766e, #0891b2, #1d4ed8)", text: "#ffffff",
          muted: "rgba(255,255,255,0.7)", accent: "#5eead4",
          cardBg: "rgba(255,255,255,0.12)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.2)", cardRadius: "20px",
          cardShadow: "0 4px 20px rgba(0,0,0,0.15)",
          buttonVariant: "outline", buttonRadius: "20px",
          font: "Inter, sans-serif", backdropBlur: "8px", shadowIntensity: "medium",
        },
      },
      {
        themeId: "dusk",
        name: "Dusk",
        isPro: true,
        tags: ["gradient", "warm"],
        config: {
          bg: "linear-gradient(160deg, #7c3aed, #db2777, #f97316)", text: "#ffffff",
          muted: "rgba(255,255,255,0.75)", accent: "#fbbf24",
          cardBg: "rgba(255,255,255,0.15)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.25)", cardRadius: "18px",
          cardShadow: "0 4px 16px rgba(0,0,0,0.2)",
          buttonVariant: "filled", buttonRadius: "18px",
          font: "Inter, sans-serif", backdropBlur: "6px", shadowIntensity: "medium",
        },
      },
      {
        themeId: "nebula",
        name: "Nebula",
        isPro: true,
        tags: ["gradient", "dark", "cool"],
        config: {
          bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", text: "#e0c3fc",
          muted: "#a78bfa", accent: "#c084fc",
          cardBg: "rgba(255,255,255,0.08)", cardText: "#e0c3fc",
          cardBorder: "rgba(168,139,250,0.3)", cardRadius: "16px",
          cardShadow: "0 4px 20px rgba(0,0,0,0.3)",
          buttonVariant: "outline", buttonRadius: "16px",
          font: "Inter, sans-serif", backdropBlur: "12px", shadowIntensity: "strong",
        },
      },
      {
        themeId: "tropical",
        name: "Tropical",
        isPro: true,
        tags: ["gradient", "warm", "nature"],
        config: {
          bg: "linear-gradient(135deg, #d4fc79, #96e6a1)", text: "#064e3b",
          muted: "#065f46", accent: "#059669",
          cardBg: "rgba(255,255,255,0.5)", cardText: "#064e3b",
          cardBorder: "rgba(255,255,255,0.7)", cardRadius: "20px",
          cardShadow: "0 2px 12px rgba(0,0,0,0.08)",
          buttonVariant: "filled", buttonRadius: "20px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "flamingo",
        name: "Flamingo",
        isPro: true,
        tags: ["gradient", "warm", "pastel"],
        config: {
          bg: "linear-gradient(135deg, #ffecd2, #fcb69f)", text: "#7f1d1d",
          muted: "#b91c1c", accent: "#ef4444",
          cardBg: "rgba(255,255,255,0.6)", cardText: "#7f1d1d",
          cardBorder: "rgba(255,255,255,0.8)", cardRadius: "24px",
          cardShadow: "0 2px 8px rgba(239,68,68,0.1)",
          buttonVariant: "filled", buttonRadius: "24px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "citrus",
        name: "Citrus",
        isPro: true,
        tags: ["gradient", "bold", "warm"],
        config: {
          bg: "linear-gradient(135deg, #facc15, #f97316)", text: "#1c1917",
          muted: "#292524", accent: "#c2410c",
          cardBg: "rgba(255,255,255,0.25)", cardText: "#1c1917",
          cardBorder: "rgba(255,255,255,0.4)", cardRadius: "16px",
          cardShadow: "0 4px 16px rgba(0,0,0,0.1)",
          buttonVariant: "filled", buttonRadius: "16px",
          font: "Inter, sans-serif", backdropBlur: "4px", shadowIntensity: "soft",
        },
      },
      {
        themeId: "galaxy",
        name: "Galaxy",
        isPro: true,
        tags: ["gradient", "dark", "cool"],
        config: {
          bg: "linear-gradient(135deg, #0f0c29, #302b63, #1e3a5f)", text: "#e0f2fe",
          muted: "#7dd3fc", accent: "#38bdf8",
          cardBg: "rgba(255,255,255,0.06)", cardText: "#e0f2fe",
          cardBorder: "rgba(56,189,248,0.2)", cardRadius: "16px",
          cardShadow: "0 4px 24px rgba(0,0,0,0.4)",
          buttonVariant: "outline", buttonRadius: "16px",
          font: "Inter, sans-serif", backdropBlur: "8px", shadowIntensity: "strong",
        },
      },
      {
        themeId: "carbon",
        name: "Carbon",
        isPro: true,
        tags: ["dark", "minimal", "cool"],
        config: {
          bg: "#09090b", text: "#fafafa", muted: "#71717a", accent: "#3b82f6",
          cardBg: "#18181b", cardText: "#fafafa", cardBorder: "#27272a",
          cardRadius: "8px", cardShadow: "0 2px 8px rgba(0,0,0,0.5)",
          buttonVariant: "outline", buttonRadius: "8px",
          font: "Inter, sans-serif", shadowIntensity: "medium",
        },
      },
      {
        themeId: "obsidian",
        name: "Obsidian",
        isPro: true,
        tags: ["dark", "cool"],
        config: {
          bg: "#0a0a0f", text: "#e2e8f0", muted: "#94a3b8", accent: "#8b5cf6",
          cardBg: "#12121a", cardText: "#e2e8f0", cardBorder: "#2d2040",
          cardRadius: "14px", cardShadow: "0 0 20px rgba(139,92,246,0.1)",
          buttonVariant: "outline", buttonRadius: "14px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "eclipse",
        name: "Eclipse",
        isPro: true,
        tags: ["dark", "warm"],
        config: {
          bg: "#0c0a09", text: "#fef3c7", muted: "#d97706", accent: "#f59e0b",
          cardBg: "#1c1917", cardText: "#fef3c7", cardBorder: "#44270a",
          cardRadius: "12px", cardShadow: "0 2px 12px rgba(0,0,0,0.4)",
          buttonVariant: "outline", buttonRadius: "12px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "dark-rose",
        name: "Dark Rose",
        isPro: true,
        tags: ["dark", "warm", "pastel"],
        config: {
          bg: "#0d0608", text: "#fda4af", muted: "#f43f5e", accent: "#fb7185",
          cardBg: "#1a0d10", cardText: "#fda4af", cardBorder: "#3d1a21",
          cardRadius: "16px", cardShadow: "0 2px 12px rgba(0,0,0,0.5)",
          buttonVariant: "outline", buttonRadius: "16px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "void",
        name: "Void",
        isPro: true,
        tags: ["dark", "minimal"],
        config: {
          bg: "#000000", text: "#ffffff", muted: "#6b7280", accent: "#ffffff",
          cardBg: "#111111", cardText: "#ffffff", cardBorder: "#222222",
          cardRadius: "0px", cardShadow: "none",
          buttonVariant: "outline", buttonRadius: "0px",
          font: "Inter, sans-serif", shadowIntensity: "none",
        },
      },
      {
        themeId: "nord",
        name: "Nord",
        isPro: true,
        tags: ["dark", "cool", "minimal"],
        config: {
          bg: "#2e3440", text: "#eceff4", muted: "#d8dee9", accent: "#88c0d0",
          cardBg: "#3b4252", cardText: "#eceff4", cardBorder: "#434c5e",
          cardRadius: "12px", cardShadow: "0 2px 8px rgba(0,0,0,0.3)",
          buttonVariant: "filled", buttonRadius: "12px",
          font: "Inter, sans-serif", shadowIntensity: "medium",
        },
      },
      {
        themeId: "mocha",
        name: "Mocha",
        isPro: true,
        tags: ["dark", "warm", "minimal"],
        config: {
          bg: "#1c1007", text: "#e8d5b7", muted: "#d4a574", accent: "#c9a96e",
          cardBg: "#2a1f10", cardText: "#e8d5b7", cardBorder: "#3d2b17",
          cardRadius: "10px", cardShadow: "0 2px 8px rgba(0,0,0,0.4)",
          buttonVariant: "outline", buttonRadius: "10px",
          font: "Inter, sans-serif", shadowIntensity: "medium",
        },
      },
      {
        themeId: "frost",
        name: "Frost",
        isPro: true,
        tags: ["glass", "light", "cool"],
        config: {
          bg: "linear-gradient(135deg, #e0f2fe, #f0fdf4)", text: "#0c4a6e",
          muted: "#0369a1", accent: "#0ea5e9",
          cardBg: "rgba(255,255,255,0.65)", cardText: "#0c4a6e",
          cardBorder: "rgba(255,255,255,0.9)", cardRadius: "20px",
          cardShadow: "0 8px 32px rgba(14,165,233,0.1)",
          buttonVariant: "filled", buttonRadius: "20px",
          font: "Inter, sans-serif", backdropBlur: "16px", shadowIntensity: "soft",
        },
      },
      {
        themeId: "vapor",
        name: "Vapor",
        isPro: true,
        tags: ["glass", "gradient", "neon", "cool"],
        config: {
          bg: "linear-gradient(135deg, #0f0c29, #1a1a2e)", text: "#f0e6ff",
          muted: "#a78bfa", accent: "#22d3ee",
          cardBg: "rgba(255,255,255,0.06)", cardText: "#f0e6ff",
          cardBorder: "rgba(34,211,238,0.25)", cardRadius: "16px",
          cardShadow: "0 0 24px rgba(34,211,238,0.1)",
          buttonVariant: "outline", buttonRadius: "16px",
          font: "Inter, sans-serif", backdropBlur: "12px", shadowIntensity: "strong",
        },
      },
      {
        themeId: "crystal",
        name: "Crystal",
        isPro: true,
        tags: ["glass", "cool", "gradient"],
        config: {
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #0ea5e9 100%)", text: "#ffffff",
          muted: "rgba(255,255,255,0.75)", accent: "#bfdbfe",
          cardBg: "rgba(255,255,255,0.18)", cardText: "#ffffff",
          cardBorder: "rgba(255,255,255,0.35)", cardRadius: "24px",
          cardShadow: "0 8px 32px rgba(0,0,0,0.15)",
          buttonVariant: "filled", buttonRadius: "24px",
          font: "Inter, sans-serif", backdropBlur: "20px", shadowIntensity: "medium",
        },
      },
      {
        themeId: "butter",
        name: "Butter",
        isPro: true,
        tags: ["pastel", "light", "warm"],
        config: {
          bg: "#fefce8", text: "#713f12", muted: "#92400e", accent: "#f59e0b",
          cardBg: "#fef9c3", cardText: "#713f12", cardBorder: "#fde68a",
          cardRadius: "20px", cardShadow: "0 2px 8px rgba(245,158,11,0.1)",
          buttonVariant: "filled", buttonRadius: "20px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "sakura",
        name: "Sakura",
        isPro: true,
        tags: ["pastel", "light", "warm"],
        config: {
          bg: "#fdf2f8", text: "#831843", muted: "#be185d", accent: "#ec4899",
          cardBg: "#fce7f3", cardText: "#831843", cardBorder: "#fbcfe8",
          cardRadius: "999px", cardShadow: "0 2px 8px rgba(236,72,153,0.1)",
          buttonVariant: "filled", buttonRadius: "999px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "mint-fresh",
        name: "Mint",
        isPro: true,
        tags: ["pastel", "light", "cool", "nature"],
        config: {
          bg: "#f0fdf4", text: "#14532d", muted: "#166534", accent: "#16a34a",
          cardBg: "#dcfce7", cardText: "#14532d", cardBorder: "#bbf7d0",
          cardRadius: "16px", cardShadow: "0 2px 8px rgba(22,163,74,0.08)",
          buttonVariant: "filled", buttonRadius: "16px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "peach",
        name: "Peach",
        isPro: true,
        tags: ["pastel", "light", "warm"],
        config: {
          bg: "#fff7ed", text: "#7c2d12", muted: "#c2410c", accent: "#ea580c",
          cardBg: "#ffedd5", cardText: "#7c2d12", cardBorder: "#fed7aa",
          cardRadius: "18px", cardShadow: "0 2px 8px rgba(234,88,12,0.08)",
          buttonVariant: "filled", buttonRadius: "18px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "lilac",
        name: "Lilac",
        isPro: true,
        tags: ["pastel", "light", "cool"],
        config: {
          bg: "#f5f3ff", text: "#3b0764", muted: "#6d28d9", accent: "#7c3aed",
          cardBg: "#ede9fe", cardText: "#3b0764", cardBorder: "#ddd6fe",
          cardRadius: "16px", cardShadow: "0 2px 8px rgba(124,58,237,0.08)",
          buttonVariant: "filled", buttonRadius: "16px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "bold-blue",
        name: "Bold Blue",
        isPro: true,
        tags: ["bold", "dark", "cool"],
        config: {
          bg: "#1e3a8a", text: "#ffffff", muted: "#93c5fd", accent: "#fbbf24",
          cardBg: "#1d4ed8", cardText: "#ffffff", cardBorder: "#3b82f6",
          cardRadius: "8px", cardShadow: "0 4px 16px rgba(0,0,0,0.3)",
          buttonVariant: "filled", buttonRadius: "8px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "noire",
        name: "Noire",
        isPro: true,
        tags: ["bold", "dark", "minimal"],
        config: {
          bg: "#000000", text: "#ffffff", muted: "#9ca3af", accent: "#ffffff",
          cardBg: "#ffffff", cardText: "#000000", cardBorder: "#ffffff",
          cardRadius: "4px", cardShadow: "none",
          buttonVariant: "filled", buttonRadius: "4px",
          font: "Inter, sans-serif", shadowIntensity: "none",
        },
      },
      {
        themeId: "terracotta",
        name: "Terracotta",
        isPro: true,
        tags: ["bold", "warm", "nature"],
        config: {
          bg: "#7c2d12", text: "#fef3c7", muted: "#fbbf24", accent: "#fbbf24",
          cardBg: "#92400e", cardText: "#fef3c7", cardBorder: "#b45309",
          cardRadius: "6px", cardShadow: "0 4px 16px rgba(0,0,0,0.3)",
          buttonVariant: "outline", buttonRadius: "6px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "jungle",
        name: "Jungle",
        isPro: true,
        tags: ["bold", "dark", "nature", "warm"],
        config: {
          bg: "#052e16", text: "#d1fae5", muted: "#6ee7b7", accent: "#34d399",
          cardBg: "#064e3b", cardText: "#d1fae5", cardBorder: "#065f46",
          cardRadius: "8px", cardShadow: "0 4px 16px rgba(0,0,0,0.4)",
          buttonVariant: "outline", buttonRadius: "8px",
          font: "Inter, sans-serif", shadowIntensity: "strong",
        },
      },
      {
        themeId: "ink",
        name: "Ink",
        isPro: true,
        tags: ["bold", "dark", "minimal"],
        config: {
          bg: "#030712", text: "#f9fafb", muted: "#6b7280", accent: "#f9fafb",
          cardBg: "#111827", cardText: "#f9fafb", cardBorder: "#1f2937",
          cardRadius: "0px", cardShadow: "none",
          buttonVariant: "outline", buttonRadius: "0px",
          font: "Inter, sans-serif", shadowIntensity: "none",
        },
      },
      {
        themeId: "paper",
        name: "Paper",
        isPro: true,
        tags: ["light", "warm", "minimal"],
        config: {
          bg: "#fafaf9", text: "#1c1917", muted: "#78716c", accent: "#d97706",
          cardBg: "#f5f5f4", cardText: "#1c1917", cardBorder: "#e7e5e4",
          cardRadius: "8px", cardShadow: "0 1px 2px rgba(0,0,0,0.04)",
          buttonVariant: "outline", buttonRadius: "8px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
      {
        themeId: "sand",
        name: "Sand",
        isPro: true,
        tags: ["light", "warm", "minimal"],
        config: {
          bg: "#fef9c3", text: "#713f12", muted: "#92400e", accent: "#b45309",
          cardBg: "#fefce8", cardText: "#713f12", cardBorder: "#fde68a",
          cardRadius: "6px", cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
          buttonVariant: "outline", buttonRadius: "6px",
          font: "Inter, sans-serif", shadowIntensity: "soft",
        },
      },
    ];

    for (const theme of themes) {
      await upsertByField(ctx, "themes", "by_theme_id", "themeId", theme.themeId, theme);
    }

    return { inserted: themes.length };
  },
});

// ─── Fonts ───────────────────────────────────────────────────

export const seedFonts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fonts = [
      // FREE
      { fontId: "inter", name: "Inter", family: "'Inter', sans-serif", isPro: false, url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
      { fontId: "dm-sans", name: "DM Sans", family: "'DM Sans', sans-serif", isPro: false, url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" },
      { fontId: "plus-jakarta", name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", isPro: false, url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" },
      { fontId: "nunito", name: "Nunito", family: "'Nunito', sans-serif", isPro: false, url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" },
      { fontId: "poppins", name: "Poppins", family: "'Poppins', sans-serif", isPro: false, url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" },
      // PRO
      { fontId: "space-grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" },
      { fontId: "outfit", name: "Outfit", family: "'Outfit', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" },
      { fontId: "sora", name: "Sora", family: "'Sora', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" },
      { fontId: "space-mono", name: "Space Mono", family: "'Space Mono', monospace", isPro: true, url: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" },
      { fontId: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" },
      { fontId: "jetbrains", name: "JetBrains Mono", family: "'JetBrains Mono', monospace", isPro: true, url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" },
      { fontId: "cabinet", name: "Cabinet Grotesk", family: "'Cabinet Grotesk', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" },
      { fontId: "lato", name: "Lato", family: "'Lato', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" },
      { fontId: "raleway", name: "Raleway", family: "'Raleway', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap" },
      { fontId: "montserrat", name: "Montserrat", family: "'Montserrat', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" },
      { fontId: "oswald", name: "Oswald", family: "'Oswald', sans-serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" },
      { fontId: "merriweather", name: "Merriweather", family: "'Merriweather', serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" },
      { fontId: "libre-baskerville", name: "Libre Baskerville", family: "'Libre Baskerville', serif", isPro: true, url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" },
      { fontId: "dancing-script", name: "Dancing Script", family: "'Dancing Script', cursive", isPro: true, url: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" },
      { fontId: "fira-code", name: "Fira Code", family: "'Fira Code', monospace", isPro: true, url: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap" },
    ];

    for (const font of fonts) {
      await upsertByField(ctx, "fonts", "by_font_id", "fontId", font.fontId, font);
    }

    return { inserted: fonts.length };
  },
});

// ─── Backgrounds ─────────────────────────────────────────────

export const seedBackgrounds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const backgrounds = [
      // ── Sólidos ────────────────────────────────────────────
      { backgroundId: "solid-white",  name: "White",       type: "solid",    value: "#ffffff",    isPro: false, meta: { tags: ["light"] } },
      { backgroundId: "solid-gray",   name: "Light Gray",  type: "solid",    value: "#f3f4f6",    isPro: false, meta: { tags: ["light", "neutral"] } },
      { backgroundId: "solid-dark",   name: "Dark",        type: "solid",    value: "#0f172a",    isPro: false, meta: { tags: ["dark"] } },
      { backgroundId: "solid-black",  name: "Black",       type: "solid",    value: "#000000",    isPro: false, meta: { tags: ["dark"] } },
      { backgroundId: "solid-cream",  name: "Cream",       type: "solid",    value: "#fefbf3",    isPro: false, meta: { tags: ["warm", "light"] } },
      { backgroundId: "solid-slate",  name: "Slate",       type: "solid",    value: "#f8fafc",    isPro: false, meta: { tags: ["cool", "light"] } },
      { backgroundId: "solid-rose",   name: "Rose",        type: "solid",    value: "#fff1f2",    isPro: false, meta: { tags: ["warm", "light", "pastel"] } },
      { backgroundId: "solid-navy",   name: "Navy",        type: "solid",    value: "#1e3a8a",    isPro: true,  meta: { tags: ["dark", "cool"] } },
      { backgroundId: "solid-forest", name: "Forest",      type: "solid",    value: "#052e16",    isPro: true,  meta: { tags: ["dark", "nature"] } },
      { backgroundId: "solid-zinc",   name: "Zinc",        type: "solid",    value: "#3f3f46",    isPro: true,  meta: { tags: ["dark", "neutral"] } },
      { backgroundId: "solid-amber",  name: "Amber",       type: "solid",    value: "#78350f",    isPro: true,  meta: { tags: ["dark", "warm"] } },
      { backgroundId: "solid-teal",   name: "Teal",        type: "solid",    value: "#0f766e",    isPro: true,  meta: { tags: ["dark", "cool", "nature"] } },

      // ── Gradientes ─────────────────────────────────────────
      { backgroundId: "gradient-sunset",    name: "Sunset",     type: "gradient", value: "linear-gradient(135deg, #f97316, #ec4899)",           isPro: true,  meta: { tags: ["warm", "gradient"] } },
      { backgroundId: "gradient-ocean",     name: "Ocean",      type: "gradient", value: "linear-gradient(180deg, #0ea5e9, #6366f1)",           isPro: true,  meta: { tags: ["cool", "gradient"] } },
      { backgroundId: "gradient-candy",     name: "Candy",      type: "gradient", value: "linear-gradient(135deg, #f472b6, #a78bfa)",           isPro: true,  meta: { tags: ["pastel", "gradient"] } },
      { backgroundId: "gradient-emerald",   name: "Emerald",    type: "gradient", value: "linear-gradient(135deg, #10b981, #059669)",           isPro: true,  meta: { tags: ["nature", "gradient"] } },
      { backgroundId: "gradient-midnight",  name: "Midnight",   type: "gradient", value: "linear-gradient(135deg, #1e1b4b, #312e81)",           isPro: true,  meta: { tags: ["dark", "gradient"] } },
      { backgroundId: "gradient-peach",     name: "Peach",      type: "gradient", value: "linear-gradient(135deg, #fbbf24, #f472b6)",           isPro: true,  meta: { tags: ["warm", "gradient"] } },
      { backgroundId: "gradient-aurora",    name: "Aurora",     type: "gradient", value: "linear-gradient(135deg, #0f766e, #0891b2, #1d4ed8)",  isPro: true,  meta: { tags: ["cool", "nature"] } },
      { backgroundId: "gradient-dusk",      name: "Dusk",       type: "gradient", value: "linear-gradient(160deg, #7c3aed, #db2777, #f97316)",  isPro: true,  meta: { tags: ["warm", "bold"] } },
      { backgroundId: "gradient-nebula",    name: "Nebula",     type: "gradient", value: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",  isPro: true,  meta: { tags: ["dark", "cool"] } },
      { backgroundId: "gradient-citrus",    name: "Citrus",     type: "gradient", value: "linear-gradient(135deg, #facc15, #f97316)",           isPro: true,  meta: { tags: ["warm", "bold"] } },
      { backgroundId: "gradient-rose",      name: "Rose Gold",  type: "gradient", value: "linear-gradient(135deg, #f43f5e, #fda4af)",           isPro: true,  meta: { tags: ["warm", "pastel"] } },
      { backgroundId: "gradient-arctic",    name: "Arctic",     type: "gradient", value: "linear-gradient(180deg, #e0f2fe, #f0fdf4)",           isPro: false, meta: { tags: ["cool", "light"] } },
      { backgroundId: "gradient-galaxy",    name: "Galaxy",     type: "gradient", value: "linear-gradient(135deg, #0f0c29, #302b63, #1e3a5f)",  isPro: true,  meta: { tags: ["dark", "cool"] } },
      { backgroundId: "gradient-midnight2", name: "Deep Night", type: "gradient", value: "linear-gradient(180deg, #000000, #1a1a2e)",           isPro: true,  meta: { tags: ["dark"] } },
      { backgroundId: "gradient-tropical",  name: "Tropical",   type: "gradient", value: "linear-gradient(135deg, #d4fc79, #96e6a1)",           isPro: true,  meta: { tags: ["nature", "light"] } },
      { backgroundId: "gradient-forest",    name: "Forest",     type: "gradient", value: "linear-gradient(135deg, #064e3b, #065f46)",           isPro: true,  meta: { tags: ["dark", "nature"] } },

      // ── Patrones ───────────────────────────────────────────
      { backgroundId: "pattern-dots",      name: "Dots",       type: "pattern", value: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",                                                                                                             isPro: false, meta: { tags: ["light", "pattern"] } },
      { backgroundId: "pattern-grid",      name: "Grid",       type: "pattern", value: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",                                                              isPro: true,  meta: { tags: ["light", "pattern"] } },
      { backgroundId: "pattern-diagonal",  name: "Diagonal",   type: "pattern", value: "repeating-linear-gradient(45deg, transparent, transparent 10px, #f3f4f6 10px, #f3f4f6 11px)",                                                                     isPro: true,  meta: { tags: ["light", "pattern"] } },
      { backgroundId: "pattern-dots-sm",   name: "Fine Dots",  type: "pattern", value: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",                                                                                                             isPro: false, meta: { tags: ["light", "minimal"] } },
      { backgroundId: "pattern-circles",   name: "Circles",    type: "pattern", value: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)",                                                                                    isPro: false, meta: { tags: ["light", "cool"] } },
      { backgroundId: "pattern-waves",     name: "Waves",      type: "pattern", value: "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(99,102,241,0.05) 24px, rgba(99,102,241,0.05) 25px)",                                           isPro: false, meta: { tags: ["light", "minimal"] } },
      { backgroundId: "pattern-grid-dark", name: "Dark Grid",  type: "pattern", value: "linear-gradient(#2d2d2d 1px, transparent 1px), linear-gradient(90deg, #2d2d2d 1px, transparent 1px)",                                                              isPro: true,  meta: { tags: ["dark", "minimal"] } },
      { backgroundId: "pattern-cross",     name: "Cross Hatch", type: "pattern", value: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px), repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px)", isPro: false, meta: { tags: ["light", "minimal"] } },
    ];

    for (const bg of backgrounds) {
      await upsertByField(ctx, "backgrounds", "by_background_id", "backgroundId", bg.backgroundId, bg);
    }

    return { inserted: backgrounds.length };
  },
});

// ─── Reserved Slugs ──────────────────────────────────────────

export const seedReservedSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slugs = [
      "admin", "api", "app", "auth", "billing", "blog", "contact",
      "dashboard", "docs", "help", "login", "logout", "onboarding",
      "pricing", "privacy", "pro", "profile", "register", "settings",
      "signup", "support", "terms", "tos", "about", "careers", "legal",
      "status", "www", "mail", "ftp", "lnksy", "linktree",
    ];

    for (const slug of slugs) {
      await upsertByField(ctx, "reservedSlugs", "by_slug", "slug", slug, { slug });
    }

    return { inserted: slugs.length };
  },
});

// ─── Entry point ─────────────────────────────────────────────

/** Seed completo — ejecutar con: npx convex run seed:all */
export const all = internalMutation({
  args: {},
  handler: async (ctx) => {
    const [themes, fonts, backgrounds, slugs] = await Promise.all([
      ctx.runMutation(internal.seed.seedThemes, {}),
      ctx.runMutation(internal.seed.seedFonts, {}),
      ctx.runMutation(internal.seed.seedBackgrounds, {}),
      ctx.runMutation(internal.seed.seedReservedSlugs, {}),
    ]);
    return { themes, fonts, backgrounds, slugs };
  },
});

// Importar internal para el self-reference
import { internal } from "./_generated/api";
