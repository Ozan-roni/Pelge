const ControlExtendedDefaultRules = {
  ShieldAll: false,
  GrayscaleMode: false,
  PostModeUntil: 0,
  ShowUsageTimer: true,
  SensitiveContentProtection: false,
  SensitiveProtectionConfig: { BlockAdultSites: true, HideDetectedAccounts: true, BlockedDomains: [], BlockedKeywords: [], BlockedAccounts: [] },
  Instagram: { Enabled: true, Reels: true, ForYou: true, Explore: true, Search: false, SearchGridGuard: true, SearchScrollLock: true, Stories: true, AdsAndSuggested: true, SuggestedPosts: true, StoryAds: true, Live: true, Shopping: true, SavedPosts: true, HomeFeed: true, HideFollowingPosts: true, DMsOnly: true, DailyLimitMinutes: 0 },
  X: { Enabled: true, DMsOnly: false, ForYou: true, SearchProfilesOnly: true, Videos: true, DailyLimitMinutes: 0 },
  Snapchat: { Enabled: true, DMsOnly: true, DailyLimitMinutes: 0 },
  TikTok: { Enabled: true, ForYou: true, FollowingFeed: true, Live: true, Suggested: true, DailyLimitMinutes: 0 },
  YouTube: { Enabled: true, VideoOnly: false, Shorts: true, HomeFeed: false, Recommendations: false, Comments: false, Ads: false, DailyLimitMinutes: 0 },
  Reddit: { Enabled: false, HomeFeed: true, Popular: true, Comments: false, DailyLimitMinutes: 0 },
  Threads: { Enabled: false, ForYou: true, Activity: false, DailyLimitMinutes: 0 },
  Facebook: { Enabled: false, HomeFeed: true, Reels: true, Stories: false, DMsOnly: false, DailyLimitMinutes: 0 },
};

let ControlExtendedRules = structuredClone(ControlExtendedDefaultRules);
let ControlExtendedLimitReached = false;
let ControlExtendedFilterTimer = null;
let ControlExtendedRulesLoaded = false;

function ControlExtendedGetApplication() {
  const Hostname = location.hostname.toLowerCase();
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
  return null;
}

function ControlExtendedGetLocalDateKey(DateValue = new Date()) {
  const Year = DateValue.getFullYear();
  const Month = String(DateValue.getMonth() + 1).padStart(2, "0");
  const Day = String(DateValue.getDate()).padStart(2, "0");
  return `${Year}-${Month}-${Day}`;
}

function ControlExtendedMergeRules(StoredRules) {
  const Rules = structuredClone(ControlExtendedDefaultRules);
  if (!StoredRules || typeof StoredRules !== "object") {
    return Rules;
  }
  const ProtectedApplications = Array.isArray(StoredRules.ProtectedApplications) ? StoredRules.ProtectedApplications : ["Instagram", "X", "Snapchat", "YouTube", "TikTok"];
  Rules.ShieldAll = StoredRules.ShieldAll ?? Rules.ShieldAll;
  Rules.GrayscaleMode = StoredRules.GrayscaleMode ?? Rules.GrayscaleMode;
  Rules.PostModeUntil = Number(StoredRules.PostModeUntil) || 0;
  Rules.ShowUsageTimer = StoredRules.ShowUsageTimer ?? Rules.ShowUsageTimer;
  Rules.SensitiveContentProtection = StoredRules.SensitiveContentProtection ?? Rules.SensitiveContentProtection;
  Rules.SensitiveProtectionConfig = { ...Rules.SensitiveProtectionConfig, ...(StoredRules.SensitiveProtectionConfig ?? {}) };
  for (const ApplicationKey of ["Instagram", "X", "Snapchat", "YouTube", "TikTok", "Reddit", "Threads", "Facebook"]) {
    Rules[ApplicationKey] = { ...Rules[ApplicationKey], ...(StoredRules[ApplicationKey] ?? {}) };
  }
  Rules.Instagram.Enabled = typeof StoredRules.Instagram?.Enabled === "boolean" ? StoredRules.Instagram.Enabled : ProtectedApplications.includes("Instagram");
  const IsLegacyFriendFeedRule = Number(StoredRules.SchemaVersion) < 14;
  Rules.Instagram.HomeFeed = IsLegacyFriendFeedRule ? false : StoredRules.Instagram?.HomeFeed === true;
  Rules.Instagram.HideFollowingPosts = IsLegacyFriendFeedRule
    ? false
    : typeof StoredRules.Instagram?.HideFollowingPosts === "boolean"
      ? StoredRules.Instagram.HideFollowingPosts
      : StoredRules.Instagram?.FollowingOnly !== true;
  Rules.X.Enabled = typeof StoredRules.X?.Enabled === "boolean" ? StoredRules.X.Enabled : ProtectedApplications.includes("X");
  Rules.Snapchat.Enabled = typeof StoredRules.Snapchat?.Enabled === "boolean" ? StoredRules.Snapchat.Enabled : ProtectedApplications.includes("Snapchat");
  Rules.YouTube.Enabled = typeof StoredRules.YouTube?.Enabled === "boolean" ? StoredRules.YouTube.Enabled : ProtectedApplications.includes("YouTube");
  Rules.TikTok.Enabled = typeof StoredRules.TikTok?.Enabled === "boolean" ? StoredRules.TikTok.Enabled : ProtectedApplications.includes("TikTok");
  return Rules;
}

