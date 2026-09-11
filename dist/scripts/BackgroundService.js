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
  Instagram: { Enabled: true, Reels: true, ForYou: true, Explore: true, Search: false, GridContent: false, SearchGridGuard: true, SearchScrollLock: true, AdsAndSuggested: true, SuggestedPosts: true, Stories: true, StoryAds: true, Live: true, Shopping: true, SavedPosts: true, HomeFeed: true, HideFollowingPosts: true, FollowingUnlockAvailableAt: 0, DMsOnly: true, DailyLimitMinutes: 0 },
  X: { Enabled: true, DMsOnly: false, ForYou: true, SearchProfilesOnly: true, Videos: true, DailyLimitMinutes: 0 },
  Snapchat: { Enabled: true, Spotlight: true, Stories: true, Discover: true, Map: true, Ads: true, DMsOnly: true, DailyLimitMinutes: 0 },
  TikTok: { Enabled: true, ForYou: true, FollowingFeed: true, Live: true, Suggested: true, DailyLimitMinutes: 0 },
  YouTube: { Enabled: true, VideoOnly: false, Shorts: true, HomeFeed: false, Recommendations: false, Comments: false, Ads: false, DailyLimitMinutes: 0 },
  Reddit: { Enabled: false, HomeFeed: true, Popular: true, Comments: false, DailyLimitMinutes: 0 },
  Threads: { Enabled: false, ForYou: true, Activity: false, DailyLimitMinutes: 0 },
  Facebook: { Enabled: false, HomeFeed: true, Reels: true, Stories: false, DMsOnly: false, DailyLimitMinutes: 0 },
};

const ApplicationKeys = ["Instagram", "X", "Snapchat", "YouTube", "TikTok", "Reddit", "Threads", "Facebook"];
const ProtectedLaunchHosts = new Set([
  "www.instagram.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "web.snapchat.com",
  "www.youtube.com",
  "youtube.com",
  "www.tiktok.com",
  "tiktok.com",
  "reddit.com", "www.reddit.com", "old.reddit.com",
  "threads.com", "www.threads.com", "threads.net", "www.threads.net",
  "facebook.com", "www.facebook.com", "m.facebook.com",
]);

function IsProtectedLaunchUrl(UrlValue) {
  try {
    const Target = new URL(UrlValue);
    return Target.protocol === "https:" && ProtectedLaunchHosts.has(Target.hostname.toLowerCase());
  } catch {
    return false;
  }
}
const UsageStateKey = "UsageState";
const UsageSessionKey = "UsageActiveSession";
const UsageHeartbeatName = "ControlUsageHeartbeat";
const MaximumSessionSlice = 5 * 60 * 1000;
let TrackingTask = Promise.resolve();

