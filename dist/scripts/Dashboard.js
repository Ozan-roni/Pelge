const ThemeStorageKey = "ControlInterfaceTheme.v1";
const ThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
function ApplyInterfaceTheme(Preference = "System") {
  const ResolvedTheme = Preference === "System" ? (ThemeMediaQuery.matches ? "dark" : "light") : Preference.toLowerCase();
  document.documentElement.dataset.theme = ResolvedTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", ResolvedTheme === "dark" ? "#0b0c0e" : "#fbfcfe");
  const ThemeSelect = document.getElementById("ThemeSelect");
  if (ThemeSelect) ThemeSelect.value = Preference;
  const LandingThemeButton = document.getElementById("LandingThemeButton");
  if (LandingThemeButton) {
    const IsDark = ResolvedTheme === "dark";
    LandingThemeButton.textContent = IsDark ? "☀" : "☾";
    LandingThemeButton.setAttribute("aria-label", IsDark ? "Switch to light theme" : "Switch to dark theme");
    LandingThemeButton.title = IsDark ? "Light theme" : "Dark theme";
  }
}
function InitializeInterfaceTheme() {
  const StoredPreference = localStorage.getItem(ThemeStorageKey) ?? "Light";
  ApplyInterfaceTheme(StoredPreference);
  ThemeMediaQuery.addEventListener?.("change", () => { if ((localStorage.getItem(ThemeStorageKey) ?? "Light") === "System") ApplyInterfaceTheme("System"); });
  const ThemeSelect = document.getElementById("ThemeSelect");
  if (ThemeSelect) ThemeSelect.onchange = () => { localStorage.setItem(ThemeStorageKey, ThemeSelect.value); ApplyInterfaceTheme(ThemeSelect.value); ShowControlToast(`${ThemeSelect.value} theme`, "The interface palette has been updated."); };
  const LandingThemeButton = document.getElementById("LandingThemeButton");
  if (LandingThemeButton) LandingThemeButton.onclick = () => {
    const NextTheme = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark";
    localStorage.setItem(ThemeStorageKey, NextTheme);
    ApplyInterfaceTheme(NextTheme);
    ShowControlToast(`${NextTheme} theme`, "The homepage palette has been updated.");
  };
}
ApplyInterfaceTheme(localStorage.getItem(ThemeStorageKey) ?? "Light");
const DefaultRules = {
  SchemaVersion: 14,
  ProtectedApplications: ["Instagram", "X", "Snapchat", "YouTube", "TikTok"],
  StrictMode: true,
  ShieldAll: false,
  GrayscaleMode: false,
  PostModeUntil: 0,
  AutoLaunchApp: "None",
  ShowUsageTimer: true,
  SensitiveContentProtection: false,
  SensitiveProtectionConfig: {
    BlockAdultSites: true,
    HideDetectedAccounts: true,
    BlockedDomains: [],
    BlockedKeywords: [],
    BlockedAccounts: [],
  },
  Instagram: {
    Enabled: true,
    Reels: true,
    ForYou: true,
    Explore: true,
    Search: true,
    GridContent: false,
    SearchGridGuard: true,
    SearchScrollLock: true,
    AdsAndSuggested: true,
    SuggestedPosts: true,
    Stories: false,
    StoryAds: true,
    Live: true,
    Shopping: true,
    SavedPosts: true,
    HomeFeed: false,
    HideFollowingPosts: false,
    FollowingUnlockAvailableAt: 0,
    DMsOnly: true,
    DailyLimitMinutes: 45,
  },
  X: {
    Enabled: true,
    DMsOnly: false,
    ForYou: true,
    SearchProfilesOnly: true,
    Videos: true,
    DailyLimitMinutes: 30,
  },
  Snapchat: {
    Enabled: true,
    Spotlight: true,
    Stories: true,
    Discover: true,
    Map: true,
    Ads: true,
    DMsOnly: true,
    DailyLimitMinutes: 30,
  },
  TikTok: { Enabled: true, ForYou: true, FollowingFeed: true, Live: true, Suggested: true, DailyLimitMinutes: 30 },
  YouTube: {
    Enabled: true,
    VideoOnly: false,
    Shorts: true,
    HomeFeed: false,
    Recommendations: false,
    Comments: false,
    Ads: false,
    DailyLimitMinutes: 60,
  },
};

const ApplicationDefinitions = [
  {
    Key: "Instagram",
    Name: "Instagram",
    Description: "Messages and intentional profiles, without passive discovery.",
    CompactDescription: "Feed and Reels controls \u00B7 profiles and messages remain",
    Url: "https://www.instagram.com/direct/inbox/",
    Rules: [
      ["Reels", "Block Reels", "Hide vertical video tabs, links and routes"],
      ["ForYou", "Block For You", "Hide the algorithmic home feed"],
      ["Search", "Keep search", "Allow intentional account and title search"],
      ["SearchGridGuard", "Hide idle explore grid", "Media appears only after you enter a search"],
      ["SearchScrollLock", "Single-result mode", "Remove next arrows and continuous media navigation"],
      ["AdsAndSuggested", "Hide ads & suggested", "Remove sponsored and suggested posts"],
      ["Stories", "Block Stories", "Remove the story tray and story routes"],
      ["StoryAds", "Block story ads", "Hide sponsored frames inside Stories"],
      ["Live", "Block Live", "Prevent live-stream routes and entry points"],
      ["Shopping", "Block Shopping", "Remove product discovery and shopping routes"],
      ["SavedPosts", "Block saved posts", "Prevent access to the saved collection"],
      ["HomeFeed", "Block every home post", "Turn this on only when you want the Instagram home page completely empty"],
      ["HideFollowingPosts", "Hide friends' posts", "Leave this off to keep chronological posts from people you follow"],
      ["DMsOnly", "DMs only", "Allow Direct Messages and account access only"],
    ],
  },
  {
    Key: "X",
    Name: "X",
    Description: "A direct line to conversations, without the timeline.",
    CompactDescription: "Profiles + messages \u00B7 no For You or video discovery",
    Url: "https://x.com/messages",
    Rules: [
      ["ForYou", "Block For You", "Remove the algorithmic home timeline"],
      ["SearchProfilesOnly", "Profile search only", "Search returns people, never posts, trends or media"],
      ["Videos", "Block videos", "Remove video players and video discovery"],
    ],
  },
  {
    Key: "Snapchat",
    Name: "Snapchat",
    Description: "Camera and private conversations only.",
    CompactDescription: "No Spotlight \u00B7 No Stories \u00B7 Chat only",
    Url: "https://web.snapchat.com/",
    Rules: [
      ["Spotlight", "Block Spotlight", "Remove every Spotlight route, button and panel"],
      ["Stories", "Block Stories", "Remove public and friend story surfaces"],
      ["DMsOnly", "DMs only", "Keep chat, camera and photographs only"],
    ],
  },
  {
    Key: "TikTok",
    Name: "TikTok",
    Description: "Search intentionally, without an endless For You feed.",
    CompactDescription: "No For You / No LIVE / intentional profiles only",
    Url: "https://www.tiktok.com/messages",
    Rules: [
      ["ForYou", "Block For You", "Remove the algorithmic For You feed"],
      ["FollowingFeed", "Block Following feed", "Remove continuous video browsing from followed accounts"],
      ["Live", "Block LIVE", "Remove live-stream routes and entry points"],
      ["Suggested", "Hide suggestions", "Remove suggested accounts and media shelves"],
    ],
  },  {
    Key: "YouTube",
    Name: "YouTube",
    Description: "YouTube stays open, with Shorts removed.",
    CompactDescription: "Everything open \u00B7 Shorts blocked",
    Url: "https://www.youtube.com/",
    Rules: [
      ["VideoOnly", "Video only", "Keep search and standard video playback"],
      ["Shorts", "Block Shorts", "Remove Shorts routes, shelves and links"],
      ["HomeFeed", "Hide home feed", "Replace the algorithmic home page with a clean screen"],
      ["Recommendations", "Hide recommendations", "Remove the related-video sidebar"],
      ["Ads", "Hide ads", "Remove promotional slots around standard videos"],
      ["Comments", "Hide comments", "Remove the comment section below videos"],
    ],
  },
];

const RequiredExtensionVersion = "0.31.8";
let ActiveSession = null;
let SessionTimer = null;
let ToastTimer = null;
let ManifestoTimer = null;
const ApplicationKeys = ApplicationDefinitions.map((Application) => Application.Key);
let ActiveRules = structuredClone(DefaultRules);
let SaveTimer = null;
let BridgeRequestIndex = 0;
let ActiveApplicationKey = "Instagram";
let LatestTodayUsage = {};
let PendingSupportRulePath = null;
let UnlockReviewDeadline = 0;
let UnlockReviewInterval = null;
let UnlockReviewSelection = new Set();
const HasExtensionStorage = Boolean(globalThis.chrome?.storage?.sync);

function HasExtensionBridge() {
  return document.documentElement.getAttribute("data-control-extension-active") === "true";
}

function HasControlExtension() {
  return HasExtensionStorage || HasExtensionBridge();
}

function WithStorageTimeout(StoragePromise, TimeoutMs = 900) {
  return Promise.race([
    StoragePromise,
    new Promise((_, Reject) => window.setTimeout(() => Reject(new Error("Extension storage unavailable")), TimeoutMs)),
  ]);
}

function SendBridgeRequest(Type, Payload = {}) {
  return new Promise((Resolve, Reject) => {
    BridgeRequestIndex += 1;
    const RequestId = `ControlRequest${BridgeRequestIndex}`;
    const TimeoutId = window.setTimeout(() => {
      window.removeEventListener("message", HandleResponse);
      Reject(new Error("Extension bridge unavailable"));
    }, 1500);

    function HandleResponse(Event) {
      const Response = Event.data;
      if (Event.origin !== location.origin || Response?.Sender !== "ControlExtension" || Response.RequestId !== RequestId) {
        return;
      }

      window.clearTimeout(TimeoutId);
      window.removeEventListener("message", HandleResponse);
      Resolve(Response);
    }

    window.addEventListener("message", HandleResponse);
    window.postMessage({ Sender: "ControlDashboard", Type, RequestId, ...Payload }, location.origin);
  });
}

async function ReadStoredRules() {
  if (HasExtensionStorage) {
    try {
      const StoredData = await WithStorageTimeout(chrome.storage.sync.get("Rules"));
      return StoredData.Rules ?? null;
    } catch {
      document.body.classList.add("PreviewMode");
    }
  }

  if (HasExtensionBridge()) {
    const Response = await SendBridgeRequest("ReadRules");
    return Response.Rules ?? null;
  }

  const StoredValue = window.localStorage.getItem("ControlRules");
  return StoredValue ? JSON.parse(StoredValue) : null;
}

async function WriteStoredRules(Rules) {
  if (HasExtensionStorage) {
    try {
      await WithStorageTimeout(chrome.storage.sync.set({ Rules }));
      return;
    } catch {
      document.body.classList.add("PreviewMode");
    }
  }

  if (HasExtensionBridge()) {
    await SendBridgeRequest("WriteRules", { Rules });
    return;
  }

  window.localStorage.setItem("ControlRules", JSON.stringify(Rules));
}

async function ReadUsageStats() {
  if (globalThis.chrome?.runtime?.sendMessage && HasExtensionStorage) {
    try {
      const Response = await WithStorageTimeout(chrome.runtime.sendMessage({ Type: "GetUsageStats" }));
      return Response?.UsageState ?? null;
    } catch {
      document.body.classList.add("PreviewMode");
    }
  }

  if (HasExtensionBridge()) {
    const Response = await SendBridgeRequest("ReadUsageStats");
    return Response.UsageState ?? null;
  }

  return null;
}

const CoreRulePaths = new Set();

const ReviewableRulePaths = new Set([
  "Instagram.Explore", "Instagram.Search", "Instagram.AdsAndSuggested", "Instagram.SuggestedPosts",
  "Instagram.Stories", "Instagram.StoryAds", "Instagram.Live", "Instagram.Shopping", "Instagram.SavedPosts",
  "Instagram.HideFollowingPosts", "Instagram.DMsOnly",
  "Snapchat.Stories", "Snapchat.Discover", "Snapchat.Map", "Snapchat.Ads", "Snapchat.DMsOnly",
  "TikTok.Suggested",
  "YouTube.HomeFeed", "YouTube.Recommendations", "YouTube.Ads", "YouTube.Comments",
]);
function ApplyCoreProtection(Rules) {
  const ProtectedApplications = Array.isArray(Rules.ProtectedApplications) ? Rules.ProtectedApplications : ApplicationKeys;
  for (const ApplicationKey of ApplicationKeys) {
    if (typeof Rules[ApplicationKey].Enabled !== "boolean") {
      Rules[ApplicationKey].Enabled = ProtectedApplications.includes(ApplicationKey);
    }
  }
  Rules.ProtectedApplications = ApplicationKeys.filter((ApplicationKey) => Rules[ApplicationKey].Enabled);
  return Rules;
}

