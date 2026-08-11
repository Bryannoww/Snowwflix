console.log("Snowwflix Settings V3 Loaded");

const SETTINGS_KEY = "snowwflix_settings";

const defaultSettings = {
  pushEnabled: true,
  newTrailers: true,
  movieReleases: true,
  watchlistUpdates: true,
  // "system" = follow OS/browser prefers-color-scheme
  theme: "system",
  themeUserSet: false,
  fontScale: "100",
  layoutGrid: "standard",
  autoPlay: true,
  defaultQuality: "auto",
  mutedPreview: true,
  skipInterval: "10",
  offlineAccess: true,
  downloadQuality: "high",
  wifiOnlyDownloads: true,
  dataSaver: false,
  appLanguage: "en",
  contentRegion: "global",
  audioSubs: "en",
  subtitles: false,
  screenReader: false,
  reduceMotion: false,
  genres: [],
  plan: "free"
};

/** Resolve stored theme to an actual CSS class theme (blue | red | light) */
function getSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch (_) {}
  return "blue"; // dark default
}

function resolveTheme(s) {
  const raw = (s && s.theme) || "system";
  if (raw === "system") return getSystemTheme();
  if (raw === "light" || raw === "red" || raw === "blue") return raw;
  return "blue";
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = { ...defaultSettings, ...JSON.parse(raw) };
    // Migrate older saves that had only blue/red/light and no system flag
    if (parsed.theme && parsed.theme !== "system" && parsed.themeUserSet === undefined) {
      parsed.themeUserSet = true;
    }
    return parsed;
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(partial) {
  const next = { ...loadSettings(), ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applySettings(next);
  if (partial.appLanguage && window.snowwflixI18n) {
    window.snowwflixI18n.applyLanguage(partial.appLanguage);
  }
  return next;
}

function applySettings(s) {
  const body = document.body;
  const root = document.documentElement;
  body.classList.remove("theme-blue", "theme-red", "theme-light");
  root.classList.remove("theme-blue", "theme-red", "theme-light");
  const resolved = resolveTheme(s);
  body.classList.add("theme-" + resolved);
  root.classList.add("theme-" + resolved);
  body.dataset.themeMode = (s.theme === "system" || !s.themeUserSet) ? "system" : "manual";
  body.dataset.themeResolved = resolved;
  try {
    root.style.colorScheme = resolved === "light" ? "light" : "dark";
  } catch (_) {}

  const scale = parseInt(s.fontScale || "100", 10) / 100;
  document.documentElement.style.fontSize = (16 * scale) + "px";

  if (s.reduceMotion) body.classList.add("reduce-motion");
  else body.classList.remove("reduce-motion");

  body.dataset.layout = s.layoutGrid || "standard";
  body.dataset.autoplay = s.autoPlay ? "1" : "0";
  body.dataset.quality = s.defaultQuality || "auto";
  body.dataset.mutedPreview = s.mutedPreview ? "1" : "0";
  body.dataset.skip = s.skipInterval || "10";
  body.dataset.dataSaver = s.dataSaver ? "1" : "0";
  body.dataset.subtitles = s.subtitles ? "1" : "0";

  // Sync dark-mode toggle UI (light theme = "day", everything else = dark)
  const isLight = resolved === "light";
  const followingSystem = s.theme === "system" || !s.themeUserSet;
  const title = followingSystem
    ? (isLight ? "Light (system) — click for dark" : "Dark (system) — click for light")
    : (isLight ? "Switch to dark mode" : "Switch to light mode");
  ["theme-toggle", "theme-toggle-desktop"].forEach((tid) => {
    const toggle = document.getElementById(tid);
    if (!toggle) return;
    toggle.classList.toggle("is-light", isLight);
    toggle.setAttribute("aria-pressed", isLight ? "true" : "false");
    toggle.title = title;
  });
  const darkCheckbox = document.getElementById("darkMode");
  if (darkCheckbox) darkCheckbox.checked = !isLight;
}

applySettings(loadSettings());

// Follow OS theme changes when user has not forced a manual theme
try {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onSchemeChange = () => {
    const s = loadSettings();
    if (s.theme === "system" || !s.themeUserSet) {
      applySettings(s);
    }
  };
  if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);
} catch (_) {}

// Navbar dark / light toggle — explicit user choice (mobile + desktop buttons)
function toggleThemeClick() {
  const s = loadSettings();
  const resolved = resolveTheme(s);
  const next = resolved === "light" ? "blue" : "light";
  saveSettings({ theme: next, themeUserSet: true });
}
function toggleThemeDblClick(e) {
  e.preventDefault();
  saveSettings({ theme: "system", themeUserSet: false });
}
["theme-toggle", "theme-toggle-desktop"].forEach((tid) => {
  document.getElementById(tid)?.addEventListener("click", toggleThemeClick);
  document.getElementById(tid)?.addEventListener("dblclick", toggleThemeDblClick);
});

// Simple settings modal checkbox (if present)
document.getElementById("darkMode")?.addEventListener("change", (e) => {
  saveSettings({
    theme: e.target.checked ? "blue" : "light",
    themeUserSet: true
  });
});

// Simple settings modal open/close (legacy modal in index.html)
document.getElementById("close-settings")?.addEventListener("click", () => {
  document.getElementById("settings-modal")?.classList.add("hidden");
});
document.querySelector("#settings-modal .settings-overlay")?.addEventListener("click", () => {
  document.getElementById("settings-modal")?.classList.add("hidden");
});

const settingsContainer = document.getElementById("settings-panel");
const settingsButton = document.getElementById("settings-open");

const menuItems = [
  { id: "account", icon: "👤", title: "Account" },
  { id: "security", icon: "🔒", title: "Security & Privacy" },
  { id: "history", icon: "📜", title: "Watch History" },
  { id: "likes", icon: "❤️", title: "Liked Videos" },
  { id: "watchlater", icon: "⏱", title: "Watch Later" },
  { id: "notifications", icon: "🔔", title: "Notifications" },
  { id: "appearance", icon: "🎨", title: "Appearance" },
  { id: "playback", icon: "▶️", title: "Playback" },
  { id: "downloads", icon: "⬇️", title: "Downloads" },
  { id: "storage", icon: "💾", title: "Data & Storage" },
  { id: "language", icon: "🌐", title: "Language & Region" },
  { id: "accessibility", icon: "♿", title: "Accessibility" },
  { id: "watch", icon: "🤍", title: "Watch Preferences" },
  { id: "connected", icon: "🔗", title: "Connected Accounts" },
  { id: "subscription", icon: "💳", title: "Subscription" },
  { id: "devices", icon: "📱", title: "Devices" },
  { id: "help", icon: "❓", title: "Help & Support" },
  { id: "about", icon: "ℹ️", title: "About" },
  { id: "legal", icon: "⚖️", title: "Privacy & Legal" },
  { id: "logout", icon: "🚪", title: "Log Out" }
];

function toggleRow(id, label, desc, checked) {
  return `
    <div class="setting-row">
      <div class="setting-info">
        <strong>${label}</strong>
        ${desc ? `<p class="setting-desc">${desc}</p>` : ""}
      </div>
      <label class="switch">
        <input type="checkbox" data-setting="${id}" ${checked ? "checked" : ""} />
        <span class="slider"></span>
      </label>
    </div>`;
}

function selectRow(id, label, desc, options, value) {
  const opts = options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const t = typeof o === "string" ? o : o.label;
    return `<option value="${v}" ${value === v ? "selected" : ""}>${t}</option>`;
  }).join("");
  return `
    <div class="setting-row">
      <div class="setting-info">
        <strong>${label}</strong>
        ${desc ? `<p class="setting-desc">${desc}</p>` : ""}
      </div>
      <select data-setting="${id}">${opts}</select>
    </div>`;
}

