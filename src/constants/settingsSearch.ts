export type SearchableItem = {
  id?: string;
  label: string;
  description: string;
  breadcrumb: string[]; // e.g. ["Settings", "Account"]
  route: string;
  params?: Record<string, string>;
};

export const SEARCHABLE_SETTINGS: SearchableItem[] = [
  // ── Settings (top level) ──────────────────────────────────────
  {
    label: "Account",
    description: "Username • Email",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Content and display",
    description: "Languages for music • App language",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/content-display",
  },
  {
    label: "Privacy and social",
    description: "Private session • Public playlists",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Playback",
    description: "Gapless playback • Autoplay",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Notifications",
    description: "Push • Email",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/notifications",
  },
  {
    label: "Apps and devices",
    description: "Google Maps • Streambeat Connect control",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/apps-devices",
  },
  {
    label: "Data-saving and offline",
    description: "Data saver mode • Downloads over cellular",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/data-saving",
  },
  {
    label: "Media quality",
    description: "Wi-Fi streaming quality • Audio download quality",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/media-quality",
  },
  {
    label: "Advertisements",
    description: "Tailored ads",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/advertisements",
  },
  {
    label: "About and support",
    description: "Version • Privacy Policy",
    breadcrumb: ["Settings"],
    route: "/(tabs)/settings/about",
  },

  // ── Account ───────────────────────────────────────────────────
  {
    label: "Username",
    description: "Your account username",
    breadcrumb: ["Settings", "Account"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Email",
    description: "Your account email address",
    breadcrumb: ["Settings", "Account"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Address",
    description: "View and change your address",
    breadcrumb: ["Settings", "Account"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Account overview",
    description: "View more account details on the web",
    breadcrumb: ["Settings", "Account", "Account details"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Your plan",
    description: "Free plan • View your plan",
    breadcrumb: ["Settings", "Account"],
    route: "/(tabs)/settings/account",
  },
  {
    label: "Close account",
    description: "To delete your data permanently, close your account",
    breadcrumb: ["Settings", "Account"],
    route: "/(tabs)/settings/account",
  },

  // ── Playback ──────────────────────────────────────────────────
  {
    label: "Gapless playback",
    description: "Removes gaps or pauses between tracks",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Automix",
    description: "Seamless transitions between songs on playlists",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Crossfade",
    description: "Adjust fading and overlap between tracks",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Autoplay",
    description: "Similar content plays when your queue ends",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Mono audio",
    description: "Left and right speakers play the same audio",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Equalizer",
    description: "Adjust frequencies to enhance your audio",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Volume normalization",
    description: "Sets the same loudness level for all tracks",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },
  {
    label: "Picture in picture",
    description: "Shrink video in a mini player when you leave",
    breadcrumb: ["Settings", "Playback"],
    route: "/(tabs)/settings/playback",
  },

  // ── Privacy and social ────────────────────────────────────────
  {
    label: "Private session",
    description: "Temporarily hides your listening activity",
    breadcrumb: ["Settings", "Privacy and social"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Listening activity",
    description: "Followers can see what you're listening to",
    breadcrumb: ["Settings", "Privacy and social"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Recently played artists",
    description: "People can see who you recently listened to",
    breadcrumb: ["Settings", "Privacy and social"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Public playlists",
    description: "New playlists are viewable by others by default",
    breadcrumb: ["Settings", "Privacy and social"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Blocked users",
    description: "Manage who you've blocked from viewing your profile",
    breadcrumb: ["Settings", "Privacy and social"],
    route: "/(tabs)/settings/privacy-social",
  },
  {
    label: "Jam access with Bluetooth",
    description: "Use Bluetooth to connect to nearby devices",
    breadcrumb: ["Settings", "Privacy and social", "Social features"],
    route: "/(tabs)/settings/privacy-social",
  },

  // ── Apps and devices ──────────────────────────────────────────
  {
    label: "Google Maps",
    description: "Connect your account to play in Google Maps",
    breadcrumb: ["Settings", "Apps and devices", "Connected apps"],
    route: "/(tabs)/settings/apps-devices",
  },
  {
    label: "Waze",
    description: "Connect your account to play in the Waze app",
    breadcrumb: ["Settings", "Apps and devices", "Connected apps"],
    route: "/(tabs)/settings/apps-devices",
  },
  {
    label: "Streambeat Connect control",
    description: "Control Streambeat from your lock screen",
    breadcrumb: ["Settings", "Apps and devices"],
    route: "/(tabs)/settings/apps-devices",
  },
  {
    label: "Local audio files",
    description: "Add tracks from this device to Your Library",
    breadcrumb: ["Settings", "Apps and devices"],
    route: "/(tabs)/settings/apps-devices",
  },
  {
    label: "Keep Streambeat open",
    description: "Prevents phone from sleeping while in the car",
    breadcrumb: ["Settings", "Apps and devices"],
    route: "/(tabs)/settings/apps-devices",
  },

  // ── Data saving ───────────────────────────────────────────────
  {
    label: "Data saver mode",
    description: "Lowers streaming quality to reduce data usage",
    breadcrumb: ["Settings", "Data-saving and offline"],
    route: "/(tabs)/settings/data-saving",
  },
  {
    label: "Downloads over cellular",
    description: "Downloads start when not on Wi-Fi",
    breadcrumb: ["Settings", "Data-saving and offline"],
    route: "/(tabs)/settings/data-saving",
  },
  {
    label: "Remove all downloads",
    description: "Free up space by removing all downloads",
    breadcrumb: ["Settings", "Data-saving and offline"],
    route: "/(tabs)/settings/data-saving",
  },
  {
    label: "Clear cache",
    description: "Free up space by clearing cached data",
    breadcrumb: ["Settings", "Data-saving and offline"],
    route: "/(tabs)/settings/data-saving",
  },
  {
    label: "Storage location",
    description: "Choose where downloads are stored",
    breadcrumb: ["Settings", "Data-saving and offline"],
    route: "/(tabs)/settings/data-saving",
  },

  // ── Media quality ─────────────────────────────────────────────
  {
    label: "Wi-Fi streaming quality",
    description: "Set audio quality when on Wi-Fi",
    breadcrumb: ["Settings", "Media quality"],
    route: "/(tabs)/settings/media-quality",
  },
  {
    label: "Cellular streaming quality",
    description: "Set audio quality when on cellular data",
    breadcrumb: ["Settings", "Media quality"],
    route: "/(tabs)/settings/media-quality",
  },
  {
    label: "Audio download quality",
    description: "Set quality for downloaded tracks",
    breadcrumb: ["Settings", "Media quality"],
    route: "/(tabs)/settings/media-quality",
  },

  // ── Notifications ─────────────────────────────────────────────
  {
    label: "Music and artists",
    description: "Notifications about music and artists",
    breadcrumb: ["Settings", "Notifications"],
    route: "/(tabs)/settings/notifications",
  },
  {
    label: "Podcasts and shows",
    description: "Notifications about podcasts",
    breadcrumb: ["Settings", "Notifications"],
    route: "/(tabs)/settings/notifications",
  },
  {
    label: "Social features",
    description: "Notifications about social activity",
    breadcrumb: ["Settings", "Notifications"],
    route: "/(tabs)/settings/notifications",
  },
  {
    label: "Live concerts and events",
    description: "Notifications about live events",
    breadcrumb: ["Settings", "Notifications"],
    route: "/(tabs)/settings/notifications",
  },

  // ── Content and display ───────────────────────────────────────
  {
    label: "Languages for music",
    description: "Set preferred languages for music recommendations",
    breadcrumb: ["Settings", "Content and display"],
    route: "/(tabs)/settings/content-display",
  },
  {
    label: "App language",
    description: "Set default language for the Streambeat app",
    breadcrumb: ["Settings", "Content and display"],
    route: "/(tabs)/settings/content-display",
  },
  {
    label: "Allow explicit content",
    description: "Explicit content is playable when enabled",
    breadcrumb: ["Settings", "Content and display"],
    route: "/(tabs)/settings/content-display",
  },
  {
    label: "Canvas",
    description: "Short looping visuals on the Now Playing view",
    breadcrumb: ["Settings", "Content and display"],
    route: "/(tabs)/settings/content-display",
  },
  {
    label: "Reduce animations",
    description: "Disables autoplaying animations",
    breadcrumb: ["Settings", "Content and display"],
    route: "/(tabs)/settings/content-display",
  },

  // ── About ─────────────────────────────────────────────────────
  {
    label: "Privacy Policy",
    description: "Read our privacy policy",
    breadcrumb: ["Settings", "About and support"],
    route: "/(tabs)/settings/about",
  },
  {
    label: "Terms of Use",
    description: "Read our terms of service",
    breadcrumb: ["Settings", "About and support"],
    route: "/(tabs)/settings/about",
  },
  {
    label: "Version",
    description: "Current app version",
    breadcrumb: ["Settings", "About and support"],
    route: "/(tabs)/settings/about",
  },
  {
    label: "Support",
    description: "Get help with Streambeat",
    breadcrumb: ["Settings", "About and support"],
    route: "/(tabs)/settings/about",
  },
];
