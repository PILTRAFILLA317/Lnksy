const PLATFORM_MAP: Record<string, string> = {
  'instagram.com': 'instagram',
  'www.instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'twitter.com': 'twitter',
  'www.twitter.com': 'twitter',
  'x.com': 'twitter',
  'spotify.com': 'spotify',
  'open.spotify.com': 'spotify',
  'github.com': 'github',
  'www.github.com': 'github',
  'linkedin.com': 'linkedin',
  'www.linkedin.com': 'linkedin',
  'facebook.com': 'facebook',
  'www.facebook.com': 'facebook',
  'twitch.tv': 'twitch',
  'www.twitch.tv': 'twitch',
  'discord.gg': 'discord',
  'discord.com': 'discord',
  'soundcloud.com': 'soundcloud',
  'www.soundcloud.com': 'soundcloud',
  'pinterest.com': 'pinterest',
  'www.pinterest.com': 'pinterest',
  'snapchat.com': 'snapchat',
  'www.snapchat.com': 'snapchat',
  'threads.net': 'threads',
  'www.threads.net': 'threads',
};

export function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PLATFORM_MAP[hostname] ?? null;
  } catch {
    return null;
  }
}

/**
 * SVG path data for platform badges. Returns a simple icon name
 * that maps to our icon set.
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'X / Twitter',
    spotify: 'Spotify',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitch: 'Twitch',
    discord: 'Discord',
    soundcloud: 'SoundCloud',
    pinterest: 'Pinterest',
    snapchat: 'Snapchat',
    threads: 'Threads',
  };
  return labels[platform] ?? platform;
}

export function getContactHref(
  type: string,
  value: string
): string {
  switch (type) {
    case 'whatsapp':
      return `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return `https://t.me/${value.replace('@', '')}`;
    case 'phone':
      return `tel:${value}`;
    case 'email':
      return `mailto:${value}`;
    case 'instagram':
      return `https://instagram.com/${value.replace('@', '')}`;
    case 'tiktok':
      return `https://tiktok.com/@${value.replace('@', '')}`;
    default:
      return value;
  }
}