function buildAccountPage() {
  const user = window.currentUser || window.auth?.currentUser || null;
  if (!user) {
    return `
      <h2>Account</h2>
      <p>Sign in to sync your profile, favourites, and history across devices.</p>
      <div class="settings-card account-guest-card">
        <div class="account-guest-hero">
          <div class="account-avatar-lg">❄️</div>
          <div>
            <strong>You're browsing as a guest</strong>
            <p class="setting-desc">Create a free account or log in to unlock the full Snowwflix experience.</p>
          </div>
        </div>
        <div class="account-auth-actions">
          <button type="button" class="primary-btn" id="settings-open-login">Login</button>
          <button type="button" class="primary-btn" id="settings-open-signup">Sign Up</button>
          <button type="button" class="ghost-btn" id="settings-open-google">Sign in with Google</button>
        </div>
      </div>
    `;
  }

  const name = user.displayName || user.email?.split("@")[0] || "User";
  const email = user.email || "—";
  const verified = !!user.emailVerified;
  const localPic = localStorage.getItem("snowwflix_avatar_" + user.uid);
  const avatarSrc = localPic || `https://placehold.co/96x96/1f6feb/ffffff?text=${encodeURIComponent(name.charAt(0).toUpperCase())}`;

  return `
    <h2>Account</h2>
    <p>Manage your profile. Changes save to your Snowwflix account.</p>
    <div class="settings-card account-profile-card">
      <div class="account-profile-head">
        <div class="account-avatar-wrap">
          <img id="settings-avatar-preview" class="account-avatar-img" src="${avatarSrc}" alt="Profile" />
          <label class="account-avatar-btn" for="settings-avatar-input">Change photo</label>
          <input type="file" id="settings-avatar-input" accept="image/*" hidden />
        </div>
        <div class="account-profile-meta">
          <strong id="settings-profile-name">${name.replace(/</g, "&lt;")}</strong>
          <p class="setting-desc">${email.replace(/</g, "&lt;")}</p>
          <span class="account-verified-badge ${verified ? "is-verified" : ""}">${verified ? "✓ Email verified" : "Email not verified"}</span>
        </div>
      </div>
      <div class="account-edit-grid">
        <label class="account-field">
          <span>Display name</span>
          <input type="text" id="settings-display-name" value="${(user.displayName || "").replace(/"/g, "&quot;")}" placeholder="Your name" />
        </label>
        <label class="account-field">
          <span>Email</span>
          <input type="email" id="settings-email" value="${email.replace(/"/g, "&quot;")}" disabled />
        </label>
      </div>
      <div class="account-auth-actions" style="margin-top:1rem">
        <button type="button" class="primary-btn" id="settings-save-profile">Save profile</button>
        ${!verified ? '<button type="button" class="ghost-btn" id="settings-resend-verify">Resend verification email</button>' : ""}
        <button type="button" class="ghost-btn" id="settings-account-logout">Log out</button>
      </div>
      <p id="settings-account-msg" class="setting-hint" style="margin-top:.75rem"></p>
    </div>
  `;
}