function MergeRules(StoredRules) {
  const Rules = structuredClone(DefaultRules);
  if (!StoredRules || typeof StoredRules !== "object" || ![8, 9, 10, 11, 12, 13, 14].includes(StoredRules.SchemaVersion)) {
    return Rules;
  }

  Rules.ProtectedApplications = Array.isArray(StoredRules.ProtectedApplications) ? StoredRules.ProtectedApplications.filter((Key) => ApplicationKeys.includes(Key)) : Rules.ProtectedApplications;
  Rules.StrictMode = StoredRules.StrictMode ?? Rules.StrictMode;
  Rules.ShieldAll = StoredRules.ShieldAll ?? Rules.ShieldAll;
  Rules.GrayscaleMode = StoredRules.GrayscaleMode ?? Rules.GrayscaleMode;
  Rules.PostModeUntil = Number(StoredRules.PostModeUntil) || 0;
  Rules.AutoLaunchApp = StoredRules.AutoLaunchApp ?? Rules.AutoLaunchApp;
  Rules.ShowUsageTimer = StoredRules.ShowUsageTimer ?? Rules.ShowUsageTimer;
  Rules.SensitiveContentProtection = StoredRules.SensitiveContentProtection ?? Rules.SensitiveContentProtection;
  Rules.SensitiveProtectionConfig = { ...Rules.SensitiveProtectionConfig, ...(StoredRules.SensitiveProtectionConfig ?? {}) };
  for (const ListKey of ["BlockedDomains", "BlockedKeywords", "BlockedAccounts"]) {
    Rules.SensitiveProtectionConfig[ListKey] = Array.isArray(StoredRules.SensitiveProtectionConfig?.[ListKey])
      ? StoredRules.SensitiveProtectionConfig[ListKey].filter((Value) => typeof Value === "string").slice(0, 500)
      : [];
  }
  for (const ApplicationKey of ApplicationKeys) {
    Rules[ApplicationKey] = { ...Rules[ApplicationKey], ...(StoredRules[ApplicationKey] ?? {}) };
    if (typeof StoredRules[ApplicationKey]?.Enabled !== "boolean") {
      Rules[ApplicationKey].Enabled = Rules.ProtectedApplications.includes(ApplicationKey);
    }
  }

  const StoredInstagram = StoredRules.Instagram ?? {};
  const IsLegacyFriendFeedRule = Number(StoredRules.SchemaVersion) < 14;
  Rules.Instagram.HomeFeed = IsLegacyFriendFeedRule ? false : StoredInstagram.HomeFeed === true;
  Rules.Instagram.HideFollowingPosts = IsLegacyFriendFeedRule
    ? false
    : typeof StoredInstagram.HideFollowingPosts === "boolean"
      ? StoredInstagram.HideFollowingPosts
      : StoredInstagram.FollowingOnly !== true;
  Rules.Instagram.FollowingUnlockAvailableAt = Rules.Instagram.HideFollowingPosts
    ? Number(StoredInstagram.FollowingUnlockAvailableAt) || 0
    : 0;
  ApplyInstagramDirectMessagesOnlyRules(Rules);
  ApplyYouTubeShortsOnlyRules(Rules);
  Rules.SchemaVersion = 14;
  return ApplyCoreProtection(Rules);
}

function GetPathValue(Source, Path) {
  return Path.split(".").reduce((Value, Key) => Value?.[Key], Source);
}

function SetPathValue(Target, Path, Value) {
  const Keys = Path.split(".");
  const FinalKey = Keys.pop();
  const Container = Keys.reduce((CurrentValue, Key) => CurrentValue[Key], Target);
  Container[FinalKey] = Value;
}

function CreateSwitch(Path, Label) {
  const Wrapper = document.createElement("label");
  Wrapper.className = "Switch";
  Wrapper.setAttribute("aria-label", Label);
  Wrapper.title = Label;
  Wrapper.innerHTML = `<input type="checkbox" data-rule-path="${Path}" /><span class="SwitchTrack"></span>`;
  return Wrapper;
}

const ApplicationIconPaths = {
  Instagram: "assets/Instagram.svg",
  X: "assets/X.svg",
  Snapchat: "assets/Snapchat.svg",
  YouTube: "assets/YouTube.svg",
  TikTok: "assets/TikTok.svg",
};

function GetApplicationBadge(Application) {
  const Badge = document.createElement("span");
  Badge.className = `AppBadge ${Application.Key}`;
  const Icon = document.createElement("img");
  Icon.src = ApplicationIconPaths[Application.Key];
  Icon.alt = "";
  Badge.append(Icon);
  Badge.setAttribute("aria-hidden", "true");
  return Badge;
}

function CreateApplicationCard(Application) {
  const Card = document.createElement("article");
  Card.className = `ApplicationShowcaseCard ${Application.Key}`;
  Card.dataset.applicationKey = Application.Key;
  Card.tabIndex = 0;

  const Header = document.createElement("header");
  const Identity = document.createElement("div");
  Identity.className = "ApplicationShowcaseIdentity";
  Identity.append(GetApplicationBadge(Application));
  Identity.insertAdjacentHTML("beforeend", `<div><small>Protected</small><h3>${Application.Name}</h3><p>${Application.Description}</p></div>`);
  const EnabledSwitch = CreateSwitch(`${Application.Key}.Enabled`, `Enable ${Application.Name}`);
  Header.append(Identity, EnabledSwitch);
  Card.append(Header);

  const Focus = document.createElement("div");
  Focus.className = "ApplicationFocusStatement";
  Focus.innerHTML = `<small>Available</small><strong>${Application.CompactDescription}</strong>`;
  Card.append(Focus);

  const Metrics = document.createElement("div");
  Metrics.className = "ApplicationShowcaseMetrics";
  Metrics.innerHTML = `<div><small>Today</small><strong data-application-usage="${Application.Key}">${FormatDuration(Number(LatestTodayUsage[Application.Key]) || 0)}</strong></div><div><small>Protection</small><strong class="ApplicationProtectionState">${ActiveRules[Application.Key].Enabled ? "Active" : "Paused"}</strong></div><div><small>Active filters</small><strong class="ApplicationRuleCount">0</strong></div>`;
  Card.append(Metrics);

  const Footer = document.createElement("footer");
  const SettingsButton = document.createElement("button");
  SettingsButton.type = "button";
  SettingsButton.className = "AppShowcaseSettingsButton";
  SettingsButton.innerHTML = `<span><strong>Settings</strong><small>Protection controls</small></span><i>&rarr;</i>`;
  SettingsButton.onclick = (Event) => {
    Event.stopPropagation();
    SelectApplication(Application.Key, true);
  };
  const OpenButton = document.createElement("button");
  OpenButton.type = "button";
  OpenButton.className = "AppShowcaseOpenButton";
  OpenButton.textContent = HasControlExtension() ? `Open ${Application.Name} \u2197` : "Use extension";
  OpenButton.onclick = (Event) => {
    Event.stopPropagation();
    LaunchApplication(Application);
  };
  Footer.append(SettingsButton, OpenButton);
  Card.append(Footer);
  Card.onclick = () => SelectApplication(Application.Key, true);
  Card.onkeydown = (Event) => {
    if (Event.key === "Enter" || Event.key === " ") {
      Event.preventDefault();
      SelectApplication(Application.Key, true);
    }
  };
  return Card;
}

function RenderApplicationSettings(ApplicationKey) {
  const Application = ApplicationDefinitions.find((Item) => Item.Key === ApplicationKey);
  if (!Application) return;
  const Panel = document.getElementById("AppSettingsPanel");
  const Identity = document.getElementById("AppSettingsIdentity");
  const RuleList = document.getElementById("AppSettingsRuleList");
  Identity.replaceChildren(GetApplicationBadge(Application));
  Identity.insertAdjacentHTML("beforeend", `<div><span>Application settings</span><h3>${Application.Name}</h3><p>${Application.Description}</p></div>`);
  RuleList.replaceChildren(...Application.Rules.map(([RuleKey, RuleName, RuleDescription]) => {
    const Row = document.createElement("div");
    Row.className = "AppSettingsRuleRow";
    Row.innerHTML = `<div><strong>${RuleName}</strong><span>${RuleDescription}</span></div>`;
    Row.append(CreateSwitch(`${Application.Key}.${RuleKey}`, RuleName));
    return Row;
  }));
  document.getElementById("AppSettingsUsageValue").textContent = FormatDuration(Number(LatestTodayUsage[Application.Key]) || 0);
  const LaunchButton = document.getElementById("LaunchSelectedApplicationButton");
  LaunchButton.textContent = HasControlExtension() ? `Open ${Application.Name} \u2197` : "Use the extension";
  LaunchButton.onclick = () => LaunchApplication(Application);
  Panel.hidden = false;
  BindSwitches();
  UpdateFollowingCooldown();
  EnsureLogoEyes(Panel);
}

function RenderLandingConfigurator(ApplicationKey = ActiveApplicationKey) {
  const AppList = document.getElementById("LandingWebAppList");
  const Identity = document.getElementById("LandingWebIdentity");
  const RuleList = document.getElementById("LandingWebRuleList");
  const OpenButton = document.getElementById("LandingWebOpenAppButton");
  if (!AppList || !Identity || !RuleList || !OpenButton) return;
  const Application = ApplicationDefinitions.find((Item) => Item.Key === ApplicationKey) ?? ApplicationDefinitions[0];
  ActiveApplicationKey = Application.Key;

  AppList.replaceChildren(...ApplicationDefinitions.map((Item) => {
    const Button = document.createElement("button");
    Button.type = "button";
    Button.className = Item.Key === Application.Key ? "IsActive" : "";
    Button.append(GetApplicationBadge(Item));
    Button.insertAdjacentHTML("beforeend", `<span><strong>${Item.Name}</strong><small>${Item.Rules.length} options</small></span><b>&rsaquo;</b>`);
    Button.onclick = () => RenderLandingConfigurator(Item.Key);
    return Button;
  }));

  Identity.replaceChildren(GetApplicationBadge(Application));
  Identity.insertAdjacentHTML("beforeend", `<div><small>Application settings</small><h3>${Application.Name}</h3><p>${Application.Description}</p></div>`);
  RuleList.replaceChildren(...Application.Rules.map(([RuleKey, RuleName, RuleDescription]) => {
    const Row = document.createElement("div");
    Row.className = "LandingWebRuleRow";
    Row.innerHTML = `<div><strong>${RuleName}</strong><span>${RuleDescription}</span></div>`;
    Row.append(CreateSwitch(`${Application.Key}.${RuleKey}`, RuleName));
    return Row;
  }));
  OpenButton.textContent = HasControlExtension() ? `Open ${Application.Name}` : "Use extension";
  OpenButton.onclick = () => LaunchApplication(Application);
  BindSwitches();
  UpdateFollowingCooldown();
}

function UpdateExtensionConnectionUI() {
  const IsConnected = HasControlExtension();
  document.body.classList.toggle("ExtensionConnected", IsConnected);
  for (const Title of document.querySelectorAll("[data-extension-status-title]")) {
    Title.textContent = IsConnected ? "Extension connected" : "Website configuration";
  }
  for (const Copy of document.querySelectorAll("[data-extension-status-copy]")) {
    Copy.textContent = IsConnected
      ? "Changes made here are synchronized with the Control extension on this browser."
      : "Your settings work here now. Install the extension to apply them inside social networks.";
  }
  const LandingTitle = document.getElementById("LandingExtensionStateTitle");
  const LandingCopy = document.getElementById("LandingExtensionStateCopy");
  if (LandingTitle) LandingTitle.textContent = IsConnected ? "Extension connected" : "Web draft ready";
  if (LandingCopy) LandingCopy.textContent = IsConnected ? "Changes apply automatically." : "Install the extension to apply these rules.";
}

