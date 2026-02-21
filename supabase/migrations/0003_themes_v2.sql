-- =============================================================
-- Migration 0003: Themes V2
-- Adds tags to themes, meta to backgrounds, performance indexes,
-- and seeds a rich catalog of themes, fonts, and backgrounds.
-- Run AFTER migrations 0001 and 0002.
-- =============================================================

-- ─── Schema changes ───────────────────────────────────────────

-- 1. Add tags array to themes
alter table public.themes
  add column if not exists tags text[] not null default '{}';

-- 2. Add meta jsonb to backgrounds
alter table public.backgrounds
  add column if not exists meta jsonb not null default '{}';

-- ─── Indexes ──────────────────────────────────────────────────

create index if not exists idx_themes_is_pro on public.themes (is_pro);
create index if not exists idx_themes_tags on public.themes using gin (tags);
create index if not exists idx_fonts_is_pro on public.fonts (is_pro);
create index if not exists idx_backgrounds_is_pro on public.backgrounds (is_pro);
create index if not exists idx_backgrounds_type on public.backgrounds (type);

-- ─── Tag existing themes ──────────────────────────────────────

update public.themes set tags = array['light', 'minimal']           where id = 'default';
update public.themes set tags = array['dark', 'minimal', 'cool']    where id = 'midnight';
update public.themes set tags = array['dark', 'nature', 'warm']     where id = 'forest';
update public.themes set tags = array['gradient', 'warm']           where id = 'sunset';
update public.themes set tags = array['gradient', 'cool']           where id = 'ocean';
update public.themes set tags = array['gradient', 'pastel']         where id = 'candy';
update public.themes set tags = array['dark', 'neon']               where id = 'neon';
update public.themes set tags = array['light', 'minimal']           where id = 'minimal';
update public.themes set tags = array['pastel', 'light']            where id = 'lavender';
update public.themes set tags = array['bold', 'brutalist', 'warm']  where id = 'brutalist';
update public.themes set tags = array['glass', 'gradient', 'cool']  where id = 'glass';
update public.themes set tags = array['dark', 'warm']               where id = 'cherry';
update public.themes set tags = array['pastel', 'light', 'cool']    where id = 'arctic';

-- ─── New FREE themes (5 additions → total 8 free) ─────────────

insert into public.themes (id, name, is_pro, tags, config) values

  ('slate', 'Slate', false, array['light', 'cool', 'minimal'], '{
    "bg": "#f8fafc",
    "text": "#0f172a",
    "muted": "#64748b",
    "accent": "#6366f1",
    "cardBg": "#f1f5f9",
    "cardText": "#0f172a",
    "cardBorder": "#e2e8f0",
    "cardRadius": "10px",
    "cardShadow": "0 1px 3px rgba(0,0,0,0.06)",
    "buttonVariant": "filled",
    "buttonRadius": "10px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('cream', 'Cream', false, array['light', 'warm', 'minimal'], '{
    "bg": "#fefbf3",
    "text": "#292524",
    "muted": "#78716c",
    "accent": "#d97706",
    "cardBg": "#fef3c7",
    "cardText": "#292524",
    "cardBorder": "#fde68a",
    "cardRadius": "14px",
    "cardShadow": "0 1px 4px rgba(0,0,0,0.05)",
    "buttonVariant": "filled",
    "buttonRadius": "14px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('charcoal', 'Charcoal', false, array['dark', 'minimal'], '{
    "bg": "#1c1c1e",
    "text": "#f5f5f7",
    "muted": "#8e8e93",
    "accent": "#0a84ff",
    "cardBg": "#2c2c2e",
    "cardText": "#f5f5f7",
    "cardBorder": "#3a3a3c",
    "cardRadius": "12px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.3)",
    "buttonVariant": "filled",
    "buttonRadius": "12px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "medium"
  }'),

  ('rose', 'Rose', false, array['light', 'warm', 'pastel'], '{
    "bg": "#fff1f2",
    "text": "#881337",
    "muted": "#be123c",
    "accent": "#e11d48",
    "cardBg": "#ffe4e6",
    "cardText": "#881337",
    "cardBorder": "#fda4af",
    "cardRadius": "16px",
    "cardShadow": "0 1px 4px rgba(225,29,72,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('sky', 'Sky', false, array['light', 'cool', 'minimal'], '{
    "bg": "#f0f9ff",
    "text": "#0c4a6e",
    "muted": "#0369a1",
    "accent": "#0ea5e9",
    "cardBg": "#e0f2fe",
    "cardText": "#0c4a6e",
    "cardBorder": "#bae6fd",
    "cardRadius": "14px",
    "cardShadow": "0 1px 4px rgba(14,165,233,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "14px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }')