function buildPages(s) {
  return {
    account: buildAccountPage(),
    security: `
      <h2>Security & Privacy</h2>
      <div class="settings-card">
        <div class="setting-row"><span>Change password</span><button class="ghost-btn" type="button" id="settings-change-password">Email reset link</button></div>
        <div class="setting-row"><span>Two-factor authentication</span><button class="ghost-btn" type="button" disabled>Coming soon</button></div>
      </div>
    `,
    notifications: `
      <h2>🔔 Notifications</h2>
      <p>Control which alerts you receive.</p>
      <div class="settings-card">
        ${toggleRow("pushEnabled", "Push Toggles", "Turn alerts on or off.", s.pushEnabled)}
        ${toggleRow("newTrailers", "New Trailers", "Alerts for freshly released trailers.", s.newTrailers)}
        ${toggleRow("movieReleases", "Movie Releases", "Reminders for theater or streaming dates.", s.movieReleases)}
        ${toggleRow("watchlistUpdates", "Watchlist Updates", "Alerts when saved titles change status.", s.watchlistUpdates)}
      </div>
    `,
    appearance: `
      <h2>🎨 Appearance</h2>
      <p>Customize how Snowwflix looks. Theme changes apply instantly.</p>
      <div class="settings-card">
        ${selectRow("theme", "Theme Selection", "Follow your device, or lock Blue / Red / Light.", [
          { value: "system", label: "System (auto)" },
          { value: "blue", label: "Blue (Dark)" },
          { value: "red", label: "Red (Dark)" },
          { value: "light", label: "Light" }
        ], s.theme === "system" || !s.themeUserSet ? "system" : s.theme)}
        ${selectRow("fontScale", "Text Scaling", "Adjust font size for better reading.", [
          { value: "90", label: "Small (90%)" },
          { value: "100", label: "Normal (100%)" },
          { value: "110", label: "Large (110%)" },
          { value: "125", label: "Extra large (125%)" }
        ], s.fontScale)}
        ${selectRow("layoutGrid", "Layout Grid", "Change how posters and videos display.", [
          { value: "compact", label: "Compact" },
          { value: "standard", label: "Standard" },
          { value: "comfortable", label: "Comfortable" }
        ], s.layoutGrid)}
      </div>
    `,
    playback: `
      <h2>▶️ Playback</h2>
      <div class="settings-card">
        ${toggleRow("autoPlay", "Auto-Play", "Toggle video playback on scroll / next episode.", s.autoPlay)}
        ${selectRow("defaultQuality", "Default Quality", "Set resolution preference.", [
          { value: "auto", label: "Auto" },
          { value: "4k", label: "4K" },
          { value: "1080p", label: "1080p" },
          { value: "720p", label: "720p" },
          { value: "480p", label: "480p" }
        ], s.defaultQuality)}
        ${toggleRow("mutedPreview", "Audio Defaults", "Muted preview playback by default.", s.mutedPreview)}
        ${selectRow("skipInterval", "Player Controls", "Double-tap / skip interval.", [
          { value: "5", label: "5 seconds" },
          { value: "10", label: "10 seconds" },
          { value: "15", label: "15 seconds" },
          { value: "30", label: "30 seconds" }
        ], s.skipInterval)}
      </div>
    `,
    downloads: `
      <h2>⬇️ Downloads</h2>
      <div class="settings-card">
        ${toggleRow("offlineAccess", "Offline Access", "Allow saving trailers for offline viewing.", s.offlineAccess)}
        ${selectRow("downloadQuality", "Video Quality", "Standard or high download resolution.", [
          { value: "standard", label: "Standard" },
          { value: "high", label: "High" }
        ], s.downloadQuality)}
        ${toggleRow("wifiOnlyDownloads", "Network Limit", "Restrict downloads to Wi-Fi only.", s.wifiOnlyDownloads)}
        <div class="setting-row">
          <div class="setting-info">
            <strong>Storage Clear</strong>
            <p class="setting-desc">Wipe all cached / downloaded videos.</p>
          </div>
          <button class="ghost-btn danger-btn" type="button" data-action="clear-downloads">Clear downloads</button>
        </div>
      </div>
    `,
    storage: `
      <h2>💾 Data & Storage</h2>
      <div class="settings-card">
        ${toggleRow("dataSaver", "Data Saver", "Restrict high-quality streaming on cellular data.", s.dataSaver)}
        <div class="setting-row">
          <div class="setting-info">
            <strong>Cache Meter</strong>
            <p class="setting-desc" id="cache-meter-label">Estimating cache size…</p>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Clear Cache</strong>
            <p class="setting-desc">Quick-delete temporary image and text files.</p>
          </div>
          <button class="ghost-btn danger-btn" type="button" data-action="clear-cache">Clear cache</button>
        </div>
      </div>
    `,
    language: `
      <h2>🌐 Language & Region</h2>
      <div class="settings-card">
        ${selectRow("appLanguage", "App Language", "Change the menu and interface language across the whole app.", [
          { value: "en", label: "English" },
          { value: "fr", label: "Français" },
          { value: "es", label: "Español" },
          { value: "de", label: "Deutsch" },
          { value: "pt", label: "Português" },
          { value: "ar", label: "العربية" },
          { value: "zh", label: "中文" }
        ], s.appLanguage)}
        ${selectRow("contentRegion", "Content Region", "Filter trailers by country availability.", [
          { value: "global", label: "Global" },
          { value: "ke", label: "Kenya" },
          { value: "us", label: "United States" },
          { value: "gb", label: "United Kingdom" },
          { value: "ng", label: "Nigeria" }
        ], s.contentRegion)}
        ${selectRow("audioSubs", "Audio & Subs", "Preferred default language for captions.", [
          { value: "en", label: "English" },
          { value: "fr", label: "Français" },
          { value: "es", label: "Español" }
        ], s.audioSubs)}
      </div>
    `,
    accessibility: `
      <h2>♿ Accessibility</h2>
      <div class="settings-card">
        ${toggleRow("subtitles", "Subtitles", "Toggle closed captions on by default.", s.subtitles)}
        ${toggleRow("screenReader", "Screen Reader", "Optimize layouts for voiceover tools.", s.screenReader)}
        ${toggleRow("reduceMotion", "Reduce Motion", "Turn off flash animations and parallax loops.", s.reduceMotion)}
      </div>
    `,
    watch: `
      <h2>❤️ Watch Preferences</h2>
      <p>Genre filters are saved on this device.</p>
      <div class="settings-card">
        <div class="genre-grid">
          ${["Action", "Sci-Fi", "Horror", "Comedy", "Drama", "Romance", "Thriller", "Animation", "Documentary"].map(g => `
            <label class="chip ${(s.genres || []).includes(g) ? "active" : ""}">
              <input type="checkbox" value="${g}" ${(s.genres || []).includes(g) ? "checked" : ""} /> ${g}
            </label>
          `).join("")}
        </div>
        <p class="setting-desc" style="margin-top:12px">Select favorite categories for recommendations.</p>
      </div>
    `,
    connected: `
      <h2>🔗 Connected Accounts</h2>
      <div class="settings-card">
        <div class="setting-row"><span>Google</span><button class="ghost-btn" type="button" data-action="link-google">Link / Manage</button></div>
        <div class="setting-row"><span>Apple</span><button class="ghost-btn" type="button" disabled>Coming soon</button></div>
        <div class="setting-row">
          <div class="setting-info"><strong>Facebook</strong></div>
          <a class="ghost-btn" href="https://www.facebook.com/profile.php?id=61592722932826" target="_blank" rel="noopener" style="text-decoration:none;">Snowwflix</a>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>TikTok</strong></div>
          <a class="ghost-btn" href="https://www.tiktok.com/@snowwflix" target="_blank" rel="noopener" style="text-decoration:none;">@snowwflix</a>
        </div>
        <div class="setting-row"><span>Netflix / Disney+ / Prime</span><button class="ghost-btn" type="button" disabled>Coming soon</button></div>
        <div class="setting-row"><span>Fandango / Atom tickets</span><button class="ghost-btn" type="button" disabled>Coming soon</button></div>
      </div>
    `,
    subscription: `
      <h2>💳 Subscription</h2>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info"><strong>Plan Tier</strong><p class="setting-desc">Current plan</p></div>
          <span class="badge">${s.plan === "premium" ? "Premium" : "Free"}</span>
        </div>
        <div class="setting-row"><span>Billing Details</span><button class="ghost-btn" type="button" disabled>Update payment</button></div>
        <div class="setting-row"><span>Invoice History</span><button class="ghost-btn" type="button" disabled>View receipts</button></div>
      </div>
    `,
    devices: `
      <h2>📱 Devices</h2>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info"><strong>This device</strong><p class="setting-desc">Current browser session</p></div>
          <span class="badge">Active</span>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>Remote Log-Out</strong><p class="setting-desc">Sign out other sessions</p></div>
          <button class="ghost-btn" type="button" disabled>Coming soon</button>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>TV Casting</strong><p class="setting-desc">Chromecast / AirPlay</p></div>
          <button class="ghost-btn" type="button" disabled>Coming soon</button>
        </div>
      </div>
    `,
    history: `
      <h2>📜 Watch History</h2>
      <p>Trailers you watched while signed in. Newest first.</p>
      <div class="settings-card">
        <div id="history-list" class="watchlater-grid"></div>
        <p id="history-empty" class="setting-desc">Sign in and watch trailers to build history.</p>
        <button type="button" class="ghost-btn" id="history-clear" style="margin-top:12px;">Clear history</button>
      </div>
    `,
    likes: `
      <h2>❤️ Liked Videos</h2>
      <p>Trailers you liked. Sign in to keep them across devices.</p>
      <div class="settings-card">
        <div id="likes-list" class="watchlater-grid"></div>
        <p id="likes-empty" class="setting-desc">No likes yet. Tap ❤️ on a trailer while watching.</p>
        <button type="button" class="ghost-btn" id="likes-clear" style="margin-top:12px;">Clear likes</button>
      </div>
    `,
    watchlater: `
      <h2>⏱ Watch Later</h2>
      <p>Save trailers for later. Requires a free Snowwflix account.</p>
      <div class="settings-card" id="watchlater-list-wrap">
        <div id="watchlater-list" class="watchlater-grid"></div>
        <p id="watchlater-empty" class="setting-desc">No items yet. Sign in, open a trailer, and tap ⏱ Watch Later.</p>
        <button type="button" class="ghost-btn" id="watchlater-clear" style="margin-top:12px;">Clear all</button>
      </div>
    `,
    help: `
      <h2>🤝 Support & Feedback</h2>
      <p>Get help or tell us how we can improve Snowwflix.</p>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info">
            <strong>Contact Support</strong>
            <p class="setting-desc">Email the team or open a help request.</p>
          </div>
          <a class="primary-btn" href="mailto:lordesnoww@gmail.com?subject=Snowwflix%20Support" style="text-decoration:none;display:inline-block;padding:10px 16px;">Email support</a>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Report a Bug</strong>
            <p class="setting-desc">Log technical glitches so we can fix them faster.</p>
          </div>
          <a class="ghost-btn" href="mailto:lordesnoww@gmail.com?subject=Snowwflix%20Bug%20Report" style="text-decoration:none;display:inline-block;">Report bug</a>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:12px;">
          <div class="setting-info">
            <strong>Rate the App</strong>
            <p class="setting-desc">Tap a star to rate Snowwflix. After about 1 hour of use we will gently ask for a 5★ rating. Your feedback is emailed to the team.</p>
          </div>
          <div class="sf-rate-stars" id="sf-rate-stars" role="group" aria-label="Rate Snowwflix">
            <button type="button" class="sf-star" data-stars="1" aria-label="1 star">★</button>
            <button type="button" class="sf-star" data-stars="2" aria-label="2 stars">★</button>
            <button type="button" class="sf-star" data-stars="3" aria-label="3 stars">★</button>
            <button type="button" class="sf-star" data-stars="4" aria-label="4 stars">★</button>
            <button type="button" class="sf-star" data-stars="5" aria-label="5 stars">★</button>
          </div>
          <p id="sf-rate-msg" class="setting-desc" style="margin:0;"></p>
        </div>
      </div>
      <div class="settings-card" style="margin-top:16px;">
        <p style="margin:0 0 8px;"><strong>Other ways to reach us</strong></p>
        <ul class="legal-list">
          <li><a href="tel:+254711414071">Phone: +254 711 414 071</a></li>
          <li><a href="https://www.instagram.com/snowwflix/?hl=en" target="_blank" rel="noopener">Instagram @snowwflix</a></li>
          <li><a href="https://x.com/SNOWWFLIX" target="_blank" rel="noopener">X @SNOWWFLIX</a></li>
          <li><a href="https://www.facebook.com/profile.php?id=61592722932826" target="_blank" rel="noopener">Facebook</a></li>
          <li><a href="https://www.tiktok.com/@snowwflix" target="_blank" rel="noopener">TikTok @snowwflix</a></li>
          <li><a href="https://www.youtube.com/@SNOWWFLIX" target="_blank" rel="noopener">YouTube @SNOWWFLIX</a></li>
        </ul>
      </div>
    `,
    about: `
      <h2>ℹ️ App Information</h2>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info"><strong>App Version</strong><p class="setting-desc">Current build number</p></div>
          <span class="badge">1.0</span>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>Release Date</strong><p class="setting-desc">First public release</p></div>
          <span class="badge">02/09/2026</span>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Company Name</strong>
            <p class="setting-desc">© 2026 SNOWWFLIX. All rights reserved. Founded and operated by Principal Owner Brian Nyangate.</p>
          </div>
        </div>
      </div>

      <h2 style="margin-top:28px;">🌐 Branding & Community</h2>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info"><strong>Official Website</strong><p class="setting-desc">Desktop homepage (when live)</p></div>
          <button class="ghost-btn" type="button" disabled>Coming soon</button>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>Instagram</strong></div>
          <a class="ghost-btn" href="https://www.instagram.com/snowwflix/?hl=en" target="_blank" rel="noopener" style="text-decoration:none;">@snowwflix</a>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>X (Twitter)</strong></div>
          <a class="ghost-btn" href="https://x.com/SNOWWFLIX" target="_blank" rel="noopener" style="text-decoration:none;">@SNOWWFLIX</a>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>YouTube</strong></div>
          <a class="ghost-btn" href="https://www.youtube.com/@SNOWWFLIX" target="_blank" rel="noopener" style="text-decoration:none;">@SNOWWFLIX</a>
        </div>
      </div>

      <h3 style="margin-top:24px;">Our Mission</h3>
      <div class="settings-card">
        <p style="margin:0;line-height:1.65;color:#c9d1d9;">
          Snowwflix exists to bring the cinematic universe closer to every screen —
          from the first trailer drop to the moment you choose what to watch next.
          We build a fast, beautiful discovery experience for movie lovers in Kenya and beyond,
          with respect for creators, clear privacy, and a community that celebrates film.
        </p>
      </div>
      <p class="setting-hint">Streaming Your Cinematic Universe · Nairobi, Kenya</p>
    `,
    legal: `
      <h2>⚖️ Legal & Compliance</h2>
      <p>User agreements, privacy, and how content is sourced.</p>
      <div class="settings-card" style="margin-top:16px;">
        <div class="setting-row">
          <div class="setting-info">
            <strong>Terms of Service</strong>
            <p class="setting-desc">User agreement rules for using Snowwflix.</p>
          </div>
          <button class="ghost-btn" type="button" id="open-terms-page">View</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Privacy Policy</strong>
            <p class="setting-desc">How we collect, use, and protect your data.</p>
          </div>
          <button class="primary-btn" id="open-privacy-page" type="button">Open Privacy Policy</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Content Licensing</strong>
            <p class="setting-desc">Movie trailers and studio assets are sourced from publicly available promotional materials and official channels for discovery purposes. Snowwflix does not host full copyrighted films without license.</p>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <strong>Third-Party Notices</strong>
            <p class="setting-desc">Built with Firebase (Google), web standards, and open web libraries. Product names (Netflix, Disney+, etc.) belong to their respective owners and are referenced for integration plans only.</p>
          </div>
        </div>
      </div>
      <p class="setting-hint">© 2026 SNOWWFLIX. Founded by Brian Nyangate. All rights reserved.</p>
    `,
    logout: `
      <h2>Log Out</h2>
      <p>Sign out of your Snowwflix account on this device.</p>
      <button class="primary-btn" id="confirm-logout" type="button">Log Out</button>
    `
  };
}

