(function InitializeControlSensitiveProtection() {
  "use strict";

  const KnownAdultDomains = [
    "onlyfans.com", "fansly.com", "manyvids.com", "justfor.fans", "loyalfans.com", "clips4sale.com",
    "pornhub.com", "xvideos.com", "xnxx.com", "redtube.com", "youporn.com", "xhamster.com",
    "chaturbate.com", "stripchat.com", "myfreecams.com", "livejasmin.com", "bongacams.com", "camsoda.com",
    "fapello.com", "erome.com", "rule34.xxx", "nhentai.net", "literotica.com", "adultfriendfinder.com",
  ];
  const AdultPlatformPattern = /\b(?:only\s?fans|fansly|manyvids|justfor\.fans|loyalfans|clips4sale|pornhub|xvideos|xnxx|xhamster|chaturbate|stripchat|myfreecams|livejasmin|bongacams|camsoda|fapello|erome|nhentai)\b/i;
  const ExplicitPattern = /\b(?:nsfw|porn(?:ography)?|xxx|nudes?|nudity|explicit|erotic(?:a)?|adult\s+content|sexual\s+content|contenu\s+adulte|contenu\s+explicite|porno(?:graphie)?|nudite|erotique)\b/i;
  const AdultMarkerPattern = /(?:\b18\s*\+|\+\s*18\b|🔞|\bNSFW\b|\badults?\s+only\b|\br[eé]serv[eé]\s+aux\s+adultes\b)/i;
  const MonetizationPattern = /\b(?:subscribe|subscription|premium|exclusive|vip|link\s+in\s+bio|lien\s+en\s+bio|abonne(?:ment)?|contenu\s+prive)\b/i;
  const ContentUnitSelector = [
    "article", "[role='article']", "[data-testid='tweet']", "[role='listitem']",
    "ytd-video-renderer", "ytd-rich-item-renderer", "ytd-compact-video-renderer", "ytd-grid-video-renderer",
    "[data-e2e*='feed']", "[data-e2e*='recommend']", "[data-e2e*='story']",
  ].join(",");
  const SearchResultSelector = [
    "[role='listbox'] [role='option']", "[role='listbox'] [role='link']", "[data-testid='typeaheadResult']",
    "[data-e2e='search-user-container']", "[data-e2e*='search-user']", "ytd-channel-renderer",
    "[aria-label*='Search'] a[href]", "[aria-label*='Rechercher'] a[href]", "[role='dialog'] a[href]",
  ].join(",");

  let Rules = { SensitiveContentProtection: false, SensitiveProtectionConfig: {} };
  let DetectedAccounts = new Set();
  const BundledHostVerdicts = new Map();
  let ScanTimer = null;
  let BundledScanRunning = false;

  function NormalizeDomain(Value) {
    const Candidate = String(Value ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").replace(/:\d+$/, "");
    return Candidate.includes(".") && !Candidate.includes(" ") ? Candidate : "";
  }

  function NormalizeHandle(Value) {
    return String(Value ?? "").trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._-]/g, "");
  }

  function GetConfig() {
    const Config = Rules.SensitiveProtectionConfig ?? {};
    return {
      Domains: [...KnownAdultDomains, ...(Array.isArray(Config.BlockedDomains) ? Config.BlockedDomains : [])].map(NormalizeDomain).filter(Boolean),
      Keywords: Array.isArray(Config.BlockedKeywords) ? Config.BlockedKeywords.map((Value) => String(Value).trim().toLowerCase()).filter((Value) => Value.length >= 3) : [],
      Accounts: [...new Set([
        ...(Array.isArray(Config.BlockedAccounts) ? Config.BlockedAccounts : []),
        ...DetectedAccounts,
      ].map(NormalizeHandle).filter(Boolean))],
      BlockAdultSites: Config.BlockAdultSites !== false,
      HideDetectedAccounts: Config.HideDetectedAccounts !== false,
    };
  }

  function HostMatches(Hostname, Domains) {
    const Host = NormalizeDomain(Hostname);
    return Domains.some((Domain) => Host === Domain || Host.endsWith(`.${Domain}`));
  }

  function GetUrlHandle(UrlValue) {
    try {
      const Url = new URL(UrlValue, location.href);
      const Segments = Url.pathname.split("/").filter(Boolean);
      const Host = Url.hostname.replace(/^www\./, "");
      if (Host.endsWith("youtube.com") && Segments[0]?.startsWith("@")) return NormalizeHandle(Segments[0]);
      if (Host.endsWith("tiktok.com") && Segments[0]?.startsWith("@")) return NormalizeHandle(Segments[0]);
      if (Host.endsWith("instagram.com") && Segments.length === 1 && !["direct", "explore", "reels", "stories", "accounts", "p"].includes(Segments[0])) return NormalizeHandle(Segments[0]);
      if ((Host === "x.com" || Host.endsWith("twitter.com")) && Segments.length && !["home", "explore", "messages", "search", "i"].includes(Segments[0])) return NormalizeHandle(Segments[0]);
      if (Host.endsWith("snapchat.com") && Segments[0] === "add") return NormalizeHandle(Segments[1]);
    } catch {
      return "";
    }
    return "";
  }

  function TextScore(Text, Config) {
    const Normalized = String(Text ?? "").toLowerCase();
    let Score = 0;
    if (AdultMarkerPattern.test(Normalized)) Score += 4;
    if (AdultPlatformPattern.test(Normalized)) Score += 3;
    if (ExplicitPattern.test(Normalized)) Score += 2;
    if (MonetizationPattern.test(Normalized)) Score += 1;
    if (Config.Keywords.some((Keyword) => Normalized.includes(Keyword))) Score += 4;
    return Score;
  }

  function ElementSignalsSensitive(Element, Config) {
    const Text = `${Element.textContent ?? ""} ${Element.getAttribute?.("aria-label") ?? ""} ${Element.getAttribute?.("title") ?? ""}`;
    if (TextScore(Text, Config) >= 4) return true;
    for (const Link of Element.querySelectorAll?.("a[href]") ?? []) {
      try {
        const Target = new URL(Link.href, location.href);
        if (HostMatches(Target.hostname, Config.Domains)) return true;
        const Handle = GetUrlHandle(Target.href);
        if (Handle && Config.Accounts.includes(Handle)) return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  function ProtectionEnabled() {
    // Adult-content protection is independent of social distraction controls.
    return Rules.SensitiveContentProtection === true;
  }

  function RestoreSensitiveContent() {
    document.querySelectorAll('[data-control-sensitive-hidden]').forEach(Node => Node.removeAttribute('data-control-sensitive-hidden'));
    RemoveBlockedProfile();
  }

  function HideUnit(Node) {
    if (!ProtectionEnabled() || !(Node instanceof Element)) return;
    Node.setAttribute("data-control-sensitive-hidden", "true");
  }

  function GetClosestResultUnit(Element) {
    return Element.closest(SearchResultSelector) ?? Element.closest(ContentUnitSelector) ?? Element.closest("li, [role='option'], [role='link'], [role='button']") ?? Element;
  }

  async function RememberDetectedAccount(Handle) {
    const Normalized = NormalizeHandle(Handle);
    if (!Normalized || DetectedAccounts.has(Normalized)) return;
    DetectedAccounts.add(Normalized);
    const Stored = await chrome.storage.local.get("DetectedSensitiveAccounts");
    const Accounts = [...new Set([...(Array.isArray(Stored.DetectedSensitiveAccounts) ? Stored.DetectedSensitiveAccounts : []), AccountScope()+':'+Normalized])].slice(-2000);
    await chrome.storage.local.set({ DetectedSensitiveAccounts: Accounts });
  }

  function HideSensitiveSearchResults(Config) {
    for (const Result of document.querySelectorAll(SearchResultSelector)) {
      const Link = Result.matches("a[href]") ? Result : Result.querySelector("a[href]");
      const Handle = Link ? GetUrlHandle(Link.href) : "";
      if ((Handle && Config.Accounts.includes(Handle)) || ElementSignalsSensitive(Result, Config)) HideUnit(GetClosestResultUnit(Result));
    }
  }

  async function ScanBundledLinkHosts() {
    if (BundledScanRunning || !ProtectionEnabled()) return;
    const LinksByHost = new Map();
    for (const Link of document.querySelectorAll("a[href]")) {
      try {
        const Target = new URL(Link.href, location.href);
        const Host = NormalizeDomain(Target.hostname);
        if (!Host || Host === NormalizeDomain(location.hostname)) continue;
        if (!LinksByHost.has(Host)) LinksByHost.set(Host, []);
        LinksByHost.get(Host).push(Link);
      } catch {
        continue;
      }
    }
    const UnknownHosts = [...LinksByHost.keys()].filter((Host) => !BundledHostVerdicts.has(Host)).slice(0, 250);
    if (UnknownHosts.length) {
      BundledScanRunning = true;
      try {
        const Response = await chrome.runtime.sendMessage({ Type: "CheckSensitiveTargets", Hosts: UnknownHosts });
        const Blocked = new Set(Response?.BlockedHosts ?? []);
        for (const Host of UnknownHosts) BundledHostVerdicts.set(Host, Blocked.has(Host));
      } catch {
        for (const Host of UnknownHosts) BundledHostVerdicts.set(Host, false);
      } finally {
        BundledScanRunning = false;
      }
    }
    for (const [Host, Links] of LinksByHost) {
      if (!BundledHostVerdicts.get(Host)) continue;
      for (const Link of Links) HideUnit(GetClosestResultUnit(Link));
    }
  }

  function GetProfileHandle() {
    return GetUrlHandle(location.href);
  }
  function AccountScope() {
    const host=location.hostname.toLowerCase().replace(/^(www|mobile|m)\./,'');
    return host==='twitter.com'?'x.com':host;
  }
  function ScopedAccounts(values) {
    const prefix=AccountScope()+':';
    // Old unscoped automatic detections are not reused across unrelated networks.
    return new Set((Array.isArray(values)?values:[]).filter(value=>typeof value==='string'&&value.startsWith(prefix)).map(value=>NormalizeHandle(value.slice(prefix.length))).filter(Boolean));
  }

  function RenderBlockedProfile() {
    if (document.getElementById("ControlSensitiveProfileBlocker")) return;
    const Blocker = document.createElement("section");
    Blocker.id = "ControlSensitiveProfileBlocker";
    Blocker.innerHTML = '<div><span>Control</span><h1>Sensitive profile hidden</h1><p>This account matched your local adult-content protection rules.</p><button type="button">Go back</button></div>';
    Blocker.querySelector("button").onclick = () => history.length > 1 ? history.back() : window.close();
    document.documentElement.append(Blocker);
    document.documentElement.classList.add("ControlSensitiveProfileIsBlocked");
  }

  function RemoveBlockedProfile() {
    document.getElementById("ControlSensitiveProfileBlocker")?.remove();
    document.documentElement.classList.remove("ControlSensitiveProfileIsBlocked");
  }

  function Scan() {
    window.clearTimeout(ScanTimer);
    if (!ProtectionEnabled() || !document.documentElement || /^(?:127\.0\.0\.1|localhost)$/.test(location.hostname)) {
      RestoreSensitiveContent();
      return;
    }
    const Config = GetConfig();
    if (Config.BlockAdultSites && HostMatches(location.hostname, Config.Domains)) {
      RenderBlockedProfile();
      return;
    }
    const CurrentHandle = GetProfileHandle();
    // Only profile metadata can classify an account; a quoted post must not label its author.
    const ProfileBio = document.querySelector('[data-testid="UserDescription"], [data-e2e="user-bio"], .ProfileHeaderCard-bio');
    const ProfileDetectedNow = Boolean(CurrentHandle && Config.HideDetectedAccounts && ProfileBio && ElementSignalsSensitive(ProfileBio, Config));
    const ProfileIsBlocked = Boolean(CurrentHandle && Config.Accounts.includes(CurrentHandle)) || ProfileDetectedNow;
    if (ProfileDetectedNow && CurrentHandle) void RememberDetectedAccount(CurrentHandle);
    if (ProfileIsBlocked) RenderBlockedProfile(); else RemoveBlockedProfile();
    HideSensitiveSearchResults(Config);
    for (const Item of document.querySelectorAll(ContentUnitSelector)) {
      if (ElementSignalsSensitive(Item, Config)) HideUnit(Item);
    }
    for (const Link of document.querySelectorAll("a[href]")) {
      let Sensitive = false;
      try {
        const Target = new URL(Link.href, location.href);
        Sensitive = HostMatches(Target.hostname, Config.Domains) || Config.Accounts.includes(GetUrlHandle(Target.href));
      } catch {
        Sensitive = false;
      }
      if (Sensitive) HideUnit(GetClosestResultUnit(Link));
    }
    void ScanBundledLinkHosts();
  }

  function ScheduleScan() {
    window.clearTimeout(ScanTimer);
    ScanTimer = window.setTimeout(Scan, 120);
  }

  document.addEventListener("click", (Event) => {
    if (!ProtectionEnabled()) return;
    const Link = Event.target instanceof Element ? Event.target.closest("a[href]") : null;
    if (!(Link instanceof HTMLAnchorElement)) return;
    const Config = GetConfig();
    try {
      const Target = new URL(Link.href, location.href);
      if (!HostMatches(Target.hostname, Config.Domains) && !Config.Accounts.includes(GetUrlHandle(Target.href))) return;
      Event.preventDefault();
      Event.stopImmediatePropagation();
      HideUnit(GetClosestResultUnit(Link));
    } catch {
      return;
    }
  }, true);

  const Observer = new MutationObserver(ScheduleScan);
  function Start() {
    if (!document.documentElement) return;
    Observer.observe(document.documentElement, { childList: true, subtree: true });
    void Promise.all([
      chrome.storage.sync.get("Rules"),
      chrome.storage.local.get("DetectedSensitiveAccounts"),
    ]).then(([StoredRules, StoredAccounts]) => {
      Rules = { ...Rules, ...(StoredRules.Rules ?? {}) };
      DetectedAccounts = ScopedAccounts(StoredAccounts.DetectedSensitiveAccounts);
      ScheduleScan();
    });
  }
  chrome.storage.onChanged.addListener((Changes, AreaName) => {
    if (AreaName === "sync" && Changes.Rules?.newValue) {
      RestoreSensitiveContent();
      Rules = { ...Rules, ...Changes.Rules.newValue };
      BundledHostVerdicts.clear();
      ScheduleScan();
    }
    if (AreaName === "local" && Changes.DetectedSensitiveAccounts) {
      DetectedAccounts = ScopedAccounts(Changes.DetectedSensitiveAccounts.newValue);
      ScheduleScan();
    }
  });
  if (document.documentElement) Start(); else document.addEventListener("readystatechange", Start, { once: true });
})();
