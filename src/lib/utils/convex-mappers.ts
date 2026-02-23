import type {
  Profile,
  Link,
  LinkSection,
  ProfileComponent,
  ProfileContact,
  Theme,
  Font,
  Background,
  DailyProfileStat,
  DailyLinkStat,
  Billing,
} from '$lib/types.js';

export function mapProfile(doc: any): Profile {
  return {
    id: doc._id,
    owner_id: doc.ownerId,
    handle: doc.handle,
    name: doc.name ?? null,
    bio: doc.bio ?? null,
    avatar_url: doc.avatarUrl ?? null,
    hero_url: doc.heroUrl ?? null,
    hero_position: doc.heroPosition,
    header_mode: doc.headerMode,
    display_title: doc.displayTitle ?? null,
    theme_id: doc.themeId,
    theme_overrides: doc.themeOverrides ?? {},
    background_id: doc.backgroundId,
    font_id: doc.fontId,
    main_links_layout: doc.mainLinksLayout,
    plan: doc.plan,
    branding_enabled: doc.brandingEnabled,
    created_at: new Date(doc._creationTime).toISOString(),
    deleted_at: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
    background_image_url: doc.backgroundImageUrl ?? null,
    background_overlay: doc.backgroundOverlay ?? 0,
    background_blur_px: doc.backgroundBlurPx ?? 0,
  };
}

export function mapComponent(doc: any): ProfileComponent {
  return {
    id: doc._id,
    profile_id: doc.profileId,
    type: doc.type,
    title: doc.title ?? null,
    config: doc.config ?? {},
    order_index: doc.orderIndex,
    is_visible: doc.isVisible,
    updated_at: new Date(doc.updatedAt).toISOString(),
  };
}

export function mapLink(doc: any): Link {
  return {
    id: doc._id,
    profile_id: doc.profileId,
    component_id: doc.componentId ?? null,
    section_id: doc.sectionId ?? null,
    title: doc.title,
    url: doc.url,
    subtitle: doc.subtitle ?? null,
    icon: doc.icon ?? null,
    image_url: doc.imageUrl ?? null,
    platform: doc.platform ?? null,
    order_index: doc.orderIndex,
    is_active: doc.isActive,
    highlight: doc.highlight,
    start_at: doc.startAt ? new Date(doc.startAt).toISOString() : null,
    end_at: doc.endAt ? new Date(doc.endAt).toISOString() : null,
    created_at: new Date(doc._creationTime).toISOString(),
    updated_at: new Date(doc.updatedAt).toISOString(),
  };
}

export function mapLinkSection(doc: any): LinkSection {
  return {
    id: doc._id,
    profile_id: doc.profileId,
    title: doc.title ?? null,
    layout: doc.layout,
    is_visible: doc.isVisible,
    order_index: doc.orderIndex,
    options: doc.options ?? {},
    created_at: new Date(doc._creationTime).toISOString(),
    updated_at: new Date(doc.updatedAt).toISOString(),
  };
}

export function mapContact(doc: any): ProfileContact {
  return {
    id: doc._id,
    profile_id: doc.profileId,
    type: doc.type,
    value: doc.value,
    order_index: doc.orderIndex,
    is_enabled: doc.isEnabled,
    created_at: new Date(doc._creationTime).toISOString(),
  };
}

export function mapTheme(doc: any): Theme {
  return {
    id: doc.themeId,
    name: doc.name,
    is_pro: doc.isPro,
    tags: doc.tags ?? [],
    config: doc.config,
  };
}

export function mapFont(doc: any): Font {
  return {
    id: doc.fontId,
    name: doc.name,
    family: doc.family,
    is_pro: doc.isPro,
    url: doc.url ?? null,
  };
}

export function mapBackground(doc: any): Background {
  return {
    id: doc.backgroundId,
    name: doc.name,
    type: doc.type,
    value: doc.value,
    is_pro: doc.isPro,
  };
}

export function mapDailyProfileStat(doc: any): DailyProfileStat {
  return {
    profile_id: doc.profileId,
    date: doc.date,
    views: doc.views,
    uniques: doc.uniques,
    clicks: doc.clicks,
    contact_clicks: doc.contactClicks,
  };
}

export function mapDailyLinkStat(doc: any): DailyLinkStat {
  return {
    link_id: doc.linkId,
    date: doc.date,
    clicks: doc.clicks,
  };
}

export function mapBilling(doc: any): Billing {
  return {
    id: doc._id,
    owner_id: doc.ownerId,
    profile_id: doc.profileId ?? null,
    stripe_customer_id: doc.stripeCustomerId ?? null,
    subscription_id: doc.subscriptionId ?? null,
    plan: doc.plan,
    status: doc.status,
    current_period_end: doc.currentPeriodEnd
      ? new Date(doc.currentPeriodEnd).toISOString()
      : null,
    created_at: new Date(doc._creationTime).toISOString(),
    updated_at: new Date(doc.updatedAt).toISOString(),
  };
}