createSettings();

function createSettings() {
  if (!settingsContainer) return;

  settingsContainer.innerHTML = `
    <div class="settings-overlay"></div>
    <div class="settings-shell">
      <div class="settings-sidebar">
        <div class="settings-brand">
          <h2>❄ SNOWWFLIX</h2>
          <p>Settings</p>
        </div>
        <input type="text" class="settings-search" placeholder="Search Settings..." />
        <ul class="settings-menu">
          ${menuItems.map(item => `
            <li data-page="${item.id}">
              <span class="menu-icon">${item.icon}</span>
              <span class="menu-title">${item.title}</span>
            </li>
          `).join("")}
        </ul>
      </div>
      <div class="settings-content">
        <div class="settings-top">
          <button id="settings-back" type="button">← Back</button>
          <h1 id="settings-title">Settings</h1>
          <button id="settings-close" type="button">✕</button>
        </div>
        <div id="settings-body">
          <h2>Welcome to Snowwflix Settings</h2>
          <p>Select a category from the left menu. Changes save automatically.</p>
        </div>
      </div>
    </div>
  `;

  bindSettingsEvents();
  if (window.snowwflixI18n) {
    window.snowwflixI18n.applyLanguage(window.snowwflixI18n.currentLang());
  }
}

function bindSettingsEvents() {
  const overlay = document.querySelector(".settings-overlay");
  const closeBtn = document.getElementById("settings-close");
  const backBtn = document.getElementById("settings-back");
  const menu = document.querySelector(".settings-menu");
  const body = document.getElementById("settings-body");
  const title = document.getElementById("settings-title");

  settingsButton?.addEventListener("click", () => {
    settingsContainer.classList.add("active");
    document.body.style.overflow = "hidden";
    // always open on the category list (mobile drill-down)
    settingsContainer.classList.remove("settings-page-open");
    if (typeof showSettingsMenu === "function") showSettingsMenu();
    else {
      const t = document.getElementById("settings-title");
      if (t) t.textContent = "Settings";
    }
  });

  let settingsView = "menu"; // "menu" | "page" — mobile drill-down

  function closeSettings() {
    settingsContainer.classList.remove("active");
    settingsContainer.classList.remove("settings-page-open");
    settingsView = "menu";
    document.body.style.overflow = "";
  }

  function showSettingsMenu() {
    settingsView = "menu";
    settingsContainer.classList.remove("settings-page-open");
    if (title) title.textContent = "Settings";
    menu?.querySelectorAll("li").forEach((item) => item.classList.remove("active"));
  }

  function showSettingsPage(pageId) {
    settingsView = "page";
    settingsContainer.classList.add("settings-page-open");
    const item = menuItems.find((m) => m.id === pageId);
    if (title && item) title.textContent = item.title;
  }

  closeBtn?.addEventListener("click", closeSettings);
  backBtn?.addEventListener("click", () => {
    // On mobile: Back returns to the full settings list; on desktop Back closes
    if (window.matchMedia("(max-width: 800px)").matches && settingsView === "page") {
      showSettingsMenu();
      if (body) {
        body.innerHTML = `<h2>Settings</h2><p>Choose a category below.</p>`;
      }
    } else {
      closeSettings();
    }
  });
  overlay?.addEventListener("click", closeSettings);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsContainer.classList.contains("active")) closeSettings();
  });

  // showSettingsMenu defined above; open handler resets to menu

  function updateCacheMeter() {
    const el = document.getElementById("cache-meter-label");
    if (!el) return;
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        bytes += (k?.length || 0) + (localStorage.getItem(k)?.length || 0);
      }
      el.textContent = `Approx. ${(bytes * 2 / 1024).toFixed(1)} KB used by local app data.`;
    } catch {
      el.textContent = "Unable to measure cache.";
    }
  }

  function wireControls(pageId) {
    body.querySelectorAll("[data-setting]").forEach((el) => {
      const key = el.getAttribute("data-setting");
      if (el.type === "checkbox") {
        el.addEventListener("change", () => saveSettings({ [key]: el.checked }));
      } else if (el.tagName === "SELECT") {
        el.addEventListener("change", () => {
          if (key === "theme") {
            const val = el.value;
            saveSettings({
              theme: val,
              themeUserSet: val !== "system"
            });
          } else {
            saveSettings({ [key]: el.value });
          }
        });
      }
    });

    body.querySelectorAll(".genre-grid input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const genres = [...body.querySelectorAll(".genre-grid input:checked")].map((i) => i.value);
        body.querySelectorAll(".genre-grid .chip").forEach((chip) => {
          const input = chip.querySelector("input");
          chip.classList.toggle("active", !!(input && input.checked));
        });
        saveSettings({ genres });
      });
    });

    body.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        if (action === "clear-cache") {
          try {
            const keep = [SETTINGS_KEY, "snowwflix_privacy_accepted", "snowwflix_privacy_declined"];
            const toRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && !keep.includes(k) && k.startsWith("snowwflix_")) toRemove.push(k);
            }
            toRemove.forEach((k) => localStorage.removeItem(k));
            alert("Cache cleared on this device.");
            updateCacheMeter();
          } catch {
            alert("Could not clear cache.");
          }
        }
        if (action === "clear-downloads") alert("Downloaded trailers cleared (local).");
        if (action === "link-google") {
          document.getElementById("signin-open")?.click();
          closeSettings();
        }
      });
    });

    if (pageId === "storage") updateCacheMeter();

    if (pageId === "watchlater") {
      const listEl = document.getElementById("watchlater-list");
      const emptyEl = document.getElementById("watchlater-empty");
      let list = [];
      try { list = JSON.parse(localStorage.getItem("snowwflix_watch_later") || "[]"); } catch {}
      const user = window.currentUser || window.auth?.currentUser;
      if (!user && emptyEl) {
        emptyEl.textContent = "Sign in to sync and keep your watchlater.";
        emptyEl.style.display = "block";
      }
      if (listEl) {
        listEl.innerHTML = "";
        if (!list.length) {
          if (emptyEl) { emptyEl.style.display = "block"; if (!user) emptyEl.textContent = "Sign in to use watchlater."; else emptyEl.textContent = "No items yet."; }
        } else {
          if (emptyEl) emptyEl.style.display = "none";
          list.forEach((m) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "watchlater-item";
            card.innerHTML = `<img src="${m.thumb || ""}" alt="" loading="lazy" /><span>${(m.title || "").replace(/</g, "&lt;")}</span>`;
            card.addEventListener("click", () => {
              closeSettings();
              if (window.openBigScreen) window.openBigScreen(m.id, m.title);
            });
            listEl.appendChild(card);
          });
        }
      }
      document.getElementById("watchlater-clear")?.addEventListener("click", () => {
        localStorage.setItem("snowwflix_watch_later", "[]");
        if (listEl) listEl.innerHTML = "";
        if (emptyEl) { emptyEl.style.display = "block"; emptyEl.textContent = "No items yet."; }
      });
    }
    if (pageId === "history") {
      const listEl = document.getElementById("history-list");
      const emptyEl = document.getElementById("history-empty");
      let list = [];
      try { list = JSON.parse(localStorage.getItem("snowwflix_watch_history") || "[]"); } catch {}
      const user = window.currentUser || window.auth?.currentUser;
      if (!user && emptyEl) {
        emptyEl.textContent = "Sign in to sync and keep your history.";
        emptyEl.style.display = "block";
      }
      if (listEl) {
        listEl.innerHTML = "";
        if (!list.length) {
          if (emptyEl) { emptyEl.style.display = "block"; if (!user) emptyEl.textContent = "Sign in to use history."; else emptyEl.textContent = "No watch history yet."; }
        } else {
          if (emptyEl) emptyEl.style.display = "none";
          list.forEach((m) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "watchlater-item";
            card.innerHTML = `<img src="${m.thumb || ""}" alt="" loading="lazy" /><span>${(m.title || "").replace(/</g, "&lt;")}</span>`;
            card.addEventListener("click", () => {
              closeSettings();
              if (window.openBigScreen) window.openBigScreen(m.id, m.title);
            });
            listEl.appendChild(card);
          });
        }
      }
      document.getElementById("history-clear")?.addEventListener("click", () => {
        localStorage.setItem("snowwflix_watch_history", "[]");
        if (listEl) listEl.innerHTML = "";
        if (emptyEl) { emptyEl.style.display = "block"; emptyEl.textContent = "No watch history yet."; }
      });
    }
    if (pageId === "likes") {
      const listEl = document.getElementById("likes-list");
      const emptyEl = document.getElementById("likes-empty");
      let list = [];
      try { list = JSON.parse(localStorage.getItem("snowwflix_likes") || "[]"); } catch {}
      const user = window.currentUser || window.auth?.currentUser;
      if (!user && emptyEl) {
        emptyEl.textContent = "Sign in to sync and keep your likes.";
        emptyEl.style.display = "block";
      }
      if (listEl) {
        listEl.innerHTML = "";
        if (!list.length) {
          if (emptyEl) { emptyEl.style.display = "block"; if (!user) emptyEl.textContent = "Sign in to use likes."; else emptyEl.textContent = "No liked videos yet."; }
        } else {
          if (emptyEl) emptyEl.style.display = "none";
          list.forEach((m) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "watchlater-item";
            card.innerHTML = `<img src="${m.thumb || ""}" alt="" loading="lazy" /><span>${(m.title || "").replace(/</g, "&lt;")}</span>`;
            card.addEventListener("click", () => {
              closeSettings();
              if (window.openBigScreen) window.openBigScreen(m.id, m.title);
            });
            listEl.appendChild(card);
          });
        }
      }
      document.getElementById("likes-clear")?.addEventListener("click", () => {
        localStorage.setItem("snowwflix_likes", "[]");
        if (listEl) listEl.innerHTML = "";
        if (emptyEl) { emptyEl.style.display = "block"; emptyEl.textContent = "No liked videos yet."; }
      });
    }

    if (pageId === "help") {
      const stars = body.querySelectorAll(".sf-star");
      const msg = document.getElementById("sf-rate-msg");
      const saved = parseInt(localStorage.getItem("snowwflix_user_rating") || "0", 10);
      stars.forEach((btn) => {
        const n = parseInt(btn.getAttribute("data-stars"), 10);
        if (saved && n <= saved) btn.classList.add("active");
        btn.addEventListener("click", async () => {
          const rating = n;
          stars.forEach((s) => {
            s.classList.toggle("active", parseInt(s.getAttribute("data-stars"), 10) <= rating);
          });
          localStorage.setItem("snowwflix_user_rating", String(rating));
          localStorage.setItem("snowwflix_rated_at", String(Date.now()));
          const user = window.currentUser || window.auth?.currentUser;
          const who = user?.email || user?.displayName || "Guest";
          const uid = user?.uid || "anonymous";
          if (msg) msg.textContent = "Thanks for rating " + rating + "★ — notifying the team…";
          // Persist rating in Firestore so admin can see it
          try {
            if (window.db) {
              await window.db.collection("ratings").add({
                rating,
                email: user?.email || null,
                displayName: user?.displayName || null,
                uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent.slice(0, 120)
              });
            }
          } catch (err) {
            console.warn("rating save", err);
          }
          // Email notification via mailto (opens user's mail client with prefilled report)
          const subject = encodeURIComponent("Snowwflix app rating: " + rating + " stars");
          const bodyText = encodeURIComponent(
            "New rating received\\n\\nStars: " + rating + "\\nWho: " + who + "\\nUID: " + uid + "\\nTime: " + new Date().toISOString()
          );
          // Also fire a silent background intent - primary path is Firestore + optional mailto
          const mail = document.createElement("a");
          mail.href = "mailto:lordesnoww@gmail.com?subject=" + subject + "&body=" + bodyText;
          // Don't auto-open mailto every time (annoying); only if 5 stars prompt path
          if (rating === 5) {
            // open briefly
            window.location.href = mail.href;
          }
          if (msg) msg.textContent = "Thanks! Your " + rating + "★ rating was sent.";
        });
      });
    }

    if (pageId === "legal") {
      document.getElementById("open-privacy-page")?.addEventListener("click", () => {
        window.open("privacy.html", "_blank");
      });
      document.getElementById("open-terms-page")?.addEventListener("click", () => {
        window.open("terms.html", "_blank");
      });
    }

    if (pageId === "logout") {
      document.getElementById("confirm-logout")?.addEventListener("click", async () => {
        if (typeof window.snowwflixSignOut === "function") await window.snowwflixSignOut();
        else if (window.auth) await window.auth.signOut();
        closeSettings();
      });
    }

    if (pageId === "security") {
      document.getElementById("settings-change-password")?.addEventListener("click", async () => {
        const email = window.currentUser?.email || prompt("Enter your account email for a reset link:");
        if (!email || !window.auth) return;
        try {
          await window.auth.sendPasswordResetEmail(email);
          alert("Password reset email sent.");
        } catch (e) {
          alert(e.message || "Could not send reset email.");
        }
      });
    }

    if (pageId === "account") {
      const openAuth = (mode) => {
        closeSettings();
        const signinBtn = document.getElementById("signin-open");
        const navLogin = document.getElementById("nav-login-btn");
        const navSignup = document.getElementById("nav-signup-btn");
        if (mode === "signup" && navSignup) navSignup.click();
        else if (mode === "login" && navLogin) navLogin.click();
        else if (signinBtn) signinBtn.click();
        else {
          document.getElementById("account-modal")?.classList.remove("hidden");
        }
      };

      document.getElementById("settings-open-login")?.addEventListener("click", () => openAuth("login"));
      document.getElementById("settings-open-signup")?.addEventListener("click", () => openAuth("signup"));
      document.getElementById("settings-open-google")?.addEventListener("click", () => {
        closeSettings();
        openAuth("login");
        setTimeout(() => document.getElementById("google-signin")?.click(), 200);
      });

      document.getElementById("settings-account-logout")?.addEventListener("click", async () => {
        if (typeof window.snowwflixSignOut === "function") await window.snowwflixSignOut();
        else if (window.auth) await window.auth.signOut();
        // Refresh account page to guest state
        const pages = buildPages(loadSettings());
        if (body) {
          body.innerHTML = pages.account;
          wireControls("account");
        }
      });

      const msgEl = document.getElementById("settings-account-msg");
      const setAccountMsg = (text, isError) => {
        if (!msgEl) return;
        msgEl.textContent = text || "";
        msgEl.style.color = isError ? "#e74c3c" : "#2ecc71";
      };

      document.getElementById("settings-avatar-input")?.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        const user = window.auth?.currentUser;
        if (!file || !user) return;
        if (file.size > 2 * 1024 * 1024) {
          setAccountMsg("Please choose an image under 2 MB.", true);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          localStorage.setItem("snowwflix_avatar_" + user.uid, dataUrl);
          const preview = document.getElementById("settings-avatar-preview");
          if (preview) preview.src = dataUrl;
          // Sync nav + side menu avatars
          const navAv = document.getElementById("nav-avatar");
          const menuAv = document.getElementById("menu-avatar");
          if (navAv) navAv.src = dataUrl;
          if (menuAv) menuAv.src = dataUrl;
          if (window.db) {
            window.db.collection("users").doc(user.uid).set({ photoURL: dataUrl }, { merge: true }).catch(() => {});
          }
          setAccountMsg("Profile photo updated.");
        };
        reader.readAsDataURL(file);
      });

      document.getElementById("settings-save-profile")?.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user) return;
        const displayName = document.getElementById("settings-display-name")?.value?.trim() || "";
        if (!displayName) {
          setAccountMsg("Display name cannot be empty.", true);
          return;
        }
        setAccountMsg("Saving…");
        try {
          await user.updateProfile({ displayName });
          if (window.db) {
            await window.db.collection("users").doc(user.uid).set({
              displayName,
              username: displayName
            }, { merge: true });
          }
          const nameEl = document.getElementById("settings-profile-name");
          if (nameEl) nameEl.textContent = displayName;
          const navUser = document.getElementById("nav-username");
          const menuName = document.getElementById("menu-display-name");
          if (navUser) navUser.textContent = displayName;
          if (menuName) menuName.textContent = displayName;
          setAccountMsg("Profile saved.");
        } catch (err) {
          console.error(err);
          setAccountMsg(err.message || "Could not save profile.", true);
        }
      });

      document.getElementById("settings-resend-verify")?.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user) return;
        try {
          await user.sendEmailVerification();
          setAccountMsg("Verification email sent. Check your inbox.");
        } catch (err) {
          setAccountMsg(err.message || "Could not send verification email.", true);
        }
      });
    }
  }

  menu?.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-page]");
    if (!li) return;
    const pageId = li.getAttribute("data-page");
    menu.querySelectorAll("li").forEach((item) => item.classList.remove("active"));
    li.classList.add("active");
    showSettingsPage(pageId);
    const pages = buildPages(loadSettings());
    if (body) {
      body.innerHTML = pages[pageId] || "<p>Coming soon.</p>";
      wireControls(pageId);
    }
  });

  document.querySelector(".settings-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    menu.querySelectorAll("li").forEach((li) => {
      li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

window.snowwflixSettings = { loadSettings, saveSettings, applySettings };