function MergeRules(StoredRules) {
  const Rules = structuredClone(DefaultRules);
  if (!StoredRules || typeof StoredRules !== "object") {
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
  }
  for (const ApplicationKey of ApplicationKeys) {
    Rules[ApplicationKey].Enabled = typeof StoredRules[ApplicationKey]?.Enabled === "boolean"
      ? StoredRules[ApplicationKey].Enabled
      : Rules.ProtectedApplications.includes(ApplicationKey);
  }
  Rules.ProtectedApplications = ApplicationKeys.filter((ApplicationKey) => Rules[ApplicationKey].Enabled);
  const IsLegacyFriendFeedRule = Number(StoredRules.SchemaVersion) < 14;
  Rules.Instagram.HomeFeed = IsLegacyFriendFeedRule ? false : StoredRules.Instagram?.HomeFeed === true;
  Rules.Instagram.HideFollowingPosts = IsLegacyFriendFeedRule
    ? false
    : typeof StoredRules.Instagram?.HideFollowingPosts === "boolean"
      ? StoredRules.Instagram.HideFollowingPosts
      : StoredRules.Instagram?.FollowingOnly !== true;
  Rules.Instagram.FollowingUnlockAvailableAt = Rules.Instagram.HideFollowingPosts
    ? Number(StoredRules.Instagram?.FollowingUnlockAvailableAt) || 0
    : 0;
  ApplyInstagramDirectMessagesOnlyRules(Rules);
  ApplyYouTubeShortsOnlyRules(Rules);
  Rules.SchemaVersion = 14;
  return Rules;
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
  Rules.Instagram.StoryAds = true;
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

async function EnsureDefaultRules() {
  const StoredData = await chrome.storage.sync.get("Rules");
  const Rules = [8, 9, 10, 11, 12, 13, 14].includes(StoredData.Rules?.SchemaVersion) ? MergeRules(StoredData.Rules) : structuredClone(DefaultRules);
  await chrome.storage.sync.set({ Rules });
}

function CreateApplicationCounter() {
  return Object.fromEntries(ApplicationKeys.map((ApplicationKey) => [ApplicationKey, 0]));
}

function CreateEmptyUsageState() {
  return { Days: {}, Lifetime: CreateApplicationCounter() };
}

function GetLocalDateKey(DateValue = new Date()) {
  const Year = DateValue.getFullYear();
  const Month = String(DateValue.getMonth() + 1).padStart(2, "0");
  const Day = String(DateValue.getDate()).padStart(2, "0");
  return `${Year}-${Month}-${Day}`;
}

function GetTrackedApplication(UrlValue) {
  if (typeof UrlValue !== "string") {
    return null;
  }

  try {
    const Hostname = new URL(UrlValue).hostname.toLowerCase();
    for (const [App, Domains] of Object.entries({Reddit:["reddit.com"],Threads:["threads.com","threads.net"],Facebook:["facebook.com"]})) {
      if (Domains.some(Domain => Hostname === Domain || Hostname.endsWith("." + Domain))) return App;
    }
    if (Hostname === "instagram.com" || Hostname.endsWith(".instagram.com")) {
      return "Instagram";
    }
    if (Hostname === "x.com" || Hostname.endsWith(".x.com") || Hostname === "twitter.com" || Hostname.endsWith(".twitter.com")) {
      return "X";
    }
    if (Hostname === "snapchat.com" || Hostname.endsWith(".snapchat.com")) {
      return "Snapchat";
    }
    if (Hostname === "youtube.com" || Hostname.endsWith(".youtube.com") || Hostname === "youtu.be") {
      return "YouTube";
    }
    if (Hostname === "tiktok.com" || Hostname.endsWith(".tiktok.com")) {
      return "TikTok";
    }
  } catch {
    return null;
  }
  return null;
}

function NormalizeUsageState(Value) {
  const UsageState = CreateEmptyUsageState();
  if (!Value || typeof Value !== "object") {
    return UsageState;
  }

  UsageState.Days = Value.Days && typeof Value.Days === "object" ? Value.Days : {};
  for (const ApplicationKey of ApplicationKeys) {
    UsageState.Lifetime[ApplicationKey] = Number(Value.Lifetime?.[ApplicationKey]) || 0;
  }
  return UsageState;
}

function PruneOldUsageDays(UsageState) {
  const MinimumDate = new Date();
  MinimumDate.setDate(MinimumDate.getDate() - 31);
  const MinimumKey = GetLocalDateKey(MinimumDate);
  for (const DateKey of Object.keys(UsageState.Days)) {
    if (DateKey < MinimumKey) {
      delete UsageState.Days[DateKey];
    }
  }
}

async function GetCurrentlyActiveApplication() {
  const IdleState = await chrome.idle.queryState(60);
  if (IdleState !== "active") {
    return null;
  }

  const FocusedWindow = await chrome.windows.getLastFocused();
  if (!FocusedWindow?.focused || FocusedWindow.id === chrome.windows.WINDOW_ID_NONE) {
    return null;
  }

  const [ActiveTab] = await chrome.tabs.query({ active: true, windowId: FocusedWindow.id });
  return GetTrackedApplication(ActiveTab?.url);
}

async function RefreshUsageTracking() {
  const Now = Date.now();
  const ActiveApplication = await GetCurrentlyActiveApplication();
  const StoredData = await chrome.storage.local.get([UsageStateKey, UsageSessionKey]);
  const UsageState = NormalizeUsageState(StoredData[UsageStateKey]);
  const PreviousSession = StoredData[UsageSessionKey];

  if (ApplicationKeys.includes(PreviousSession?.Application) && Number.isFinite(PreviousSession.StartedAt)) {
    const Duration = Math.max(0, Math.min(Now - PreviousSession.StartedAt, MaximumSessionSlice));
    if (Duration > 0) {
      const DateKey = GetLocalDateKey();
      const DayUsage = { ...CreateApplicationCounter(), ...(UsageState.Days[DateKey] ?? {}) };
      DayUsage[PreviousSession.Application] = (Number(DayUsage[PreviousSession.Application]) || 0) + Duration;
      UsageState.Days[DateKey] = DayUsage;
      UsageState.Lifetime[PreviousSession.Application] += Duration;
    }
  }

  PruneOldUsageDays(UsageState);
  await chrome.storage.local.set({
    [UsageStateKey]: UsageState,
    [UsageSessionKey]: ActiveApplication ? { Application: ActiveApplication, StartedAt: Now } : null,
  });
  return UsageState;
}

function QueueUsageRefresh() {
  TrackingTask = TrackingTask.catch(() => undefined).then(RefreshUsageTracking);
  return TrackingTask;
}

async function InitializeUsageTracking() {
  chrome.idle.setDetectionInterval(60);
  await chrome.alarms.create(UsageHeartbeatName, { periodInMinutes: 1 });
  await QueueUsageRefresh();
}

async function ResetUsageTracking() {
  await chrome.storage.local.remove([UsageStateKey, UsageSessionKey]);
  return QueueUsageRefresh();
}


const SensitiveBlockedDomains = [
  "onlyfans.com", "fansly.com", "manyvids.com", "justfor.fans", "loyalfans.com", "clips4sale.com",
  "pornhub.com", "xvideos.com", "xnxx.com", "redtube.com", "youporn.com", "xhamster.com",
  "chaturbate.com", "stripchat.com", "myfreecams.com", "livejasmin.com", "bongacams.com", "camsoda.com",
  "fapello.com", "erome.com", "rule34.xxx", "nhentai.net", "literotica.com", "adultfriendfinder.com",
];
const SensitiveHostTokens = new Set(["porn", "xxx", "hentai", "nsfw"]);
let BundledSensitiveDomainsPromise = null;

function NormalizeSensitiveDomain(Value) {
  const Candidate = String(Value ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").replace(/:\d+$/, "");
  return Candidate.includes(".") && !Candidate.includes(" ") ? Candidate : "";
}

function IsSensitiveHostname(Hostname, CustomDomains = []) {
  const Normalized = Hostname.toLowerCase().replace(/^www\./, "");
  const Domains = [...SensitiveBlockedDomains, ...CustomDomains.map(NormalizeSensitiveDomain).filter(Boolean)];
  if (Domains.some((Domain) => Normalized === Domain || Normalized.endsWith(`.${Domain}`))) return true;
  return Normalized.split(/[.-]/).some((Token) => SensitiveHostTokens.has(Token));
}

function LoadBundledSensitiveDomains() {
  if (!BundledSensitiveDomainsPromise) {
    BundledSensitiveDomainsPromise = fetch(chrome.runtime.getURL("data/adult-domains.txt"))
      .then((Response) => Response.ok ? Response.text() : "")
      .then((Text) => new Set(Text.split(/\r?\n/).map(NormalizeSensitiveDomain).filter(Boolean)))
      .catch(() => new Set());
  }
  return BundledSensitiveDomainsPromise;
}

function SetContainsHostname(DomainSet, Hostname) {
  let Candidate = NormalizeSensitiveDomain(Hostname);
  while (Candidate.includes(".")) {
    if (DomainSet.has(Candidate)) return true;
    Candidate = Candidate.slice(Candidate.indexOf(".") + 1);
  }
  return false;
}

async function IsSensitiveHostnameComplete(Hostname, CustomDomains = []) {
  if (IsSensitiveHostname(Hostname, CustomDomains)) return true;
  return SetContainsHostname(await LoadBundledSensitiveDomains(), Hostname);
}

async function UpdateSensitiveNetworkRules(RulesValue = null) {
  const StoredRules = RulesValue ?? (await chrome.storage.sync.get("Rules")).Rules;
  const Rules = MergeRules(StoredRules);
  const ExistingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ExistingIds = ExistingRules.filter((Rule) => Rule.id >= 6000 && Rule.id < 7000).map((Rule) => Rule.id);
  const Domains = [...new Set([
    ...SensitiveBlockedDomains,
    ...(Rules.SensitiveProtectionConfig.BlockedDomains ?? []).map(NormalizeSensitiveDomain).filter(Boolean),
  ])].slice(0, 900);
  const AddRules = Rules.SensitiveContentProtection && Rules.SensitiveProtectionConfig.BlockAdultSites !== false
    ? Domains.map((Domain, Index) => ({
        id: 6000 + Index,
        priority: 1,
        action: { type: "redirect", redirect: { extensionPath: "/Blocked.html" } },
        condition: { urlFilter: `||${Domain}^`, resourceTypes: ["main_frame"] },
      }))
    : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ExistingIds, addRules: AddRules });
}