function ApplyControlExtendedInstagramDirectMessagesOnlyRules(Rules) {
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

function ApplyControlExtendedYouTubeShortsOnlyRules(Rules) {
  if (!Rules?.YouTube) return;
  Rules.YouTube.Enabled = true;
  Rules.YouTube.VideoOnly = false;
  Rules.YouTube.Shorts = true;
  Rules.YouTube.HomeFeed = false;
  Rules.YouTube.Recommendations = false;
  Rules.YouTube.Comments = false;
  Rules.YouTube.Ads = false;
}

function ControlExtendedRemoveBlocker() {
  document.getElementById("ControlExtendedBlocker")?.remove();
  document.documentElement.classList.remove("ControlExtendedRouteIsBlocked");
}

function ControlExtendedShowBlocker(Title, Description, SafeUrl = "__close__") {
  if (document.getElementById("ControlRouteBlocker")) return;
  let Blocker = document.getElementById("ControlExtendedBlocker");
  if (!Blocker) {
    Blocker = document.createElement("section");
    Blocker.id = "ControlExtendedBlocker";
    Blocker.innerHTML = `
      <div class="ControlRouteCard" role="dialog" aria-modal="true" aria-labelledby="ControlExtendedTitle">
        <div class="ControlRouteMark" aria-hidden="true"><img src="${chrome.runtime.getURL("assets/ControlSelectedWhiteIcon128.png")}" alt=""><span class="ControlRouteLock"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span></div>
        <p class="ControlRouteEyebrow">CONTROL · PROTECTED ROUTE</p>
        <h1 id="ControlExtendedTitle"></h1>
        <p id="ControlExtendedDescription"></p>
        <button id="ControlExtendedSafeButton" type="button"></button>
      </div>
    `;
    document.documentElement.append(Blocker);
  }

  const TitleElement = Blocker.querySelector("#ControlExtendedTitle");
  const DescriptionElement = Blocker.querySelector("#ControlExtendedDescription");
  const SafeButton = Blocker.querySelector("#ControlExtendedSafeButton");
  const ButtonLabel = SafeUrl === "__close__" ? "Close application" : "Return to the useful area";
  if (TitleElement.textContent !== Title) {
    TitleElement.textContent = Title;
  }
  if (DescriptionElement.textContent !== Description) {
    DescriptionElement.textContent = Description;
  }
  if (SafeButton.textContent !== ButtonLabel) {
    SafeButton.textContent = ButtonLabel;
  }
  SafeButton.onclick = () => {
    if (SafeUrl === "__close__") {
      void chrome.runtime.sendMessage({ Type: "CloseCurrentTab" });
      return;
    }
    location.assign(SafeUrl);
  };
  document.documentElement.classList.add("ControlExtendedRouteIsBlocked");
}

function ControlExtendedRemoveElement(Node) {
  if (!(Node instanceof Element)) return;
  // Keep the native node and accessibility attributes intact for immediate restoration.
  Node.setAttribute("data-control-extended-hidden", "true");
}

function ControlExtendedRestorePage() {
  document.querySelectorAll('[data-control-extended-hidden], [data-control-social-hidden]').forEach(Node => {
    Node.removeAttribute('data-control-extended-hidden');
    Node.removeAttribute('data-control-social-hidden');
  });
  for (const ClassName of [...document.documentElement.classList]) {
    if (/^Control(?:X|YouTube|TikTok|GlobalGrayscale|SensitiveProtection)/.test(ClassName)) {
      document.documentElement.classList.remove(ClassName);
    }
  }
  ControlExtendedRemoveBlocker();
  document.getElementById("ControlUsageTimer")?.remove();
  window.clearInterval(ControlExtendedSessionTimer);
}

function ControlExtendedFilterInstagram(Rules) {
  const Path = location.pathname.toLowerCase();
  const IsHomeRoute = Path === "/";
  const IsAccountAccess = Path.startsWith("/accounts/") || Path.startsWith("/challenge/");

  if (Rules.DMsOnly && !Path.startsWith("/direct/") && !IsAccountAccess) {
    ControlExtendedShowBlocker("Instagram is in DMs-only mode", "The feed, profiles and discovery surfaces are unavailable. Direct Messages remain open.", "/direct/inbox/");
    return true;
  }
  if (Rules.Live && (Path.startsWith("/live") || Path.includes("/live/"))) {
    ControlExtendedShowBlocker("Instagram Live is blocked", "Live streams are removed while conversations and intentional profiles stay available.", "/");
    return true;
  }
  if (Rules.Shopping && (Path.startsWith("/shop") || Path.includes("/shopping"))) {
    ControlExtendedShowBlocker("Instagram Shopping is blocked", "Product discovery is outside your intentional Instagram experience.", "/");
    return true;
  }
  if (Rules.SavedPosts && Path.includes("/saved")) {
    ControlExtendedShowBlocker("Saved posts are blocked", "Control keeps Instagram focused on conversations.", "/direct/inbox/");
    return true;
  }

  document.documentElement.classList.toggle("ControlInstagramHideFeed", Rules.HomeFeed === true && IsHomeRoute && Rules.HideFollowingPosts === true);
  document.documentElement.classList.toggle("ControlInstagramHideStories", Rules.Stories === true);
  document.documentElement.classList.toggle("ControlInstagramHideReels", Rules.Reels === true);
  document.documentElement.classList.toggle("ControlInstagramFollowingOnly", Rules.HideFollowingPosts === false);
  document.documentElement.classList.toggle("ControlInstagramHideCommerce", Rules.Shopping === true);
  if (Rules.Live || Rules.Shopping) {
    for (const Link of document.querySelectorAll("a[href]")) {
      const Href = Link.getAttribute("href")?.toLowerCase() ?? "";
      if ((Rules.Live && Href.includes("/live")) || (Rules.Shopping && (Href.includes("/shop") || Href.includes("/shopping")))) {
        ControlExtendedRemoveElement(Link.closest("li, [role=menuitem], [role=link]") ?? Link);
      }
    }
  }

  for (const Article of document.querySelectorAll("main article")) {
    const IsLeafArticle = !Article.querySelector("article");
    const IsFeedPost = IsLeafArticle && Boolean(Article.querySelector('a[href^="/p/"], a[href^="/reel/"]'));
    const Text = (Article.textContent ?? "").toLowerCase();
    const IsSuggestedOrSponsored = Text.includes("suggested for you") ||
      Text.includes("suggested posts") ||
      Text.includes("because you follow") ||
      Text.includes("recommended for you") ||
      Text.includes("sponsored") ||
      Text.includes("sponsoris\u00e9") ||
      Text.includes("sponsoris\u00e9e") ||
      Text.includes("publicit\u00e9") ||
      Text.includes("paid partnership") ||
      Text.includes("partenariat r\u00e9mun\u00e9r\u00e9");
    const IsStoryAdvertisement = Path.startsWith("/stories/") && Text.includes("sponsored");
    const ShouldHideSuggested = IsFeedPost && (Rules.AdsAndSuggested || !Rules.HideFollowingPosts) && IsSuggestedOrSponsored;
    if (ShouldHideSuggested || (Rules.StoryAds && IsStoryAdvertisement)) {
      ControlExtendedRemoveElement(Article);
    }
  }
  return false;
}
function ControlExtendedFilterX(Rules) {
  const SearchParameters = new URLSearchParams(location.search);
  const Path = location.pathname.toLowerCase();
  const IsAuthentication = Path.startsWith("/i/flow/") || Path.startsWith("/login") || Path.startsWith("/account/");
  if (Rules.DMsOnly && !IsAuthentication && !Path.startsWith('/messages') && !Path.startsWith('/i/chat') && !Path.startsWith('/settings')) {
    ControlExtendedShowBlocker('X is in messages-only mode', 'Your conversations remain available.', '/messages');
    return true;
  }
  if (Rules.ForYou && (Path === "/" || Path === "/home")) {
    ControlExtendedShowBlocker("The For You timeline is locked", "Search for a person, open a profile intentionally or continue to Messages.", "/messages");
    return true;
  }
  if (Rules.SearchProfilesOnly && Path.startsWith("/search") && SearchParameters.get("q") && SearchParameters.get("f") !== "user") {
    const ProfileSearch = new URL(location.href);
    ProfileSearch.searchParams.set("f", "user");
    location.replace(ProfileSearch.toString());
    return true;
  }
  document.documentElement.classList.toggle("ControlXIntentional", Rules.ForYou === true);
  document.documentElement.classList.toggle("ControlXDMOnly", Rules.DMsOnly === true);
  document.documentElement.classList.toggle("ControlXSearchProfilesOnly", Rules.SearchProfilesOnly === true && (Path.startsWith("/search") || Path.startsWith("/explore")));
  document.documentElement.classList.toggle("ControlXHideVideos", Rules.Videos === true);
  if (!IsAuthentication && Rules.Videos) {
    for (const Video of document.querySelectorAll("video, [data-testid='videoPlayer'], [data-testid='videoComponent']")) {
      ControlExtendedRemoveElement(Video.closest("[data-testid='tweet'], article") ?? Video);
    }
  }
  return false;
}

function ControlExtendedFilterSnapchat(Rules) {
  const Path = location.pathname.toLowerCase();
  const IsWebApplication = location.hostname === "web.snapchat.com" || Path.startsWith("/web");
  if (Rules.DMsOnly && !IsWebApplication) {
    ControlExtendedShowBlocker("Snapchat is in DMs-only mode", "Control keeps chat, camera and private photographs only.", "https://web.snapchat.com/");
    return true;
  }
  return false;
}

function ControlExtendedFilterYouTube(Rules) {
  const Path = location.pathname.toLowerCase();
  if (Rules.Shorts && Path.startsWith("/shorts")) {
    ControlExtendedShowBlocker("YouTube Shorts are blocked", "Search for a regular video or open one directly.", "/");
    return true;
  }

  const IsAllowedVideoRoute = Path === "/" || Path.startsWith("/watch") || Path.startsWith("/results") || Path.startsWith("/account") || Path.startsWith("/signin");
  if (Rules.VideoOnly && !IsAllowedVideoRoute) {
    ControlExtendedShowBlocker("YouTube is in video-only mode", "Search and standard video playback remain available.", "/");
    return true;
  }

  document.documentElement.classList.toggle("ControlYouTubeHideHome", Rules.HomeFeed === true && Path === "/");
  document.documentElement.classList.toggle("ControlYouTubeHideRecommendations", Rules.Recommendations === true);
  document.documentElement.classList.toggle("ControlYouTubeHideComments", Rules.Comments === true);
  document.documentElement.classList.toggle("ControlYouTubeHideShorts", Rules.Shorts === true);
  document.documentElement.classList.toggle("ControlYouTubeHideAds", Rules.Ads === true);
  if (Rules.Shorts) {
    for (const ShortsLink of document.querySelectorAll('a[href^="/shorts"], a[href*="youtube.com/shorts"]')) {
      ControlExtendedRemoveElement(ShortsLink.closest("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, ytd-rich-section-renderer, ytd-reel-shelf-renderer") ?? ShortsLink);
    }
  }
  return false;
}



function ControlExtendedFilterTikTok(Rules) {
  const Path = location.pathname.toLowerCase();
  const IsForYou = Path === "/" || Path.startsWith("/foryou");
  const IsFollowing = Path.startsWith("/following");
  const IsLive = Path.startsWith("/live");
  if ((Rules.ForYou && IsForYou) || (Rules.FollowingFeed && IsFollowing) || (Rules.Live && IsLive)) {
    ControlExtendedShowBlocker("TikTok discovery is locked", "Search for a specific account or continue to private messages.", "/messages");
    return true;
  }
  document.documentElement.classList.toggle("ControlTikTokProtected", Rules.ForYou || Rules.FollowingFeed || Rules.Live);
  for (const Link of document.querySelectorAll('a[href="/"], a[href^="/foryou"], a[href^="/following"], a[href^="/live"]')) {
    const Label = `${Link.textContent ?? ""} ${Link.getAttribute("aria-label") ?? ""}`;
    const Href = Link.getAttribute("href") || "";
    const Blocked = (Rules.ForYou && (Href === "/" || Href.startsWith("/foryou"))) || (Rules.FollowingFeed && Href.startsWith("/following")) || (Rules.Live && Href.startsWith("/live"));
    if (Blocked) ControlExtendedRemoveElement(Link.closest("li, [role='listitem']") ?? Link);
  }
  return false;
}
const ControlSensitivePattern = /(?:\bnsfw\b|\bnudity\b|\bnude(?:s)?\b|\bporn(?:ography)?\b|\bsexual(?:ly)?\b|\berotic(?:a)?\b|\bexplicit\b|\bcontenu sensible\b|\bnudité\b|\bporno(?:graphie)?\b|\bérotique\b|\bsexuel(?:le)?\b)/i;

function ControlExtendedScrubSensitiveContent(Application) {
  document.documentElement.classList.toggle("ControlSensitiveProtection", ControlExtendedRules.SensitiveContentProtection === true);
  if (!ControlExtendedRules.SensitiveContentProtection) return;
  const Selectors = {
    Instagram: "article, [role='presentation']",
    X: "[data-testid='tweet'], article",
    Snapchat: "[role='listitem'], article",
    YouTube: "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer",
    TikTok: "article, [data-e2e*=feed], [data-e2e*=recommend]",
  };
  for (const Item of document.querySelectorAll(Selectors[Application] ?? "article")) {
    const AccessibleText = `${Item.textContent ?? ""} ${Item.getAttribute("aria-label") ?? ""}`;
    const ImageAlt = [...Item.querySelectorAll("img[alt]")].map((Image) => Image.getAttribute("alt") ?? "").join(" ");
    if (ControlSensitivePattern.test(`${AccessibleText} ${ImageAlt}`)) ControlExtendedRemoveElement(Item);
  }
}

function ControlExtendedFilterSocialApp(Application, Rules) {
  const Path = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  // These rules only target named routes and comment containers, never private messages.
  if (Application !== "Reddit" || !Rules.Comments) document.querySelectorAll('[data-control-social-hidden]').forEach(Node => Node.removeAttribute('data-control-social-hidden'));
  let Message = "";
  if (Application === "Reddit") {
    if (Rules.HomeFeed && Path === "/") Message = "Your Reddit home feed is paused";
    if (Rules.Popular && /^\/r\/(popular|all)(\/|$)/.test(Path)) Message = "Discovery is paused on Reddit";
    if (Rules.Comments) document.querySelectorAll('shreddit-comment:not([data-control-social-hidden]), .commentarea:not([data-control-social-hidden])').forEach(Node => Node.setAttribute('data-control-social-hidden','true'));
  }
  if (Application === "Threads") {
    if (Rules.ForYou && Path === "/") Message = "Your Threads home feed is paused";
    if (Rules.Activity && /^\/activity(\/|$)/.test(Path)) Message = "Threads activity is paused";
  }
  if (Application === "Facebook") {
    const IsUseful = /^\/(messages|settings|login|recover|checkpoint)(\/|$)/.test(Path);
    if (Rules.DMsOnly && !IsUseful) Message = "Facebook is in messages-only mode";
    else if (Rules.HomeFeed && (Path === "/" || Path === "/home.php")) Message = "Your Facebook home feed is paused";
    else if (Rules.Reels && /^\/reels?(\/|$)/.test(Path)) Message = "Facebook Reels are paused";
    else if (Rules.Stories && /^\/stories(\/|$)/.test(Path)) Message = "Facebook Stories are paused";
  }
  if (!Message) return false;
  ControlExtendedShowBlocker(Message, "Your chosen boundary is active. You can adjust it in Control at any time.", Application === "Facebook" ? "/messages/" : "__close__");
  return true;
}

function ControlExtendedApplyFilters() {
  if (!ControlExtendedRulesLoaded) return;
  const Application = ControlExtendedGetApplication();
  if (!Application) {
    return;
  }

  const Rules = ControlExtendedRules[Application];
  // Per-application opt-out takes precedence over every global option.
  if (!Rules?.Enabled) {
    ControlExtendedLimitReached = false;
    ControlExtendedRestorePage();
    return;
  }
  document.documentElement.classList.toggle("ControlGlobalGrayscale", ControlExtendedRules.GrayscaleMode === true);
  if (ControlExtendedRules.ShieldAll) {
    ControlExtendedShowBlocker("Social shield is active", "Control is protecting this focus period across every configured network.");
    return;
  }

  if (ControlExtendedLimitReached) {
    const Limit = Number(Rules.DailyLimitMinutes) || 0;
    ControlExtendedShowBlocker("Daily limit reached", `You have used today’s ${Limit}-minute allowance for ${Application}.`);
    return;
  }

  let IsBlocked = false;
  if (Application === "Instagram") {
    /* ContentFilter owns Instagram's DOM and route pass to avoid a second visual load. */
    IsBlocked = false;
  } else if (Application === "X") {
    IsBlocked = ControlExtendedFilterX(Rules);
  } else if (Application === "Snapchat") {
    IsBlocked = ControlExtendedFilterSnapchat(Rules);
  } else if (Application === "YouTube") {
    IsBlocked = ControlExtendedFilterYouTube(Rules);
  } else if (Application === "TikTok") {
    IsBlocked = ControlExtendedFilterTikTok(Rules);
  } else if (["Reddit", "Threads", "Facebook"].includes(Application)) {
    IsBlocked = ControlExtendedFilterSocialApp(Application, Rules);
  }

  if (!IsBlocked) {
    ControlExtendedRemoveBlocker();
  }
}

function ControlExtendedScheduleFilters() {
  window.clearTimeout(ControlExtendedFilterTimer);
  ControlExtendedFilterTimer = window.setTimeout(ControlExtendedApplyFilters, 90);
}

async function ControlExtendedRefreshLimit() {
  const Application = ControlExtendedGetApplication();
  if (!Application) {
    return;
  }
  const LimitMinutes = Math.max(0, Number(ControlExtendedRules[Application]?.DailyLimitMinutes) || 0);
  if (!ControlExtendedRules[Application]?.Enabled || LimitMinutes === 0) {
    ControlExtendedLimitReached = false;
    ControlExtendedScheduleFilters();
    return;
  }

  const StoredData = await chrome.storage.local.get("UsageState");
  const UsedToday = Number(StoredData.UsageState?.Days?.[ControlExtendedGetLocalDateKey()]?.[Application]) || 0;
  ControlExtendedLimitReached = ControlExtendedRules[Application]?.Enabled === true && Number(ControlExtendedRules[Application]?.DailyLimitMinutes) === LimitMinutes && UsedToday >= LimitMinutes * 60 * 1000;
  ControlExtendedScheduleFilters();
}


let ControlExtendedSessionStartedAt = Date.now();
let ControlExtendedSessionTimer = null;

function ControlExtendedFormatTimer(Seconds) {
  const Hours = Math.floor(Seconds / 3600);
  const Minutes = Math.floor((Seconds % 3600) / 60);
  const RemainingSeconds = Seconds % 60;
  return Hours > 0
    ? `${Hours}:${String(Minutes).padStart(2, "0")}:${String(RemainingSeconds).padStart(2, "0")}`
    : `${String(Minutes).padStart(2, "0")}:${String(RemainingSeconds).padStart(2, "0")}`;
}

function ControlExtendedDetectLightTheme() {
  const Candidates = [document.body, document.documentElement];
  for (const Candidate of Candidates) {
    if (!Candidate) continue;
    const Color = getComputedStyle(Candidate).backgroundColor;
    const Match = Color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!Match) continue;
    const [Red, Green, Blue] = Match.slice(1).map(Number);
    if (Red + Green + Blue > 30) return (Red * 299 + Green * 587 + Blue * 114) / 1000 > 150;
  }
  return !matchMedia("(prefers-color-scheme: dark)").matches;
}