on conflict (id) do update set
  tags = excluded.tags,
  config = excluded.config;

-- ─── New PRO themes (27 additions → total 37+ pro) ────────────

insert into public.themes (id, name, is_pro, tags, config) values

  -- ── Gradient themes ──────────────────────────────────────────

  ('aurora', 'Aurora', true, array['gradient', 'cool', 'nature'], '{
    "bg": "linear-gradient(135deg, #0f766e, #0891b2, #1d4ed8)",
    "text": "#ffffff",
    "muted": "rgba(255,255,255,0.7)",
    "accent": "#5eead4",
    "cardBg": "rgba(255,255,255,0.12)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.2)",
    "cardRadius": "20px",
    "cardShadow": "0 4px 20px rgba(0,0,0,0.15)",
    "buttonVariant": "outline",
    "buttonRadius": "20px",
    "font": "Inter, sans-serif",
    "backdropBlur": "8px",
    "shadowIntensity": "medium"
  }'),

  ('dusk', 'Dusk', true, array['gradient', 'warm'], '{
    "bg": "linear-gradient(160deg, #7c3aed, #db2777, #f97316)",
    "text": "#ffffff",
    "muted": "rgba(255,255,255,0.75)",
    "accent": "#fbbf24",
    "cardBg": "rgba(255,255,255,0.15)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.25)",
    "cardRadius": "18px",
    "cardShadow": "0 4px 16px rgba(0,0,0,0.2)",
    "buttonVariant": "filled",
    "buttonRadius": "18px",
    "font": "Inter, sans-serif",
    "backdropBlur": "6px",
    "shadowIntensity": "medium"
  }'),

  ('nebula', 'Nebula', true, array['gradient', 'dark', 'cool'], '{
    "bg": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    "text": "#e0c3fc",
    "muted": "#a78bfa",
    "accent": "#c084fc",
    "cardBg": "rgba(255,255,255,0.08)",
    "cardText": "#e0c3fc",
    "cardBorder": "rgba(168,139,250,0.3)",
    "cardRadius": "16px",
    "cardShadow": "0 4px 20px rgba(0,0,0,0.3)",
    "buttonVariant": "outline",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "backdropBlur": "12px",
    "shadowIntensity": "strong"
  }'),

  ('tropical', 'Tropical', true, array['gradient', 'warm', 'nature'], '{
    "bg": "linear-gradient(135deg, #d4fc79, #96e6a1)",
    "text": "#064e3b",
    "muted": "#065f46",
    "accent": "#059669",
    "cardBg": "rgba(255,255,255,0.5)",
    "cardText": "#064e3b",
    "cardBorder": "rgba(255,255,255,0.7)",
    "cardRadius": "20px",
    "cardShadow": "0 2px 12px rgba(0,0,0,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "20px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('flamingo', 'Flamingo', true, array['gradient', 'warm', 'pastel'], '{
    "bg": "linear-gradient(135deg, #ffecd2, #fcb69f)",
    "text": "#7f1d1d",
    "muted": "#b91c1c",
    "accent": "#ef4444",
    "cardBg": "rgba(255,255,255,0.6)",
    "cardText": "#7f1d1d",
    "cardBorder": "rgba(255,255,255,0.8)",
    "cardRadius": "24px",
    "cardShadow": "0 2px 8px rgba(239,68,68,0.1)",
    "buttonVariant": "filled",
    "buttonRadius": "24px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('citrus', 'Citrus', true, array['gradient', 'bold', 'warm'], '{
    "bg": "linear-gradient(135deg, #facc15, #f97316)",
    "text": "#1c1917",
    "muted": "#292524",
    "accent": "#c2410c",
    "cardBg": "rgba(255,255,255,0.25)",
    "cardText": "#1c1917",
    "cardBorder": "rgba(255,255,255,0.4)",
    "cardRadius": "16px",
    "cardShadow": "0 4px 16px rgba(0,0,0,0.1)",
    "buttonVariant": "filled",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "backdropBlur": "4px",
    "shadowIntensity": "soft"
  }'),

  ('galaxy', 'Galaxy', true, array['gradient', 'dark', 'cool'], '{
    "bg": "linear-gradient(135deg, #0f0c29, #302b63, #1e3a5f)",
    "text": "#e0f2fe",
    "muted": "#7dd3fc",
    "accent": "#38bdf8",
    "cardBg": "rgba(255,255,255,0.06)",
    "cardText": "#e0f2fe",
    "cardBorder": "rgba(56,189,248,0.2)",
    "cardRadius": "16px",
    "cardShadow": "0 4px 24px rgba(0,0,0,0.4)",
    "buttonVariant": "outline",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "backdropBlur": "8px",
    "shadowIntensity": "strong"
  }'),

  -- ── Dark themes ──────────────────────────────────────────────

  ('carbon', 'Carbon', true, array['dark', 'minimal', 'cool'], '{
    "bg": "#09090b",
    "text": "#fafafa",
    "muted": "#71717a",
    "accent": "#3b82f6",
    "cardBg": "#18181b",
    "cardText": "#fafafa",
    "cardBorder": "#27272a",
    "cardRadius": "8px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.5)",
    "buttonVariant": "outline",
    "buttonRadius": "8px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "medium"
  }'),

  ('obsidian', 'Obsidian', true, array['dark', 'cool'], '{
    "bg": "#0a0a0f",
    "text": "#e2e8f0",
    "muted": "#94a3b8",
    "accent": "#8b5cf6",
    "cardBg": "#12121a",
    "cardText": "#e2e8f0",
    "cardBorder": "#2d2040",
    "cardRadius": "14px",
    "cardShadow": "0 0 20px rgba(139,92,246,0.1)",
    "buttonVariant": "outline",
    "buttonRadius": "14px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  ('eclipse', 'Eclipse', true, array['dark', 'warm'], '{
    "bg": "#0c0a09",
    "text": "#fef3c7",
    "muted": "#d97706",
    "accent": "#f59e0b",
    "cardBg": "#1c1917",
    "cardText": "#fef3c7",
    "cardBorder": "#44270a",
    "cardRadius": "12px",
    "cardShadow": "0 2px 12px rgba(0,0,0,0.4)",
    "buttonVariant": "outline",
    "buttonRadius": "12px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  ('dark-rose', 'Dark Rose', true, array['dark', 'warm', 'pastel'], '{
    "bg": "#0d0608",
    "text": "#fda4af",
    "muted": "#f43f5e",
    "accent": "#fb7185",
    "cardBg": "#1a0d10",
    "cardText": "#fda4af",
    "cardBorder": "#3d1a21",
    "cardRadius": "16px",
    "cardShadow": "0 2px 12px rgba(0,0,0,0.5)",
    "buttonVariant": "outline",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  ('void', 'Void', true, array['dark', 'minimal'], '{
    "bg": "#000000",
    "text": "#ffffff",
    "muted": "#6b7280",
    "accent": "#ffffff",
    "cardBg": "#111111",
    "cardText": "#ffffff",
    "cardBorder": "#222222",
    "cardRadius": "0px",
    "cardShadow": "none",
    "buttonVariant": "outline",
    "buttonRadius": "0px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "none"
  }'),

  ('nord', 'Nord', true, array['dark', 'cool', 'minimal'], '{
    "bg": "#2e3440",
    "text": "#eceff4",
    "muted": "#d8dee9",
    "accent": "#88c0d0",
    "cardBg": "#3b4252",
    "cardText": "#eceff4",
    "cardBorder": "#434c5e",
    "cardRadius": "12px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.3)",
    "buttonVariant": "filled",
    "buttonRadius": "12px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "medium"
  }'),

  ('mocha', 'Mocha', true, array['dark', 'warm', 'minimal'], '{
    "bg": "#1c1007",
    "text": "#e8d5b7",
    "muted": "#d4a574",
    "accent": "#c9a96e",
    "cardBg": "#2a1f10",
    "cardText": "#e8d5b7",
    "cardBorder": "#3d2b17",
    "cardRadius": "10px",
    "cardShadow": "0 2px 8px rgba(0,0,0,0.4)",
    "buttonVariant": "outline",
    "buttonRadius": "10px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "medium"
  }'),

  -- ── Glass themes ─────────────────────────────────────────────

  ('frost', 'Frost', true, array['glass', 'light', 'cool'], '{
    "bg": "linear-gradient(135deg, #e0f2fe, #f0fdf4)",
    "text": "#0c4a6e",
    "muted": "#0369a1",
    "accent": "#0ea5e9",
    "cardBg": "rgba(255,255,255,0.65)",
    "cardText": "#0c4a6e",
    "cardBorder": "rgba(255,255,255,0.9)",
    "cardRadius": "20px",
    "cardShadow": "0 8px 32px rgba(14,165,233,0.1)",
    "buttonVariant": "filled",
    "buttonRadius": "20px",
    "font": "Inter, sans-serif",
    "backdropBlur": "16px",
    "shadowIntensity": "soft"
  }'),

  ('vapor', 'Vapor', true, array['glass', 'gradient', 'neon', 'cool'], '{
    "bg": "linear-gradient(135deg, #0f0c29, #1a1a2e)",
    "text": "#f0e6ff",
    "muted": "#a78bfa",
    "accent": "#22d3ee",
    "cardBg": "rgba(255,255,255,0.06)",
    "cardText": "#f0e6ff",
    "cardBorder": "rgba(34,211,238,0.25)",
    "cardRadius": "16px",
    "cardShadow": "0 0 24px rgba(34,211,238,0.1)",
    "buttonVariant": "outline",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "backdropBlur": "12px",
    "shadowIntensity": "strong"
  }'),

  ('crystal', 'Crystal', true, array['glass', 'cool', 'gradient'], '{
    "bg": "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #0ea5e9 100%)",
    "text": "#ffffff",
    "muted": "rgba(255,255,255,0.75)",
    "accent": "#bfdbfe",
    "cardBg": "rgba(255,255,255,0.18)",
    "cardText": "#ffffff",
    "cardBorder": "rgba(255,255,255,0.35)",
    "cardRadius": "24px",
    "cardShadow": "0 8px 32px rgba(0,0,0,0.15)",
    "buttonVariant": "filled",
    "buttonRadius": "24px",
    "font": "Inter, sans-serif",
    "backdropBlur": "20px",
    "shadowIntensity": "medium"
  }'),

  -- ── Pastel themes ────────────────────────────────────────────

  ('butter', 'Butter', true, array['pastel', 'light', 'warm'], '{
    "bg": "#fefce8",
    "text": "#713f12",
    "muted": "#92400e",
    "accent": "#f59e0b",
    "cardBg": "#fef9c3",
    "cardText": "#713f12",
    "cardBorder": "#fde68a",
    "cardRadius": "20px",
    "cardShadow": "0 2px 8px rgba(245,158,11,0.1)",
    "buttonVariant": "filled",
    "buttonRadius": "20px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('sakura', 'Sakura', true, array['pastel', 'light', 'warm'], '{
    "bg": "#fdf2f8",
    "text": "#831843",
    "muted": "#be185d",
    "accent": "#ec4899",
    "cardBg": "#fce7f3",
    "cardText": "#831843",
    "cardBorder": "#fbcfe8",
    "cardRadius": "999px",
    "cardShadow": "0 2px 8px rgba(236,72,153,0.1)",
    "buttonVariant": "filled",
    "buttonRadius": "999px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('mint-fresh', 'Mint', true, array['pastel', 'light', 'cool', 'nature'], '{
    "bg": "#f0fdf4",
    "text": "#14532d",
    "muted": "#166534",
    "accent": "#16a34a",
    "cardBg": "#dcfce7",
    "cardText": "#14532d",
    "cardBorder": "#bbf7d0",
    "cardRadius": "16px",
    "cardShadow": "0 2px 8px rgba(22,163,74,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('peach', 'Peach', true, array['pastel', 'light', 'warm'], '{
    "bg": "#fff7ed",
    "text": "#7c2d12",
    "muted": "#c2410c",
    "accent": "#ea580c",
    "cardBg": "#ffedd5",
    "cardText": "#7c2d12",
    "cardBorder": "#fed7aa",
    "cardRadius": "18px",
    "cardShadow": "0 2px 8px rgba(234,88,12,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "18px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('lilac', 'Lilac', true, array['pastel', 'light', 'cool'], '{
    "bg": "#f5f3ff",
    "text": "#3b0764",
    "muted": "#6d28d9",
    "accent": "#7c3aed",
    "cardBg": "#ede9fe",
    "cardText": "#3b0764",
    "cardBorder": "#ddd6fe",
    "cardRadius": "16px",
    "cardShadow": "0 2px 8px rgba(124,58,237,0.08)",
    "buttonVariant": "filled",
    "buttonRadius": "16px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  -- ── Bold / Striking themes ────────────────────────────────────

  ('bold-blue', 'Bold Blue', true, array['bold', 'dark', 'cool'], '{
    "bg": "#1e3a8a",
    "text": "#ffffff",
    "muted": "#93c5fd",
    "accent": "#fbbf24",
    "cardBg": "#1d4ed8",
    "cardText": "#ffffff",
    "cardBorder": "#3b82f6",
    "cardRadius": "8px",
    "cardShadow": "0 4px 16px rgba(0,0,0,0.3)",
    "buttonVariant": "filled",
    "buttonRadius": "8px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  ('noire', 'Noire', true, array['bold', 'dark', 'minimal'], '{
    "bg": "#000000",
    "text": "#ffffff",
    "muted": "#9ca3af",
    "accent": "#ffffff",
    "cardBg": "#ffffff",
    "cardText": "#000000",
    "cardBorder": "#ffffff",
    "cardRadius": "4px",
    "cardShadow": "none",
    "buttonVariant": "filled",
    "buttonRadius": "4px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "none"
  }'),

  ('terracotta', 'Terracotta', true, array['bold', 'warm', 'nature'], '{
    "bg": "#7c2d12",
    "text": "#fef3c7",
    "muted": "#fbbf24",
    "accent": "#fbbf24",
    "cardBg": "#92400e",
    "cardText": "#fef3c7",
    "cardBorder": "#b45309",
    "cardRadius": "6px",
    "cardShadow": "0 4px 16px rgba(0,0,0,0.3)",
    "buttonVariant": "outline",
    "buttonRadius": "6px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  ('jungle', 'Jungle', true, array['bold', 'dark', 'nature', 'warm'], '{
    "bg": "#052e16",
    "text": "#d1fae5",
    "muted": "#6ee7b7",
    "accent": "#34d399",
    "cardBg": "#064e3b",
    "cardText": "#d1fae5",
    "cardBorder": "#065f46",
    "cardRadius": "8px",
    "cardShadow": "0 4px 16px rgba(0,0,0,0.4)",
    "buttonVariant": "outline",
    "buttonRadius": "8px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "strong"
  }'),

  -- ── Minimal / Monochrome themes ───────────────────────────────

  ('ink', 'Ink', true, array['bold', 'dark', 'minimal'], '{
    "bg": "#030712",
    "text": "#f9fafb",
    "muted": "#6b7280",
    "accent": "#f9fafb",
    "cardBg": "#111827",
    "cardText": "#f9fafb",
    "cardBorder": "#1f2937",
    "cardRadius": "0px",
    "cardShadow": "none",
    "buttonVariant": "outline",
    "buttonRadius": "0px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "none"
  }'),

  ('paper', 'Paper', true, array['light', 'warm', 'minimal'], '{
    "bg": "#fafaf9",
    "text": "#1c1917",
    "muted": "#78716c",
    "accent": "#d97706",
    "cardBg": "#f5f5f4",
    "cardText": "#1c1917",
    "cardBorder": "#e7e5e4",
    "cardRadius": "8px",
    "cardShadow": "0 1px 2px rgba(0,0,0,0.04)",
    "buttonVariant": "outline",
    "buttonRadius": "8px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'),

  ('sand', 'Sand', true, array['light', 'warm', 'minimal'], '{
    "bg": "#fef9c3",
    "text": "#713f12",
    "muted": "#92400e",
    "accent": "#b45309",
    "cardBg": "#fefce8",
    "cardText": "#713f12",
    "cardBorder": "#fde68a",
    "cardRadius": "6px",
    "cardShadow": "0 1px 3px rgba(0,0,0,0.04)",
    "buttonVariant": "outline",
    "buttonRadius": "6px",
    "font": "Inter, sans-serif",
    "shadowIntensity": "soft"
  }'  )

on conflict (id) do update set
  tags = excluded.tags,
  config = excluded.config;

-- ─── Additional fonts ─────────────────────────────────────────

insert into public.fonts (id, name, family, is_pro, url) values
  ('nunito', 'Nunito', '''Nunito'', sans-serif', false,
   'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap'),
  ('poppins', 'Poppins', '''Poppins'', sans-serif', false,
   'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'),
  ('lato', 'Lato', '''Lato'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap'),
  ('raleway', 'Raleway', '''Raleway'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap'),
  ('montserrat', 'Montserrat', '''Montserrat'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap'),
  ('oswald', 'Oswald', '''Oswald'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap'),
  ('merriweather', 'Merriweather', '''Merriweather'', serif', true,
   'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap'),
  ('libre-baskerville', 'Libre Baskerville', '''Libre Baskerville'', serif', true,
   'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap'),
  ('dancing-script', 'Dancing Script', '''Dancing Script'', cursive', true,
   'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap'),
  ('fira-code', 'Fira Code', '''Fira Code'', monospace', true,
   'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap')
on conflict (id) do nothing;

-- ─── Additional backgrounds ───────────────────────────────────

insert into public.backgrounds (id, name, type, value, is_pro, meta) values
  -- Solid
  ('solid-cream',  'Cream',   'solid', '#fefbf3', false, '{"tags":["warm","light"]}'),
  ('solid-slate',  'Slate',   'solid', '#f8fafc', false, '{"tags":["cool","light"]}'),
  ('solid-rose',   'Rose',    'solid', '#fff1f2', false, '{"tags":["warm","light","pastel"]}'),
  ('solid-navy',   'Navy',    'solid', '#1e3a8a', true,  '{"tags":["dark","cool"]}'),
  ('solid-forest', 'Forest',  'solid', '#052e16', true,  '{"tags":["dark","nature"]}'),
  ('solid-zinc',   'Zinc',    'solid', '#3f3f46', true,  '{"tags":["dark","neutral"]}'),
  ('solid-amber',  'Amber',   'solid', '#78350f', true,  '{"tags":["dark","warm"]}'),
  ('solid-teal',   'Teal',    'solid', '#0f766e', true,  '{"tags":["dark","cool","nature"]}'),

  -- Gradients
  ('gradient-aurora',    'Aurora',    'gradient',
   'linear-gradient(135deg, #0f766e, #0891b2, #1d4ed8)', true,
   '{"tags":["cool","nature"]}'),
  ('gradient-dusk',      'Dusk',      'gradient',
   'linear-gradient(160deg, #7c3aed, #db2777, #f97316)', true,
   '{"tags":["warm","bold"]}'),
  ('gradient-nebula',    'Nebula',    'gradient',
   'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', true,
   '{"tags":["dark","cool"]}'),
  ('gradient-citrus',    'Citrus',    'gradient',
   'linear-gradient(135deg, #facc15, #f97316)', true,
   '{"tags":["warm","bold"]}'),
  ('gradient-rose',      'Rose Gold', 'gradient',
   'linear-gradient(135deg, #f43f5e, #fda4af)', true,
   '{"tags":["warm","pastel"]}'),
  ('gradient-arctic',    'Arctic',    'gradient',
   'linear-gradient(180deg, #e0f2fe, #f0fdf4)', false,
   '{"tags":["cool","light"]}'),
  ('gradient-galaxy',    'Galaxy',    'gradient',
   'linear-gradient(135deg, #0f0c29, #302b63, #1e3a5f)', true,
   '{"tags":["dark","cool"]}'),
  ('gradient-midnight2', 'Deep Night','gradient',
   'linear-gradient(180deg, #000000, #1a1a2e)', true,
   '{"tags":["dark"]}'),
  ('gradient-tropical',  'Tropical',  'gradient',
   'linear-gradient(135deg, #d4fc79, #96e6a1)', true,
   '{"tags":["nature","light"]}'),
  ('gradient-forest',    'Forest',    'gradient',
   'linear-gradient(135deg, #064e3b, #065f46)', true,
   '{"tags":["dark","nature"]}'),

  -- Patterns
  ('pattern-dots-sm',   'Fine Dots',  'pattern',
   'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
   false, '{"tags":["light","minimal"]}'),
  ('pattern-circles',   'Circles',    'pattern',
   'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)',
   false, '{"tags":["light","cool"]}'),
  ('pattern-waves',     'Waves',      'pattern',
   'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(99,102,241,0.05) 24px, rgba(99,102,241,0.05) 25px)',
   false, '{"tags":["light","minimal"]}'),
  ('pattern-grid-dark', 'Dark Grid',  'pattern',
   'linear-gradient(#2d2d2d 1px, transparent 1px), linear-gradient(90deg, #2d2d2d 1px, transparent 1px)',
   true, '{"tags":["dark","minimal"]}'),
  ('pattern-cross',     'Cross Hatch','pattern',
   'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px), repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px)',
   false, '{"tags":["light","minimal"]}')

on conflict (id) do update set
  meta = excluded.meta;

-- Update meta on existing backgrounds that already exist
update public.backgrounds set meta = '{"tags":["light"]}' where id = 'solid-white' and meta = '{}';
update public.backgrounds set meta = '{"tags":["light","neutral"]}' where id = 'solid-gray' and meta = '{}';
update public.backgrounds set meta = '{"tags":["dark"]}' where id = 'solid-dark' and meta = '{}';
update public.backgrounds set meta = '{"tags":["dark"]}' where id = 'solid-black' and meta = '{}';
update public.backgrounds set meta = '{"tags":["warm","gradient"]}' where id = 'gradient-sunset' and meta = '{}';
update public.backgrounds set meta = '{"tags":["cool","gradient"]}' where id = 'gradient-ocean' and meta = '{}';
update public.backgrounds set meta = '{"tags":["pastel","gradient"]}' where id = 'gradient-candy' and meta = '{}';
update public.backgrounds set meta = '{"tags":["nature","gradient"]}' where id = 'gradient-emerald' and meta = '{}';
update public.backgrounds set meta = '{"tags":["dark","gradient"]}' where id = 'gradient-midnight' and meta = '{}';
update public.backgrounds set meta = '{"tags":["warm","gradient"]}' where id = 'gradient-peach' and meta = '{}';
update public.backgrounds set meta = '{"tags":["light","pattern"]}' where id = 'pattern-dots' and meta = '{}';
update public.backgrounds set meta = '{"tags":["light","pattern"]}' where id = 'pattern-grid' and meta = '{}';
update public.backgrounds set meta = '{"tags":["light","pattern"]}' where id = 'pattern-diagonal' and meta = '{}';
