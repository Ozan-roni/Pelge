(() => {
  const Root = document.querySelector(".ControlLandingV2");
  if (!Root) return;

  const GlobalRail = Root.querySelector(".V2HeroRail");
  if (GlobalRail) {
    GlobalRail.classList.add("V2GlobalRail");
    document.body.appendChild(GlobalRail);
  }

  const Topbar = Root.querySelector(".V2Topbar");
  const UpdateTopbarGlass = () => {
    const ScrollDepth = Math.max(window.scrollY, document.documentElement.scrollTop, document.querySelector(".MainContent")?.scrollTop ?? 0);
    Topbar?.classList.toggle("IsScrolled", ScrollDepth > 18);
  };
  window.addEventListener("scroll", UpdateTopbarGlass, { passive:true });
  document.querySelector(".MainContent")?.addEventListener("scroll", UpdateTopbarGlass, { passive:true });
  UpdateTopbarGlass();

  const AccountMenu = Root.querySelector(".V2AccountMenu");
  const AccountButton = Root.querySelector(".V2AccountButton");
  const AccountPopover = document.getElementById("V2AccountPopover");
  const SetAccountOpen = (IsOpen) => {
    if (!AccountPopover || !AccountButton) return;
    AccountPopover.hidden = !IsOpen;
    AccountButton.setAttribute("aria-expanded", String(IsOpen));
    AccountMenu?.classList.toggle("IsOpen", IsOpen);
  };
  AccountButton?.addEventListener("click", (Event) => {
    Event.stopPropagation();
    SetAccountOpen(AccountPopover?.hidden ?? true);
  });
  AccountPopover?.addEventListener("click", (Event) => Event.stopPropagation());
  document.addEventListener("click", () => SetAccountOpen(false));
  document.addEventListener("keydown", (Event) => {
    if (Event.key === "Escape") SetAccountOpen(false);
  });

  const OpenProfile = () => {
    SetAccountOpen(false);
    document.querySelector('.NavigationLink[data-section="Profile"]')?.click();
  };
  Root.querySelector("[data-v2-open-profile]")?.addEventListener("click", OpenProfile);

  for (const ProviderButton of Root.querySelectorAll("[data-v2-account-provider]")) {
    ProviderButton.addEventListener("click", () => {
      const Provider = ProviderButton.dataset.v2AccountProvider;
      OpenProfile();
      window.setTimeout(() => document.querySelector(`[data-profile-provider="${Provider}"]`)?.click(), 180);
    });
  }

  document.getElementById("V2AccountSigninForm")?.addEventListener("submit", (Event) => {
    Event.preventDefault();
    const Email = document.getElementById("V2AccountEmail")?.value ?? "";
    const Password = document.getElementById("V2AccountPassword")?.value ?? "";
    OpenProfile();
    window.setTimeout(() => {
      const ProfileEmail = document.getElementById("ProfileSigninEmailInput");
      const ProfilePassword = document.getElementById("ProfileSigninPasswordInput");
      if (ProfileEmail) ProfileEmail.value = Email;
      if (ProfilePassword) ProfilePassword.value = Password;
      document.getElementById("ProfileSigninForm")?.requestSubmit();
    }, 180);
  });

  const ProfileMemberView = document.getElementById("ProfileMemberView");
  const ProfileAvatar = document.getElementById("ProfileAvatar");
  if (ProfileMemberView && !ProfileMemberView.hidden && ProfileAvatar) {
    for (const Avatar of Root.querySelectorAll("[data-v2-account-avatar]")) {
      Avatar.replaceChildren(document.createTextNode(ProfileAvatar.textContent?.trim().slice(0, 1) || "C"));
      if (ProfileAvatar.style.backgroundImage) {
        Avatar.style.backgroundImage = ProfileAvatar.style.backgroundImage;
        Avatar.classList.add("HasPhoto");
      }
    }
  }

  const RevealElements = [
    ...Root.querySelectorAll(".V2HeroCopy, .V2HeroProof"),
    ...Root.querySelectorAll(".V2Platforms > header, .V2PlatformProtection, .V2PlatformCard, .V2PlatformsFree"),
    ...Root.querySelectorAll(".V2Highlights > header, .V2Highlights > article"),
    ...Root.querySelectorAll(".V2SampleBridge > *"),
    ...Root.querySelectorAll(".V2SampleIntro, .V2ControlPanel"),
    ...Root.querySelectorAll(".V2StoreBand, .V2Legal > *")
  ];
  RevealElements.forEach((Element, Index) => {
    Element.classList.add("V2Reveal");
    Element.style.setProperty("--reveal-delay", `${(Index % 5) * 65}ms`);
  });
  Root.classList.add("HasReveal");

  if ("IntersectionObserver" in window) {
    const RevealObserver = new IntersectionObserver((Entries, Observer) => {
      for (const Entry of Entries) {
        if (!Entry.isIntersecting) continue;
        Entry.target.classList.add("IsRevealed");
        Observer.unobserve(Entry.target);
      }
    }, { rootMargin:"0px 0px -8%", threshold:.08 });
    RevealElements.forEach((Element) => RevealObserver.observe(Element));
  } else {
    RevealElements.forEach((Element) => Element.classList.add("IsRevealed"));
  }

  const BrandMarks = [...Root.querySelectorAll(".V2BrandMark")];
  const ResetEyes = () => BrandMarks.forEach((Mark) => {
    Mark.style.setProperty("--eye-x", "0px");
    Mark.style.setProperty("--eye-y", "0px");
  });
  Root.addEventListener("pointermove", (Event) => {
    for (const Mark of BrandMarks) {
      const Bounds = Mark.getBoundingClientRect();
      const DeltaX = Event.clientX - (Bounds.left + Bounds.width / 2);
      const DeltaY = Event.clientY - (Bounds.top + Bounds.height / 2);
      const Distance = Math.max(1, Math.hypot(DeltaX, DeltaY));
      Mark.style.setProperty("--eye-x", `${(DeltaX / Distance) * 1.6}px`);
      Mark.style.setProperty("--eye-y", `${(DeltaY / Distance) * 1.1}px`);
    }
  });
  Root.addEventListener("pointerleave", ResetEyes);

  for (const Control of Root.querySelectorAll("a, button")) {
    if (Control.matches(".V2Switch, .V2HeroRail button")) continue;
    Control.addEventListener("click", () => {
      Control.classList.remove("IsBursting");
      requestAnimationFrame(() => Control.classList.add("IsBursting"));
      window.setTimeout(() => Control.classList.remove("IsBursting"), 680);
    });
  }

  for (const StoreButton of Root.querySelectorAll(".V2Hero .V2StoreButton, .V2StoreBand .V2StoreButton")) {
    StoreButton.addEventListener("click", (Event) => {
      Event.preventDefault();
      const StoreName = StoreButton.textContent?.includes("Google") ? "Google Play" : "App Store";
      if (typeof ShowControlToast === "function") ShowControlToast(`${StoreName} coming soon`, "Use the free browser extension today; the mobile app will appear here after store review.");
    });
  }

  Root.querySelector("[data-v2-admin-link]")?.addEventListener("click", () => {
    window.setTimeout(() => document.querySelector(".ProfileAdminCard")?.scrollIntoView({ behavior:"smooth", block:"center" }), 320);
  });

  const ToolsStorageKey = "ControlHomeTools.v1";
  const DefaultToolState = {
    activePanel:"blocked",
    switches:{ whatsappStatus:true, whatsappMessages:false, whatsappGroups:true, explicitMedia:true, blurUncertain:true },
    focusDuration:45,
    focusEndAt:0,
    sensitive:true,
    advancedPreset:"Strict",
    advancedLimit:30
  };
  const ReadToolState = () => {
    try {
      const Stored = JSON.parse(localStorage.getItem(ToolsStorageKey) || "null");
      return { ...DefaultToolState, ...(Stored || {}), switches:{ ...DefaultToolState.switches, ...(Stored?.switches || {}) } };
    } catch {
      return structuredClone(DefaultToolState);
    }
  };
  let ToolState = ReadToolState();
  let SaveFeedbackTimer = 0;
  let FocusTimer = 0;

  const SetSaveFeedback = (IsSaving) => {
    const Status = document.getElementById("V2SaveStatus");
    if (!Status) return;
    window.clearTimeout(SaveFeedbackTimer);
    Status.classList.toggle("IsSaving", IsSaving);
    const Title = Status.querySelector("strong");
    const Detail = Status.querySelector("small");
    if (Title) Title.textContent = IsSaving ? "Saving changes" : "Saved automatically";
    if (Detail) Detail.textContent = IsSaving ? "Updating Control on this device..." : "Your settings stay on this device.";
    if (IsSaving) SaveFeedbackTimer = window.setTimeout(() => SetSaveFeedback(false), 520);
  };

  const SaveToolState = async (SaveRules = false) => {
    localStorage.setItem(ToolsStorageKey, JSON.stringify(ToolState));
    SetSaveFeedback(true);
    if (SaveRules && typeof WriteStoredRules === "function" && typeof ActiveRules !== "undefined") {
      if (typeof ApplyCoreProtection === "function") ApplyCoreProtection(ActiveRules);
      try {
        await WriteStoredRules(ActiveRules);
      } catch {
        localStorage.setItem("ControlRules", JSON.stringify(ActiveRules));
      }
      if (typeof UpdateRuleStatistics === "function") UpdateRuleStatistics();
      if (typeof UpdateApplicationCardStates === "function") UpdateApplicationCardStates();
    }
  };

  const SetSwitchVisual = (Switch, IsEnabled) => {
    Switch.classList.toggle("IsOn", IsEnabled);
    Switch.setAttribute("aria-checked", String(IsEnabled));
  };

  const ReadBoundSwitch = (Switch) => {
    if (Switch.dataset.rulePath && typeof GetPathValue === "function" && typeof ActiveRules !== "undefined") return Boolean(GetPathValue(ActiveRules, Switch.dataset.rulePath));
    if (Switch.dataset.v2ConfigPath && typeof ActiveRules !== "undefined") return Boolean(ActiveRules.SensitiveProtectionConfig?.[Switch.dataset.v2ConfigPath]);
    if (Switch.dataset.v2StateKey) return Boolean(ToolState.switches[Switch.dataset.v2StateKey]);
    return Switch.getAttribute("aria-checked") === "true";
  };

  const WriteBoundSwitch = (Switch, IsEnabled) => {
    if (Switch.dataset.rulePath && typeof SetPathValue === "function" && typeof ActiveRules !== "undefined") {
      SetPathValue(ActiveRules, Switch.dataset.rulePath, IsEnabled);
      if (typeof ApplyInstagramModeExclusivity === "function") ApplyInstagramModeExclusivity(Switch.dataset.rulePath, IsEnabled);
      if (typeof SynchronizeDuplicateSwitches === "function") SynchronizeDuplicateSwitches(Switch.dataset.rulePath, IsEnabled);
      return true;
    }
    if (Switch.dataset.v2ConfigPath && typeof ActiveRules !== "undefined") {
      ActiveRules.SensitiveProtectionConfig ||= structuredClone(DefaultRules.SensitiveProtectionConfig);
      ActiveRules.SensitiveProtectionConfig[Switch.dataset.v2ConfigPath] = IsEnabled;
      return true;
    }
    if (Switch.dataset.v2StateKey) ToolState.switches[Switch.dataset.v2StateKey] = IsEnabled;
    return false;
  };

  const SetActivePanel = (PanelKey, Persist = true) => {
    for (const Tab of Root.querySelectorAll("[data-v2-tab]")) {
      const IsActive = Tab.dataset.v2Tab === PanelKey;
      Tab.classList.toggle("IsActive", IsActive);
      Tab.setAttribute("aria-selected", String(IsActive));
    }

    for (const Panel of Root.querySelectorAll("[data-v2-panel]")) {
      const IsActive = Panel.dataset.v2Panel === PanelKey;
      Panel.hidden = !IsActive;
      Panel.classList.toggle("IsActive", IsActive);
    }

    for (const Jump of Root.querySelectorAll("[data-v2-tab-jump]")) {
      Jump.classList.toggle("IsActive", Jump.dataset.v2TabJump === PanelKey);
    }
    ToolState.activePanel = PanelKey;
    if (Persist) void SaveToolState();
  };

  const UpdateScore = () => {
    const Switches = [...Root.querySelectorAll("[data-v2-switch]")];
    const ActiveCount = Switches.filter((Switch) => Switch.getAttribute("aria-checked") === "true").length;
    const Score = Math.min(99, 74 + Math.round((ActiveCount / Math.max(1, Switches.length)) * 22));
    const ScoreValue = document.getElementById("V2FocusScore");
    const ScoreRing = document.getElementById("V2ScoreRing");
    const ScoreLabel = document.getElementById("V2FocusLabel");
    const BlockedCount = document.getElementById("V2BlockedCount");
    if (ScoreValue) ScoreValue.textContent = String(Score);
    if (ScoreRing) ScoreRing.style.background = `conic-gradient(#5d3eff 0 ${Score}%, transparent ${Score}%)`;
    if (ScoreLabel) ScoreLabel.textContent = Score >= 90 ? "Excellent focus!" : Score >= 82 ? "Great focus!" : "Building focus";
    if (BlockedCount) BlockedCount.textContent = (1180 + ActiveCount * 7).toLocaleString("en-US");
  };

  const SyncSensitiveProtection = (IsEnabled) => {
    for (const Switch of Root.querySelectorAll('[data-setting="sensitive"]')) {
      SetSwitchVisual(Switch, IsEnabled);
    }
    ToolState.sensitive = IsEnabled;
    const Status = document.getElementById("V2SensitiveStatus");
    if (Status) Status.textContent = IsEnabled ? "Protected everywhere" : "Protection paused";
    Root.querySelector("[data-sensitive-card]")?.classList.toggle("IsPaused", !IsEnabled);
  };

  for (const Tab of Root.querySelectorAll("[data-v2-tab]")) {
    Tab.addEventListener("click", () => SetActivePanel(Tab.dataset.v2Tab));
  }

  for (const Jump of Root.querySelectorAll("[data-v2-tab-jump]")) {
    Jump.addEventListener("click", () => {
      SetActivePanel(Jump.dataset.v2TabJump);
      Root.querySelector(".V2ControlTabs")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  for (const Switch of Root.querySelectorAll("[data-v2-switch]")) {
    Switch.addEventListener("click", () => {
      const IsEnabled = Switch.getAttribute("aria-checked") !== "true";
      let SavesRules = false;
      if (Switch.dataset.setting === "sensitive") {
        SyncSensitiveProtection(IsEnabled);
        if (typeof ActiveRules !== "undefined") {
          ActiveRules.SensitiveContentProtection = IsEnabled;
          SavesRules = true;
        }
      }
      else {
        SetSwitchVisual(Switch, IsEnabled);
        SavesRules = WriteBoundSwitch(Switch, IsEnabled);
      }
      UpdateScore();
      void SaveToolState(SavesRules);
    });
  }

  for (const Slider of Root.querySelectorAll("[data-limit-output]")) {
    Slider.addEventListener("input", () => {
      const Output = document.getElementById(Slider.dataset.limitOutput);
      if (Output) Output.textContent = `${Slider.value} min`;
    });
    Slider.addEventListener("change", () => {
      const ApplicationKey = Slider.dataset.limitApp;
      if (ApplicationKey && typeof ActiveRules !== "undefined" && ActiveRules[ApplicationKey]) {
        ActiveRules[ApplicationKey].DailyLimitMinutes = Number(Slider.value);
        void SaveToolState(true);
      }
    });
  }

  const FocusRange = document.getElementById("V2FocusRange");
  const FocusDuration = document.getElementById("V2FocusDuration");
  const SetFocusDuration = (Value, Force = false) => {
    if (!Force && ToolState.focusEndAt > Date.now()) return;
    if (FocusRange) FocusRange.value = String(Value);
    if (FocusDuration) FocusDuration.textContent = String(Value);
    for (const Preset of Root.querySelectorAll("[data-duration]")) Preset.classList.toggle("IsActive", Number(Preset.dataset.duration) === Number(Value));
    ToolState.focusDuration = Number(Value);
    void SaveToolState();
  };
  FocusRange?.addEventListener("input", () => SetFocusDuration(FocusRange.value));
  for (const Preset of Root.querySelectorAll("[data-duration]")) Preset.addEventListener("click", () => SetFocusDuration(Preset.dataset.duration));

  const StartFocusButton = document.getElementById("V2StartFocus");
  const FocusSetup = Root.querySelector(".V2FocusSetup");
  const FocusStatus = Root.querySelector('[data-v2-panel="focus"] .V2StatusPill');
  const FocusUnit = Root.querySelector(".V2Timer small");
  const RenderFocusSession = () => {
    window.clearInterval(FocusTimer);
    const Remaining = Math.max(0, Number(ToolState.focusEndAt) - Date.now());
    const IsActive = Remaining > 0;
    FocusSetup?.classList.toggle("IsRunning", IsActive);
    StartFocusButton?.classList.toggle("IsActive", IsActive);
    if (FocusStatus) FocusStatus.textContent = IsActive ? "Active" : "Ready";
    if (FocusRange) FocusRange.disabled = IsActive;
    if (!IsActive) {
      ToolState.focusEndAt = 0;
      if (FocusDuration) FocusDuration.textContent = String(ToolState.focusDuration);
      if (FocusUnit) FocusUnit.textContent = "minutes";
      if (StartFocusButton) StartFocusButton.textContent = "Start focus session";
      return;
    }
    const TotalSeconds = Math.ceil(Remaining / 1000);
    const Minutes = Math.floor(TotalSeconds / 60);
    const Seconds = String(TotalSeconds % 60).padStart(2, "0");
    if (FocusDuration) FocusDuration.textContent = `${Minutes}:${Seconds}`;
    if (FocusUnit) FocusUnit.textContent = "remaining";
    if (StartFocusButton) StartFocusButton.textContent = "Stop focus session";
    FocusTimer = window.setInterval(RenderFocusSession, 1000);
  };
  StartFocusButton?.addEventListener("click", () => {
    const WasActive = ToolState.focusEndAt > Date.now();
    ToolState.focusEndAt = WasActive ? 0 : Date.now() + ToolState.focusDuration * 60 * 1000;
    void SaveToolState();
    RenderFocusSession();
    if (typeof ShowControlToast === "function") ShowControlToast(WasActive ? "Focus mode stopped" : "Focus mode active", WasActive ? "Your temporary session has ended." : "Your selected distractions are hidden until the timer ends.");
  });

  const CollapseButton = Root.querySelector("[data-v2-collapse]");
  CollapseButton?.addEventListener("click", () => {
    const List = Root.querySelector(".V2AppSettings");
    if (!List) return;
    List.hidden = !List.hidden;
    CollapseButton.textContent = List.hidden ? "Expand all⌄" : "Collapse all⌃";
  });

  const Advanced = Root.querySelector("[data-v2-advanced]");
  const AdvancedToggle = Root.querySelector("[data-v2-advanced-toggle]");
  const AdvancedEditor = document.getElementById("V2AdvancedEditor");
  const AdvancedPreset = document.getElementById("V2AdvancedPreset");
  const AdvancedLimit = document.getElementById("V2AdvancedLimit");
  const AdvancedLimitOutput = document.getElementById("V2AdvancedLimitOutput");
  const AdvancedSummary = document.getElementById("V2AdvancedSummary");
  const UpdateAdvancedSummary = () => {
    if (AdvancedPreset) AdvancedPreset.value = ToolState.advancedPreset;
    if (AdvancedLimit) AdvancedLimit.value = String(ToolState.advancedLimit);
    if (AdvancedLimitOutput) AdvancedLimitOutput.textContent = `${ToolState.advancedLimit} min`;
    if (AdvancedSummary) AdvancedSummary.textContent = `${ToolState.advancedPreset} preset · ${ToolState.advancedLimit} minute limit`;
  };
  const SetAdvancedOpen = (IsOpen) => {
    if (!AdvancedEditor || !AdvancedToggle) return;
    AdvancedEditor.hidden = !IsOpen;
    Advanced?.classList.toggle("IsOpen", IsOpen);
    AdvancedToggle.setAttribute("aria-expanded", String(IsOpen));
    AdvancedToggle.firstChild.textContent = IsOpen ? "Close preset " : "Edit preset ";
  };
  AdvancedToggle?.addEventListener("click", () => SetAdvancedOpen(AdvancedEditor?.hidden ?? true));
  AdvancedLimit?.addEventListener("input", () => {
    if (AdvancedLimitOutput) AdvancedLimitOutput.textContent = `${AdvancedLimit.value} min`;
  });
  Root.querySelector("[data-v2-advanced-save]")?.addEventListener("click", () => {
    ToolState.advancedPreset = AdvancedPreset?.value || "Custom";
    ToolState.advancedLimit = Number(AdvancedLimit?.value || 30);
    if (typeof ActiveRules !== "undefined") ActiveRules.TikTok.DailyLimitMinutes = ToolState.advancedLimit;
    const TikTokLimit = Root.querySelector('[data-limit-app="TikTok"]');
    if (TikTokLimit) {
      TikTokLimit.value = String(ToolState.advancedLimit);
      TikTokLimit.dispatchEvent(new Event("input"));
    }
    UpdateAdvancedSummary();
    SetAdvancedOpen(false);
    void SaveToolState(true);
    if (typeof ShowControlToast === "function") ShowControlToast("TikTok preset saved", `${ToolState.advancedPreset} protection with a ${ToolState.advancedLimit} minute daily limit.`);
  });
  Root.querySelector("[data-v2-advanced-reset]")?.addEventListener("click", () => {
    ToolState.advancedPreset = "Strict";
    ToolState.advancedLimit = 30;
    UpdateAdvancedSummary();
  });

  const RestoreTools = () => {
    for (const Switch of Root.querySelectorAll("[data-v2-switch]")) {
      if (Switch.dataset.setting === "sensitive") continue;
      SetSwitchVisual(Switch, ReadBoundSwitch(Switch));
    }
    if (typeof ActiveRules !== "undefined") {
      ToolState.sensitive = Boolean(ActiveRules.SensitiveContentProtection);
      ToolState.advancedLimit = Number(ActiveRules.TikTok?.DailyLimitMinutes || ToolState.advancedLimit);
    }
    SyncSensitiveProtection(Boolean(ToolState.sensitive));
    for (const Slider of Root.querySelectorAll("[data-limit-app]")) {
      const App = Slider.dataset.limitApp;
      if (typeof ActiveRules !== "undefined" && ActiveRules[App]) Slider.value = String(ActiveRules[App].DailyLimitMinutes);
      Slider.dispatchEvent(new Event("input"));
    }
    SetFocusDuration(ToolState.focusDuration, true);
    UpdateAdvancedSummary();
    SetActivePanel(ToolState.activePanel, false);
    RenderFocusSession();
    UpdateScore();
  };

  Root.querySelector("[data-v2-reset-tools]")?.addEventListener("click", () => {
    ToolState = structuredClone(DefaultToolState);
    if (typeof ActiveRules !== "undefined") {
      for (const Switch of Root.querySelectorAll("[data-rule-path]")) {
        const DefaultValue = typeof GetPathValue === "function" ? Boolean(GetPathValue(DefaultRules, Switch.dataset.rulePath)) : true;
        SetPathValue(ActiveRules, Switch.dataset.rulePath, DefaultValue);
      }
      ActiveRules.SensitiveContentProtection = true;
      ActiveRules.SensitiveProtectionConfig.BlockAdultSites = true;
      ActiveRules.SensitiveProtectionConfig.HideDetectedAccounts = true;
      for (const App of ["Instagram", "YouTube", "TikTok", "X"]) ActiveRules[App].DailyLimitMinutes = DefaultRules[App].DailyLimitMinutes;
    }
    RestoreTools();
    void SaveToolState(true);
    if (typeof ShowControlToast === "function") ShowControlToast("Sample reset", "The homepage controls have returned to their recommended defaults.");
  });

  Root.querySelector("[data-v2-open-settings]")?.addEventListener("click", () => {
    document.querySelector('.NavigationLink[data-section="Settings"]')?.click();
  });

  window.addEventListener("control:rules-ready", RestoreTools, { once:true });

  const ThemeButton = document.getElementById("V2ThemeButton");
  const UpdateThemeButton = () => {
    if (!ThemeButton) return;
    const IsDark = document.documentElement.dataset.theme === "dark";
    ThemeButton.setAttribute("aria-label", IsDark ? "Switch to light theme" : "Switch to dark theme");
    ThemeButton.title = IsDark ? "Light theme" : "Dark theme";
  };
  ThemeButton?.addEventListener("click", () => {
    const NextTheme = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark";
    localStorage.setItem("ControlInterfaceTheme.v1", NextTheme);
    if (typeof ApplyInterfaceTheme === "function") ApplyInterfaceTheme(NextTheme);
    else document.documentElement.dataset.theme = NextTheme.toLowerCase();
    UpdateThemeButton();
  });
  new MutationObserver(UpdateThemeButton).observe(document.documentElement, { attributes:true, attributeFilter:["data-theme"] });

  const NavigationLinks = [...Root.querySelectorAll(".V2TopLinks a")];
  for (const Link of NavigationLinks) Link.addEventListener("click", () => {
    for (const Item of NavigationLinks) Item.classList.toggle("IsActive", Item === Link);
  });

  const HeroRailButtons = [...document.querySelectorAll(".V2GlobalRail [data-v2-hero-target]")];
  const HeroRailSections = new Map(HeroRailButtons.map((Button) => {
    const Target = Button.dataset.v2HeroTarget === "Home" ? Root.querySelector(".V2Hero") : document.getElementById(Button.dataset.v2HeroTarget);
    return [Target, Button];
  }).filter(([Target]) => Target));
  for (const Button of HeroRailButtons) Button.addEventListener("click", () => {
    const Target = Button.dataset.v2HeroTarget === "Home" ? Root.querySelector(".V2Hero") : document.getElementById(Button.dataset.v2HeroTarget);
    Target?.scrollIntoView({ behavior:"smooth", block:"start" });
  });
  if ("IntersectionObserver" in window) {
    const HeroRailObserver = new IntersectionObserver((Entries) => {
      const Visible = Entries.filter((Entry) => Entry.isIntersecting).sort((A, B) => B.intersectionRatio - A.intersectionRatio)[0];
      if (!Visible) return;
      for (const Button of HeroRailButtons) Button.classList.toggle("IsActive", HeroRailSections.get(Visible.target) === Button);
    }, { rootMargin:"-28% 0px -56%", threshold:[0,.1,.35] });
    for (const Section of HeroRailSections.keys()) HeroRailObserver.observe(Section);
  }

  if ("IntersectionObserver" in window) {
    const Sections = [
      [Root.querySelector(".V2Hero"), "#Home"],
      [document.getElementById("V2Platforms"), "#V2Platforms"],
      [document.getElementById("V2SampleBridge"), "#V2SampleBridge"],
      [document.getElementById("V2ProductSample"), "#V2SampleBridge"],
      [document.getElementById("V2Legal"), "#V2Legal"]
    ];
    const Observer = new IntersectionObserver((Entries) => {
      const Visible = Entries.filter((Entry) => Entry.isIntersecting).sort((A, B) => B.intersectionRatio - A.intersectionRatio)[0];
      if (!Visible) return;
      const Key = Sections.find(([Section]) => Section === Visible.target)?.[1];
      for (const Link of NavigationLinks) Link.classList.toggle("IsActive", Link.getAttribute("href") === Key || (Key === "#V2Legal" && ["#V2Legal"].includes(Link.getAttribute("href"))));
    }, { rootMargin:"-20% 0px -60%", threshold:[0,.25,.5] });
    for (const [Section] of Sections) if (Section) Observer.observe(Section);
  }

  const SamplePreview = Root.querySelector("[data-v2-reveal-sample]");
  const SamplePanel = document.getElementById("V2ControlPanel");
  SamplePreview?.addEventListener("click", () => {
    if (!SamplePanel) return;
    const WillOpen = SamplePanel.hidden;
    SamplePanel.hidden = !WillOpen;
    SamplePreview.setAttribute("aria-expanded", String(WillOpen));
    Root.querySelector(".V2ProductSample")?.classList.toggle("IsSampleOpen", WillOpen);
    if (!WillOpen) return;
    requestAnimationFrame(() => SamplePanel.classList.add("IsSampleVisible"));
    window.setTimeout(() => SamplePanel.scrollIntoView({ behavior:"smooth", block:"start" }), 120);
  });

  RestoreTools();
  UpdateThemeButton();
})();