function ControlExtendedRenderUsageTimer() {
  const Timer = document.getElementById("ControlUsageTimer");
  if (!Timer) return;
  const Seconds = Math.max(0, Math.floor((Date.now() - ControlExtendedSessionStartedAt) / 1000));
  Timer.querySelector("time").textContent = ControlExtendedFormatTimer(Seconds);
  Timer.classList.toggle("IsLight", ControlExtendedDetectLightTheme());
}

async function ControlExtendedInitializeUsageTimer(Application) {
  const ExistingTimer = document.getElementById("ControlUsageTimer");
  if (!ControlExtendedRules[Application]?.Enabled || !ControlExtendedRules.ShowUsageTimer || sessionStorage.getItem("ControlUsageTimerDismissed") === "true") {
    ExistingTimer?.remove();
    window.clearInterval(ControlExtendedSessionTimer);
    return;
  }
  if (ExistingTimer) return;
  const StoredSession = await chrome.storage.local.get("ControlLaunchedSession");
  if (!ControlExtendedRules[Application]?.Enabled || !ControlExtendedRules.ShowUsageTimer || document.getElementById("ControlUsageTimer")) return;
  const Session = StoredSession.ControlLaunchedSession;
  if (Session?.ApplicationKey === Application && Date.now() - Number(Session.StartedAt) < 12 * 60 * 60 * 1000) {
    ControlExtendedSessionStartedAt = Number(Session.StartedAt);
  }
  const Timer = document.createElement("aside");
  Timer.id = "ControlUsageTimer";
  Timer.setAttribute("aria-label", `${Application} session timer`);
  Timer.innerHTML = `<span>${Application}</span><time>00:00</time><button type="button" aria-label="Hide session timer"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></button>`;
  Timer.querySelector("button").onclick = () => {
    sessionStorage.setItem("ControlUsageTimerDismissed", "true");
    Timer.remove();
    window.clearInterval(ControlExtendedSessionTimer);
  };
  document.documentElement.append(Timer);
  ControlExtendedRenderUsageTimer();
  window.clearInterval(ControlExtendedSessionTimer);
  ControlExtendedSessionTimer = window.setInterval(ControlExtendedRenderUsageTimer, 1000);
}

