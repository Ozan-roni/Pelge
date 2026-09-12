const DefaultRules = {
  StrictMode: true,
  Instagram: {
    Enabled: true,
    Reels: true,
    ForYou: true,
    Explore: true,
    Search: true,
    GridContent: false,
    SearchGridGuard: true,
    SearchScrollLock: true,
    HomeFeed: false,
    HideFollowingPosts: false,
    DMsOnly: false,
    SuggestedPosts: true,
    Stories: false,
  },
  Snapchat: {
    Enabled: true,
    Spotlight: true,
    Stories: true,
    Discover: true,
    Map: true,
    Ads: true,
  },
};

let ActiveRules = structuredClone(DefaultRules);
let CurrentUrl = location.href;
let FilterScheduled = false;
let InstagramRuleReloadTimer = null;
const ForceInstagramDirectMessagesOnly = false;
let LastInstagramShareContext = null;
const ControlOriginalStyles = new Map();
const ControlOriginalLabels = new Map();
let ControlCoreRulesLoaded = false;
let ControlCoreRestored = true;

const InstagramBlockedText = {
  SuggestedPosts: [
    "suggested for you",
    "suggested posts",
    "sponsored",
    "sponsoris\u00e9",
    "sponsoris\u00e9e",
    "publicit\u00e9",
    "paid partnership",
    "partenariat r\u00e9mun\u00e9r\u00e9",
    "suggestions pour vous",
    "publications sugg\u00e9r\u00e9es",
  ],
};

const SnapchatHardBlockedLinkFragments = [
  "/discover",
  "/spotlight",
  "/lens",
  "/plus",
  "/stories",
  "/story",
  "/map",
];

const SnapchatBlockedControlTokens = [
  "spotlight",
  "discover_home_page",
  "discover",
  "stories",
  "story",
  "lens_home_page",
  "lenses",
  "snapchat+",
  "snap map",
  "carte snap",
];

function IsInstagram() {
  return location.hostname.endsWith("instagram.com");
}

function IsSnapchat() {
  return location.hostname.endsWith("snapchat.com");
}

function IsPublicSnapchat() {
  return location.hostname === "www.snapchat.com" || location.hostname === "snapchat.com";
}

function NormalizePath() {
  return location.pathname.toLocaleLowerCase("fr-FR");
}

function IncludesAny(Value, Needles) {
  const NormalizedValue = Value.toLocaleLowerCase("fr-FR");
  return Needles.some((Needle) => NormalizedValue.includes(Needle));
}

function RemoveElement(Element) {
  if (!(Element instanceof HTMLElement)) {
    return;
  }

  Element.setAttribute("data-control-filter-hidden", "true");
}

function GetElementSignature(Element) {
  if (!(Element instanceof globalThis.Element)) {
    return "";
  }

  const ImageLabels = Array.from(Element.querySelectorAll("img[alt]"))
    .slice(0, 4)
    .map((ImageElement) => ImageElement.getAttribute("alt") ?? "")
    .join(" ");
  const VisibleText = (Element.textContent ?? "").trim().slice(0, 220);
  return [
    Element.getAttribute("href"),
    Element.getAttribute("aria-label"),
    Element.getAttribute("title"),
    Element.getAttribute("data-testid"),
    Element.getAttribute("data-route"),
    ImageLabels,
    VisibleText,
  ].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");
}

function IsBlockedSnapchatControl(Element) {
  const Signature = GetElementSignature(Element);
  return SnapchatBlockedControlTokens.some((Token) => Signature.includes(Token));
}

function GetRemovableNavigationItem(Element) {
  const ListItem = Element.closest("li, [role='listitem']");

  if (ListItem instanceof HTMLElement && ListItem.textContent?.trim().length < 260) {
    return ListItem;
  }

  return Element instanceof HTMLElement ? Element : null;
}

function RemoveSnapchatBlockedNavigationControls() {
  const NavigationRoots = document.querySelectorAll("nav, header, [role='navigation']");

  for (const NavigationRoot of NavigationRoots) {
    const Controls = NavigationRoot.querySelectorAll("a, button, [role='button'], [role='tab']");

    for (const Control of Controls) {
      if (IsBlockedSnapchatControl(Control)) {
        RemoveElement(GetRemovableNavigationItem(Control));
      }
    }
  }
}

function RemoveSnapchatBlockedFramesAndPanels() {
  const StoryAndSpotlightDocks = document.querySelectorAll(".tCfts.n_KES");

  for (const StoryAndSpotlightDock of StoryAndSpotlightDocks) {
    const ContainsPublicTabs = Boolean(
      StoryAndSpotlightDock.querySelector(
        ".OwWqx[title*='stories' i], .OwWqx[title*='spotlight' i]",
      ),
    );

    if (ContainsPublicTabs) {
      RemoveElement(StoryAndSpotlightDock);
    }
  }

  const StoryRows = document.querySelectorAll("[role='listitem']");

  for (const StoryRow of StoryRows) {
    if (!(StoryRow instanceof HTMLElement)) {
      continue;
    }

    const StoryCards = StoryRow.querySelectorAll(".Qz2mt .xh7V_ .AFBnk");
    const ContainsStoryAvatar = Boolean(StoryRow.querySelector(".Qz2mt .LPo2u"));
    const DeclaredHeight = Number.parseFloat(StoryRow.style.height);
    const IsStorySizedRow = (DeclaredHeight >= 80 && DeclaredHeight <= 130) || StoryCards.length >= 2;

    if (ContainsStoryAvatar && IsStorySizedRow) {
      RemoveElement(StoryRow);
    }
  }

  const SpotlightCarousels = document.querySelectorAll(
    ".S4e9r.UnaIb .swiper.swiper-vertical, .S4e9r.UnaIb video.nauoE, .FDMBo > .swiper.swiper-vertical",
  );

  for (const SpotlightCarousel of SpotlightCarousels) {
    const SpotlightFrame = SpotlightCarousel.closest(".S4e9r.UnaIb") ??
      SpotlightCarousel.closest(".FDMBo") ??
      SpotlightCarousel;
    RemoveElement(SpotlightFrame);
  }

  const VerticalCarousels = document.querySelectorAll(".swiper.swiper-vertical");

  for (const VerticalCarousel of VerticalCarousels) {
    const ContainsSpotlightMedia = Boolean(
      VerticalCarousel.querySelector("video.nauoE, .swiper-slide .P9uMP, a[href*='snapchat.com/@']"),
    );

    if (!ContainsSpotlightMedia) {
      continue;
    }

    const SpotlightFrame = VerticalCarousel.closest(".S4e9r.UnaIb") ??
      VerticalCarousel.closest(".FDMBo") ??
      VerticalCarousel;
    RemoveElement(SpotlightFrame);
  }

  const EmbeddedFrames = document.querySelectorAll("iframe");

  for (const EmbeddedFrame of EmbeddedFrames) {
    if (IsBlockedSnapchatControl(EmbeddedFrame)) {
      RemoveElement(EmbeddedFrame);
    }
  }

  const LabelledPanels = document.querySelectorAll(
    "aside[aria-label], section[aria-label], [role='region'][aria-label], aside[data-testid], section[data-testid]",
  );

  for (const Panel of LabelledPanels) {
    if (!(Panel instanceof HTMLElement) || !IsBlockedSnapchatControl(Panel)) {
      continue;
    }

    const Bounds = Panel.getBoundingClientRect();
    const IsSubstantialPanel = Bounds.width >= 160 && Bounds.height >= 240;

    if (IsSubstantialPanel) {
      RemoveElement(Panel);
    }
  }
}

function GetSnapchatApplicationRoot() {
  const MainElement = document.querySelector("main");
  return MainElement?.firstElementChild instanceof HTMLElement ? MainElement.firstElementChild : null;
}

function FindSnapchatSidebar(ApplicationRoot) {
  const RootChildren = Array.from(ApplicationRoot.children);

  return RootChildren.find((Element) => {
    if (!(Element instanceof HTMLElement)) {
      return false;
    }

    const ElementBounds = Element.getBoundingClientRect();
    return ElementBounds.x < 20 && ElementBounds.width >= 260 && ElementBounds.width <= 460 && ElementBounds.height >= 500;
  }) ?? null;
}

function HideSnapchatStoriesRow(ApplicationRoot) {
  const Sidebar = FindSnapchatSidebar(ApplicationRoot);
  const Navigation = Sidebar?.querySelector("nav");

  if (!(Navigation instanceof HTMLElement)) {
    return;
  }

  const NavigationBounds = Navigation.getBoundingClientRect();
  const ListItems = Navigation.querySelectorAll("[role='listitem']");

  for (const ListItem of ListItems) {
    if (!(ListItem instanceof HTMLElement)) {
      continue;
    }

    const ItemBounds = ListItem.getBoundingClientRect();
    const IsStoriesHeight = ItemBounds.height >= 88 && ItemBounds.height <= 150;
    const IsFirstNavigationItem = ItemBounds.y <= NavigationBounds.y + 12;
    const ContainsStoryControl = Boolean(ListItem.querySelector("button"));

    if (IsStoriesHeight && IsFirstNavigationItem && ContainsStoryControl) {
      RemoveElement(ListItem);
      return;
    }
  }
}

function FindSnapchatContentShell(ApplicationRoot) {
  const RootChildren = Array.from(ApplicationRoot.children);

  return RootChildren.find((Element) => {
    if (!(Element instanceof HTMLElement)) {
      return false;
    }

    const ElementBounds = Element.getBoundingClientRect();
    return ElementBounds.x >= 250 && ElementBounds.width >= 500 && ElementBounds.height >= 500;
  }) ?? null;
}

function HideSnapchatEntertainmentPanel(ApplicationRoot) {
  const ContentShell = FindSnapchatContentShell(ApplicationRoot);
  const SplitPanel = ContentShell?.firstElementChild;

  if (!(SplitPanel instanceof HTMLElement)) {
    return;
  }

  const SplitBounds = SplitPanel.getBoundingClientRect();
  const PanelCandidates = Array.from(SplitPanel.children).filter((Element) => Element instanceof HTMLElement);
  let EntertainmentPanel = PanelCandidates.find((Element) => {
    const ElementBounds = Element.getBoundingClientRect();
    const IsRightColumn = ElementBounds.x >= SplitBounds.x + SplitBounds.width * 0.55;
    const IsNarrowColumn = ElementBounds.width > 160 && ElementBounds.width <= SplitBounds.width * 0.45;
    const ContainsEntertainment = Boolean(Element.querySelector("video, a[href*='/@']"));
    return IsRightColumn && IsNarrowColumn && ContainsEntertainment;
  });

  if (!(EntertainmentPanel instanceof HTMLElement)) {
    const ApplicationBounds = ApplicationRoot.getBoundingClientRect();
    const FallbackCandidates = Array.from(ApplicationRoot.querySelectorAll("aside, section, div"))
      .filter((Element) => {
        if (!(Element instanceof HTMLElement)) {
          return false;
        }

        const ElementBounds = Element.getBoundingClientRect();
        const IsRightPanel = ElementBounds.x >= ApplicationBounds.x + ApplicationBounds.width * 0.7;
        const HasPanelDimensions = ElementBounds.width >= 180 &&
          ElementBounds.width <= ApplicationBounds.width * 0.4 &&
          ElementBounds.height >= ApplicationBounds.height * 0.65;
        const ContainsPublicContent = Boolean(Element.querySelector("video, a[href*='/@'], a[href*='/spotlight']"));
        return IsRightPanel && HasPanelDimensions && ContainsPublicContent;
      })
      .sort((FirstElement, SecondElement) => {
        const FirstBounds = FirstElement.getBoundingClientRect();
        const SecondBounds = SecondElement.getBoundingClientRect();
        return (SecondBounds.width * SecondBounds.height) - (FirstBounds.width * FirstBounds.height);
      });

    EntertainmentPanel = FallbackCandidates[0] ?? null;
  }

  if (EntertainmentPanel instanceof HTMLElement) {
    RemoveElement(EntertainmentPanel);
  }

  const ConversationPanel = PanelCandidates.find((Element) => {
    if (Element === EntertainmentPanel) {
      return false;
    }

    const ElementBounds = Element.getBoundingClientRect();
    return ElementBounds.x < SplitBounds.x + SplitBounds.width * 0.25 && ElementBounds.width >= SplitBounds.width * 0.45;
  });

  if (ConversationPanel instanceof HTMLElement) {
    if (!ControlOriginalStyles.has(ConversationPanel)) ControlOriginalStyles.set(ConversationPanel, ConversationPanel.getAttribute("style"));
    ConversationPanel.style.setProperty("flex", "1 1 auto", "important");
    ConversationPanel.style.setProperty("max-width", "none", "important");
    ConversationPanel.style.setProperty("width", "100%", "important");
  }
}