async function ApplySensitiveNavigationProtection(TabId, Url) {
  if (!Url || Url.startsWith(chrome.runtime.getURL(""))) return;
  const StoredData = await chrome.storage.sync.get("Rules");
  const Rules = MergeRules(StoredData.Rules);
  if (!Rules.SensitiveContentProtection || Rules.SensitiveProtectionConfig.BlockAdultSites === false) return;
  try {
    const Target = new URL(Url);
    if (!await IsSensitiveHostnameComplete(Target.hostname, Rules.SensitiveProtectionConfig.BlockedDomains)) return;
    await chrome.tabs.update(TabId, { url: chrome.runtime.getURL(`Blocked.html?host=${encodeURIComponent(Target.hostname)}`) });
  } catch { return; }
}

chrome.runtime.onInstalled.addListener(() => {
  void EnsureDefaultRules();
  void InitializeUsageTracking();
  void UpdateSensitiveNetworkRules();
});
chrome.runtime.onStartup.addListener(() => {
  void EnsureDefaultRules();
  void InitializeUsageTracking();
  void UpdateSensitiveNetworkRules();
});
chrome.storage.onChanged.addListener((Changes, AreaName) => {
  if (AreaName === "sync" && Changes.Rules?.newValue) void UpdateSensitiveNetworkRules(Changes.Rules.newValue);
});
chrome.alarms.onAlarm.addListener((Alarm) => {
  if (Alarm.name === UsageHeartbeatName) {
    void QueueUsageRefresh();
  }
});
chrome.tabs.onActivated.addListener(() => void QueueUsageRefresh());
chrome.tabs.onUpdated.addListener((TabId, ChangeInfo) => {
  if (ChangeInfo.url || ChangeInfo.status === "complete") {
    void QueueUsageRefresh();
    if (ChangeInfo.url) void ApplySensitiveNavigationProtection(TabId, ChangeInfo.url);
  }
});
chrome.windows.onFocusChanged.addListener(() => void QueueUsageRefresh());
chrome.idle.onStateChanged.addListener(() => void QueueUsageRefresh());