function SelectApplication(ApplicationKey, OpenSettings = false) {
  const ApplicationIndex = ApplicationDefinitions.findIndex((Item) => Item.Key === ApplicationKey);
  if (ApplicationIndex < 0) return;
  ActiveApplicationKey = ApplicationKey;
  const Cards = Array.from(document.querySelectorAll(".ApplicationShowcaseCard"));
  Cards.forEach((Card) => Card.classList.toggle("IsSelected", Card.dataset.applicationKey === ApplicationKey));
  document.getElementById("ApplicationPosition").textContent = `${String(ApplicationIndex + 1).padStart(2, "0")} / ${String(ApplicationDefinitions.length).padStart(2, "0")}`;
  const ActiveCard = Cards.find((Card) => Card.dataset.applicationKey === ApplicationKey);
  ActiveCard?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  if (OpenSettings) {
    RenderApplicationSettings(ApplicationKey);
    window.setTimeout(() => document.getElementById("AppSettingsPanel")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
  }
}

function NavigateApplication(Direction) {
  const CurrentIndex = Math.max(0, ApplicationDefinitions.findIndex((Item) => Item.Key === ActiveApplicationKey));
  const NextIndex = (CurrentIndex + Direction + ApplicationDefinitions.length) % ApplicationDefinitions.length;
  SelectApplication(ApplicationDefinitions[NextIndex].Key, false);
}

function GetApplicationLaunchUrl(Application) {
  if (Application.Key !== "Instagram") {
    return Application.Url;
  }

  const InstagramRules = ActiveRules.Instagram;
  if (InstagramRules.DMsOnly) {
    return "https://www.instagram.com/direct/inbox/";
  }
  if (!InstagramRules.HideFollowingPosts) {
    return "https://www.instagram.com/?variant=following";
  }
  return "https://www.instagram.com/";
}
function CreateOverviewApplicationCard(Application) {
  const Card = document.createElement("article");
  Card.className = `OverviewAppCard ${Application.Key}`;
  const Header = document.createElement("header");
  Header.append(GetApplicationBadge(Application), CreateSwitch(`${Application.Key}.Enabled`, `Enable ${Application.Name}`));
  Card.append(Header);
  Card.insertAdjacentHTML("beforeend", `<h3>${Application.Name}</h3><p>${Application.CompactDescription}</p><div class="OverviewUsage"><small>Focused today</small><strong id="${Application.Key}OverviewUsage">0 min</strong><i></i></div>`);
  const Footer = document.createElement("footer");
  const EnabledCount = Application.Rules.filter(([RuleKey]) => Boolean(ActiveRules[Application.Key][RuleKey])).length;
  Footer.innerHTML = `<span>${EnabledCount} filter${EnabledCount === 1 ? "" : "s"} active</span>`;
  const OpenButton = document.createElement("button");
  OpenButton.type = "button";
  OpenButton.textContent = HasControlExtension() ? "Open \u2197" : "Use extension";
  OpenButton.onclick = () => LaunchApplication(Application);
  Footer.append(OpenButton);
  Card.append(Footer);
  return Card;
}

function CreateLimitCard(Application) {
  const Card = document.createElement("article");
  Card.className = "LimitCard";
  const Header = document.createElement("header");
  Header.append(GetApplicationBadge(Application));
  const LimitState = document.createElement("span");
  LimitState.className = "ApplicationMode";
  LimitState.innerHTML = "<i></i>Daily";
  LimitState.style.margin = "0";
  Header.append(LimitState);
  Card.append(Header);
  Card.insertAdjacentHTML("beforeend", `<h3>${Application.Name}</h3><p>Focused time per day.</p>`);

  const Control = document.createElement("label");
  Control.className = "LimitControl";
  const Input = document.createElement("input");
  Input.type = "number";
  Input.min = "0";
  Input.max = "1440";
  Input.step = "5";
  Input.value = String(ActiveRules[Application.Key].DailyLimitMinutes);
  Input.setAttribute("aria-label", `${Application.Name} daily limit in minutes`);
  Input.onchange = () => {
    const Value = Math.max(0, Math.min(1440, Math.round(Number(Input.value) || 0)));
    Input.value = String(Value);
    ActiveRules[Application.Key].DailyLimitMinutes = Value;
    QueueSave();
  };
  Control.append(Input);
  Control.insertAdjacentHTML("beforeend", "<span>minutes / day</span>");
  Card.append(Control);

  const Presets = document.createElement("div");
  Presets.className = "LimitPresets";
  for (const Preset of [15, 30, 60, 0]) {
    const Button = document.createElement("button");
    Button.type = "button";
    Button.textContent = Preset === 0 ? "Unlimited" : `${Preset} min`;
    Button.onclick = () => {
      Input.value = String(Preset);
      ActiveRules[Application.Key].DailyLimitMinutes = Preset;
      QueueSave();
    };
    Presets.append(Button);
  }
  Card.append(Presets);
  return Card;
}

function UpdateApplicationCardStates() {
  for (const Application of ApplicationDefinitions) {
    const Card = document.querySelector(`.ApplicationShowcaseCard[data-application-key="${Application.Key}"]`);
    if (!Card) continue;
    const IsEnabled = Boolean(ActiveRules[Application.Key].Enabled);
    const ActiveFilterCount = Application.Rules.filter(([RuleKey]) => Boolean(ActiveRules[Application.Key][RuleKey])).length;
    const Protection = Card.querySelector(".ApplicationProtectionState");
    const Count = Card.querySelector(".ApplicationRuleCount");
    const Usage = Card.querySelector(`[data-application-usage="${Application.Key}"]`);
    Card.classList.toggle("IsPaused", !IsEnabled);
    if (Protection) Protection.textContent = IsEnabled ? "Active" : "Paused";
    if (Count) Count.textContent = String(ActiveFilterCount);
    if (Usage) Usage.textContent = FormatDuration(Number(LatestTodayUsage[Application.Key]) || 0);
  }
  if (!document.getElementById("AppSettingsPanel")?.hidden) {
    const ActiveUsage = document.getElementById("AppSettingsUsageValue");
    if (ActiveUsage) ActiveUsage.textContent = FormatDuration(Number(LatestTodayUsage[ActiveApplicationKey]) || 0);
  }
}

function RenderApplications() {
  document.getElementById("ApplicationGrid").replaceChildren(...ApplicationDefinitions.map(CreateApplicationCard));
  RenderOverviewApplications();
  BindSwitches();
  UpdateFollowingCooldown();
  UpdateRuleStatistics();
  UpdateApplicationCardStates();
  document.getElementById("PreviousApplicationButton").onclick = () => NavigateApplication(-1);
  document.getElementById("NextApplicationButton").onclick = () => NavigateApplication(1);
  document.getElementById("CloseAppSettingsButton").onclick = () => {
    document.getElementById("AppSettingsPanel").hidden = true;
  };
  SelectApplication(ActiveApplicationKey, true);
}

function RenderOverviewApplications() {
  document.getElementById("OverviewApplicationGrid").replaceChildren(...ApplicationDefinitions.map(CreateOverviewApplicationCard));
  BindSwitches();
}

function RenderLimits() {
  document.getElementById("LimitsGrid").replaceChildren(...ApplicationDefinitions.map(CreateLimitCard));
}

function BindSwitches() {
  for (const SwitchInput of document.querySelectorAll("input[data-rule-path]")) {
    const RulePath = SwitchInput.getAttribute("data-rule-path");
    SwitchInput.checked = Boolean(GetPathValue(ActiveRules, RulePath));
    if (SwitchInput.disabled) continue;
    SwitchInput.onchange = () => {
      if (RulePath === "Instagram.HideFollowingPosts") ActiveRules.Instagram.FollowingUnlockAvailableAt = 0;
      SetPathValue(ActiveRules, RulePath, SwitchInput.checked);
      ApplyInstagramModeExclusivity(RulePath, SwitchInput.checked);
      SynchronizeDuplicateSwitches(RulePath, SwitchInput.checked);
      UpdateRuleStatistics();
      UpdateApplicationCardStates();
      QueueSave();
      UpdateFollowingCooldown();
      const Label = RulePath.split(".").pop().replace(/([A-Z])/g, " $1").trim();
      ShowControlToast(Label + (SwitchInput.checked ? " enabled" : " disabled"), "Your protected pages update automatically.");
    };
  }
}


function EnsureLogoEyes(Root = document) {
  for (const Image of Root.querySelectorAll('img[src*="ControlSelectedBlack.png"],img[src*="ControlSelectedWhite.png"]')) {
    if (Image.closest(".BootSeraphMark")) continue;
    const Host = Image.parentElement;
    if (!Host || Host.querySelector(":scope > .SiteEyePupil")) continue;
    const HasNonLogoContent = [...Host.childNodes].some((ChildNode) => {
      if (ChildNode === Image || ChildNode instanceof HTMLImageElement) return false;
      if (ChildNode.nodeType === Node.TEXT_NODE) return Boolean(ChildNode.textContent?.trim());
      return true;
    });
    if (HasNonLogoContent) continue;
    Host.classList.add("ControlLogoHost");
    const Pupil = document.createElement("i");
    Pupil.className = "SiteEyePupil";
    const Blink = document.createElement("b");
    Blink.className = "SiteEyeBlink";
    Host.append(Pupil, Blink);
  }
}

function GetRuleMetadata(RulePath) {
  const [ApplicationKey, RuleKey] = RulePath.split(".");
  const Application = ApplicationDefinitions.find((Item) => Item.Key === ApplicationKey);
  const Rule = Application?.Rules.find(([Key]) => Key === RuleKey);
  return Application && Rule ? { Application, RuleKey, RuleName: Rule[1], RuleDescription: Rule[2] } : null;
}

function CloseLockSupportModal() {
  const Modal = document.getElementById("LockSupportModal");
  Modal.hidden = true;
  PendingSupportRulePath = null;
  if (document.getElementById("UnlockReviewModal").hidden) document.body.classList.remove("ModalIsOpen");
}

function OpenLockSupportModal(RulePath) {
  const Metadata = GetRuleMetadata(RulePath);
  PendingSupportRulePath = RulePath;
  const IsPermanent = CoreRulePaths.has(RulePath);
  document.getElementById("LockSupportTitle").textContent = IsPermanent ? "Protection enabled" : "Stay strong.";
  document.getElementById("LockSupportMessage").textContent = IsPermanent
    ? `${Metadata?.RuleName ?? "This protection"} is currently enabled. You can change it from Apps.`
    : `${Metadata?.RuleName ?? "This protection"} is keeping ${Metadata?.Application.Name ?? "this space"} intentional. Give the urge one minute before deciding.`;
  const ReviewButton = document.getElementById("ReviewLockButton");
  ReviewButton.hidden = IsPermanent || !ReviewableRulePaths.has(RulePath);
  document.getElementById("LockSupportModal").hidden = false;
  document.body.classList.add("ModalIsOpen");
  EnsureLogoEyes(document.getElementById("LockSupportModal"));
}

function GetReviewableRules() {
  const Rules = [];
  for (const Application of ApplicationDefinitions) {
    for (const [RuleKey, RuleName, RuleDescription] of Application.Rules) {
      const Path = `${Application.Key}.${RuleKey}`;
      if (!ReviewableRulePaths.has(Path) || GetPathValue(ActiveRules, Path) !== true) continue;
      Rules.push({ Application, Path, RuleName, RuleDescription });
    }
  }
  return Rules;
}

function RenderUnlockRulePicker() {
  const Picker = document.getElementById("UnlockRulePicker");
  const Rules = GetReviewableRules();
  if (!Rules.length) {
    Picker.innerHTML = '<div class="UnlockEmptyState"><strong>Every optional lock is already open.</strong><p>You can restore protections at any time from the application settings.</p></div>';
    return;
  }
  Picker.replaceChildren(...Rules.map(({ Application, Path, RuleName, RuleDescription }) => {
    const Button = document.createElement("button");
    Button.type = "button";
    Button.className = "UnlockRuleOption";
    Button.dataset.rulePath = Path;
    Button.setAttribute("aria-pressed", String(UnlockReviewSelection.has(Path)));
    const Badge = GetApplicationBadge(Application);
    Button.append(Badge);
    Button.insertAdjacentHTML("beforeend", `<span><strong>${RuleName}</strong><small>${Application.Name} \u00B7 ${RuleDescription}</small></span><i></i>`);
    Button.onclick = () => {
      if (UnlockReviewSelection.has(Path)) UnlockReviewSelection.delete(Path); else UnlockReviewSelection.add(Path);
      RenderUnlockRulePicker();
      UpdateUnlockReviewCountdown();
    };
    return Button;
  }));
}

function UpdateUnlockReviewCountdown() {
  const Remaining = Math.max(0, UnlockReviewDeadline - Date.now());
  const Value = document.getElementById("UnlockCountdownValue");
  const ConfirmButton = document.getElementById("ConfirmUnlockReviewButton");
  const Ring = document.getElementById("UnlockCountdownRing");
  if (!Value || !ConfirmButton || !Ring) return;
  Value.textContent = FormatCooldown(Remaining);
  Ring.style.setProperty("--UnlockProgress", String(Math.min(100, ((60000 - Remaining) / 60000) * 100)));
  ConfirmButton.disabled = Remaining > 0 || UnlockReviewSelection.size === 0;
  ConfirmButton.textContent = Remaining > 0 ? `Confirm after ${FormatCooldown(Remaining)}` : UnlockReviewSelection.size ? "Release selected locks" : "Select a lock to release";
  document.getElementById("UnlockCountdownMessage").textContent = Remaining > 0
    ? "Use this minute to remember what you want your time to become."
    : "The reflection is complete. You can still cancel or confirm your choice.";
}

function CloseUnlockReviewModal() {
  window.clearInterval(UnlockReviewInterval);
  UnlockReviewInterval = null;
  UnlockReviewDeadline = 0;
  UnlockReviewSelection.clear();
  document.getElementById("UnlockReviewModal").hidden = true;
  if (document.getElementById("LockSupportModal").hidden) document.body.classList.remove("ModalIsOpen");
}

function OpenUnlockReviewModal(InitialPath = null) {
  CloseLockSupportModal();
  UnlockReviewSelection = new Set(InitialPath && ReviewableRulePaths.has(InitialPath) ? [InitialPath] : []);
  UnlockReviewDeadline = Date.now() + 60000;
  document.getElementById("UnlockReviewModal").hidden = false;
  document.body.classList.add("ModalIsOpen");
  RenderUnlockRulePicker();
  UpdateUnlockReviewCountdown();
  window.clearInterval(UnlockReviewInterval);
  UnlockReviewInterval = window.setInterval(UpdateUnlockReviewCountdown, 250);
}

async function ConfirmUnlockReview() {
  if (Date.now() < UnlockReviewDeadline || UnlockReviewSelection.size === 0) return;
  const ReleasedCount = UnlockReviewSelection.size;
  for (const RulePath of UnlockReviewSelection) {
    if (!ReviewableRulePaths.has(RulePath) || CoreRulePaths.has(RulePath)) continue;
    SetPathValue(ActiveRules, RulePath, false);
    if (RulePath === "Instagram.HideFollowingPosts") ActiveRules.Instagram.FollowingUnlockAvailableAt = 0;
  }
  await WriteStoredRules(ActiveRules);
  CloseUnlockReviewModal();
  RenderApplications();
  RenderLimits();
  await UpdateUsageStatistics();
  ShowControlToast("Choice confirmed", `${ReleasedCount} optional protection${ReleasedCount === 1 ? "" : "s"} released. Core anti-scroll locks remain active.`);
}

function InitializeLockReview() {
  document.getElementById("KeepLockButton").onclick = CloseLockSupportModal;
  document.getElementById("ReviewLockButton").onclick = () => OpenUnlockReviewModal(PendingSupportRulePath);
  document.getElementById("OpenUnlockReviewButton").onclick = () => OpenUnlockReviewModal();
  document.getElementById("CloseUnlockReviewButton").onclick = CloseUnlockReviewModal;
  document.getElementById("CancelUnlockReviewButton").onclick = CloseUnlockReviewModal;
  document.getElementById("ConfirmUnlockReviewButton").onclick = () => void ConfirmUnlockReview();
  document.getElementById("LockSupportModal").addEventListener("click", (Event) => { if (Event.target.id === "LockSupportModal") CloseLockSupportModal(); });
  document.getElementById("UnlockReviewModal").addEventListener("click", (Event) => { if (Event.target.id === "UnlockReviewModal") CloseUnlockReviewModal(); });
  window.addEventListener("keydown", (Event) => { if (Event.key === "Escape") { if (!document.getElementById("UnlockReviewModal").hidden) CloseUnlockReviewModal(); else if (!document.getElementById("LockSupportModal").hidden) CloseLockSupportModal(); } });
}
function FormatCooldown(RemainingMilliseconds) {
  const TotalSeconds = Math.max(0, Math.ceil(RemainingMilliseconds / 1000));
  const Minutes = Math.floor(TotalSeconds / 60);
  const Seconds = TotalSeconds % 60;
  return `${String(Minutes).padStart(2, "0")}:${String(Seconds).padStart(2, "0")}`;
}

function UpdateFollowingCooldown() {
  ActiveRules.Instagram.FollowingUnlockAvailableAt = 0;
  for (const Input of document.querySelectorAll('input[data-rule-path="Instagram.HideFollowingPosts"]')) {
    const Wrapper = Input.closest(".Switch");
    Input.disabled = false;
    Wrapper?.classList.remove("TimedSwitch", "TimedSwitchReady");
  }
}

function ApplyInstagramModeExclusivity(RulePath, IsChecked) {
  if (!IsChecked || !RulePath.startsWith("Instagram.")) {
    return;
  }

  if (RulePath === "Instagram.DMsOnly") {
    ApplyInstagramDirectMessagesOnlyRules(ActiveRules);
    for (const Key of Object.keys(ActiveRules.Instagram)) {
      SynchronizeDuplicateSwitches(`Instagram.${Key}`, ActiveRules.Instagram[Key]);
    }
    return;
  }

  const RuleKey = RulePath.split(".")[1];
  const ExclusiveModes = {};

  for (const DisabledMode of ExclusiveModes[RuleKey] ?? []) {
    ActiveRules.Instagram[DisabledMode] = false;
    SynchronizeDuplicateSwitches(`Instagram.${DisabledMode}`, false);
  }
}

function ApplyInstagramDirectMessagesOnlyRules(Rules) {
  if (!Rules?.Instagram) return;
  Rules.Instagram.DMsOnly = true;
  Rules.Instagram.Enabled = true;
  Rules.Instagram.ForYou = true;
  Rules.Instagram.Reels = true;
  Rules.Instagram.Explore = true;
  Rules.Instagram.AdsAndSuggested = true;
  Rules.Instagram.SuggestedPosts = true;
  Rules.Instagram.Stories = true;
  Rules.Instagram.Live = true;
  Rules.Instagram.Shopping = true;
  Rules.Instagram.SavedPosts = true;
  Rules.Instagram.HomeFeed = true;
  Rules.Instagram.HideFollowingPosts = true;
  Rules.Instagram.Search = false;
  Rules.Instagram.SearchGridGuard = true;
  Rules.Instagram.SearchScrollLock = true;
  Rules.Instagram.FollowingUnlockAvailableAt = 0;
}

function ApplyYouTubeShortsOnlyRules(Rules) {
  if (!Rules?.YouTube) return;
  Rules.YouTube.Enabled = true;
  Rules.YouTube.VideoOnly = false;
  Rules.YouTube.Shorts = true;
  Rules.YouTube.HomeFeed = false;
  Rules.YouTube.Recommendations = false;
  Rules.YouTube.Comments = false;
  Rules.YouTube.Ads = false;
}
function SynchronizeDuplicateSwitches(RulePath, IsChecked) {
  for (const MatchingInput of document.querySelectorAll(`input[data-rule-path="${RulePath}"]`)) {
    MatchingInput.checked = IsChecked;
  }
}

function UpdateRuleStatistics() {
  let ActiveRuleCount = 0;
  let ProtectedApplicationCount = 0;
  for (const Application of ApplicationDefinitions) {
    if (!ActiveRules[Application.Key].Enabled) {
      continue;
    }

    ProtectedApplicationCount += 1;
    ActiveRuleCount += Application.Rules.filter(([RuleKey]) => Boolean(ActiveRules[Application.Key][RuleKey])).length;
  }

  document.getElementById("ActiveRuleCount").textContent = String(ActiveRuleCount);
  document.getElementById("SidebarRuleCount").textContent = String(ActiveRuleCount);
  document.getElementById("ProtectedApplicationCount").textContent = String(ProtectedApplicationCount);
  for (const Metric of document.querySelectorAll("[data-stream-active-rules]")) {
    Metric.textContent = String(ActiveRuleCount);
  }
  for (const Metric of document.querySelectorAll("[data-stream-protected-apps]")) {
    Metric.textContent = String(ProtectedApplicationCount);
  }
}

function QueueSave() {
  const SavedState = document.getElementById("SavedState");
  SavedState.textContent = "Saving...";
  window.clearTimeout(SaveTimer);
  SaveTimer = window.setTimeout(SaveRules, 240);
}

async function SaveRules() {
  ApplyCoreProtection(ActiveRules);
  await WriteStoredRules(ActiveRules);
  document.getElementById("SavedState").textContent = "All changes saved";
  UpdateRuleStatistics();
}

function GetLocalDateKey(DateValue = new Date()) {
  const Year = DateValue.getFullYear();
  const Month = String(DateValue.getMonth() + 1).padStart(2, "0");
  const Day = String(DateValue.getDate()).padStart(2, "0");
  return `${Year}-${Month}-${Day}`;
}

function FormatDuration(Duration) {
  if (!Number.isFinite(Duration) || Duration <= 0) {
    return "0 min";
  }

  const Minutes = Math.max(1, Math.round(Duration / 60000));
  const Hours = Math.floor(Minutes / 60);
  const RemainingMinutes = Minutes % 60;
  return Hours > 0 ? `${Hours}h ${String(RemainingMinutes).padStart(2, "0")}` : `${Minutes} min`;
}

function GetRecentDays(Count) {
  return Array.from({ length: Count }, (_, Index) => {
    const DateValue = new Date();
    DateValue.setHours(12, 0, 0, 0);
    DateValue.setDate(DateValue.getDate() - (Count - 1 - Index));
    return DateValue;
  });
}

function RenderUsageChart(UsageState) {
  const Days = GetRecentDays(7);
  const DayValues = Days.map((DateValue) => {
    const StoredDay = UsageState?.Days?.[GetLocalDateKey(DateValue)] ?? {};
    const Values = Object.fromEntries(ApplicationKeys.map((Key) => [Key, Number(StoredDay[Key]) || 0]));
    return { DateValue, ...Values, Total: ApplicationKeys.reduce((Total, Key) => Total + Values[Key], 0) };
  });
  const Maximum = Math.max(...DayValues.map((DayValue) => DayValue.Total), 1);
  const Chart = document.getElementById("UsageChart");
  if (!Chart) return;

  Chart.replaceChildren(...DayValues.map((DayValue) => {
    const Column = document.createElement("div");
    Column.className = "ChartColumn";
    Column.classList.toggle("IsEmpty", DayValue.Total <= 0);
    Column.title = `${DayValue.DateValue.toLocaleDateString("en-US", { weekday: "long" })}: ${FormatDuration(DayValue.Total)}`;
    const StackHeight = (DayValue.Total / Maximum) * 100;
    Column.innerHTML = `
      <strong class="ChartValue">${FormatDuration(DayValue.Total)}</strong>
      <div class="BarTrack ${DayValue.Total <= 0 ? "IsEmpty" : ""}">
        <span class="BarStack" style="height:${StackHeight}%">
          <i class="BarSegment InstagramBar" style="flex-grow:${DayValue.Instagram}"></i>
          <i class="BarSegment XBar" style="flex-grow:${DayValue.X}"></i>
          <i class="BarSegment SnapchatBar" style="flex-grow:${DayValue.Snapchat}"></i>
          <i class="BarSegment YouTubeBar" style="flex-grow:${DayValue.YouTube}"></i>
          <i class="BarSegment TikTokBar" style="flex-grow:${DayValue.TikTok}"></i>
        </span>
      </div>
      <small>${DayValue.DateValue.toLocaleDateString("en-US", { weekday: "short" })}</small>
    `;
    return Column;
  }));

  const WeekUsageTotal = document.getElementById("WeekUsageTotal");
  if (WeekUsageTotal) WeekUsageTotal.textContent = FormatDuration(DayValues.reduce((Total, DayValue) => Total + DayValue.Total, 0));
}
function UpdateVisualStreamMetrics(UsageState, TodayUsage, TodayTotal) {
  const WeekTotal = GetRecentDays(7).reduce((Total, DateValue) => {
    const StoredDay = UsageState?.Days?.[GetLocalDateKey(DateValue)] ?? {};
    return Total + ApplicationKeys.reduce((DayTotal, ApplicationKey) => DayTotal + (Number(StoredDay[ApplicationKey]) || 0), 0);
  }, 0);
  const MostUsedApplication = ApplicationKeys.reduce((CurrentMostUsed, ApplicationKey) => {
    const Duration = Number(TodayUsage[ApplicationKey]) || 0;
    return Duration > CurrentMostUsed.Duration ? { ApplicationKey, Duration } : CurrentMostUsed;
  }, { ApplicationKey: "None", Duration: 0 });
  const HasMostUsedApplication = MostUsedApplication.ApplicationKey !== "None";

  for (const Metric of document.querySelectorAll("[data-stream-usage]")) {
    const ApplicationKey = Metric.getAttribute("data-stream-usage");
    Metric.textContent = FormatDuration(Number(TodayUsage[ApplicationKey]) || 0);
  }
  for (const Metric of document.querySelectorAll("[data-stream-today-total]")) {
    Metric.textContent = FormatDuration(TodayTotal);
  }
  for (const Metric of document.querySelectorAll("[data-stream-week-total]")) {
    Metric.textContent = FormatDuration(WeekTotal);
  }
  for (const Metric of document.querySelectorAll("[data-stream-most-used-name]")) {
    Metric.textContent = HasMostUsedApplication ? MostUsedApplication.ApplicationKey : "No activity";
  }
  for (const Metric of document.querySelectorAll("[data-stream-most-used-duration]")) {
    Metric.textContent = HasMostUsedApplication ? `${FormatDuration(MostUsedApplication.Duration)} tracked today` : "No foreground time yet";
  }
  for (const Icon of document.querySelectorAll("[data-stream-most-used-icon]")) {
    Icon.hidden = !HasMostUsedApplication;
    if (HasMostUsedApplication) {
      Icon.src = ApplicationIconPaths[MostUsedApplication.ApplicationKey];
      Icon.alt = "";
      Icon.closest(".ActivitySummaryIcon")?.classList.toggle("X", MostUsedApplication.ApplicationKey === "X");
    }
  }
  for (const Placeholder of document.querySelectorAll("[data-stream-most-used-placeholder]")) {
    Placeholder.hidden = HasMostUsedApplication;
  }
}
async function UpdateUsageStatistics() {
  try {
    const UsageState = await ReadUsageStats();
    const TodayUsage = UsageState?.Days?.[GetLocalDateKey()] ?? {};
    LatestTodayUsage = { ...TodayUsage };
    let TodayTotal = 0;
    for (const ApplicationKey of ApplicationKeys) {
      const Duration = Number(TodayUsage[ApplicationKey]) || 0;
      TodayTotal += Duration;
      const LegacyUsage = document.getElementById(`${ApplicationKey}UsageToday`);
      const OverviewUsage = document.getElementById(`${ApplicationKey}OverviewUsage`);
      if (LegacyUsage) LegacyUsage.textContent = FormatDuration(Duration);
      if (OverviewUsage) OverviewUsage.textContent = FormatDuration(Duration);
    }

    document.getElementById("TodayUsageTotal").textContent = FormatDuration(TodayTotal);
    const ProfileTodayUsage = document.getElementById("ProfileTodayUsage");
    const ProfileUsageTotal = document.getElementById("ProfileUsageTotal");
    if (ProfileTodayUsage) ProfileTodayUsage.textContent = FormatDuration(TodayTotal);
    if (ProfileUsageTotal) ProfileUsageTotal.textContent = FormatDuration(TodayTotal);
    RenderProfileUsage(TodayUsage);
    UpdateVisualStreamMetrics(UsageState, TodayUsage, TodayTotal);
    UpdateApplicationCardStates();
    RenderUsageChart(UsageState);
  } catch {
    LatestTodayUsage = {};
    UpdateVisualStreamMetrics(null, {}, 0);
    RenderUsageChart(null);
  }
}

function ShowSection(SectionName) {
  for (const Section of document.querySelectorAll(".PageSection")) {
    Section.classList.toggle("IsVisible", Section.id === SectionName);
  }

  for (const NavigationLink of document.querySelectorAll("[data-section]")) {
    NavigationLink.classList.toggle("IsActive", NavigationLink.getAttribute("data-section") === SectionName);
  }

  const MainNavigation = document.getElementById("MainNavigation");
  const MobileMenuButton = document.getElementById("MobileMenuButton");
  MainNavigation.classList.remove("IsOpen");
  MobileMenuButton.setAttribute("aria-expanded", "false");
  document.documentElement.dataset.currentSection = SectionName;
  history.replaceState(null, "", `#${SectionName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (SectionName === "Activity" || SectionName === "Profile") {
    void UpdateUsageStatistics();
  }
}

function BindPrimaryNavigation() {
  if (document.documentElement.dataset.ControlNavigationBound === "true") return;
  document.documentElement.dataset.ControlNavigationBound = "true";
  document.addEventListener("click", (Event) => {
    const Target = Event.target instanceof Element ? Event.target.closest("[data-section], [data-go-to], [data-hero-page]") : null;
    if (!Target) return;
    const SectionName = Target.getAttribute("data-section") ?? Target.getAttribute("data-go-to");
    if (SectionName) {
      Event.preventDefault();
      ShowSection(SectionName);
      return;
    }
    const HeroPageValue = Target.getAttribute("data-hero-page");
    if (HeroPageValue === null) return;
    Event.preventDefault();
    const HeroPage = Number(HeroPageValue);
    const Hero = document.querySelector(".OverviewHero");
    Hero?.classList.toggle("ShowProtection", HeroPage === 1);
    Hero?.classList.toggle("ShowAttention", HeroPage === 2);
    for (const Button of document.querySelectorAll("[data-hero-page]")) {
      Button.classList.toggle("IsActive", Number(Button.getAttribute("data-hero-page")) === HeroPage);
    }
    const Labels = ["Mobile companion", "Protection overview"];
    const Label = document.getElementById("HeroPageLabel");
    if (Label) Label.textContent = Labels[HeroPage] ?? Labels[0];
  });
}

function ShowControlToast(Title, Message) {
  const Toast = document.getElementById("ControlToast");
  if (!Toast) return;
  document.getElementById("ControlToastTitle").textContent = Title;
  document.getElementById("ControlToastMessage").textContent = Message;
  Toast.hidden = false;
  Toast.classList.add("IsVisible");
  window.clearTimeout(ToastTimer);
  ToastTimer = window.setTimeout(() => { Toast.classList.remove("IsVisible"); window.setTimeout(() => { Toast.hidden = true; }, 250); }, 3200);
}

function FormatSessionTime(Seconds) {
  const Minutes = Math.floor(Seconds / 60);
  const RemainingSeconds = Seconds % 60;
  return `${String(Minutes).padStart(2, "0")}:${String(RemainingSeconds).padStart(2, "0")}`;
}

function LaunchApplication(Application) {
  if (!HasControlExtension()) {
    document.getElementById("InstallationNotice").hidden = false;
    document.body.classList.add("ModalIsOpen");
    ShowControlToast("Extension required", "Your settings are saved. Install Control to apply them inside the app.");
    return;
  }
  ActiveSession = { ApplicationKey: Application.Key, StartedAt: Date.now() };
  localStorage.setItem("ControlActiveSession", JSON.stringify(ActiveSession));
  if (globalThis.chrome?.storage?.local) {
    void chrome.storage.local.set({ ControlLaunchedSession: ActiveSession });
  }
  ShowControlToast(Application.Name + " session started", "The minimal timer will appear inside the social page.");
  void OpenUrl(GetApplicationLaunchUrl(Application));
}


function FormatAttentionHorizon(Days) {
  if (Days >= 365) return `${(Days / 365).toFixed(1)} years`;
  return `${Math.round(Days).toLocaleString("en-US")} days`;
}

function UpdateAnnualCost() {
  const DailyHours = Number(document.getElementById("DailyScrollInput").value);
  const AnnualHours = DailyHours * 365;
  const AnnualDays = AnnualHours / 24;
  document.getElementById("DailyScrollOutput").textContent = DailyHours.toFixed(1);
  document.getElementById("AnnualHoursLost").textContent = AnnualHours.toLocaleString("en-US", { maximumFractionDigits: 0 });
  document.getElementById("AnnualDaysLost").textContent = `${AnnualDays.toFixed(1)} days`;
  document.getElementById("AnnualWorkdaysLost").textContent = (AnnualHours / 8).toFixed(1);
  for (const Years of [1, 5, 10, 20]) {
    const HorizonValue = document.getElementById(`HorizonYear${Years}`);
    if (HorizonValue) HorizonValue.textContent = FormatAttentionHorizon(AnnualDays * Years);
  }
  const GraphDaysLost = document.getElementById("GraphDaysLost");
  const MarkerLine = document.getElementById("AttentionMarkerLine");
  const MarkerDot = document.getElementById("AttentionMarkerDot");
  const MarkerCore = document.querySelector(".GraphMarkerCore");
  const GraphHoursLost = document.getElementById("GraphHoursLost");
  if (GraphDaysLost) GraphDaysLost.textContent = AnnualDays.toFixed(1);
  if (GraphHoursLost) GraphHoursLost.textContent = AnnualHours.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (MarkerLine && MarkerDot) {
    const Ratio = (DailyHours - 0.5) / 7.5;
    const MarkerX = 36 + Ratio * 464;
    const MarkerY = 260 - Math.min(1, AnnualDays / 122) * 238;
    MarkerLine.setAttribute("x1", MarkerX.toFixed(1));
    MarkerLine.setAttribute("x2", MarkerX.toFixed(1));
    MarkerDot.setAttribute("cx", MarkerX.toFixed(1));
    MarkerDot.setAttribute("cy", MarkerY.toFixed(1));
    if (MarkerCore) {
      MarkerCore.setAttribute("cx", MarkerX.toFixed(1));
      MarkerCore.setAttribute("cy", MarkerY.toFixed(1));
    }
  }
}
function InitializeAttentionExperience() {
  const DailyScrollInput = document.getElementById("DailyScrollInput");
  if (DailyScrollInput) { DailyScrollInput.oninput = UpdateAnnualCost; UpdateAnnualCost(); }
  const Hero = document.querySelector(".OverviewHero");
  const HeroButtons = [...document.querySelectorAll("[data-hero-page]")];
  const HeroLabel = document.getElementById("HeroPageLabel");
  let HeroPage = 0;
  let HeroRotationTimer = null;
  const ShowHeroPage = (Page) => {
    HeroPage = Page;
    Hero.classList.toggle("ShowProtection", HeroPage === 1);
    Hero.classList.toggle("ShowAttention", HeroPage === 2);
    HeroButtons.forEach((Button, ButtonIndex) => Button.classList.toggle("IsActive", ButtonIndex === HeroPage));
    const Labels = ["Mobile companion", "Protection overview"];
    HeroLabel.textContent = Labels[HeroPage] ?? Labels[0];
  };
  const StartHeroRotation = () => {
    window.clearInterval(HeroRotationTimer);
    HeroRotationTimer = window.setInterval(() => ShowHeroPage((HeroPage + 1) % HeroButtons.length), 7200);
  };
  HeroButtons.forEach((Button) => Button.onclick = () => { ShowHeroPage(Number(Button.dataset.heroPage)); StartHeroRotation(); });
  Hero.addEventListener("mouseenter", () => window.clearInterval(HeroRotationTimer));
  Hero.addEventListener("mouseleave", StartHeroRotation);
  StartHeroRotation();

  const Scenes = [...document.querySelectorAll(".ManifestoScene")];
  if (Scenes.length) {
    let Index = 0;
    ManifestoTimer = window.setInterval(() => { Scenes[Index].classList.remove("IsActive"); Index = (Index + 1) % Scenes.length; Scenes[Index].classList.add("IsActive"); }, 4200);
  }  for (const StoreButton of document.querySelectorAll("[data-store]")) StoreButton.onclick = () => ShowControlToast(StoreButton.dataset.store + " coming soon", "The real store link will replace this button after mobile review.");
}

function UpdatePostModeStatus() {
  const Remaining = Math.max(0, ActiveRules.PostModeUntil - Date.now());
  const Button = document.getElementById("PostModeButton");
  const Status = document.getElementById("PostModeStatus");
  if (Remaining <= 0) {
    if (ActiveRules.PostModeUntil) { ActiveRules.PostModeUntil = 0; QueueSave(); ShowControlToast("Post Mode ended", "All protection rules are active again."); }
    Button.textContent = "Start 10 min"; Status.textContent = "Ready for a focused 10-minute session"; return;
  }
  const Seconds = Math.ceil(Remaining / 1000);
  Status.textContent = `Filters resume in ${FormatSessionTime(Seconds)}`;
  Button.textContent = "End now";
}

function InitializeFocusFeatures() {
  const Select = document.getElementById("AutoLaunchSelect");
  Select.value = ActiveRules.AutoLaunchApp;
  Select.onchange = () => { ActiveRules.AutoLaunchApp = Select.value; QueueSave(); ShowControlToast("Automatic launch updated", Select.value === "None" ? "The launcher remains your starting point." : `${Select.value} will open from the extension shortcut.`); };
  document.getElementById("PostModeButton").onclick = () => { ActiveRules.PostModeUntil = ActiveRules.PostModeUntil > Date.now() ? 0 : Date.now() + 10 * 60 * 1000; QueueSave(); UpdatePostModeStatus(); ShowControlToast(ActiveRules.PostModeUntil ? "Post Mode started" : "Post Mode ended", ActiveRules.PostModeUntil ? "Filters will restore automatically in ten minutes." : "All protection rules are active."); };
  UpdatePostModeStatus(); UpdateFollowingCooldown(); window.setInterval(() => { UpdatePostModeStatus(); UpdateFollowingCooldown(); }, 1000);
}

function GetSensitiveProtectionConfig() {
  if (!ActiveRules.SensitiveProtectionConfig || typeof ActiveRules.SensitiveProtectionConfig !== "object") {
    ActiveRules.SensitiveProtectionConfig = structuredClone(DefaultRules.SensitiveProtectionConfig);
  }
  for (const ListKey of ["BlockedDomains", "BlockedKeywords", "BlockedAccounts"]) {
    if (!Array.isArray(ActiveRules.SensitiveProtectionConfig[ListKey])) ActiveRules.SensitiveProtectionConfig[ListKey] = [];
  }
  return ActiveRules.SensitiveProtectionConfig;
}

function NormalizeSensitiveEntry(ListKey, Value) {
  let Entry = String(Value ?? "").trim().toLowerCase();
  if (ListKey === "BlockedDomains") Entry = Entry.replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").replace(/:\d+$/, "");
  if (ListKey === "BlockedAccounts") Entry = Entry.replace(/^@/, "").replace(/[^a-z0-9._-]/g, "");
  if (ListKey === "BlockedKeywords") Entry = Entry.replace(/\s+/g, " ");
  if (ListKey === "BlockedDomains" && (!Entry.includes(".") || Entry.includes(" "))) return "";
  if (ListKey === "BlockedKeywords" && Entry.length < 3) return "";
  return Entry.slice(0, 120);
}

function RenderSensitiveProtectionSettings() {
  const Config = GetSensitiveProtectionConfig();
  for (const Input of document.querySelectorAll("[data-sensitive-option]")) {
    Input.checked = Config[Input.getAttribute("data-sensitive-option")] !== false;
  }
  let Total = 0;
  for (const Panel of document.querySelectorAll("[data-sensitive-list]")) {
    const ListKey = Panel.getAttribute("data-sensitive-list");
    const Values = Config[ListKey];
    Total += Values.length;
    const Tokens = Panel.querySelector(".SensitiveTokens");
    Tokens.replaceChildren(...Values.map((Value) => {
      const Token = document.createElement("span");
      const Label = document.createElement("b");
      const RemoveButton = document.createElement("button");
      Label.textContent = ListKey === "BlockedAccounts" ? `@${Value}` : Value;
      RemoveButton.type = "button";
      RemoveButton.setAttribute("aria-label", `Remove ${Value}`);
      RemoveButton.textContent = "×";
      RemoveButton.onclick = () => {
        Config[ListKey] = Config[ListKey].filter((Item) => Item !== Value);
        RenderSensitiveProtectionSettings();
        QueueSave();
      };
      Token.append(Label, RemoveButton);
      return Token;
    }));
    if (!Values.length) Tokens.innerHTML = "<small>No custom entry</small>";
  }
  const Count = document.getElementById("SensitiveProtectionCount");
  if (Count) Count.textContent = `${Total} custom rule${Total === 1 ? "" : "s"}`;
}

async function RenderDetectedSensitiveAccountCount() {
  const Count = document.getElementById("DetectedSensitiveAccountCount");
  const ClearButton = document.getElementById("ClearDetectedSensitiveAccounts");
  if (!Count || !ClearButton) return;
  if (!globalThis.chrome?.storage?.local) {
    Count.textContent = "Extension required";
    ClearButton.disabled = true;
    return;
  }
  const Stored = await chrome.storage.local.get("DetectedSensitiveAccounts");
  const Total = Array.isArray(Stored.DetectedSensitiveAccounts) ? Stored.DetectedSensitiveAccounts.length : 0;
  Count.textContent = `${Total} learned account${Total === 1 ? "" : "s"}`;
  ClearButton.disabled = Total === 0;
}

function InitializeSensitiveProtectionSettings() {
  for (const Input of document.querySelectorAll("[data-sensitive-option]")) {
    Input.onchange = () => {
      const Option = Input.getAttribute("data-sensitive-option");
      GetSensitiveProtectionConfig()[Option] = Input.checked;
      QueueSave();
      ShowControlToast("Protection updated", "The extension will apply this change immediately.");
    };
  }
  for (const Panel of document.querySelectorAll("[data-sensitive-list]")) {
    const Form = Panel.querySelector("form");
    const Input = Form.querySelector("input");
    Form.onsubmit = (Event) => {
      Event.preventDefault();
      const ListKey = Panel.getAttribute("data-sensitive-list");
      const Entry = NormalizeSensitiveEntry(ListKey, Input.value);
      if (!Entry) {
        ShowControlToast("Invalid entry", ListKey === "BlockedDomains" ? "Enter a complete domain such as example.com." : "Enter a valid value.");
        return;
      }
      const Config = GetSensitiveProtectionConfig();
      if (!Config[ListKey].includes(Entry)) Config[ListKey].push(Entry);
      ActiveRules.SensitiveContentProtection = true;
      SynchronizeDuplicateSwitches("SensitiveContentProtection", true);
      Input.value = "";
      RenderSensitiveProtectionSettings();
      QueueSave();
      ShowControlToast("Blacklist updated", "The new local rule is active.");
    };
  }
  const ClearDetectedButton = document.getElementById("ClearDetectedSensitiveAccounts");
  if (ClearDetectedButton) ClearDetectedButton.onclick = async () => {
    if (!globalThis.chrome?.storage?.local) return;
    await chrome.storage.local.remove("DetectedSensitiveAccounts");
    await RenderDetectedSensitiveAccountCount();
    ShowControlToast("Detection memory cleared", "Previously learned accounts can appear again until Control detects a strong signal.");
  };
  RenderSensitiveProtectionSettings();
  void RenderDetectedSensitiveAccountCount();
}

async function OpenUrl(Url) {
  if (globalThis.chrome?.tabs?.create) {
    await chrome.tabs.create({ url: Url });
    return;
  }

  if (HasExtensionBridge()) {
    try {
      const Response = await SendBridgeRequest("OpenProtectedPage", { Url });
      if (Response.Success === true) return;
    } catch {
      // The installation dialog below gives the user a recoverable action.
    }
  }

  ShowControlToast("Unable to open application", "Reload the Control extension, then try again.");
  document.getElementById("InstallationNotice").hidden = false;
  document.body.classList.add("ModalIsOpen");
}

function CloseInstallationNotice() {
  document.getElementById("InstallationNotice").hidden = true;
  document.body.classList.remove("ModalIsOpen");
}

function UpdateProtectionStatus() {
  const InstalledVersion = HasExtensionStorage
    ? chrome.runtime?.getManifest?.().version
    : document.documentElement.getAttribute("data-control-extension-version");

  if (InstalledVersion === RequiredExtensionVersion) {
    return;
  }

  document.body.classList.add("PreviewMode");
  document.getElementById("ProtectionStatusTitle").textContent = InstalledVersion
    ? `Reload extension \u00B7 ${RequiredExtensionVersion}`
    : "Preview \u00B7 extension required";
}

async function ResetRules() {
  const ProtectedApplications = [...ActiveRules.ProtectedApplications];
  ActiveRules = structuredClone(DefaultRules);
  ActiveRules.ProtectedApplications = ProtectedApplications;
  ApplyCoreProtection(ActiveRules);
  await WriteStoredRules(ActiveRules);
  RenderApplications();
  RenderLimits();
  RenderSensitiveProtectionSettings();
  document.getElementById("SavedState").textContent = "Defaults restored";
}

async function ResetUsageStats() {
  if (globalThis.chrome?.runtime?.sendMessage && HasExtensionStorage) {
    await chrome.runtime.sendMessage({ Type: "ResetUsageStats" });
  } else if (HasExtensionBridge()) {
    await SendBridgeRequest("ResetUsageStats");
  }
  await UpdateUsageStatistics();
}

const EditorialQuotes = [
  ["Saint Augustine", "Our heart is restless until it rests in you.", "Augustine"],
  ["Marcus Aurelius", "You have power over your mind - not outside events.", "Aurelius"],
  ["Seneca", "Life is long if you know how to use it.", "Seneca"],
  ["Epictetus", "No person is free who is not master of himself.", "Epictetus"],
  ["Blaise Pascal", "The heart has its reasons which reason does not know.", "Pascal"],
  ["Simone Weil", "Attention is the rarest and purest form of generosity.", "Weil"],
  ["Victor Hugo", "Nothing is more powerful than an idea whose time has come.", "Hugo"],
  ["Friedrich Nietzsche", "He who has a why to live can bear almost any how.", "Nietzsche"],
  ["Virginia Woolf", "Arrange whatever pieces come your way.", "Woolf"],
  ["Henry David Thoreau", "The price of anything is the amount of life you exchange for it.", "Thoreau"],
  ["Ralph Waldo Emerson", "Nothing great was ever achieved without enthusiasm.", "Emerson"],
  ["Leo Tolstoy", "The two most powerful warriors are patience and time.", "Tolstoy"],
  ["Rene Descartes", "It is not enough to have a good mind; the main thing is to use it well.", "Descartes"],
  ["Soren Kierkegaard", "Life can only be understood backwards; it must be lived forwards.", "Kierkegaard"],
  ["Aristotle", "We are what we repeatedly do.", "Aristotle"],
  ["Plotinus", "Withdraw into yourself and look.", "Plotinus"],
];

let InsightAnimation = null;

function GetLocalContext() {
  const LocaleCode = navigator.language || "en-US";
  const Locale = new Intl.Locale(LocaleCode);
  const RegionCode = Locale.region;
  const RegionNames = new Intl.DisplayNames([LocaleCode], { type: "region" });
  return { LocaleCode, RegionName: RegionCode ? RegionNames.of(RegionCode) : "Your region", TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

function CreateQuoteCard(Person, Quote, Tone) {
  const Card = document.createElement("article");
  Card.className = "InsightCard Quote " + Tone;
  Card.innerHTML = '<div class="InsightCardTop"><span>WORDS TO KEEP</span><i>&ldquo;</i></div><blockquote>' + Quote + '</blockquote><footer><strong>' + Person + '</strong><small>Philosophy &amp; literature</small></footer>';
  return Card;
}
function CreateContextCard(ClassName, Label, Title, Description, Footer, Subfooter, Metric = "") {
  const Card = document.createElement("article");
  Card.className = `InsightCard Context ${ClassName}`;
  Card.innerHTML = `<div class="InsightCardTop"><span>${Label}</span><i>&#9673;</i></div><h3>${Title}</h3><p>${Description}</p><footer><strong>${Footer}</strong><small>${Subfooter}</small></footer>`;
  if (Metric) Card.querySelector("footer strong").setAttribute(Metric, "");
  return Card;
}

function StartInsightAnimation() {
  const Track = document.getElementById("InsightTrack");
  const Group = Track?.querySelector(".InsightGroup");
  if (!Track || !Group) return;
  InsightAnimation?.cancel();
  const Distance = Group.getBoundingClientRect().width + 14;
  InsightAnimation = Track.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(-${Distance}px,0,0)` }], { duration: Math.max(76000, Distance * 24), iterations: Infinity, easing: "linear" });
  const Viewport = Track.closest(".InsightViewport");
  Viewport.onmouseenter = () => InsightAnimation?.pause();
  Viewport.onmouseleave = () => InsightAnimation?.play();
}

function InitializeVisualStream() {
  const Track = document.getElementById("InsightTrack");
  if (!Track) return;
  const Context = GetLocalContext();
  const Now = new Date();
  const DateText = new Intl.DateTimeFormat(Context.LocaleCode, { weekday: "long", month: "long", day: "numeric" }).format(Now);
  const TimeText = new Intl.DateTimeFormat(Context.LocaleCode, { hour: "2-digit", minute: "2-digit" }).format(Now);
  const BuildGroup = () => {
    const Group = document.createElement("div");
    Group.className = "InsightGroup";
    Group.append(
      CreateContextCard("LocalTime", "LOCAL CONTEXT", `${TimeText} \u00B7 ${Context.RegionName}`, DateText, Context.TimeZone, "No precise location requested"),
      CreateContextCard("Usage", "TODAY'S ATTENTION", "Your active social time", "Measured only while a social tab is focused.", "0 min", "Stored on this device", "data-stream-today-total"),
      CreateContextCard("Protection", "PROTECTION", "Intentional surfaces remain", "Messages, chosen profiles and standard videos stay available.", "0 active filters", "Applied locally", "data-stream-active-rules"),
      ...EditorialQuotes.map(([Person, Quote, Tone]) => CreateQuoteCard(Person, Quote, Tone)),
    );
    return Group;
  };
  Track.replaceChildren(BuildGroup(), BuildGroup());
  document.getElementById("InsightRegionLabel").textContent = `${Context.RegionName} \u00B7 ${Context.TimeZone} \u00B7 private context`;
  requestAnimationFrame(StartInsightAnimation);
}

function RunBootSequence() {
  const BootScreen = document.getElementById("BootScreen");
  const BootSeraph = BootScreen?.querySelector(".BootSeraph");
  const BootStatusText = document.getElementById("BootStatusText");
  const PrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!(BootScreen instanceof HTMLElement) || !(BootSeraph instanceof HTMLElement)) {
    return Promise.resolve();
  }

  return new Promise((Resolve) => {
    const BootMessages = ["Preparing your space", "Keeping the noise away", "Ready when you are"];
    let BootMessageIndex = 0;

    if (PrefersReducedMotion) {
      BootSeraph.classList.add("IsCentered");
      window.setTimeout(Resolve, 120);
      return;
    }

    const MessageTimer = window.setInterval(() => {
      BootMessageIndex = Math.min(BootMessageIndex + 1, BootMessages.length - 1);
      if (BootStatusText) BootStatusText.textContent = BootMessages[BootMessageIndex];
    }, 840);
    window.setTimeout(() => {
      window.clearInterval(MessageTimer);
      if (BootStatusText) BootStatusText.textContent = BootMessages.at(-1);
      BootSeraph.classList.add("IsCentered");
      window.setTimeout(Resolve, 790);
    }, 2360);
  });
}

function RevealInterface() {
  const BootScreen = document.getElementById("BootScreen");
  document.body.classList.remove("Booting");
  document.body.classList.add("AppReady");
  BootScreen?.classList.add("IsLeaving");
  window.setTimeout(() => BootScreen?.remove(), 700);
}

const ProfileStorageKey = "ControlDesktopProfile";
const AccountStorageKey = "ControlDesktopAccounts.v1";
const SessionStorageKey = "ControlDesktopSession.v1";
const GuestStorageKey = "ControlDesktopGuestPreview";

function ReadJsonStorage(Key, Fallback) {
  try {
    return JSON.parse(localStorage.getItem(Key) || JSON.stringify(Fallback));
  } catch {
    return Fallback;
  }
}

function WriteJsonStorage(Key, Value) {
  localStorage.setItem(Key, JSON.stringify(Value));
}

function NormalizeEmail(Email) {
  return String(Email || "").trim().toLowerCase();
}

function ReadAccounts() {
  return ReadJsonStorage(AccountStorageKey, {});
}

function PasswordMeetsPolicy(Password) {
  return Password.length >= 12 && /[A-Z]/.test(Password) && /[a-z]/.test(Password) && /[0-9]/.test(Password);
}

function CreateRandomToken(ByteLength = 16) {
  const Bytes = new Uint8Array(ByteLength);
  crypto.getRandomValues(Bytes);
  return [...Bytes].map((Byte) => Byte.toString(16).padStart(2, "0")).join("");
}

async function HashSecret(Secret, Salt) {
  if (!crypto.subtle) throw new Error("Secure local authentication is unavailable in this browser.");
  const Encoded = new TextEncoder().encode(`${Salt}:${Secret}`);
  const Digest = await crypto.subtle.digest("SHA-256", Encoded);
  return [...new Uint8Array(Digest)].map((Byte) => Byte.toString(16).padStart(2, "0")).join("");
}

function AccountToProfile(Account, SignedInAt = Date.now()) {
  return {
    AccountId: Account.Id,
    Name: Account.Name,
    Email: Account.Email,
    PhotoDataUrl: Account.PhotoDataUrl || "",
    TwoFactorEnabled: Boolean(Account.TwoFactorEnabled),
    SignedInAt,
  };
}

async function CreateLocalAccount({ Name, Email, Password, PhotoDataUrl = "", TwoFactorCode = "" }) {
  const NormalizedEmail = NormalizeEmail(Email);
  if (!Name.trim()) return { Success: false, Message: "Enter your name." };
  if (!NormalizedEmail.includes("@")) return { Success: false, Message: "Enter a valid email." };
  if (!PasswordMeetsPolicy(Password)) return { Success: false, Message: "Use at least 12 characters with upper-case, lower-case and a number." };
  const Accounts = ReadAccounts();
  if (Accounts[NormalizedEmail]) return { Success: false, Message: "This account already exists. Sign in instead." };

  const PasswordSalt = CreateRandomToken();
  const TwoFactorEnabled = TwoFactorCode.trim().length >= 4;
  const TwoFactorSalt = TwoFactorEnabled ? CreateRandomToken() : "";
  const Account = {
    Id: CreateRandomToken(10),
    Name: Name.trim(),
    Email: NormalizedEmail,
    PhotoDataUrl,
    PasswordSalt,
    PasswordHash: await HashSecret(Password, PasswordSalt),
    TwoFactorEnabled,
    TwoFactorSalt,
    TwoFactorHash: TwoFactorEnabled ? await HashSecret(TwoFactorCode.trim(), TwoFactorSalt) : "",
    CreatedAt: Date.now(),
    LastSignedInAt: Date.now(),
  };
  Accounts[NormalizedEmail] = Account;
  WriteJsonStorage(AccountStorageKey, Accounts);
  SignInAccount(Account);
  return { Success: true, Account };
}

async function VerifyLocalAccount(Email, Password, TwoFactorCode = "") {
  const NormalizedEmail = NormalizeEmail(Email);
  const Accounts = ReadAccounts();
  const Account = Accounts[NormalizedEmail];
  if (!Account) return { Success: false, Message: "Account not found. Create an account first." };
  const PasswordHash = await HashSecret(Password, Account.PasswordSalt);
  if (PasswordHash !== Account.PasswordHash) return { Success: false, Message: "Wrong password." };
  if (Account.TwoFactorEnabled) {
    const CodeHash = await HashSecret(TwoFactorCode.trim(), Account.TwoFactorSalt);
    if (CodeHash !== Account.TwoFactorHash) return { Success: false, Message: "Enter the correct two-step code." };
  }
  Account.LastSignedInAt = Date.now();
  Accounts[NormalizedEmail] = Account;
  WriteJsonStorage(AccountStorageKey, Accounts);
  SignInAccount(Account);
  return { Success: true, Account };
}

function SignInAccount(Account) {
  const Session = { Email: Account.Email, SignedInAt: Date.now(), SessionId: CreateRandomToken(12) };
  WriteJsonStorage(SessionStorageKey, Session);
  localStorage.removeItem(GuestStorageKey);
  WriteJsonStorage(ProfileStorageKey, AccountToProfile(Account, Session.SignedInAt));
}

function SignOutAccount() {
  localStorage.removeItem(SessionStorageKey);
  localStorage.removeItem(ProfileStorageKey);
}

function DeleteCurrentAccount() {
  const Profile = ReadLocalProfile();
  if (Profile?.Email) {
    const Accounts = ReadAccounts();
    delete Accounts[NormalizeEmail(Profile.Email)];
    WriteJsonStorage(AccountStorageKey, Accounts);
  }
  SignOutAccount();
}

function ReadLocalProfile() {
  const Session = ReadJsonStorage(SessionStorageKey, null);
  const Accounts = ReadAccounts();
  const Account = Session?.Email ? Accounts[NormalizeEmail(Session.Email)] : null;
  if (Account) {
    const Profile = AccountToProfile(Account, Session.SignedInAt);
    WriteJsonStorage(ProfileStorageKey, Profile);
    return Profile;
  }

  const LegacyProfile = ReadJsonStorage(ProfileStorageKey, null);
  if (LegacyProfile?.Name && LegacyProfile?.Email) return LegacyProfile;
  return null;
}

function HasServiceAccess() {
  return Boolean(ReadLocalProfile()?.Name);
}

function PaintProfileAvatar(Element, Profile) {
  if (!(Element instanceof HTMLElement)) return;
  Element.style.removeProperty("background-image");
  Element.textContent = (Profile?.Name ?? "Control").slice(0, 1).toUpperCase();
  if (Profile?.PhotoDataUrl) {
    Element.textContent = "";
    Element.style.backgroundImage = `url("${Profile.PhotoDataUrl}")`;
  }
}

function UpdateServiceAccessState() {
  const HasProfile = HasServiceAccess();
  document.body.classList.add("ServicesUnlocked");
  document.body.classList.remove("ServicesLocked");
  const ProtectionStatusTitle = document.getElementById("ProtectionStatusTitle");
  if (ProtectionStatusTitle && !document.body.classList.contains("PreviewMode")) {
    ProtectionStatusTitle.textContent = "Protection active";
  }
  const AdminProfileState = document.getElementById("AdminProfileState");
  const AdminAccessMode = document.getElementById("AdminAccessMode");
  if (AdminProfileState) AdminProfileState.textContent = "Available";
  if (AdminAccessMode) AdminAccessMode.textContent = HasProfile ? "Account active" : "Local access";
}

function SetProfileNotice(Message) {
  const Notice = document.getElementById("ProfileNotice");
  if (Notice) Notice.textContent = Message;
}

function RenderLocalProfile() {
  const Profile = ReadLocalProfile();
  const GuestView = document.getElementById("ProfileGuestView");
  const MemberView = document.getElementById("ProfileMemberView");
  if (!GuestView || !MemberView) return;
  GuestView.hidden = Boolean(Profile);
  MemberView.hidden = !Profile;
  if (Profile) {
    document.getElementById("ProfileDisplayName").textContent = Profile.Name;
    document.getElementById("ProfileDisplayEmail").textContent = Profile.Email;
    PaintProfileAvatar(document.getElementById("ProfileAvatar"), Profile);
    document.getElementById("ProfileTwoFactorState").textContent = Profile.TwoFactorEnabled ? "Enabled" : "Ready";
  }
  UpdateServiceAccessState();
}

function RenderProfileUsage(TodayUsage = {}) {
  const Container = document.getElementById("ProfileUsageRows");
  if (!Container) return;
  const Maximum = Math.max(1, ...ApplicationKeys.map((Key) => Number(TodayUsage[Key]) || 0));
  Container.replaceChildren(...ApplicationKeys.map((ApplicationKey) => {
    const Duration = Number(TodayUsage[ApplicationKey]) || 0;
    const Application = ApplicationDefinitions.find((Item) => Item.Key === ApplicationKey);
    const Row = document.createElement("div");
    Row.className = "ProfileUsageRow";
    const Identity = document.createElement("span");
    Identity.className = "ProfileUsageIdentity";
    if (Application) Identity.append(GetApplicationBadge(Application));
    const Name = document.createElement("strong");
    Name.textContent = ApplicationKey;
    Identity.append(Name);
    const Track = document.createElement("span");
    Track.className = "ProfileUsageTrack";
    const Fill = document.createElement("i");
    Fill.style.width = `${Duration > 0 ? Math.max(4, (Duration / Maximum) * 100) : 0}%`;
    Track.append(Fill);
    const Value = document.createElement("b");
    Value.textContent = FormatDuration(Duration);
    Row.append(Identity, Track, Value);
    return Row;
  }));
}
function BindProfileActions() {
  RenderLocalProfile();
  let PendingProfilePhoto = "";
  for (const Button of document.querySelectorAll("[data-profile-auth-mode]")) {
    Button.addEventListener("click", () => {
      const Mode = Button.getAttribute("data-profile-auth-mode");
      document.querySelectorAll("[data-profile-auth-mode]").forEach((Item) => Item.classList.toggle("IsActive", Item === Button));
      document.querySelectorAll("[data-profile-auth-panel]").forEach((Panel) => { Panel.hidden = Panel.getAttribute("data-profile-auth-panel") !== Mode; });
      SetProfileNotice("");
    });
  }
  const ProfilePhotoInput = document.getElementById("ProfilePhotoInput");
  ProfilePhotoInput?.addEventListener("change", () => {
    const File = ProfilePhotoInput.files?.[0];
    if (!File) return;
    const Reader = new FileReader();
    Reader.onload = () => {
      PendingProfilePhoto = typeof Reader.result === "string" ? Reader.result : "";
      PaintProfileAvatar(document.getElementById("ProfileAvatarPreview"), { Name: document.getElementById("ProfileNameInput")?.value || "Control", PhotoDataUrl: PendingProfilePhoto });
    };
    Reader.readAsDataURL(File);
  });
  document.getElementById("ProfileSigninForm")?.addEventListener("submit", async (Event) => {
    Event.preventDefault();
    const Email = document.getElementById("ProfileSigninEmailInput").value;
    const Password = document.getElementById("ProfileSigninPasswordInput").value;
    const TwoFactorCode = document.getElementById("ProfileSigninTwoFactorInput")?.value ?? "";
    try {
      const Result = await VerifyLocalAccount(Email, Password, TwoFactorCode);
      if (!Result.Success) {
        SetProfileNotice(Result.Message);
        return;
      }
      document.getElementById("ProfileSigninPasswordInput").value = "";
      if (document.getElementById("ProfileSigninTwoFactorInput")) document.getElementById("ProfileSigninTwoFactorInput").value = "";
      SetProfileNotice("Signed in. Your local profile is active on this device.");
      RenderLocalProfile();
      RenderApplications();
      RenderLimits();
      ShowControlToast("Signed in", "Your local profile is active.");
    } catch (Error) {
      SetProfileNotice(Error.message || "Sign in failed.");
    }
  });
  document.getElementById("ProfileForm")?.addEventListener("submit", async (Event) => {
    Event.preventDefault();
    const Name = document.getElementById("ProfileNameInput").value.trim();
    const Email = document.getElementById("ProfileEmailInput").value.trim();
    const Password = document.getElementById("ProfilePasswordInput").value;
    const TwoFactorCode = document.getElementById("ProfileTwoFactorInput")?.value.trim() ?? "";
    try {
      const Result = await CreateLocalAccount({ Name, Email, Password, PhotoDataUrl: PendingProfilePhoto, TwoFactorCode });
      if (!Result.Success) {
        SetProfileNotice(Result.Message);
        return;
      }
      document.getElementById("ProfilePasswordInput").value = "";
      if (document.getElementById("ProfileTwoFactorInput")) document.getElementById("ProfileTwoFactorInput").value = "";
      SetProfileNotice("Account created. Your settings remain available with or without sign-in.");
      RenderLocalProfile();
      RenderApplications();
      RenderLimits();
      ShowControlToast("Account created", "Your local profile is ready.");
    } catch (Error) {
      SetProfileNotice(Error.message || "Account creation failed.");
    }
  });
  document.getElementById("SignOutButton")?.addEventListener("click", () => {
    SignOutAccount();
    SetProfileNotice("Signed out. Protection and settings remain available locally.");
    RenderLocalProfile();
    RenderApplications();
    RenderLimits();
  });
  document.getElementById("RemoveProfileButton")?.addEventListener("click", () => {
    DeleteCurrentAccount();
    SetProfileNotice("Local account deleted. Protection and settings remain available locally.");
    RenderLocalProfile();
    RenderApplications();
    RenderLimits();
  });
  for (const Button of document.querySelectorAll("[data-profile-provider]")) {
    Button.addEventListener("click", () => {
      SetProfileNotice(`${Button.dataset.profileProvider} sign-in is ready in the interface, but needs secure OAuth before real login.`);
      ShowControlToast(`${Button.dataset.profileProvider} sign-in`, "Create a local account now, then connect OAuth when the backend is ready.");
    });
  }
  document.getElementById("ShareControlButton")?.addEventListener("click", async () => {
    const ShareData = { title: "Control", text: "Control - intentional social media, without endless feeds.", url: location.origin };
    if (navigator.share) await navigator.share(ShareData);
    else {
      await navigator.clipboard?.writeText(location.origin);
      SetProfileNotice("App link copied.");
    }
  });
  document.getElementById("FamilyFeaturesButton")?.addEventListener("click", () => SetProfileNotice("Family features are prepared for the secure account phase."));
  document.getElementById("OpenSupportPanelButton")?.addEventListener("click", () => {
    SetProfileNotice("Support desk ready. Email support opens from the Help & support action.");
    ShowControlToast("Support panel", "The full ticket system will connect when the account backend is live.");
  });
  document.getElementById("OpenAdminPanelButton")?.addEventListener("click", () => {
    SetProfileNotice("Admin panel opened locally. You can manage protected services here without an account.");
    ShowControlToast("Admin panel", "Local controls are available.");
  });
  document.getElementById("ReportIssueButton")?.addEventListener("click", () => {
    SetProfileNotice("Issue noted locally. Use Help & support to send it when support is connected.");
    ShowControlToast("Feedback captured", "The support backend will turn this into a real ticket.");
  });
  document.getElementById("OpenLinkForm")?.addEventListener("submit", (Event) => {
    Event.preventDefault();
    const Input = document.getElementById("OpenLinkInput");
    let Url;
    try { Url = new URL(Input.value).href; } catch { SetProfileNotice("Enter a complete https:// link."); return; }
    if (!Url.startsWith("https://")) { SetProfileNotice("Only secure https:// links are accepted."); return; }
    void OpenUrl(Url);
  });
}


const OnboardingStorageKey = "ControlDesktopOnboarding.v1";
let OnboardingTransitionActive = false;
async function SetOnboardingStep(StepIndex) {
  if (OnboardingTransitionActive) return;
  const CurrentStep = document.querySelector(".OnboardingStep.IsActive");
  const NextStep = document.querySelector(`[data-onboarding-step="${StepIndex}"]`);
  if (!NextStep || CurrentStep === NextStep) return;
  OnboardingTransitionActive = true;
  if (CurrentStep) {
    await CurrentStep.animate([
      { filter: "blur(0)", opacity: 1, transform: "translateY(0) scale(1)" },
      { filter: "blur(5px)", opacity: 0, transform: "translateY(-14px) scale(.985)" },
    ], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished.catch(() => undefined);
    CurrentStep.classList.remove("IsActive");
  }
  document.querySelectorAll(".OnboardingProgress i").forEach((Dot, Index) => Dot.classList.toggle("IsActive", Index <= StepIndex));
  document.getElementById("OnboardingStepLabel").textContent = `${String(StepIndex + 1).padStart(2, "0")} / 04`;
  NextStep.classList.add("IsActive");
  await NextStep.animate([
    { filter: "blur(7px)", opacity: 0, transform: "translateY(18px) scale(.985)" },
    { filter: "blur(0)", opacity: 1, transform: "translateY(0) scale(1)" },
  ], { duration: 520, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }).finished.catch(() => undefined);
  OnboardingTransitionActive = false;
}
async function InitializeOnboarding() {
  const Onboarding = document.getElementById("Onboarding");
  if (localStorage.getItem(OnboardingStorageKey)) return false;
  const Draft = { Intent: "Focus", Name: "", Email: "", Password: "", TwoFactorCode: "", SelectedApps: new Set(["Instagram"]) };
  Onboarding.hidden = false; document.body.classList.add("OnboardingActive");
  const Choices = document.getElementById("OnboardingAppChoices");
  Choices.replaceChildren(...ApplicationDefinitions.map((Application) => { const Button = document.createElement("button"); Button.type = "button"; Button.dataset.application = Application.Key; Button.className = Draft.SelectedApps.has(Application.Key) ? "IsSelected" : ""; Button.innerHTML = `<span class="OnboardingAppIcon ${Application.Key}"><img src="${ApplicationIconPaths[Application.Key]}" alt=""></span><span><strong>${Application.Name}</strong><small>${Application.CompactDescription}</small></span><i></i>`; Button.onclick = () => { Draft.SelectedApps.has(Application.Key) ? Draft.SelectedApps.delete(Application.Key) : Draft.SelectedApps.add(Application.Key); Button.classList.toggle("IsSelected", Draft.SelectedApps.has(Application.Key)); }; return Button; }));
  for (const Button of document.querySelectorAll("[data-onboarding-provider]")) {
    Button.onclick = () => {
      const Error = document.getElementById("OnboardingAccountError");
      Error.textContent = `${Button.dataset.onboardingProvider} sign-in needs secure OAuth before real login. You can continue as guest with full local access.`;
    };
  }
  document.getElementById("OnboardingSigninForm")?.addEventListener("submit", async (Event) => {
    Event.preventDefault();
    const Error = document.getElementById("OnboardingAccountError");
    const Email = document.getElementById("OnboardingSigninEmail").value;
    const Password = document.getElementById("OnboardingSigninPassword").value;
    const TwoFactorCode = document.getElementById("OnboardingSigninTwoFactor")?.value ?? "";
    try {
      const Result = await VerifyLocalAccount(Email, Password, TwoFactorCode);
      if (!Result.Success) {
        Error.textContent = Result.Message;
        return;
      }
      localStorage.setItem(OnboardingStorageKey, JSON.stringify({ CompletedAt: Date.now(), Mode: "SignIn" }));
      Onboarding.classList.add("IsCompleting");
      await new Promise((Resolve) => window.setTimeout(Resolve, 420));
      Onboarding.hidden = true;
      Onboarding.classList.remove("IsCompleting");
      document.body.classList.remove("OnboardingActive");
      RenderLocalProfile();
      RenderApplications();
      RenderLimits();
      ShowControlToast("Signed in", "Your local profile is active.");
    } catch (SignInError) {
      Error.textContent = SignInError.message || "Sign in failed.";
    }
  });
  document.getElementById("EnterGuestButton").onclick = async () => {
    localStorage.setItem(GuestStorageKey, "true");
    localStorage.setItem(OnboardingStorageKey, JSON.stringify({ CompletedAt: Date.now(), Mode: "Guest" }));
    Onboarding.classList.add("IsCompleting");
    await new Promise((Resolve) => window.setTimeout(Resolve, 420));
    Onboarding.hidden = true;
    Onboarding.classList.remove("IsCompleting");
    document.body.classList.remove("OnboardingActive");
    RenderLocalProfile();
    RenderApplications();
    RenderLimits();
    ShowSection("Home");
    ShowControlToast("Local access active", "Every protection setting is available without an account.");
  };
  document.getElementById("OnboardingAccountForm").onsubmit = (Event) => { Event.preventDefault(); const Name = document.getElementById("OnboardingName").value.trim(); const Email = document.getElementById("OnboardingEmail").value.trim(); const Password = document.getElementById("OnboardingPassword").value; const Confirmation = document.getElementById("OnboardingPasswordConfirm").value; const TwoFactorCode = document.getElementById("OnboardingTwoFactor")?.value.trim() ?? ""; const Error = document.getElementById("OnboardingAccountError"); if (!Name) { Error.textContent = "Enter your name."; return; } if (ReadAccounts()[NormalizeEmail(Email)]) { Error.textContent = "This account already exists. Sign in instead."; return; } if (!PasswordMeetsPolicy(Password)) { Error.textContent = "Use 12 characters with upper-case, lower-case and a number."; return; } if (Password !== Confirmation) { Error.textContent = "The two passwords do not match."; return; } Draft.Name = Name; Draft.Email = Email; Draft.Password = Password; Draft.TwoFactorCode = TwoFactorCode; Error.textContent = ""; document.getElementById("OnboardingPassword").value = ""; document.getElementById("OnboardingPasswordConfirm").value = ""; SetOnboardingStep(1); };
  for (const Button of document.querySelectorAll("[data-intent]")) Button.onclick = () => { Draft.Intent = Button.dataset.intent; document.querySelectorAll("[data-intent]").forEach((Choice) => Choice.classList.toggle("IsSelected", Choice === Button)); };
  document.getElementById("OnboardingIntentNext").onclick = () => SetOnboardingStep(2);
  document.getElementById("OnboardingAppsNext").onclick = () => { const Error = document.getElementById("OnboardingAppsError"); if (!Draft.SelectedApps.size) { Error.textContent = "Choose at least one application to protect."; return; } Error.textContent = ""; document.getElementById("OnboardingSummary").innerHTML = [...Draft.SelectedApps].map((Key) => `<span><img src="${ApplicationIconPaths[Key]}" alt="">${Key}<b>LOCKED</b></span>`).join(""); SetOnboardingStep(3); };
  const Consent = document.getElementById("OnboardingConsent"); const CompleteButton = document.getElementById("CompleteOnboardingButton"); Consent.onchange = () => { CompleteButton.disabled = !Consent.checked; };
  CompleteButton.onclick = async () => { const Error = document.getElementById("OnboardingAccountError"); const AccountResult = await CreateLocalAccount({ Name: Draft.Name, Email: Draft.Email, Password: Draft.Password, TwoFactorCode: Draft.TwoFactorCode }); if (!AccountResult.Success) { Error.textContent = AccountResult.Message; SetOnboardingStep(0); return; } ActiveRules.ProtectedApplications = ApplicationKeys.filter((Key) => Draft.SelectedApps.has(Key)); ApplyCoreProtection(ActiveRules); await WriteStoredRules(ActiveRules); localStorage.removeItem(GuestStorageKey); localStorage.setItem(OnboardingStorageKey, JSON.stringify({ CompletedAt: Date.now(), Intent: Draft.Intent, ProtectedApplications: ActiveRules.ProtectedApplications })); RenderApplications(); RenderLimits(); RenderLocalProfile(); Onboarding.classList.add("IsCompleting"); await new Promise((Resolve) => window.setTimeout(Resolve, 620)); Onboarding.hidden = true; Onboarding.classList.remove("IsCompleting"); document.body.classList.remove("OnboardingActive"); ShowControlToast("Protection applied", `${ActiveRules.ProtectedApplications.length} applications are configured and remain editable.`); };
  return true;
}
function InitializeProductFooter() {
  const FooterNote = document.getElementById("FooterNote");
  if (!FooterNote) return;
  const FooterNotes = {
    privacy: "Control stores filters, local profile details and usage statistics on this device. The current extension does not sell an advertising profile or upload browsing history to a Control server.",
    terms: "Control is an independent focus tool provided as local software. Network interfaces may change, so filters should be reviewed after major platform updates.",
    trademarks: "Instagram, X, Snapchat, YouTube and TikTok are trademarks of their respective owners. Their presence describes compatibility only and does not imply sponsorship or affiliation.",
  };
  for (const Button of document.querySelectorAll("[data-footer-note]")) {
    Button.addEventListener("click", () => {
      const NoteKey = Button.getAttribute("data-footer-note");
      FooterNote.textContent = FooterNotes[NoteKey] ?? "";
      FooterNote.hidden = false;
      FooterNote.animate([
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 280, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  }
  const FooterLanguageSelect = document.getElementById("FooterLanguageSelect");
  const FooterLanguageStatus = document.getElementById("FooterLanguageStatus");
  if (FooterLanguageSelect instanceof HTMLSelectElement) {
    const StoredLanguage = localStorage.getItem("ControlLanguage") || document.documentElement.lang || "en";
    FooterLanguageSelect.value = StoredLanguage.startsWith("fr") ? "fr" : "en";
    FooterLanguageSelect.addEventListener("change", () => {
      document.documentElement.lang = FooterLanguageSelect.value;
      localStorage.setItem("ControlLanguage", FooterLanguageSelect.value);
      if (FooterLanguageStatus) FooterLanguageStatus.textContent = FooterLanguageSelect.value === "fr" ? "Préférence enregistrée sur cet appareil" : "Preference saved on this device";
    });
  }}

function InitializeSoftReveals() {
  const RevealTargets = document.querySelectorAll(".ProductDemoShowcase, .ProductDemoHeader, .ProductDemoStage, .HomeShortcutsHeader, .HomeShortcutCard, .InsightCard, .MetricsGrid article, .AttentionManifesto .ManifestoCopy, .AttentionGraphPanel, .FocusFeature, .SettingsCard, .ProductFooter");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    RevealTargets.forEach((Target) => Target.classList.add("IsRevealed"));
    return;
  }
  const RevealObserver = new IntersectionObserver((Entries) => {
    for (const Entry of Entries) {
      if (!Entry.isIntersecting) continue;
      Entry.target.classList.add("IsRevealed");
      RevealObserver.unobserve(Entry.target);
    }
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
  RevealTargets.forEach((Target) => RevealObserver.observe(Target));
}

async function Initialize() {
  BindPrimaryNavigation();
  InitializeInterfaceTheme();
  const BootSequence = RunBootSequence();
  UpdateProtectionStatus();
  UpdateExtensionConnectionUI();
  ActiveRules = MergeRules(await ReadStoredRules());
  RenderApplications();
  RenderLandingConfigurator();
  RenderLimits();
  InitializeSensitiveProtectionSettings();
  window.dispatchEvent(new CustomEvent("control:rules-ready"));
  InitializeLockReview();
  EnsureLogoEyes();
  InitializeVisualStream();
  BindProfileActions();
  InitializeProductFooter();
  InitializeSoftReveals();
  await InitializeOnboarding();
  InitializeAttentionExperience();
  InitializeFocusFeatures();
  await UpdateUsageStatistics();

  document.getElementById("CurrentDate").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  for (const Application of ApplicationDefinitions) {
    document.getElementById(`Open${Application.Key}Button`).onclick = () => LaunchApplication(Application);
  }

  document.getElementById("ResetButton").onclick = ResetRules;
  document.getElementById("ResetUsageButton").onclick = ResetUsageStats;
  document.getElementById("CloseInstallationNoticeButton").onclick = CloseInstallationNotice;
  const MobileMenuButton = document.getElementById("MobileMenuButton");
  MobileMenuButton.onclick = () => {
    const MainNavigation = document.getElementById("MainNavigation");
    const IsOpen = MainNavigation.classList.toggle("IsOpen");
    MobileMenuButton.setAttribute("aria-expanded", String(IsOpen));
  };

  window.addEventListener("focus", () => void UpdateUsageStatistics());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void UpdateUsageStatistics();
    }
  });

  const InitialSection = location.hash.slice(1);
  if (["Home", "Apps", "Activity", "Settings", "Profile"].includes(InitialSection)) {
    ShowSection(InitialSection);
  }

  await BootSequence;
  RevealInterface();
}

BindPrimaryNavigation();

void Initialize().catch((Error) => {
  console.error("Control initialization failed", Error);
  RevealInterface();
});