function HideSnapchatPublicNavigation() {
  const ChatLink = Array.from(document.querySelectorAll("a[href]")).find((Link) => {
    try {
      return new URL(Link.href).pathname.startsWith("/web");
    } catch {
      return false;
    }
  });
  const ConsumerNavigation = ChatLink?.closest("nav");
  const GlobalNavigation = ConsumerNavigation?.parentElement?.closest("nav");

  if (!(GlobalNavigation instanceof HTMLElement) || !(ConsumerNavigation instanceof HTMLElement)) {
    return;
  }

  for (const NavigationLink of ConsumerNavigation.querySelectorAll("a[href]")) {
    let IsChatLink = false;

    try {
      IsChatLink = new URL(NavigationLink.href).pathname.startsWith("/web");
    } catch {
      IsChatLink = false;
    }

    if (!IsChatLink) {
      RemoveElement(NavigationLink.closest("li") ?? NavigationLink);
    }
  }

  for (const NavigationSection of GlobalNavigation.children) {
    if (!(NavigationSection instanceof HTMLElement)) {
      continue;
    }

    const ContainsChat = NavigationSection.contains(ConsumerNavigation);
    const ContainsSearch = Boolean(NavigationSection.querySelector('input, [role="textbox"]'));
    const ContainsSnapchatLogo = Array.from(NavigationSection.querySelectorAll("a[href]"))
      .some((Link) => {
        try {
          const TargetUrl = new URL(Link.href);
          const IsMainSnapchatHost = TargetUrl.hostname === "www.snapchat.com" || TargetUrl.hostname === "snapchat.com";
          const IsGraphicLogo = (Link.textContent ?? "").trim() === "";
          return IsMainSnapchatHost && TargetUrl.pathname === "/" && IsGraphicLogo;
        } catch {
          return false;
        }
      });

    if (!ContainsChat && !ContainsSearch && !ContainsSnapchatLogo) {
      RemoveElement(NavigationSection);
    }
  }
}

function HideMatchingLinks(PathFragments) {
  const Links = document.querySelectorAll("a[href]");

  for (const Link of Links) {
    const RawHref = Link.getAttribute("href") ?? "";
    const NormalizedHref = RawHref.toLocaleLowerCase("fr-FR");

    if (PathFragments.some((Fragment) => NormalizedHref.includes(Fragment))) {
      RemoveElement(Link.closest("li, [role='listitem'], [role='button']") ?? Link);
    }
  }
}

function GetSnapchatBlockingState() {
  const Rules = ActiveRules.Snapchat;
  const IsStrict = Rules.DMsOnly === true;

  return {
    Spotlight: IsStrict || Rules.Spotlight === true,
    Stories: IsStrict || Rules.Stories === true,
    Discover: IsStrict || Rules.Discover === true,
    Map: IsStrict || Rules.Map === true,
    Ads: IsStrict || Rules.Ads === true,
  };
}

function IsBlockedSnapchatUrl(RawUrl) {
  try {
    const TargetUrl = new URL(RawUrl, location.href);

    if (!TargetUrl.hostname.endsWith("snapchat.com")) {
      return false;
    }

    const Path = TargetUrl.pathname.toLocaleLowerCase("fr-FR");
    const BlockingState = GetSnapchatBlockingState();
    const IsTargetPublicSite = TargetUrl.hostname === "www.snapchat.com" || TargetUrl.hostname === "snapchat.com";

    if (ActiveRules.Snapchat.DMsOnly === true && IsTargetPublicSite && !Path.startsWith("/web")) {
      return true;
    }

    return (BlockingState.Spotlight && (Path.includes("spotlight") || Path.startsWith("/@"))) ||
      (BlockingState.Stories && (Path.includes("stories") || Path.includes("story"))) ||
      (BlockingState.Discover && (Path.includes("discover") || Path.startsWith("/@"))) ||
      (BlockingState.Map && Path.includes("map")) ||
      (ActiveRules.Snapchat.DMsOnly === true && (Path.includes("lens") || Path.includes("plus")));
  } catch {
    return false;
  }
}

function BlockSnapchatNavigation(Event) {
  if (!IsSnapchat() || !ActiveRules.Snapchat?.Enabled) {
    return;
  }

  const Control = Event.target instanceof Element
    ? Event.target.closest("a[href], button, [role='button'], [role='tab']")
    : null;
  const TargetUrl = Control instanceof HTMLAnchorElement ? Control.href : "";
  const IsBlockedControl = Control instanceof Element && IsBlockedSnapchatControl(Control);

  if (!(IsBlockedControl || (TargetUrl && IsBlockedSnapchatUrl(TargetUrl)))) {
    return;
  }

  Event.preventDefault();
  Event.stopImmediatePropagation();
  ShowBlocker("This Snapchat section is sealed", "Control keeps only the camera, photographs and conversations.", "/web");
}

function RemoveSnapchatHardBlockedControls() {
  if (!IsSnapchat() || !ActiveRules.Snapchat?.Enabled) {
    return;
  }

  for (const Link of document.querySelectorAll("nav a[href]")) {
    const RawHref = (Link.getAttribute("href") ?? "").toLocaleLowerCase("fr-FR");

    if (SnapchatHardBlockedLinkFragments.some((Fragment) => RawHref.includes(Fragment))) {
      RemoveElement(Link.closest("li, [role='listitem']") ?? Link);
    }
  }

  RemoveSnapchatBlockedNavigationControls();
  RemoveSnapchatBlockedFramesAndPanels();
}

function HideCardsContainingText(Needles) {
  const Candidates = document.querySelectorAll("article, section, [role='dialog'], [role='listitem']");

  for (const Candidate of Candidates) {
    const CandidateText = Candidate.textContent ?? "";

    if (CandidateText.length < 8000 && IncludesAny(CandidateText, Needles)) {
      RemoveElement(Candidate);
    }
  }
}

function IsInstagramFeedPost(Article) {
  if (!(Article instanceof HTMLElement) || Article.closest("aside, nav, header") || Article.querySelector("article")) {
    return false;
  }

  return Boolean(Article.querySelector('a[href^="/p/"], a[href^="/reel/"]'));
}

function HideInstagramForYouTabs() {
  const ForYouLabels = new Set(["for you", "pour vous"]);
  for (const Tab of document.querySelectorAll('[role="tab"], button, a[href], [role="button"], [role="link"]')) {
    const Label = (Tab.textContent ?? "").trim().toLocaleLowerCase("fr-FR");
    if (!ForYouLabels.has(Label)) {
      continue;
    }

    const Wrapper = Tab.parentElement;
    const Target = Wrapper instanceof HTMLElement && Wrapper.children.length === 1 ? Wrapper : Tab;
    RemoveElement(Target);
  }
}

function UpdateInstagramHomeFeedGuard(ShouldHide) {
  for (const HiddenElement of document.querySelectorAll('[data-control-home-feed-post="true"], [data-control-home-feed-surface="true"]')) {
    HiddenElement.removeAttribute("data-control-home-feed-post");
    HiddenElement.removeAttribute("data-control-home-feed-surface");
  }

  if (!ShouldHide) {
    return;
  }

  const Main = document.querySelector("main");
  if (!(Main instanceof HTMLElement)) {
    return;
  }

  for (const Article of Main.querySelectorAll("article")) {
    if (!IsInstagramFeedPost(Article)) {
      continue;
    }

    Article.setAttribute("data-control-home-feed-post", "true");

    const FeedSurface = Article.closest('[style*="--x-width"][style*="470px"]');
    if (FeedSurface instanceof HTMLElement && Main.contains(FeedSurface)) {
      FeedSurface.setAttribute("data-control-home-feed-surface", "true");
        }
  }

  for (const FeedSurface of Main.querySelectorAll('[style*="--x-width"][style*="470px"]')) {
    const HasVirtualFeed = Boolean(
      FeedSurface.querySelector('article, [style*="padding-bottom"][style*="position: relative"], [role="progressbar"]'),
    );
    if (!(FeedSurface instanceof HTMLElement) || !HasVirtualFeed) {
      continue;
    }

    FeedSurface.setAttribute("data-control-home-feed-surface", "true");
  }
}

function HideInstagramSuggestedFeedPosts() {
  const Main = document.querySelector("main");
  if (!(Main instanceof HTMLElement)) {
    return;
  }

  for (const Article of Main.querySelectorAll("article")) {
    if (!IsInstagramFeedPost(Article)) {
      continue;
    }

    const Text = Article.textContent ?? "";
    if (Text.length < 8000 && IncludesAny(Text, InstagramBlockedText.SuggestedPosts)) {
      RemoveElement(Article);
    }
  }
}

function RemoveBlocker() {
  document.getElementById("ControlRouteBlocker")?.remove();
  document.documentElement.classList.remove("ControlRouteIsBlocked");
}

function ShowBlocker(Title, Description, SafeUrl) {
  document.getElementById("ControlExtendedBlocker")?.remove();
  let Blocker = document.getElementById("ControlRouteBlocker");

  if (!Blocker) {
    Blocker = document.createElement("section");
    Blocker.id = "ControlRouteBlocker";
    Blocker.innerHTML = `
      <div class="ControlRouteCard" role="dialog" aria-modal="true" aria-labelledby="ControlRouteTitle">
        <div class="ControlRouteMark" aria-hidden="true"><img src="${chrome.runtime.getURL("assets/ControlSelectedWhiteIcon128.png")}" alt=""><span class="ControlRouteLock"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span></div>
        <p class="ControlRouteEyebrow">CONTROL \u00b7 PROTECTED ROUTE</p>
        <h1 id="ControlRouteTitle"></h1>
        <p id="ControlRouteDescription"></p>
        <button id="ControlRouteSafeButton" type="button">Return to messages</button>
      </div>
    `;
    document.documentElement.append(Blocker);
  }

  Blocker.dataset.controlGlass = typeof ControlExtendedDetectLightTheme === "function" && ControlExtendedDetectLightTheme() ? "light" : "dark";
  const TitleElement = Blocker.querySelector("#ControlRouteTitle");
  const DescriptionElement = Blocker.querySelector("#ControlRouteDescription");
  const SafeButton = Blocker.querySelector("#ControlRouteSafeButton");

  if (TitleElement) {
    TitleElement.textContent = Title;
  }

  if (DescriptionElement) {
    DescriptionElement.textContent = Description;
  }

  if (SafeButton instanceof HTMLButtonElement) {
    SafeButton.onclick = () => location.assign(SafeUrl);
  }

  document.documentElement.classList.add("ControlRouteIsBlocked");
}


function GetInstagramSearchInput() {
  return document.querySelector('input[placeholder*="search" i], input[aria-label*="search" i], input[placeholder*="recherche" i], input[aria-label*="recherche" i]');
}

function HasInstagramSearchQuery() {
  const SearchInput = GetInstagramSearchInput();
  return SearchInput instanceof HTMLInputElement && SearchInput.value.trim().length > 0;
}




const InstagramReservedRoutes = new Set([
  "", "accounts", "challenge", "direct", "explore", "p", "reel", "reels", "stories", "web", "about", "legal",
]);

function IsInstagramProfilePath(Path) {
  const Segments = Path.split("/").filter(Boolean);
  return Segments.length >= 1 && !InstagramReservedRoutes.has(Segments[0].toLowerCase());
}

function GetChosenInstagramProfilePath() {
  return sessionStorage.getItem("ControlInstagramChosenProfile") ?? "";
}

function IsChosenInstagramProfileMedia(Path) {
  return sessionStorage.getItem("ControlInstagramChosenProfileMedia") === Path;
}

function GetInstagramDiscoveryContainers() {
  const Containers = new Set();
  for (const Grid of document.querySelectorAll('main div[style*="--x-gridTemplateColumns"]')) {
    const ColumnList = Grid.parentElement;
    const InnerViewport = ColumnList?.parentElement;
    const DiscoveryContainer = InnerViewport?.parentElement;
    if (!(DiscoveryContainer instanceof HTMLElement)) continue;
    if (!DiscoveryContainer.querySelector('a[href*="/p/"], a[href*="/reel/"], video, svg[aria-label="Reel"], svg[aria-label="Carousel"]')) continue;
    Containers.add(DiscoveryContainer);
  }
  return [...Containers];
}

function IsInstagramSearchSurface() {
  const Path = NormalizePath();
  if (IsInstagramProfilePath(Path)) return false;
  if (Path.startsWith("/explore")) return true;
  const SearchInput = GetInstagramSearchInput();
  if (!(SearchInput instanceof HTMLInputElement)) return false;
  return [...document.querySelectorAll("span, button, [role='tab']")].some((Element) => {
    const Text = (Element.textContent ?? "").trim().toLowerCase();
    return Text === "for you" || Text === "not personalized" || Text === "pour vous" || Text === "non personnalis\u00e9";
  });
}

function UpdateInstagramIdleDiscoveryGuard(ShouldHide) {
  for (const Element of document.querySelectorAll('[data-control-idle-explore="true"]')) {
    Element.removeAttribute("data-control-idle-explore");
  }
  if (!ShouldHide) return;
  for (const DiscoveryContainer of GetInstagramDiscoveryContainers()) {
    DiscoveryContainer.setAttribute("data-control-idle-explore", "true");
  }
  const Scope = document.querySelector("main") ?? document.body;
  if (!Scope) return;
  for (const Link of Scope.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]')) {
    Link.setAttribute("data-control-idle-explore", "true");
  }
  for (const Label of Scope.querySelectorAll("span, button, [role='tab']")) {
    const Text = (Label.textContent ?? "").trim().toLowerCase();
    if (!["for you", "not personalized", "pour vous", "non personnalis\u00e9"].includes(Text)) continue;
    const Control = Label.closest("button, [role='tab']") ?? Label;
    Control.setAttribute("data-control-idle-explore", "true");
  }
}