chrome.runtime.onMessage.addListener((Message, Sender, SendResponse) => {
  if (Message?.Type === "OpenDashboard") {
    chrome.runtime.openOptionsPage();
    SendResponse({ Success: true });
    return false;
  }

  if (Message?.Type === "OpenProtectedPage") {
    if (!IsProtectedLaunchUrl(Message.Url)) {
      SendResponse({ Success: false });
      return false;
    }
    void chrome.tabs.create({ url: Message.Url })
      .then(() => SendResponse({ Success: true }))
      .catch(() => SendResponse({ Success: false }));
    return true;
  }

  if (Message?.Type === "CloseCurrentTab" && Number.isInteger(Sender.tab?.id)) {
    void chrome.tabs.remove(Sender.tab.id);
    SendResponse({ Success: true });
    return false;
  }

  if (Message?.Type === "GetUsageStats") {
    void QueueUsageRefresh().then((UsageState) => SendResponse({ Success: true, UsageState }));
    return true;
  }

  if (Message?.Type === "ResetUsageStats") {
    void ResetUsageTracking().then((UsageState) => SendResponse({ Success: true, UsageState }));
    return true;
  }

  if (Message?.Type === "FetchInstagramStoryAsset") {
    void (async () => {
      const Target = new URL(String(Message.Url ?? ""));
      const Hostname = Target.hostname.toLowerCase();
      const IsInstagramAsset = Target.protocol === "https:" && (
        Hostname === "instagram.com" || Hostname.endsWith(".instagram.com") ||
        Hostname === "cdninstagram.com" || Hostname.endsWith(".cdninstagram.com") ||
        Hostname === "fbcdn.net" || Hostname.endsWith(".fbcdn.net")
      );
      if (!IsInstagramAsset) throw new Error("Unsupported Instagram media host");
      const Response = await fetch(Target.href, { credentials: "omit", redirect: "follow" });
      const ContentType = Response.headers.get("content-type")?.split(";")[0] ?? "";
      if (!Response.ok || !ContentType.startsWith("image/")) throw new Error("Instagram media is unavailable");
      const Buffer = await Response.arrayBuffer();
      if (Buffer.byteLength > 10 * 1024 * 1024) throw new Error("Instagram media is too large");
      const Bytes = new Uint8Array(Buffer);
      let Binary = "";
      for (let Offset = 0; Offset < Bytes.length; Offset += 0x8000) {
        Binary += String.fromCharCode(...Bytes.subarray(Offset, Offset + 0x8000));
      }
      SendResponse({ Success: true, DataUrl: `data:${ContentType};base64,${btoa(Binary)}` });
    })().catch(() => SendResponse({ Success: false }));
    return true;
  }

  if (Message?.Type === "CheckSensitiveTargets") {
    void (async () => {
      const StoredData = await chrome.storage.sync.get("Rules");
      const Rules = MergeRules(StoredData.Rules);
      if (!Rules.SensitiveContentProtection) {
        SendResponse({ Success: true, BlockedHosts: [] });
        return;
      }
      const Hosts = [...new Set((Array.isArray(Message.Hosts) ? Message.Hosts : [])
        .map(NormalizeSensitiveDomain).filter(Boolean))].slice(0, 250);
      const BlockedHosts = [];
      for (const Host of Hosts) {
        if (await IsSensitiveHostnameComplete(Host, Rules.SensitiveProtectionConfig.BlockedDomains)) BlockedHosts.push(Host);
      }
      SendResponse({ Success: true, BlockedHosts });
    })().catch(() => SendResponse({ Success: false, BlockedHosts: [] }));
    return true;
  }
  return false;
});

void EnsureDefaultRules();
void InitializeUsageTracking();
void UpdateSensitiveNetworkRules();
void LoadBundledSensitiveDomains();