async function ControlExtendedLoadRules() {
  const StoredData = await chrome.storage.sync.get("Rules");
  ControlExtendedRules = ControlExtendedMergeRules(StoredData.Rules);
  ControlExtendedRulesLoaded = true;
  ControlExtendedScheduleFilters();
  await ControlExtendedRefreshLimit();
  const Application = ControlExtendedGetApplication();
  if (Application) await ControlExtendedInitializeUsageTimer(Application);
}

document.addEventListener("click", (Event) => {
  const Link = Event.target instanceof Element ? Event.target.closest("a[href]") : null;
  if (!(Link instanceof HTMLAnchorElement)) {
    return;
  }

  const Application = ControlExtendedGetApplication();
  const Rules = ControlExtendedRules[Application];
  if (!ControlExtendedRulesLoaded || !Rules?.Enabled) {
    return;
  }

  try {
    const Target = new URL(Link.href, location.href);
    const Path = Target.pathname.toLowerCase();
    const IsBlockedXRoute = Application === "X" && Rules.ForYou && (Path === "/" || Path === "/home");
    const IsBlockedYouTubeShort = Application === "YouTube" && Rules.Shorts && Path.startsWith("/shorts");
    if (!IsBlockedXRoute && !IsBlockedYouTubeShort) {
      return;
    }
    Event.preventDefault();
    Event.stopImmediatePropagation();
    ControlExtendedScheduleFilters();
  } catch {
    return;
  }
}, true);

const ControlExtendedDocumentObserver = new MutationObserver(ControlExtendedScheduleFilters);
function ControlExtendedStartDocumentObserver() {
  if (!document.documentElement) return;
  ControlExtendedDocumentObserver.observe(document.documentElement, { childList: true, subtree: true });
}
if (document.documentElement) {
  ControlExtendedStartDocumentObserver();
} else {
  document.addEventListener("readystatechange", ControlExtendedStartDocumentObserver, { once: true });
}
chrome.storage.onChanged.addListener((Changes, AreaName) => {
  if (AreaName === "sync" && Changes.Rules?.newValue) {
    ControlExtendedRestorePage();
    ControlExtendedRules = ControlExtendedMergeRules(Changes.Rules.newValue);
    ControlExtendedRulesLoaded = true;
    ControlExtendedApplyFilters();
    void ControlExtendedRefreshLimit();
    const Application = ControlExtendedGetApplication();
    if (Application) void ControlExtendedInitializeUsageTimer(Application);
  }
  if (AreaName === "local" && Changes.UsageState) {
    void ControlExtendedRefreshLimit();
  }
});
window.setInterval(() => void ControlExtendedRefreshLimit(), 15000);
void ControlExtendedLoadRules();