function IsInstagramIntentionalPostPath(Path) {
  return Path.startsWith("/p/") && sessionStorage.getItem("ControlInstagramIntentionalPost") === Path;
}

function RemoveInstagramContinuationControls() {
  if (!ActiveRules.Instagram?.SearchScrollLock) return;
  const Path = NormalizePath();
  if (!IsInstagramIntentionalPostPath(Path)) return;
  for (const LabeledControl of document.querySelectorAll('[aria-label*="next" i], [aria-label*="previous" i], [aria-label*="suivant" i], [aria-label*="pr\u00e9c\u00e9dent" i]')) {
    const Control = LabeledControl.closest('button, [role="button"], a[href]') ?? LabeledControl;
    RemoveElement(Control);
  }
}

function BlockInstagramContinuation(Event) {
  if (!IsInstagram() || !ActiveRules.Instagram?.Enabled || !ActiveRules.Instagram?.SearchScrollLock || !IsInstagramIntentionalPostPath(NormalizePath())) return;
  if (Event.type === "keydown" && !["ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(Event.key)) return;
  if (Event.type === "wheel" || Event.type === "touchmove") {
    Event.preventDefault();
    Event.stopImmediatePropagation();
    return;
  }
  const LabeledTarget = Event.target instanceof Element ? Event.target.closest("[aria-label]") : null;
  const Target = Event.target instanceof Element ? Event.target.closest('button, [role="button"], a[href]') : null;
  const Signature = `${GetElementSignature(Target)} ${GetElementSignature(LabeledTarget)}`;
  if (Event.type !== "keydown" && !/(next|previous|suivant|pr\u00e9c\u00e9dent|chevron)/i.test(Signature)) return;
  Event.preventDefault();
  Event.stopImmediatePropagation();
}

function BlockInstagramExploreMediaNavigation(Event) {
  if (!IsInstagram() || !ActiveRules.Instagram?.Enabled) {
    return;
  }

  const IsSearchSurface = IsInstagramSearchSurface();
  const Link = Event.target instanceof Element ? Event.target.closest("a[href]") : null;
  if (!(Link instanceof HTMLAnchorElement)) {
    return;
  }

  try {
    const TargetUrl = new URL(Link.href, location.href);
    const TargetPath = TargetUrl.pathname.toLowerCase();
    const IsExploreMedia = TargetPath.startsWith("/p/") || TargetPath.startsWith("/reel/") || TargetPath.startsWith("/reels/");
    const CurrentPath = NormalizePath();
    if (IsSearchSurface && IsInstagramProfilePath(TargetPath)) {
      sessionStorage.setItem("ControlInstagramChosenProfile", TargetPath.replace(/\/$/, ""));
      sessionStorage.removeItem("ControlInstagramChosenProfileMedia");
      sessionStorage.removeItem("ControlInstagramIntentionalPost");
      return;
    }
    if (IsExploreMedia && IsInstagramProfilePath(CurrentPath)) {
      sessionStorage.setItem("ControlInstagramChosenProfileMedia", TargetPath);
      sessionStorage.removeItem("ControlInstagramIntentionalPost");
      return;
    }
    if (!IsExploreMedia) {
      return;
    }
    if (!IsSearchSurface) {
      sessionStorage.removeItem("ControlInstagramIntentionalPost");
      sessionStorage.removeItem("ControlInstagramChosenProfileMedia");
      return;
    }
    const HasQuery = HasInstagramSearchQuery();
    const IsReel = TargetPath.startsWith("/reel/") || TargetPath.startsWith("/reels/");
    if (HasQuery && !IsReel && TargetPath.startsWith("/p/")) {
      sessionStorage.setItem("ControlInstagramIntentionalPost", TargetPath);
      return;
    }
    Event.preventDefault();
    Event.stopImmediatePropagation();
  } catch {
    return;
  }
}

function HideInstagramReelsNavigation() {
  const PermanentSelectors = [
    'nav a[href="/reels"]',
    'nav a[href="/reels/"]',
    'nav a[href^="/reels"]',
    'aside a[href="/reels"]',
    'aside a[href="/reels/"]',
    'aside a[href^="/reels"]',
    'nav [aria-label*="Reels" i]',
    'aside [aria-label*="Reels" i]',
    'nav [title*="Reels" i]',
    'aside [title*="Reels" i]',
  ];
  for (const Match of document.querySelectorAll(PermanentSelectors.join(","))) {
    const Control = Match.closest('a, button, [role="link"], [role="button"], [role="tab"]') ?? Match;
    RemoveElement(Control.closest("li") ?? Control);
  }
  for (const Label of document.querySelectorAll("nav span, nav div, aside span, aside div")) {
    if ((Label.textContent ?? "").trim().toLowerCase() !== "reels") continue;
    const Control = Label.closest('a, button, [role="link"], [role="button"], [role="tab"]') ?? Label;
    RemoveElement(Control.closest("li") ?? Control);
  }
}

function GetInstagramEventTargetPath(Event) {
  const Target = Event.target instanceof Element ? Event.target.closest("a[href]") : null;
  if (!(Target instanceof HTMLAnchorElement)) return "";
  try {
    return new URL(Target.getAttribute("href") ?? "", location.origin).pathname.toLocaleLowerCase("fr-FR");
  } catch {
    return "";
  }
}

function BlockInstagramCoreNavigation(Event) {
  if (!IsInstagram() || !ActiveRules.Instagram?.Enabled) return;
  const TargetPath = GetInstagramEventTargetPath(Event);
  const Label = Event.target instanceof Element
    ? GetInstagramSurfaceLabel(Event.target.closest('a, button, [role="link"], [role="button"], [role="tab"]') ?? Event.target)
    : "";
  const WantsReels = TargetPath.startsWith("/reels") || TargetPath.startsWith("/reel/") || Label === "reels";
  const WantsExplore = TargetPath.startsWith("/explore");
  const WantsStories = TargetPath.startsWith("/stories/");

  if (
    (ActiveRules.Instagram.Reels === true && WantsReels && !IsChosenInstagramProfileMedia(TargetPath)) ||
    (ActiveRules.Instagram.Search === false && WantsExplore) ||
    (ActiveRules.Instagram.Stories === true && WantsStories)
  ) {
    Event.preventDefault();
    Event.stopImmediatePropagation();
  }
}

function GetInstagramRouteKind(Path) {
  if (Path.startsWith("/direct/")) return "direct";
  if (Path.startsWith("/stories/")) return "story";
  if (Path.startsWith("/explore")) return "search";
  if (Path.startsWith("/p/") || Path.startsWith("/reel/")) return "media";
  if (IsInstagramProfilePath(Path)) return "profile";
  return "home";
}

function FindInstagramPrimaryNavigation() {
  return [...document.querySelectorAll("nav")].find((Navigation) => {
    const Links = [...Navigation.querySelectorAll("a[href]")];
    const HasMessages = Links.some((Link) => (Link.getAttribute("href") ?? "").startsWith("/direct/"));
    const HasHomeOrSearch = Links.some((Link) => {
      const Href = Link.getAttribute("href") ?? "";
      return Href === "/" || Href.startsWith("/explore");
    });
    return HasMessages && HasHomeOrSearch;
  }) ?? null;
}

function FindInstagramStoriesTray() {
  const Main = document.querySelector("main");
  if (!(Main instanceof HTMLElement)) return null;

  const NativeStoryLinks = [...Main.querySelectorAll('a[href*="/stories/"]')];
  const StoryControls = NativeStoryLinks.length >= 2
    ? NativeStoryLinks
    : [...Main.querySelectorAll('button, [role="button"]')].filter((Control) => {
      if (!(Control instanceof HTMLElement) || Control.closest('nav, aside, [role="dialog"]')) return false;
      const Bounds = Control.getBoundingClientRect();
      if (Bounds.top < 24 || Bounds.top > 360 || Bounds.width < 50 || Bounds.width > 170 || Bounds.height < 50 || Bounds.height > 210) return false;
      const Image = Control.querySelector("img");
      if (!(Image instanceof HTMLImageElement)) return false;
      const ImageBounds = Image.getBoundingClientRect();
      return ImageBounds.width >= 38 && ImageBounds.width <= 126 && Math.abs(ImageBounds.width - ImageBounds.height) <= 18;
    });
  if (StoryControls.length < 2) return null;

  let BestCandidate = null;
  let BestSize = Number.POSITIVE_INFINITY;
  for (const StoryControl of StoryControls.slice(0, 16)) {
    let Candidate = StoryControl.parentElement;
    for (let Depth = 0; Candidate && Depth < 9; Depth += 1, Candidate = Candidate.parentElement) {
      if (Candidate.matches("main, body") || Candidate.closest('[role="dialog"]')) break;
      const ContainedStories = StoryControls.filter((Control) => Candidate.contains(Control)).length;
      const CandidateSize = Candidate.querySelectorAll("*").length;
      if (ContainedStories >= Math.min(2, StoryControls.length) && CandidateSize < BestSize) {
        BestCandidate = Candidate;
        BestSize = CandidateSize;
      }
    }
  }
  return BestCandidate;
}
function GetInstagramSurfaceLabel(Element) {
  if (!(Element instanceof HTMLElement)) return "";
  return [
    Element.textContent,
    Element.getAttribute("aria-label"),
    Element.getAttribute("title"),
    ...[...Element.querySelectorAll("[aria-label], [title]")].slice(0, 8).flatMap((Child) => [
      Child.getAttribute("aria-label"),
      Child.getAttribute("title"),
    ]),
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().toLowerCase();
}

function GetInstagramDirectChild(Element, Boundary) {
  let Candidate = Element;
  while (Candidate.parentElement && Candidate.parentElement !== Boundary) Candidate = Candidate.parentElement;
  return Candidate;
}

function MarkInstagramStoriesExperience(StoriesTray) {
  if (!(StoriesTray instanceof HTMLElement)) return;
  StoriesTray.setAttribute("data-control-ig-stories", "true");

  for (const StoryLink of StoriesTray.querySelectorAll('a[href^="/stories/"], button, [role="button"]')) {
    if (StoryLink.closest("#ControlInstagramOwnStoryItem")) continue;
    const StoryItem = GetInstagramDirectChild(StoryLink, StoriesTray);
    if (!(StoryItem instanceof HTMLElement)) continue;
    const Label = GetInstagramSurfaceLabel(StoryItem);
    const HasAddControl = Boolean(StoryItem.querySelector('[aria-label*="add" i], [aria-label*="ajouter" i], [title*="add" i], [title*="ajouter" i]'));
    const IsOwnStory = HasAddControl || ["your story", "votre story", "your profile photo", "votre photo de profil"].some((Text) => Label.includes(Text));
    const IsRecentHighlight = ["recent highlight", "recent highlights", "contenu à la une récent", "nouvelle story à la une", "new highlight"].some((Text) => Label.includes(Text));
    StoryItem.setAttribute("data-control-ig-story-item", "true");
    if (IsOwnStory) {
      StoryItem.setAttribute("data-control-ig-own-story", "true");
      EnsureInstagramStoryLauncher(StoryItem, "tray");
    }
    if (IsRecentHighlight) StoryItem.setAttribute("data-control-ig-recent-highlight", "true");
  }
}

function MarkInstagramSearchExperience(SearchInput, SearchPanel) {
  if (!(SearchInput instanceof HTMLInputElement)) return;
  SearchPanel?.setAttribute("data-control-ig-search-panel", "true");
  for (const PreviousField of document.querySelectorAll("[data-control-ig-search-field]")) {
    PreviousField.removeAttribute("data-control-ig-search-field");
  }

  let SearchField = SearchInput.parentElement;
  let BestField = SearchField;
  for (let Depth = 0; SearchField && Depth < 5 && SearchField !== SearchPanel; Depth += 1) {
    const Bounds = SearchField.getBoundingClientRect();
    if (Bounds.height > 0 && Bounds.height <= 74) BestField = SearchField;
    SearchField = SearchField.parentElement;
  }
  BestField?.setAttribute("data-control-ig-search-field", "true");
}
function MarkInstagramDirectExperience(Main) {
  if (!(Main instanceof HTMLElement)) return;
  Main.setAttribute('data-control-ig-direct', 'true');
  // Old text-based matching framed entire message rows mentioning "note" or "music".
  document.querySelectorAll('[data-control-ig-direct-tool]').forEach(Node => Node.removeAttribute('data-control-ig-direct-tool'));
  document.querySelectorAll('[data-control-ig-notes]').forEach(Node => Node.removeAttribute('data-control-ig-notes'));
  const OwnNote = [...Main.querySelectorAll('button, [role="button"]')].find(Node => {
    if (Node.closest('[role="log"], #ControlInstagramMobileFeatureDock')) return false;
    const Label = (Node.getAttribute('aria-label') || Node.getAttribute('title') || Node.textContent || '').trim();
    return /^(your note|leave a note|votre note|laisser une note|your status|votre statut)$/i.test(Label) && Node.querySelector('img,svg');
  });
  if (!OwnNote) return;
  let Row = OwnNote.parentElement, Candidate = null;
  for (let Depth=0; Row && Row!==Main && Depth<5; Depth++, Row=Row.parentElement) {
    const Bounds=Row.getBoundingClientRect();
    if(Bounds.height>240 || Bounds.width>600 || Row.querySelector('textarea,[contenteditable="true"],a[href^="/direct/t/"]')) break;
    if(Bounds.height>=70 && Bounds.width>=180) Candidate=Row;
  }
  Candidate?.setAttribute('data-control-ig-notes','true');
}

function GetInstagramOwnProfileImageSource() {
  const PrimaryNavigation = FindInstagramPrimaryNavigation();
  const StoriesTray = document.querySelector('[data-control-ig-stories="true"]');
  const CandidateRecords = [...document.querySelectorAll("img")]
    .filter((Image) => Image instanceof HTMLImageElement && Boolean(Image.currentSrc || Image.src))
    .map((Image) => {
      const Bounds = Image.getBoundingClientRect();
      const Link = Image.closest("a[href]");
      const Path = (Link?.getAttribute("href") ?? "").toLowerCase();
      const Label = GetInstagramSurfaceLabel(Link ?? Image);
      const Alt = (Image.getAttribute("alt") ?? "").toLowerCase();
      let Score = 0;
      if (IsInstagramProfilePath(Path)) Score += 90;
      if (PrimaryNavigation?.contains(Image)) Score += 130;
      if (Image.closest("nav, aside")) Score += 75;
      if (Bounds.left < Math.min(250, window.innerWidth * .2)) Score += 65;
      if (Bounds.left > window.innerWidth * .58 && Bounds.top >= 20 && Bounds.top < 170) Score += 80;
      if (Bounds.top >= 20 && Bounds.top < 170) Score += 24;
      if (["profile", "profil", "profile photo", "profile picture", "photo de profil"].some((Text) => Label.includes(Text) || Alt.includes(Text))) Score += 75;
      if (StoriesTray?.contains(Image) || Link?.getAttribute("href")?.includes("/stories/")) Score -= 220;
      return { Bounds, Image, Path, Score };
    })
    .filter(({ Bounds }) => Bounds.width >= 18 && Bounds.width <= 160 && Bounds.height >= 18 && Bounds.height <= 160 && Math.abs(Bounds.width - Bounds.height) <= 22)
    .sort((Left, Right) => Right.Score - Left.Score);

  const BestRecord = CandidateRecords.find(({ Score }) => Score >= 80);
  const BestCandidate = BestRecord?.Image;
  const Source = BestCandidate instanceof HTMLImageElement
    ? BestCandidate.currentSrc || BestCandidate.src
    : sessionStorage.getItem("ControlInstagramOwnProfileImageSource") ?? "";
  if (Source) sessionStorage.setItem("ControlInstagramOwnProfileImageSource", Source);
  if (BestRecord && IsInstagramProfilePath(BestRecord.Path)) {
    sessionStorage.setItem("ControlInstagramOwnProfilePath", BestRecord.Path.replace(/\/$/, ""));
  }
  return Source;
}
function FindInstagramNativeOwnStoryControl(StoriesTray) {
  if (!(StoriesTray instanceof HTMLElement)) return null;
  const OwnProfilePath = sessionStorage.getItem("ControlInstagramOwnProfilePath") ?? "";
  const OwnProfileImageSource = sessionStorage.getItem("ControlInstagramOwnProfileImageSource") ?? "";
  const OwnUsername = OwnProfilePath.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  const OwnStoryTerms = [
    "your story", "votre story", "your profile photo", "votre photo de profil",
    "add to story", "add to your story", "ajouter à la story", "ajouter à votre story",
  ];
  const SearchRoot = StoriesTray.closest("main") ?? StoriesTray.parentElement ?? StoriesTray;
  const TrayBounds = StoriesTray.getBoundingClientRect();

  return [...SearchRoot.querySelectorAll('a, button, [role="button"], [role="link"]')].find((Control) => {
    if (!(Control instanceof HTMLElement) || Control.id === "ControlInstagramOwnStoryItem" || Control.closest("#ControlInstagramOwnStoryItem")) return false;
    const Bounds = Control.getBoundingClientRect();
    const IsBesideStories = Bounds.width >= 42 && Bounds.width <= 180 && Bounds.height >= 42 && Bounds.height <= 190
      && Bounds.top >= TrayBounds.top - 48 && Bounds.top <= TrayBounds.bottom + 36;
    if (!IsBesideStories) return false;
    const Label = GetInstagramSurfaceLabel(Control);
    const HasOwnStoryLabel = OwnStoryTerms.some((Term) => Label.includes(Term));
    const HasNativeAddControl = Boolean(Control.querySelector('[aria-label*="add" i], [aria-label*="ajouter" i], [title*="add" i], [title*="ajouter" i]'));
    const Avatar = Control.querySelector("img");
    const AvatarSource = Avatar instanceof HTMLImageElement ? Avatar.currentSrc || Avatar.src : "";
    const HasOwnAvatar = Boolean(OwnProfileImageSource && AvatarSource === OwnProfileImageSource);
    const Href = Control instanceof HTMLAnchorElement ? Control.getAttribute("href") ?? "" : Control.closest("a[href]")?.getAttribute("href") ?? "";
    const IsOwnStoryLink = OwnUsername && Href.toLowerCase().startsWith(`/stories/${OwnUsername}/`);
    return HasOwnStoryLabel || HasNativeAddControl || HasOwnAvatar || Boolean(IsOwnStoryLink);
  }) ?? null;
}

function EnsureInstagramOwnStoryItem(StoriesTray) {
  if (!(StoriesTray instanceof HTMLElement)) return;
  const ProfileImageSource = GetInstagramOwnProfileImageSource();
  if (!ProfileImageSource) return;

  const NativeOwnStoryControl = FindInstagramNativeOwnStoryControl(StoriesTray);
  if (NativeOwnStoryControl instanceof HTMLElement) {
    document.getElementById("ControlInstagramOwnStoryItem")?.remove();
    StoriesTray.removeAttribute("data-control-ig-own-story-track");
    StoriesTray.querySelectorAll("[data-control-ig-shifted-story]").forEach((StoryItem) => StoryItem.removeAttribute("data-control-ig-shifted-story"));
    return;
  }

  const NativeStoryLinks = [...StoriesTray.querySelectorAll('a[href*="/stories/"]')];
  const NativeStoryControls = NativeStoryLinks.length > 0
    ? NativeStoryLinks
    : [...StoriesTray.querySelectorAll('button, [role="button"]')].filter((Control) => {
      if (!(Control instanceof HTMLElement) || Control.id === "ControlInstagramOwnStoryItem") return false;
      const Image = Control.querySelector("img");
      if (!(Image instanceof HTMLImageElement)) return false;
      const Bounds = Image.getBoundingClientRect();
      return Bounds.width >= 38 && Bounds.width <= 126 && Math.abs(Bounds.width - Bounds.height) <= 18;
    });
  const NativeStoryItems = new Set(NativeStoryControls.map((Control) => GetInstagramDirectChild(Control, StoriesTray)));
  NativeStoryItems.forEach((StoryItem) => StoryItem instanceof HTMLElement && StoryItem.setAttribute("data-control-ig-shifted-story", "true"));
  StoriesTray.setAttribute("data-control-ig-own-story-track", "true");

  let Item = document.getElementById("ControlInstagramOwnStoryItem");
  if (!Item) {
    Item = document.createElement("button");
    Item.id = "ControlInstagramOwnStoryItem";
    Item.type = "button";
    Item.setAttribute("aria-label", "Ajouter à votre story");
    Item.innerHTML = '<span class="ControlInstagramOwnStoryRing"><img alt="Votre photo de profil"><span class="ControlInstagramOwnStoryAdd" aria-hidden="true">+</span></span><span class="ControlInstagramOwnStoryLabel">Votre story</span>';
    Item.addEventListener("click", (Event) => {
      Event.preventDefault();
      Event.stopPropagation();
      const CurrentTray = FindInstagramStoriesTray();
      const NativeControl = FindInstagramNativeOwnStoryControl(CurrentTray);
      if (NativeControl instanceof HTMLElement) {
        NativeControl.click();
        return;
      }
      OpenInstagramStoryComposer();
    });
  }
  Item.removeAttribute("data-control-ig-has-story");
  delete Item.dataset.storyHref;
  const Avatar = Item.querySelector("img");
  if (Avatar instanceof HTMLImageElement && Avatar.src !== ProfileImageSource) Avatar.src = ProfileImageSource;
  if (Item.parentElement !== StoriesTray || StoriesTray.firstElementChild !== Item) StoriesTray.prepend(Item);
}
function ShowInstagramStoryNotice(Message) {
  let Notice = document.getElementById("ControlInstagramStoryNotice");
  if (!Notice) {
    Notice = document.createElement("aside");
    Notice.id = "ControlInstagramStoryNotice";
    Notice.setAttribute("role", "status");
    document.documentElement.append(Notice);
  }
  Notice.textContent = Message;
  Notice.classList.remove("IsVisible");
  window.requestAnimationFrame(() => Notice.classList.add("IsVisible"));
  window.clearTimeout(Number(Notice.dataset.timeoutId));
  const TimeoutId = window.setTimeout(() => Notice.classList.remove("IsVisible"), 4200);
  Notice.dataset.timeoutId = String(TimeoutId);
}

function CloseInstagramStoryHandoff() {
  const Handoff = document.getElementById("ControlInstagramStoryHandoff");
  if (!Handoff) return;
  Handoff.classList.remove("IsVisible");
  window.setTimeout(() => Handoff.remove(), 260);
}

function OpenInstagramStoryHandoff() {
  document.getElementById("ControlInstagramStoryHandoff")?.remove();
  const IsMobile = navigator.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const Handoff = document.createElement("div");
  Handoff.id = "ControlInstagramStoryHandoff";
  Handoff.setAttribute("role", "dialog");
  Handoff.setAttribute("aria-modal", "true");
  Handoff.setAttribute("aria-labelledby", "ControlInstagramStoryHandoffTitle");
  Handoff.innerHTML = `
    <section class="ControlInstagramHandoffSheet">
      <header class="ControlInstagramHandoffBar">
        <span class="ControlInstagramWindowDots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Instagram Story</span>
        <button type="button" data-control-story-close aria-label="Fermer">×</button>
      </header>
      <div class="ControlInstagramHandoffBody">
        <div class="ControlInstagramHandoffMark" aria-hidden="true"><span>+</span></div>
        <p class="ControlInstagramHandoffEyebrow">CONTINUE IN INSTAGRAM</p>
        <h2 id="ControlInstagramStoryHandoffTitle">${IsMobile ? "Créer votre Story" : "Continuez sur votre téléphone"}</h2>
        <p>${IsMobile
          ? "Control va ouvrir directement la caméra Story d’Instagram. Rien ne sera publié sans votre confirmation."
          : "Instagram réserve l’éditeur de Stories à son application mobile. Ouvrez Control sur votre téléphone puis touchez le même +."}</p>
        <div class="ControlInstagramHandoffFacts" aria-label="Informations">
          <span>Application Instagram</span><span>Publication manuelle</span><span>Compte protégé</span>
        </div>
        <div class="ControlInstagramHandoffActions">
          <button type="button" data-control-open-instagram>${IsMobile ? "Ouvrir Instagram" : "Essayer d’ouvrir Instagram"}<span aria-hidden="true">↗</span></button>
          <button type="button" data-control-story-close>Pas maintenant</button>
        </div>
      </div>
    </section>`;
  Handoff.addEventListener("click", (Event) => {
    if (Event.target === Handoff || Event.target.closest("[data-control-story-close]")) {
      CloseInstagramStoryHandoff();
      return;
    }
    if (Event.target.closest("[data-control-open-instagram]")) {
      window.location.href = "instagram://story-camera";
    }
  });
  document.documentElement.append(Handoff);
  window.requestAnimationFrame(() => Handoff.classList.add("IsVisible"));
}
function OpenInstagramNativeFilePicker() {
  document.getElementById("ControlInstagramStoryHandoff")?.remove();
  const ExistingInput = [...document.querySelectorAll('input[type="file"]')].find((Input) => {
    if (!(Input instanceof HTMLInputElement) || Input.disabled || Input.closest("#ControlInstagramStoryHandoff")) return false;
    const Accept = (Input.accept ?? "").toLowerCase();
    return !Accept || Accept.includes("image") || Accept.includes("video");
  });
  if (ExistingInput instanceof HTMLInputElement) {
    ExistingInput.click();
    return;
  }

  const FileInput = document.createElement("input");
  FileInput.type = "file";
  FileInput.accept = "image/*,video/*";
  FileInput.style.display = "none";
  FileInput.addEventListener("change", () => FileInput.remove(), { once: true });
  FileInput.addEventListener("cancel", () => FileInput.remove(), { once: true });
  document.body.append(FileInput);
  FileInput.click();
}
function OpenInstagramStoryComposer() {
  const NativeCreate = [...document.querySelectorAll('a[href^="/create"], button, [role="button"], [role="link"]')].find((Control) => {
    if (Control.id === "ControlInstagramStoryLauncher") return false;
    const Label = GetInstagramSurfaceLabel(Control);
    return ["create", "cr\u00e9er", "creer"].some((Text) => Label === Text || Label.startsWith(`${Text} `));
  });
  if (!(NativeCreate instanceof HTMLElement)) {
    OpenInstagramNativeFilePicker();
    return;
  }

  NativeCreate.click();
  window.setTimeout(() => {
    const StoryAction = [...document.querySelectorAll('[role="menuitem"], [role="option"], button, [role="button"]')].find((Control) => {
      if (Control.id === "ControlInstagramStoryLauncher") return false;
      const Label = GetInstagramSurfaceLabel(Control);
      return ["story", "your story", "votre story", "histoire"].includes(Label);
    });
    if (StoryAction instanceof HTMLElement) {
      StoryAction.click();
      return;
    }
    OpenInstagramNativeFilePicker();
  }, 320);
}

function EscapeInstagramStoryHtml(Value) {
  return String(Value ?? "").replace(/[&<>'"]/g, (Character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[Character]);
}

function GetInstagramPostCaption(Article, Username) {
  const NoiseTerms = [
    "original audio", "audio original", "more options", "plus d’options", "plus d'options",
    "see translation", "voir la traduction", "view all comments", "voir les commentaires",
    "like", "j’aime", "j'aime", "comment", "share", "partager", "save", "enregistrer",
  ];
  const Candidates = [...Article.querySelectorAll('h1, [data-testid*="caption" i], span[dir="auto"]')]
    .filter((Element) => !Element.closest('button, [role="button"], nav, time'))
    .map((Element) => {
      let Text = (Element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (Text.toLocaleLowerCase("fr-FR").startsWith(Username.toLocaleLowerCase("fr-FR"))) {
        Text = Text.slice(Username.length).replace(/^[\s·:.-]+/, "").trim();
      }
      return { Text, IsHeading: Element.matches("h1, [data-testid*='caption' i]") };
    })
    .filter(({ Text }) => {
      const Normalized = Text.toLocaleLowerCase("fr-FR");
      return Text.length >= 3 && Text.length <= 180 &&
        Normalized !== Username.toLocaleLowerCase("fr-FR") &&
        !NoiseTerms.some((Term) => Normalized.includes(Term));
    })
    .sort((First, Second) => Number(Second.IsHeading) - Number(First.IsHeading) || Second.Text.length - First.Text.length);
  return Candidates[0]?.Text || `Publication partagée par @${Username}`;
}

function GetInstagramPostContext(Article) {
  if (!(Article instanceof HTMLElement)) return null;
  const PostLink = [...Article.querySelectorAll('a[href^="/p/"], a[href^="/reel/"]')]
    .map((Link) => Link.href)
    .find(Boolean);
  const CurrentPath = location.pathname;
  const CurrentPostUrl = /^\/(p|reel)\//.test(CurrentPath) ? location.href : "";
  const ResolvedPostUrl = PostLink || CurrentPostUrl;
  if (!ResolvedPostUrl) return null;
  const ProfileLink = [...Article.querySelectorAll('a[href^="/"]')].find((Link) => {
    try {
      const Segments = new URL(Link.href, location.href).pathname.split("/").filter(Boolean);
      return Segments.length === 1 && !["explore", "reels", "direct", "stories", "accounts"].includes(Segments[0].toLowerCase());
    } catch {
      return false;
    }
  });
  const Images = [...Article.querySelectorAll("img[src]")].filter((Image) => {
    const Bounds = Image.getBoundingClientRect();
    return Image.naturalWidth >= 180 && Image.naturalHeight >= 180 && Bounds.width >= 160 && Bounds.height >= 160;
  });
  const Image = Images.sort((First, Second) => (Second.naturalWidth * Second.naturalHeight) - (First.naturalWidth * First.naturalHeight))[0];
  const Video = [...Article.querySelectorAll("video[poster]")].find((Candidate) => Candidate.poster);
  const Username = ProfileLink
    ? new URL(ProfileLink.href, location.href).pathname.split("/").filter(Boolean)[0]
    : "Instagram";
  const Caption = GetInstagramPostCaption(Article, Username);
  return {
    PostUrl: ResolvedPostUrl,
    ImageUrl: Image?.currentSrc || Image?.src || Video?.poster || "",
    Username,
    Caption,
  };
}

function CaptureInstagramShareContext(Event) {
  const Control = Event.target instanceof Element ? Event.target.closest('button, [role="button"], a[href]') : null;
  if (!(Control instanceof HTMLElement)) return;
  const Label = GetInstagramSurfaceLabel(Control);
  const IsShareAction = Control.hasAttribute("data-control-ig-share") || ["share", "partager"].some((Term) => Label === Term || Label.startsWith(`${Term} `));
  if (!IsShareAction) return;
  const Article = Control.closest("article") ?? (/^\/(p|reel)\//.test(location.pathname) ? document.querySelector("main article") : null);
  const Context = GetInstagramPostContext(Article);
  if (Context) LastInstagramShareContext = { ...Context, CapturedAt: Date.now() };
}

function EnsureInstagramPostStoryButtons() {
  for (const Article of document.querySelectorAll('main article, [role="dialog"] article')) {
    if (!(Article instanceof HTMLElement) || Article.closest("#ControlInstagramPostStoryStudio")) continue;
    if (Article.querySelector("[data-control-post-story-direct]")) continue;
    const ShareControl = [...Article.querySelectorAll('[data-control-ig-share="true"], button, [role="button"]')].find((Candidate) => {
      if (!(Candidate instanceof HTMLElement)) return false;
      if (Candidate.hasAttribute("data-control-ig-share")) return true;
      const Label = GetInstagramSurfaceLabel(Candidate);
      return ["share", "partager"].some((Term) => Label === Term || Label.startsWith(`${Term} `));
    });
    if (!(ShareControl instanceof HTMLElement)) continue;
    const Context = GetInstagramPostContext(Article);
    if (!Context) continue;
    const StoryButton = document.createElement("button");
    StoryButton.type = "button";
    if (!ControlOriginalLabels.has(StoryButton)) ControlOriginalLabels.set(StoryButton, StoryButton.getAttribute("aria-label"));
    StoryButton.setAttribute("data-control-post-story-direct", "true");
    StoryButton.setAttribute("aria-label", "Prévisualiser ce post dans ma Story avec Control");
    StoryButton.title = "Prévisualiser dans ma Story";
    StoryButton.innerHTML = '<span aria-hidden="true">＋</span><b>Story</b>';
    StoryButton.addEventListener("click", (Event) => {
      Event.preventDefault();
      Event.stopPropagation();
      LastInstagramShareContext = { ...Context, CapturedAt: Date.now() };
      OpenInstagramPostStoryStudio(LastInstagramShareContext);
    });
    ShareControl.insertAdjacentElement("afterend", StoryButton);
  }
}

function CloseInstagramPostStoryStudio() {
  const Studio = document.getElementById("ControlInstagramPostStoryStudio");
  if (!Studio) return;
  Studio.classList.remove("IsVisible");
  window.setTimeout(() => Studio.remove(), 220);
}

function RemoveInstagramStoryReturnDock() {
  document.getElementById("ControlInstagramStoryReturnDock")?.remove();
}

function ShowInstagramStoryReturnDock(Context, Draft) {
  RemoveInstagramStoryReturnDock();
  const Dock = document.createElement("aside");
  Dock.id = "ControlInstagramStoryReturnDock";
  Dock.setAttribute("aria-label", "Story Control prête dans Instagram");
  Dock.innerHTML = `
    <button type="button" data-control-story-return>
      <span aria-hidden="true">${EscapeInstagramStoryHtml(String(Context.Username || "Instagram").slice(0, 1).toUpperCase())}</span>
      <i><strong>Story prête dans Instagram</strong><small>Revoir l’aperçu avant de publier</small></i>
    </button>
    <button type="button" data-control-story-return-close aria-label="Masquer ce rappel">×</button>`;
  Dock.addEventListener("click", (Event) => {
    const Target = Event.target instanceof Element ? Event.target : null;
    if (!Target) return;
    if (Target.closest("[data-control-story-return-close]")) {
      RemoveInstagramStoryReturnDock();
      return;
    }
    if (Target.closest("[data-control-story-return]")) {
      OpenInstagramPostStoryStudio(Context, Draft);
    }
  });
  document.documentElement.append(Dock);
  window.requestAnimationFrame(() => Dock.classList.add("IsVisible"));
}

function DrawInstagramStoryRoundedRect(Context, X, Y, Width, Height, Radius) {
  Context.beginPath();
  Context.moveTo(X + Radius, Y);
  Context.arcTo(X + Width, Y, X + Width, Y + Height, Radius);
  Context.arcTo(X + Width, Y + Height, X, Y + Height, Radius);
  Context.arcTo(X, Y + Height, X, Y, Radius);
  Context.arcTo(X, Y, X + Width, Y, Radius);
  Context.closePath();
}

function DrawInstagramStoryContain(Context, Image, X, Y, Width, Height, BackgroundColor) {
  Context.fillStyle = BackgroundColor;
  Context.fillRect(X, Y, Width, Height);
  const Scale = Math.min(Width / Image.naturalWidth, Height / Image.naturalHeight);
  const DrawWidth = Image.naturalWidth * Scale;
  const DrawHeight = Image.naturalHeight * Scale;
  Context.drawImage(Image, X + ((Width - DrawWidth) / 2), Y + ((Height - DrawHeight) / 2), DrawWidth, DrawHeight);
}

function WrapInstagramStoryText(Context, Text, MaximumWidth, MaximumLines = 3) {
  const Words = String(Text ?? "").split(/\s+/).filter(Boolean);
  const Lines = [];
  let CurrentLine = "";
  for (const Word of Words) {
    const Candidate = CurrentLine ? `${CurrentLine} ${Word}` : Word;
    if (Context.measureText(Candidate).width <= MaximumWidth || !CurrentLine) {
      CurrentLine = Candidate;
      continue;
    }
    Lines.push(CurrentLine);
    CurrentLine = Word;
    if (Lines.length >= MaximumLines) break;
  }
  if (CurrentLine && Lines.length < MaximumLines) Lines.push(CurrentLine);
  if (Lines.length === MaximumLines && Words.join(" ").length > Lines.join(" ").length) Lines[MaximumLines - 1] = `${Lines[MaximumLines - 1].replace(/[.\s]+$/, "")}...`;
  return Lines;
}

async function LoadInstagramStoryImage(Context) {
  if (!Context.ImageUrl) return null;
  const Response = await chrome.runtime.sendMessage({ Type: "FetchInstagramStoryAsset", Url: Context.ImageUrl });
  if (!Response?.Success || !Response.DataUrl) return null;
  const StoryImage = new window.Image();
  StoryImage.src = Response.DataUrl;
  await StoryImage.decode();
  return StoryImage;
}

async function RenderInstagramStoryCanvas(Context, Caption, BackgroundColor, TargetCanvas, PreparedImage) {
  const Canvas = TargetCanvas instanceof HTMLCanvasElement ? TargetCanvas : document.createElement("canvas");
  Canvas.width = 1080;
  Canvas.height = 1920;
  const Drawing = Canvas.getContext("2d");
  if (!Drawing) throw new Error("Story preview is unavailable");
  const SelectedBackground = BackgroundColor || "#111318";
  const IsLightBackground = SelectedBackground === "#f2f3f5";
  const PrimaryTextColor = IsLightBackground ? "#111318" : "#ffffff";
  const SecondaryTextColor = IsLightBackground ? "rgba(17,19,24,.58)" : "rgba(255,255,255,.58)";
  Drawing.fillStyle = SelectedBackground;
  Drawing.fillRect(0, 0, Canvas.width, Canvas.height);
  Drawing.fillStyle = IsLightBackground ? "rgba(255,255,255,.76)" : "rgba(255,255,255,.08)";
  DrawInstagramStoryRoundedRect(Drawing, 80, 160, 920, 1600, 52);
  Drawing.fill();

  const Image = PreparedImage === undefined
    ? await LoadInstagramStoryImage(Context).catch(() => null)
    : PreparedImage;
  const MediaX = 120;
  const MediaY = 310;
  const MediaWidth = 840;
  const MediaHeight = 980;
  Drawing.save();
  DrawInstagramStoryRoundedRect(Drawing, MediaX, MediaY, MediaWidth, MediaHeight, 34);
  Drawing.clip();
  if (Image) {
    DrawInstagramStoryContain(Drawing, Image, MediaX, MediaY, MediaWidth, MediaHeight, IsLightBackground ? "#e5e7eb" : "#08090c");
  } else {
    Drawing.fillStyle = IsLightBackground ? "#e5e7eb" : "#252932";
    Drawing.fillRect(MediaX, MediaY, MediaWidth, MediaHeight);
    Drawing.fillStyle = PrimaryTextColor;
    Drawing.font = "600 42px Arial, sans-serif";
    Drawing.textAlign = "center";
    Drawing.fillText("Aperçu du post indisponible", Canvas.width / 2, MediaY + MediaHeight / 2);
  }
  Drawing.restore();
  Drawing.textAlign = "left";
  Drawing.fillStyle = PrimaryTextColor;
  Drawing.font = "700 42px Arial, sans-serif";
  Drawing.fillText(`@${Context.Username}`, 120, 246);
  Drawing.font = "500 34px Arial, sans-serif";
  WrapInstagramStoryText(Drawing, Caption || Context.Caption || "Voir cette publication", 840, 3)
    .forEach((Line, Index) => Drawing.fillText(Line, 120, 1380 + (Index * 48)));
  Drawing.fillStyle = IsLightBackground ? "rgba(17,19,24,.08)" : "rgba(255,255,255,.12)";
  DrawInstagramStoryRoundedRect(Drawing, 120, 1570, 840, 92, 46);
  Drawing.fill();
  Drawing.fillStyle = PrimaryTextColor;
  Drawing.font = "650 30px Arial, sans-serif";
  Drawing.textAlign = "center";
  Drawing.fillText("Voir la publication originale", Canvas.width / 2, 1628);
  Drawing.fillStyle = SecondaryTextColor;
  Drawing.font = "500 22px Arial, sans-serif";
  Drawing.fillText("Préparé localement par Control", Canvas.width / 2, 1718);
  return Canvas;
}

async function BuildInstagramStoryFile(Context, Caption, BackgroundColor, PreparedImage) {
  const Canvas = await RenderInstagramStoryCanvas(Context, Caption, BackgroundColor, null, PreparedImage);
  const Blob = await new Promise((Resolve) => Canvas.toBlob(Resolve, "image/jpeg", .94));
  if (!Blob) throw new Error("Story image generation failed");
  return new File([Blob], `control-story-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function DownloadInstagramStoryFile(FileValue) {
  const Link = document.createElement("a");
  const ObjectUrl = URL.createObjectURL(FileValue);
  Link.href = ObjectUrl;
  Link.download = FileValue.name;
  document.documentElement.append(Link);
  Link.click();
  Link.remove();
  window.setTimeout(() => URL.revokeObjectURL(ObjectUrl), 3000);
}

async function TryOpenInstagramStoryEditor(FileValue) {
  const NativeCreate = FindInstagramActionByTerms(["create", "créer", "creer"]);
  if (!(NativeCreate instanceof HTMLElement)) return false;
  NativeCreate.click();
  await new Promise((Resolve) => window.setTimeout(Resolve, 380));
  const StoryAction = FindInstagramActionByTerms(["story", "your story", "votre story", "histoire"]);
  if (!(StoryAction instanceof HTMLElement)) return false;
  StoryAction.click();
  await new Promise((Resolve) => window.setTimeout(Resolve, 520));
  const Input = [...document.querySelectorAll('input[type="file"]')].find((Candidate) => {
    const Accept = (Candidate.accept ?? "").toLowerCase();
    return Candidate instanceof HTMLInputElement && !Candidate.disabled && (!Accept || Accept.includes("image"));
  });
  if (!(Input instanceof HTMLInputElement)) return false;
  const Transfer = new DataTransfer();
  Transfer.items.add(FileValue);
  Input.files = Transfer.files;
  Input.dispatchEvent(new Event("input", { bubbles: true }));
  Input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

async function CopyInstagramPostLink(Context) {
  try {
    await navigator.clipboard.writeText(Context.PostUrl);
  } catch {
    const Input = document.createElement("textarea");
    Input.value = Context.PostUrl;
    document.documentElement.append(Input);
    Input.select();
    document.execCommand("copy");
    Input.remove();
  }
  ShowInstagramStoryNotice("Lien du post copié.");
}

function OpenInstagramPostStoryStudio(Context, Draft = {}) {
  if (!Context?.PostUrl) {
    ShowInstagramStoryNotice("Ouvrez d’abord le menu Partager du post à republier.");
    return;
  }
  document.getElementById("ControlInstagramPostStoryStudio")?.remove();
  const Studio = document.createElement("div");
  Studio.id = "ControlInstagramPostStoryStudio";
  Studio.setAttribute("data-control-story-studio", "true");
  Studio.setAttribute("role", "dialog");
  Studio.setAttribute("aria-modal", "true");
  Studio.setAttribute("aria-labelledby", "ControlInstagramPostStoryTitle");
  Studio.innerHTML = `
    <section class="ControlInstagramPostStorySheet">
      <header><div><small>CONTROL STORY STUDIO · ÉTAPE 1 SUR 2</small><h2 id="ControlInstagramPostStoryTitle">Prévisualiser la Story</h2></div><button type="button" data-control-post-story-close aria-label="Fermer">×</button></header>
      <div class="ControlInstagramPostStoryLayout">
        <figure class="ControlInstagramPostStoryPreview">
          <div class="ControlInstagramPostStoryCanvasFrame IsLoading"><canvas width="1080" height="1920" data-control-story-preview-canvas aria-label="Aperçu final de la Story"></canvas><span>APERÇU FINAL</span><i data-control-story-preview-state>Chargement du post...</i></div>
          <figcaption>Ce cadre correspond exactement au visuel 9:16 chargé dans l’éditeur Instagram.</figcaption>
        </figure>
        <div class="ControlInstagramPostStoryControls">
          <div class="ControlInstagramPostStoryExact"><strong>Vous gardez le dernier mot</strong><span>Control prépare le visuel et ouvre l’éditeur. Rien ne sera publié sans votre action sur le bouton Instagram.</span></div>
          <label>Message visible dans la Story<input type="text" maxlength="120" value="${EscapeInstagramStoryHtml(Draft.Caption ?? Context.Caption ?? "Voir cette publication")}" data-control-story-caption /></label>
          <fieldset><legend>Fond</legend><button class="IsSelected" type="button" data-control-story-color="#111318" aria-label="Fond noir"></button><button type="button" data-control-story-color="#24324a" aria-label="Fond bleu"></button><button type="button" data-control-story-color="#6d2848" aria-label="Fond rose"></button><button type="button" data-control-story-color="#f2f3f5" aria-label="Fond clair"></button></fieldset>
          <button class="ControlInstagramPostStoryPrimary" type="button" data-control-story-prepare><span>Continuer vers l’éditeur Instagram</span><b aria-hidden="true">→</b></button>
          <button type="button" data-control-story-download>Télécharger le visuel 9:16</button>
          <button type="button" data-control-story-copy>Copier le lien du post</button>
          <a href="https://business.facebook.com/latest/home" target="_blank" rel="noopener">Publier avec Meta Business Suite</a>
          <small><b>Aucune publication automatique.</b> Le lien du post est copié séparément pour que vous puissiez l’ajouter avec le sticker Lien dans Instagram.</small>
        </div>
      </div>
    </section>`;
  let SelectedColor = Draft.BackgroundColor || "#111318";
  let PreviewRenderVersion = 0;
  const PreviewCanvas = Studio.querySelector("[data-control-story-preview-canvas]");
  const PreviewFrame = Studio.querySelector(".ControlInstagramPostStoryCanvasFrame");
  const PreviewState = Studio.querySelector("[data-control-story-preview-state]");
  const CaptionInput = Studio.querySelector("[data-control-story-caption]");
  Studio.querySelectorAll("[data-control-story-color]").forEach((Button) => {
    Button.classList.toggle("IsSelected", Button.getAttribute("data-control-story-color") === SelectedColor);
  });
  const StoryImagePromise = LoadInstagramStoryImage(Context).catch(() => null);
  const RefreshPreview = async () => {
    const RenderVersion = ++PreviewRenderVersion;
    PreviewFrame?.classList.add("IsLoading");
    if (PreviewState) PreviewState.textContent = "Chargement du rendu...";
    const StoryImage = await StoryImagePromise;
    if (RenderVersion !== PreviewRenderVersion || !(PreviewCanvas instanceof HTMLCanvasElement)) return;
    await RenderInstagramStoryCanvas(Context, CaptionInput?.value ?? "", SelectedColor, PreviewCanvas, StoryImage);
    if (RenderVersion !== PreviewRenderVersion) return;
    PreviewFrame?.classList.remove("IsLoading");
    if (PreviewState) PreviewState.textContent = StoryImage ? "Prêt à publier" : "Image source indisponible";
  };
  CaptionInput?.addEventListener("input", () => { void RefreshPreview(); });
  Studio.addEventListener("click", async (Event) => {
    const Target = Event.target instanceof Element ? Event.target : null;
    if (!Target) return;
    if (Event.target === Studio || Target.closest("[data-control-post-story-close]")) {
      CloseInstagramPostStoryStudio();
      return;
    }
    const ColorButton = Target.closest("[data-control-story-color]");
    if (ColorButton instanceof HTMLElement) {
      SelectedColor = ColorButton.dataset.controlStoryColor || SelectedColor;
      Studio.querySelectorAll("[data-control-story-color]").forEach((Button) => Button.classList.toggle("IsSelected", Button === ColorButton));
      void RefreshPreview();
      return;
    }
    if (Target.closest("[data-control-story-copy]")) {
      await CopyInstagramPostLink(Context);
      return;
    }
    const IsPrepare = Boolean(Target.closest("[data-control-story-prepare]"));
    const IsDownload = Boolean(Target.closest("[data-control-story-download]"));
    if (!IsPrepare && !IsDownload) return;
    const Button = Target.closest("button");
    const OriginalContent = Button?.innerHTML;
    if (Button) { Button.disabled = true; Button.textContent = "Préparation..."; }
    try {
      const Caption = Studio.querySelector("[data-control-story-caption]")?.value ?? "";
      const StoryImage = await StoryImagePromise;
      const StoryFile = await BuildInstagramStoryFile(Context, Caption, SelectedColor, StoryImage);
      if (IsPrepare && await TryOpenInstagramStoryEditor(StoryFile)) {
        const CurrentDraft = { Caption, BackgroundColor: SelectedColor };
        CloseInstagramPostStoryStudio();
        ShowInstagramStoryReturnDock(Context, CurrentDraft);
        ShowInstagramStoryNotice("Visuel chargé dans Instagram. Vérifiez l’aperçu puis publiez vous-même.");
        return;
      }
      DownloadInstagramStoryFile(StoryFile);
      await CopyInstagramPostLink(Context);
      ShowInstagramStoryNotice("Visuel 9:16 téléchargé. Ajoutez-le à votre Story puis collez le lien.");
    } catch {
      ShowInstagramStoryNotice("Impossible de préparer ce média. Essayez un autre post public.");
    } finally {
      if (Button?.isConnected) { Button.disabled = false; Button.innerHTML = OriginalContent ?? ""; }
    }
  });
  document.documentElement.append(Studio);
  window.requestAnimationFrame(() => {
    Studio.classList.add("IsVisible");
    void RefreshPreview();
  });
}

function EnsureInstagramPostStoryAction(Dialog) {
  if (!(Dialog instanceof HTMLElement) || Dialog.querySelector("#ControlInstagramPostStoryAction")) return;
  const NativeStoryAction = [...Dialog.querySelectorAll('button, [role="button"], a')].find((Action) => {
    const Label = GetInstagramSurfaceLabel(Action);
    return ["add to story", "add to your story", "ajouter à la story", "ajouter à votre story"].some((Text) => Label.includes(Text));
  });
  if (NativeStoryAction instanceof HTMLElement) {
    NativeStoryAction.setAttribute("data-control-ig-story-action", "true");
  }
  if (!LastInstagramShareContext) return;
  const Action = document.createElement("button");
  Action.id = "ControlInstagramPostStoryAction";
  Action.type = "button";
  Action.innerHTML = '<span aria-hidden="true">＋</span><b>Prévisualiser dans ma Story</b><small>Contrôler le rendu avant Instagram</small>';
  Action.addEventListener("click", (Event) => {
    Event.preventDefault();
    Event.stopPropagation();
    OpenInstagramPostStoryStudio(LastInstagramShareContext);
  });
  Dialog.prepend(Action);
}

function FindInstagramActionByTerms(Terms, Root = document) {
  const NormalizedTerms = Terms.map((Term) => Term.toLocaleLowerCase("fr-FR"));
  return [...Root.querySelectorAll('a[href], button, [role="button"], [role="link"], [role="menuitem"], [role="option"]')].find((Control) => {
    if (!(Control instanceof HTMLElement) || Control.closest("#ControlInstagramMobileFeatureDock, #ControlRouteBlocker, #ControlExtendedBlocker")) return false;
    const Label = GetInstagramSurfaceLabel(Control);
    return NormalizedTerms.some((Term) => Label === Term || Label.includes(Term));
  }) ?? null;
}

function OpenInstagramCreatePost() {
  const NativeCreate = FindInstagramActionByTerms(["create", "créer", "creer", "new post", "nouvelle publication"]);
  if (NativeCreate instanceof HTMLElement) {
    NativeCreate.click();
    return;
  }
  location.href = "/create/select/";
}

function ClickInstagramDirectTool(Action) {
  const ToolTerms = ["note", "notes", "your note", "votre note", "add note", "ajouter une note", "leave a note", "laisser une note"];
  const Tool = FindInstagramActionByTerms(ToolTerms, document.querySelector("main") ?? document);
  if (Tool instanceof HTMLElement) {
    Tool.click();
    return true;
  }
  return false;
}

function OpenInstagramDirectMobileTool(Action) {
  if (GetInstagramRouteKind(NormalizePath()) !== "direct") {
    sessionStorage.setItem("ControlInstagramPendingMobileTool", Action);
    location.href = "/direct/inbox/";
    return;
  }

  if (!ClickInstagramDirectTool(Action)) {
    ShowInstagramStoryNotice("Je ne trouve pas encore le bouton Note natif dans Instagram Web.");
  }
}

function ProcessPendingInstagramMobileTool(RouteKind) {
  if (RouteKind !== "direct") return;
  const PendingAction = sessionStorage.getItem("ControlInstagramPendingMobileTool");
  if (!PendingAction) return;
  sessionStorage.removeItem("ControlInstagramPendingMobileTool");
  window.setTimeout(() => OpenInstagramDirectMobileTool(PendingAction), 650);
}

function EnsureInstagramMobileFeatureDock(RouteKind) {
  if (RouteKind === "story") {
    document.getElementById("ControlInstagramMobileFeatureDock")?.remove();
    return;
  }

  let Dock = document.getElementById("ControlInstagramMobileFeatureDock");
  if (!Dock) {
    Dock = document.createElement("aside");
    Dock.id = "ControlInstagramMobileFeatureDock";
    Dock.setAttribute("aria-label", "Instagram mobile features");
    Dock.innerHTML = `
      <button type="button" title="Story" data-control-ig-mobile-action="story"><span aria-hidden="true">+</span><b class="ControlInstagramMobileFeatureLabel">Story</b></button>
      <button type="button" title="Note" data-control-ig-mobile-action="note"><span aria-hidden="true">Aa</span><b class="ControlInstagramMobileFeatureLabel">Note</b></button>
      <button type="button" title="Post" data-control-ig-mobile-action="post"><span aria-hidden="true">□</span><b class="ControlInstagramMobileFeatureLabel">Post</b></button>`;
    Dock.addEventListener("click", (Event) => {
      const Button = Event.target instanceof Element ? Event.target.closest("[data-control-ig-mobile-action]") : null;
      if (!(Button instanceof HTMLElement)) return;
      Event.preventDefault();
      Event.stopPropagation();
      const Action = Button.dataset.controlIgMobileAction;
      if (Action === "story") OpenInstagramStoryComposer();
      if (Action === "note") OpenInstagramDirectMobileTool("note");
      if (Action === "post") OpenInstagramCreatePost();
    });
    document.documentElement.append(Dock);
  }
  Dock.dataset.route = RouteKind;
  const Notes = RouteKind==='direct' ? document.querySelector('[data-control-ig-notes="true"]') : null;
  Dock.hidden = RouteKind==='direct' && !Notes;
  // Join the existing notes area in normal flow instead of floating over the inbox header.
  if (Notes?.parentElement) {
    if (Notes.previousElementSibling!==Dock) Notes.before(Dock);
    Dock.dataset.placement='notes';
  } else {
    if (Dock.parentElement!==document.documentElement) document.documentElement.append(Dock);
    Dock.removeAttribute('data-placement');
  }
}

function EnsureInstagramStoryLauncher(Host, Placement) {
  if (!(Host instanceof HTMLElement)) return;
  let Launcher = document.getElementById("ControlInstagramStoryLauncher");
  if (!Launcher) {
    Launcher = document.createElement("button");
    Launcher.id = "ControlInstagramStoryLauncher";
    Launcher.type = "button";
    Launcher.setAttribute("aria-label", "Create a Story");
    Launcher.innerHTML = '<span aria-hidden="true">+</span>';
    Launcher.addEventListener("click", (Event) => {
      Event.preventDefault();
      Event.stopPropagation();
      OpenInstagramStoryComposer();
    });
  }
  Launcher.dataset.placement = Placement;
  if (Launcher.parentElement !== Host) Host.append(Launcher);
  Host.setAttribute("data-control-ig-story-launcher-host", "true");
}

function ResetInstagramProfileViewport(Main) {
  if (!(Main instanceof HTMLElement)) return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  Main.scrollTop = 0;
  let ScrollContainer = Main.parentElement;
  for (let Depth = 0; ScrollContainer && Depth < 8; Depth += 1, ScrollContainer = ScrollContainer.parentElement) {
    if (ScrollContainer.scrollTop !== 0) ScrollContainer.scrollTop = 0;
  }
}
function ApplyInstagramDesktopExperience() {
  const Root = document.documentElement;
  const Path = NormalizePath();
  const RouteKind = GetInstagramRouteKind(Path);
  const IsDesktop = window.innerWidth >= 860;
  const PreviousRouteKind = Root.dataset.controlInstagramRoute;

  Root.dataset.controlInstagramRoute = RouteKind;
  Root.removeAttribute("data--control-instagram-route" );
  if (PreviousRouteKind && PreviousRouteKind !== RouteKind) {
    Root.classList.remove("ControlInstagramRouteChanging");
    window.requestAnimationFrame(() => {
      Root.classList.add("ControlInstagramRouteChanging");
      window.setTimeout(() => Root.classList.remove("ControlInstagramRouteChanging"), 430);
    });
  }

  const BackgroundColor = document.body ? getComputedStyle(document.body).backgroundColor : "";
  const ColorMatch = BackgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const IsLight = window.ControlInstagramVisuals ? window.ControlInstagramVisuals.lightTheme() : ColorMatch
    ? Number(ColorMatch[1]) + Number(ColorMatch[2]) + Number(ColorMatch[3]) > 420
    : !matchMedia("(prefers-color-scheme: dark)").matches;
  Root.classList.toggle("ControlInstagramLight", IsLight);
  Root.classList.toggle("ControlInstagramPolished", IsDesktop);

  if (RouteKind !== "story") {
    document.querySelector("[data-control-ig-story-viewer]")?.removeAttribute("data-control-ig-story-viewer");
  }
  for (const ProfileHost of document.querySelectorAll('[data-control-ig-profile-launcher-host="true"]')) {
    ProfileHost.removeAttribute("data-control-ig-story-launcher-host");
    ProfileHost.removeAttribute("data-control-ig-profile-launcher-host");
    ProfileHost.style.removeProperty("--ControlIgProfileLauncherLeft");
    ProfileHost.style.removeProperty("--ControlIgProfileLauncherTop");
  }
  document.querySelectorAll('#ControlInstagramStoryLauncher[data-placement="profile"]').forEach((ProfileLauncher) => ProfileLauncher.remove());
  for (const PreviousStoryTrack of document.querySelectorAll("[data-control-ig-own-story-track]")) PreviousStoryTrack.removeAttribute("data-control-ig-own-story-track");
  for (const ShiftedStory of document.querySelectorAll("[data-control-ig-shifted-story]")) ShiftedStory.removeAttribute("data-control-ig-shifted-story");
  for (const DecoratedStoryTray of document.querySelectorAll("[data-control-ig-stories]")) {
    DecoratedStoryTray.removeAttribute("data-control-ig-stories");
    DecoratedStoryTray.querySelectorAll("[data-control-ig-story-item], [data-control-ig-own-story], [data-control-ig-recent-highlight]").forEach((StoryItem) => {
      StoryItem.removeAttribute("data-control-ig-story-item");
      StoryItem.removeAttribute("data-control-ig-own-story");
      StoryItem.removeAttribute("data-control-ig-recent-highlight");
    });
  }
  if (RouteKind !== "home" || ActiveRules.Instagram?.Stories === true) {
    const TrayLauncher = document.querySelector('#ControlInstagramStoryLauncher[data-placement="tray"]');
    TrayLauncher?.parentElement?.removeAttribute("data-control-ig-story-launcher-host");
    TrayLauncher?.remove();
    document.getElementById("ControlInstagramOwnStoryItem")?.remove();
  }

  if (!IsDesktop) {
    document.getElementById("ControlInstagramMobileFeatureDock")?.remove();
    document.querySelectorAll('[data-control-ig-notes]').forEach(Node => Node.removeAttribute('data-control-ig-notes'));
    return;
  }

  const Navigation = FindInstagramPrimaryNavigation();
  Navigation?.setAttribute("data-control-ig-rail", "true");

  const Main = document.querySelector("main");
  if (Main instanceof HTMLElement) {
    Main.setAttribute("data-control-ig-main", "true");
    if (RouteKind === "story") {
      Main.setAttribute("data-control-ig-story-viewer", "true");
    }
    if (RouteKind === "direct") MarkInstagramDirectExperience(Main);
    if (RouteKind === "profile" && PreviousRouteKind !== "profile") {
      window.requestAnimationFrame(() => ResetInstagramProfileViewport(Main));
      window.setTimeout(() => ResetInstagramProfileViewport(Main), 160);
    }
  }

  if (RouteKind === "home" && ActiveRules.Instagram?.Stories !== true) {
    const StoriesTray = FindInstagramStoriesTray();
    EnsureInstagramOwnStoryItem(StoriesTray);
  }

  const SearchInput = GetInstagramSearchInput();
  if (SearchInput instanceof HTMLInputElement) {
    const SearchPanel = SearchInput.closest('[role="dialog"]') ?? SearchInput.parentElement?.parentElement;
    MarkInstagramSearchExperience(SearchInput, SearchPanel);
  }

  MarkInstagramNativeInteractions(RouteKind);
  EnsureInstagramMobileFeatureDock(RouteKind);
  ProcessPendingInstagramMobileTool(RouteKind);

}
function MarkInstagramNativeInteractions(RouteKind) {
  for (const Match of document.querySelectorAll('[aria-label*="share" i], [aria-label*="partager" i], [title*="share" i], [title*="partager" i]')) {
    const Control = Match.closest('button, [role="button"], a[href]') ?? Match;
    if (!Control.closest("nav")) Control.setAttribute("data-control-ig-share", "true");
  }
  MarkInstagramPostVisualSystem();
  EnsureInstagramPostStoryButtons();

  for (const CreateControl of document.querySelectorAll('a[href^="/create"], [aria-label*="create" i], [aria-label*="cr\u00e9er" i]')) {
    (CreateControl.closest('a, button, [role="button"], [role="link"]') ?? CreateControl)
      .setAttribute("data-control-ig-create", "true");
  }

  const VisibleDialogs = [...document.querySelectorAll('[role="dialog"]')].filter((Dialog) => {
    if (!(Dialog instanceof HTMLElement)) return false;
    if (Dialog.id === "ControlInstagramPostStoryStudio" || Dialog.closest("#ControlInstagramPostStoryStudio")) return false;
    const Bounds = Dialog.getBoundingClientRect();
    return Bounds.width > 0 && Bounds.height > 0;
  });
  const HasRecentShareContext = LastInstagramShareContext &&
    Date.now() - Number(LastInstagramShareContext.CapturedAt || 0) < 15000;
  const RecentShareDialog = HasRecentShareContext ? VisibleDialogs.at(-1) : null;

  for (const Dialog of VisibleDialogs) {
    if (Dialog.closest("#ControlRouteBlocker, #ControlExtendedBlocker, #ControlInstagramPostStoryStudio")) continue;
    const Bounds = Dialog.getBoundingClientRect();
    if (RouteKind === "story" && Bounds.width > window.innerWidth * .88 && Bounds.height > window.innerHeight * .88) continue;
    Dialog.setAttribute("data-control-ig-sheet", "true");
    const DialogLabel = GetInstagramSurfaceLabel(Dialog);
    const IsShareDialog = Dialog === RecentShareDialog ||
      ["share", "send to", "partager", "envoyer à", "envoyer a"].some((Text) => DialogLabel.includes(Text));
    if (IsShareDialog) {
      Dialog.setAttribute("data-control-ig-share-sheet", "true");
      EnsureInstagramPostStoryAction(Dialog);
    }
    if (["create new post", "créer une publication", "new post", "nouvelle publication", "add to story", "ajouter à la story"].some((Text) => DialogLabel.includes(Text))) {
      Dialog.setAttribute("data-control-ig-composer", "true");
    }
    for (const Action of Dialog.querySelectorAll('button, [role="button"], a')) {
      const Label = GetInstagramSurfaceLabel(Action);
      if (["add to story", "ajouter \u00e0 la story", "ajouter \u00e0 votre story", "add to your story"].some((Text) => Label.includes(Text))) {
        Action.setAttribute("data-control-ig-story-action", "true");
      }
      if (["music", "musique", "collage", "add yours", "ajout perso", "gallery", "galerie"].some((Text) => Label.includes(Text))) {
        Action.setAttribute("data-control-ig-composer-action", "true");
      }
    }
  }
}

function MarkInstagramPostDetailsBranch(StartElement, Article) {
  let Current = StartElement;
  for (let Depth = 0; Current && Current !== Article && Depth < 12; Depth += 1) {
    if (Current instanceof HTMLElement) Current.setAttribute("data-control-ig-post-details", "true");
    Current = Current.parentElement;
  }
}

function MarkInstagramPostVisualSystem() {
  for (const Article of document.querySelectorAll('main article, [role="dialog"] article')) {
    if (!(Article instanceof HTMLElement) || Article.closest("#ControlInstagramPostStoryStudio")) continue;
    const HasPostMedia = Boolean(Article.querySelector('video, a[href^="/p/"], a[href^="/reel/"], svg[aria-label="Carousel" i], svg[aria-label="Carrousel" i]'));
    if (!HasPostMedia) continue;
    Article.setAttribute("data-control-ig-post", "true");

    const Header = Article.querySelector("header");
    if (Header instanceof HTMLElement) Header.setAttribute("data-control-ig-post-header", "true");

    for (const ActionGroup of Article.querySelectorAll("section, div")) {
      if (!(ActionGroup instanceof HTMLElement) || ActionGroup.closest("header")) continue;
      const ActionCount = ActionGroup.querySelectorAll('button, [role="button"], a[role="link"]').length;
      if (ActionCount < 2) continue;
      ActionGroup.setAttribute("data-control-ig-post-actions", "true");
      MarkInstagramPostDetailsBranch(ActionGroup, Article);
    }

    for (const Label of Article.querySelectorAll('button, [role="button"], span')) {
      const Text = (Label.textContent ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("fr-FR");
      if (!["see translation", "voir la traduction"].includes(Text)) continue;
      const TranslationControl = Label.closest('button, [role="button"]') ?? Label;
      TranslationControl.setAttribute("data-control-ig-post-translation", "true");
      MarkInstagramPostDetailsBranch(TranslationControl, Article);
    }
  }
}

function EnsureInstagramFollowingRoute(IsHomeRoute, IsFollowingRoute, HideFollowingPosts) {
  const AttemptKey = "ControlInstagramFollowingTarget";
  if (!IsHomeRoute) {
    sessionStorage.removeItem(AttemptKey);
    return false;
  }

  const Target = HideFollowingPosts ? "home" : "following";
  const IsAlreadyCorrect = HideFollowingPosts ? !IsFollowingRoute : IsFollowingRoute;
  if (IsAlreadyCorrect) {
    sessionStorage.removeItem(AttemptKey);
    return false;
  }
  if (sessionStorage.getItem(AttemptKey) === Target) return false;

  sessionStorage.setItem(AttemptKey, Target);
  const TargetUrl = new URL(location.href);
  TargetUrl.pathname = "/";
  TargetUrl.search = "";
  if (Target === "following") TargetUrl.searchParams.set("variant", "following");
  location.replace(TargetUrl.toString());
  return true;
}

function RestoreCorePage() {
  if (ControlCoreRestored) return;
  ControlCoreRestored = true;
  RemoveBlocker();
  UpdateInstagramHomeFeedGuard(false);
  UpdateInstagramIdleDiscoveryGuard(false);
  document.querySelectorAll('[data-control-filter-hidden]').forEach(Node => Node.removeAttribute('data-control-filter-hidden'));
  for (const ClassName of [...document.documentElement.classList]) {
    if (/^Control(?:Instagram|Snapchat)/.test(ClassName)) document.documentElement.classList.remove(ClassName);
  }
  document.querySelectorAll('[id^="ControlInstagram"]').forEach(Node => Node.remove());
  document.querySelectorAll('*').forEach(Node => {
    for (const Attribute of [...Node.attributes]) {
      if (/^data-control-(?:ig-|instagram-|post-story-)/.test(Attribute.name)) Node.removeAttribute(Attribute.name);
    }
  });
  for (const [Node, Style] of ControlOriginalStyles) {
    if (Style === null) Node.removeAttribute('style'); else Node.setAttribute('style', Style);
  }
  ControlOriginalStyles.clear();
  for (const [Node, Label] of ControlOriginalLabels) {
    if (Label === null) Node.removeAttribute('aria-label'); else Node.setAttribute('aria-label', Label);
  }
  ControlOriginalLabels.clear();
}

function FilterInstagram() {
  const Rules = ActiveRules.Instagram;

  if (!Rules.Enabled) {
    RestoreCorePage();
    return;
  }

  const Path = NormalizePath();
  const IsReelsRoute = Path.startsWith("/reels") || Path.startsWith("/reel/");
  const IsExploreRoute = Path.startsWith("/explore");
  const IsSearchSurface = IsInstagramSearchSurface();
  const IsSearchEnabled = Rules.Search !== false;
  const HasSearchQuery = HasInstagramSearchQuery();
  const IsHomeRoute = Path === "/";
  const IsFollowingRoute = IsHomeRoute && new URLSearchParams(location.search).get("variant") === "following";
  const IsStoriesRoute = Path.startsWith("/stories/");
  const IsAccountAccessRoute = Path.startsWith("/accounts/") || Path.startsWith("/challenge/");
  const IsDirectMessagesOnly = ForceInstagramDirectMessagesOnly || Rules.DMsOnly === true;

  ApplyInstagramDesktopExperience();

  if (IsDirectMessagesOnly && !Path.startsWith("/direct/") && !IsAccountAccessRoute) {
    ShowBlocker("Instagram is in DMs-only mode", "Only Direct Messages stay open right now. Feed, profiles, Reels, Stories, Explore and search are locked.", "/direct/inbox/");
    return;
  }

  if (Rules.Reels && IsReelsRoute && !IsChosenInstagramProfileMedia(Path)) {
    ShowBlocker("Reels are blocked", "Control has removed the infinite vertical-video route. A reel opened from a profile you deliberately chose remains available.", "/direct/inbox/");
    return;
  }
  if (EnsureInstagramFollowingRoute(IsHomeRoute, IsFollowingRoute, Rules.HideFollowingPosts)) return;
  if (!IsSearchEnabled && IsExploreRoute) {
    ShowBlocker("Instagram search is disabled", "Turn Search back on in Control to find accounts and profiles.", "/direct/inbox/");
    return;
  }



  if (Rules.Live && (Path.startsWith("/live") || Path.includes("/live/"))) {
    ShowBlocker("Instagram Live is blocked", "Live streams are removed while conversations and intentional profiles stay available.", "/");
    return;
  }
  if (Rules.Shopping && (Path.startsWith("/shop") || Path.includes("/shopping"))) {
    ShowBlocker("Instagram Shopping is blocked", "Product discovery is outside your intentional Instagram experience.", "/");
    return;
  }
  if (Rules.SavedPosts && Path.includes("/saved")) {
    ShowBlocker("Saved posts are blocked", "Control keeps Instagram focused on conversations.", "/direct/inbox/");
    return;
  }
  if (Rules.Stories && IsStoriesRoute) {
    ShowBlocker("Stories are sealed", "This content has been removed from your path.", "/direct/inbox/");
    return;
  }

  RemoveBlocker();
  document.documentElement.classList.toggle("ControlInstagramHideStories", Rules.Stories === true);
  document.documentElement.classList.toggle("ControlInstagramHideReels", Rules.Reels === true);
  document.documentElement.classList.toggle("ControlInstagramFollowingOnly", Rules.HideFollowingPosts === false);
  document.documentElement.classList.toggle("ControlInstagramHideCommerce", Rules.Shopping === true);
  document.documentElement.classList.toggle("ControlInstagramSearchOnly", Rules.SearchGridGuard === true && IsSearchSurface && !HasSearchQuery);
  const ShouldHideHomeFeed = Rules.HomeFeed === true && IsHomeRoute && Rules.HideFollowingPosts === true;
  document.documentElement.classList.toggle("ControlInstagramHideFeed", ShouldHideHomeFeed);
  UpdateInstagramHomeFeedGuard(ShouldHideHomeFeed);

  if (Rules.Reels) {
    HideInstagramReelsNavigation();
  }

  if (Rules.ForYou) {
    HideInstagramForYouTabs();
  }

  if (!IsSearchEnabled) {
    HideMatchingLinks(["/explore/"]);
  }

  UpdateInstagramIdleDiscoveryGuard(Rules.SearchGridGuard === true && IsSearchSurface && !HasSearchQuery);

  if (Rules.Stories) {
    HideMatchingLinks(["/stories/"]);
  }

  if (Rules.AdsAndSuggested === true) {
    HideInstagramSuggestedFeedPosts();
  }
  RemoveInstagramContinuationControls();
}

function FilterSnapchat() {
  const Rules = ActiveRules.Snapchat;

  if (!Rules.Enabled) {
    RestoreCorePage();
    return;
  }

  const Path = NormalizePath();
  const BlockingState = GetSnapchatBlockingState();
  const IsStrictPublicPage = Rules.DMsOnly === true && IsPublicSnapchat();
  document.documentElement.classList.toggle(
    "ControlSnapchatHidePublic",
    BlockingState.Spotlight || BlockingState.Stories || BlockingState.Discover || BlockingState.Map,
  );
  document.documentElement.classList.toggle("ControlSnapchatOnlyChat", IsStrictPublicPage);
  HideSnapchatPublicNavigation();
  RemoveSnapchatBlockedNavigationControls();
  RemoveSnapchatBlockedFramesAndPanels();

  const BlockedRoute =
    (IsStrictPublicPage && !Path.startsWith("/web")) ||
    (BlockingState.Spotlight && Path.includes("spotlight")) ||
    (BlockingState.Stories && (Path.includes("stories") || Path.includes("story"))) ||
    (BlockingState.Discover && Path.includes("discover")) ||
    (BlockingState.Map && Path.includes("map")) ||
    ((BlockingState.Spotlight || BlockingState.Discover) && Path.startsWith("/@"));

  if (BlockedRoute) {
    ShowBlocker("This Snapchat section is sealed", "Control keeps only the camera, photographs and conversations.", "/web");
    return;
  }

  RemoveBlocker();

  const ApplicationRoot = GetSnapchatApplicationRoot();

  if (ApplicationRoot) {
    if (BlockingState.Stories) {
      HideSnapchatStoriesRow(ApplicationRoot);
    }

    if (BlockingState.Spotlight || BlockingState.Discover) {
      HideSnapchatEntertainmentPanel(ApplicationRoot);
    }
  }

  if (BlockingState.Spotlight) {
    HideMatchingLinks(["/spotlight", "/@"]);
  }

  if (BlockingState.Stories) {
    HideMatchingLinks(["/stories", "/story"]);
  }

  if (BlockingState.Discover) {
    HideMatchingLinks(["/discover", "/@"]);
  }

  if (BlockingState.Map) {
    HideMatchingLinks(["/map"]);
  }

  if (BlockingState.Ads) {
    HideCardsContainingText(["sponsored", "sponsoris\u00e9", "publicit\u00e9", " ad "]);
  }
}

function ApplyFilters() {
  FilterScheduled = false;
  if (!ControlCoreRulesLoaded) return;
  if ((IsInstagram() && ActiveRules.Instagram.Enabled) || (IsSnapchat() && ActiveRules.Snapchat.Enabled)) ControlCoreRestored = false;

  if (IsInstagram()) {
    window.ControlInstagramVisuals?.update({enabled:ActiveRules.Instagram.Enabled});
    FilterInstagram();
  } else if (IsSnapchat()) {
    if (ActiveRules.Snapchat.Enabled) RemoveSnapchatHardBlockedControls();
    FilterSnapchat();
  }
}

function ScheduleFilters() {
  if (FilterScheduled) {
    return;
  }

  FilterScheduled = true;
  window.requestAnimationFrame(ApplyFilters);
}


function NormalizeActiveRules(StoredRules = {}) {
  const Rules = {
    ...structuredClone(DefaultRules),
    ...StoredRules,
    Instagram: { ...DefaultRules.Instagram, ...(StoredRules.Instagram ?? {}) },
    Snapchat: { ...DefaultRules.Snapchat, ...(StoredRules.Snapchat ?? {}) },
  };
  Rules.Instagram.Enabled = typeof StoredRules.Instagram?.Enabled === "boolean" ? StoredRules.Instagram.Enabled : true;
  const IsLegacyFriendFeedRule = Number(StoredRules.SchemaVersion) < 14;
  Rules.Instagram.HomeFeed = IsLegacyFriendFeedRule ? false : StoredRules.Instagram?.HomeFeed === true;
  Rules.Instagram.HideFollowingPosts = IsLegacyFriendFeedRule
    ? false
    : typeof StoredRules.Instagram?.HideFollowingPosts === "boolean"
      ? StoredRules.Instagram.HideFollowingPosts
      : StoredRules.Instagram?.FollowingOnly !== true;
  return Rules;
}

async function LoadRules() {
  const StoredData = await chrome.storage.sync.get("Rules");
  const StoredRules = StoredData.Rules ?? {};
  ActiveRules = NormalizeActiveRules(StoredRules);
  ControlCoreRulesLoaded = true;
  ScheduleFilters();
}

const DocumentObserver = new MutationObserver(() => {
  if (CurrentUrl !== location.href) {
    CurrentUrl = location.href;
    RemoveBlocker();
  }

  ScheduleFilters();
});

function StartDocumentObserver() {
  if (!document.documentElement) return;
  DocumentObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.documentElement) {
  StartDocumentObserver();
} else {
  document.addEventListener("readystatechange", StartDocumentObserver, { once: true });
}

chrome.storage.onChanged.addListener((Changes, AreaName) => {
  if (AreaName === "sync" && Changes.Rules?.newValue) {
    RestoreCorePage();
    ActiveRules = NormalizeActiveRules(Changes.Rules.newValue);
    sessionStorage.removeItem("ControlInstagramFollowingTarget");
    ScheduleFilters();
  }
});

window.addEventListener("resize", ScheduleFilters, { passive: true });
document.addEventListener("click", CaptureInstagramShareContext, true);
document.addEventListener("click", BlockInstagramExploreMediaNavigation, true);
document.addEventListener("auxclick", BlockInstagramExploreMediaNavigation, true);
document.addEventListener("click", BlockInstagramCoreNavigation, true);
document.addEventListener("auxclick", BlockInstagramCoreNavigation, true);
document.addEventListener("click", BlockInstagramContinuation, true);
document.addEventListener("keydown", BlockInstagramContinuation, true);
document.addEventListener("wheel", BlockInstagramContinuation, { capture: true, passive: false });
document.addEventListener("touchmove", BlockInstagramContinuation, { capture: true, passive: false });
document.addEventListener("input", (Event) => { if (Event.target === GetInstagramSearchInput()) ScheduleFilters(); }, true);
document.addEventListener("click", BlockSnapchatNavigation, true);
document.addEventListener("auxclick", BlockSnapchatNavigation, true);

void LoadRules();
