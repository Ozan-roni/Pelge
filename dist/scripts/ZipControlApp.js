(() => {
  const AppMeta = [
    { key:"Instagram", name:"Instagram", icon:"assets/Instagram.svg", main:"Reels", mainLabel:"Block Reels" },
    { key:"X", name:"X", icon:"assets/X.svg", main:"ForYou", mainLabel:"Block For You feed" },
    { key:"Snapchat", name:"Snapchat", icon:"assets/Snapchat.svg", main:"Spotlight", mainLabel:"Block Spotlight" },
    { key:"YouTube", name:"YouTube", icon:"assets/YouTube.svg", main:"Shorts", mainLabel:"Block Shorts" },
    { key:"TikTok", name:"TikTok", icon:"assets/TikTok.svg", main:"ForYou", mainLabel:"Block For You feed" },
    { key:"Reddit", name:"Reddit", icon:"assets/Reddit.svg", main:"HomeFeed", mainLabel:"Block home feed" },
    { key:"Threads", name:"Threads", icon:"assets/Threads.svg", main:"ForYou", mainLabel:"Block For You feed" },
    { key:"Facebook", name:"Facebook", icon:"assets/Facebook.svg", main:"Reels", mainLabel:"Block Reels" }
  ];
  const TicketKey = "ControlSupportTickets.v1";
  let SelectedApp = "Instagram";

  const ReadJson = (Key, Fallback) => {
    try { return JSON.parse(localStorage.getItem(Key) || "null") ?? Fallback; }
    catch { return Fallback; }
  };
  const GetRules = () => typeof ActiveRules !== "undefined" ? ActiveRules : ReadJson("ControlRules", {});

  function SaveRules() {
    if (typeof ApplyCoreProtection === "function") ApplyCoreProtection(ActiveRules);
    if (typeof WriteStoredRules === "function") void WriteStoredRules(ActiveRules);
    else localStorage.setItem("ControlRules", JSON.stringify(ActiveRules));
    if (typeof UpdateApplicationCardStates === "function") UpdateApplicationCardStates();
    RenderHomeTools();
  }

  function RuleButton(Label, IsOn, OnToggle) {
    const Button = document.createElement("button");
    Button.type = "button";
    Button.className = `ZipQuickRule${IsOn ? " IsOn" : ""}`;
    Button.setAttribute("aria-pressed", String(IsOn));
    Button.innerHTML = `<span>${Label}</span><i aria-hidden="true"></i>`;
    Button.addEventListener("click", OnToggle);
    return Button;
  }

  function RenderOverview(App, AppRules, Rules) {
    const Comparison = document.getElementById("ZipComparison");
    const Eyebrow = document.getElementById("ZipOverviewEyebrow");
    const Title = document.getElementById("ZipComparisonTitle");
    const Copy = document.getElementById("ZipOverviewCopy");
    const List = document.getElementById("ZipOverviewRules");
    if (!Comparison || !Eyebrow || !Title || !Copy || !List) return;

    const IsProtected = AppRules.Enabled !== false;
    const MainIsBlocked = Boolean(AppRules[App.main]);
    Comparison.classList.toggle("IsPaused", !IsProtected);
    Eyebrow.textContent = `${App.name.toUpperCase()} OVERVIEW`;
    Title.replaceChildren(
      document.createTextNode(`${App.name} is ${IsProtected ? "protected" : "paused"}.`),
      document.createElement("br"),
      document.createTextNode(IsProtected ? "Your choices stay in control." : "Everything is available.")
    );
    Copy.textContent = IsProtected
      ? `Control applies your selected filters to ${App.name}. Change them at any time in Quick Controls.`
      : `Protection is paused for ${App.name}. Turn it back on whenever you want a quieter experience.`;

    const Summary = [
      { label:`Protection ${IsProtected ? "active" : "paused"}`, active:IsProtected },
      { label:MainIsBlocked ? App.mainLabel : `${App.mainLabel.replace(/^Block /, "")} available`, active:IsProtected && MainIsBlocked },
      { label:`Focus timer ${Rules.ShowUsageTimer ? "visible" : "hidden"}`, active:Boolean(Rules.ShowUsageTimer) },
      { label:`Daily limit: ${Number(AppRules.DailyLimitMinutes) > 0 ? Number(AppRules.DailyLimitMinutes) + ' minutes' : 'Unlimited'}`, active:IsProtected && Number(AppRules.DailyLimitMinutes) > 0 }
    ];
    List.replaceChildren(...Summary.map(Item => {
      const Row = document.createElement("li");
      Row.textContent = Item.label;
      Row.className = Item.active ? "IsActive" : "IsInactive";
      return Row;
    }));
  }

  function RenderHomeTools() {
    const Picker = document.getElementById("ZipAppPicker");
    const RulesBox = document.getElementById("ZipQuickRules");
    if (!Picker || !RulesBox) return;
    const Rules = GetRules();
    Picker.replaceChildren();
    for (const App of AppMeta) {
      const Button = document.createElement("button");
      Button.type = "button";
      Button.className = App.key === SelectedApp ? "IsActive" : "";
      Button.dataset.app = App.key;
      Button.title = App.name;
      Button.setAttribute("aria-label", `Configure ${App.name}`);
      Button.innerHTML = `<img src="${App.icon}" alt="" />`;
      Button.addEventListener("click", () => { SelectedApp = App.key; RenderHomeTools(); });
      Picker.append(Button);
    }
    const App = AppMeta.find(Item => Item.key === SelectedApp) || AppMeta[0];
    const AppRules = Rules[App.key] || {};
    const ActiveIcon = document.getElementById("ZipActiveAppIcon");
    ActiveIcon.className = `ZipActiveAppIcon ${App.key}`;
    ActiveIcon.innerHTML = `<img src="${App.icon}" alt="" />`;
    document.getElementById("ZipActiveAppName").textContent = App.name;
    document.getElementById("ZipActiveAppCopy").textContent = AppRules.Enabled === false ? "Protection paused for this application." : "Choose exactly what stays available.";
    const State = document.getElementById("ZipActiveAppState");
    State.textContent = AppRules.Enabled === false ? "Paused" : "Protected";
    State.style.cssText = AppRules.Enabled === false ? "background:#fff0eb;color:#b96246" : "";
    RulesBox.replaceChildren(
      RuleButton("Protect this application", AppRules.Enabled !== false, () => { ActiveRules[App.key].Enabled = !(AppRules.Enabled !== false); SaveRules(); }),
      RuleButton(App.mainLabel, Boolean(AppRules[App.main]), () => { ActiveRules[App.key][App.main] = !AppRules[App.main]; SaveRules(); }),
      RuleButton("Show focus timer", Boolean(Rules.ShowUsageTimer), () => { ActiveRules.ShowUsageTimer = !Rules.ShowUsageTimer; SaveRules(); })
    );
    RenderOverview(App, AppRules, Rules);
  }

  function RenderHomeProfile() {
    const Profile = ReadJson("ControlDesktopProfile", null);
    const Avatar = document.getElementById("ZipTopProfileAvatar");
    if (!Avatar) return;
    Avatar.textContent = (Profile?.Name || "Control").slice(0,1).toUpperCase();
    Avatar.style.backgroundImage = Profile?.PhotoDataUrl ? `url("${Profile.PhotoDataUrl}")` : "";
  }

  function SetQuickControlsOpen(IsOpen) {
    const Comparison = document.getElementById("ZipComparison");
    const Scene = document.getElementById("ZipQuickScene");
    const Trigger = document.getElementById("ZipExploreFeatures");
    if (!Comparison || !Scene) return;
    Comparison.classList.toggle("IsShowingControls", IsOpen);
    Scene.setAttribute("aria-hidden", String(!IsOpen));
    Trigger?.setAttribute("aria-expanded", String(IsOpen));
    if (IsOpen) window.setTimeout(() => Scene.querySelector(".ZipAppPicker button")?.focus(), 520);
    else window.setTimeout(() => Trigger?.focus(), 520);
  }

  function ReadTickets() { return ReadJson(TicketKey, []); }
  function WriteTickets(Tickets) { localStorage.setItem(TicketKey, JSON.stringify(Tickets)); RenderTickets(); }
  function TicketNumber(Index) { return `CT-${new Date().getFullYear()}-${String(Index + 1).padStart(3,"0")}`; }

  function RenderTickets() {
    const List = document.getElementById("ZipTicketList");
    if (!List) return;
    const Tickets = ReadTickets();
    document.getElementById("ZipTicketTotal").textContent = `${Tickets.length} total`;
    List.replaceChildren();
    if (!Tickets.length) {
      const Empty = document.createElement("div");
      Empty.className = "ZipTicketEmpty";
      Empty.innerHTML = "No ticket yet.<br>Create your first request on the left.";
      List.append(Empty);
      return;
    }
    Tickets.slice().reverse().forEach(Ticket => {
      const Item = document.createElement("article");
      Item.className = "ZipTicketItem";
      const SafeSubject = document.createElement("strong");
      SafeSubject.textContent = Ticket.subject;
      const SafeMessage = document.createElement("p");
      SafeMessage.textContent = Ticket.message;
      Item.innerHTML = `<header><div><strong></strong><small>${Ticket.id} · ${Ticket.category} · ${Ticket.priority}</small></div></header><p></p><div class="ZipTicketActions"><select aria-label="Ticket status"><option value="open">Open</option><option value="progress">In progress</option><option value="resolved">Resolved</option></select><button type="button">Delete</button></div>`;
      Item.querySelector("strong").replaceWith(SafeSubject);
      Item.querySelector("p").replaceWith(SafeMessage);
      const Select = Item.querySelector("select");
      Select.value = Ticket.status;
      Select.addEventListener("change", () => { const Next = ReadTickets(); const Match = Next.find(Entry => Entry.id === Ticket.id); if (Match) Match.status = Select.value; WriteTickets(Next); });
      Item.querySelector("button").addEventListener("click", () => WriteTickets(ReadTickets().filter(Entry => Entry.id !== Ticket.id)));
      List.append(Item);
    });
  }

  function OpenDesk() {
    const Desk = document.getElementById("ZipSupportDesk");
    Desk.hidden = false;
    document.body.classList.add("ModalIsOpen");
    RenderTickets();
    window.setTimeout(() => document.getElementById("ZipTicketSubject")?.focus(), 80);
  }
  function CloseDesk() {
    document.getElementById("ZipSupportDesk").hidden = true;
    document.body.classList.remove("ModalIsOpen");
  }

  document.addEventListener("DOMContentLoaded", () => {
    RenderHomeProfile();
    RenderHomeTools();
    RenderTickets();
    document.getElementById("ZipExploreFeatures")?.addEventListener("click", () => SetQuickControlsOpen(true));
    document.getElementById("ZipCloseQuickControls")?.addEventListener("click", () => SetQuickControlsOpen(false));
    document.querySelector(".ZipTopProfile")?.addEventListener("click", () => {
      if (typeof ShowSection === "function") ShowSection("Profile");
    });
    document.querySelectorAll("[data-open-support-desk]").forEach(Button => Button.addEventListener("click", OpenDesk));
    ["OpenSupportPanelButton","OpenAdminPanelButton","ReportIssueButton"].forEach(Id => document.getElementById(Id)?.addEventListener("click", OpenDesk));
    document.getElementById("ZipCloseSupportDesk")?.addEventListener("click", CloseDesk);
    document.getElementById("ZipSupportDesk")?.addEventListener("click", Event => { if (Event.target.id === "ZipSupportDesk") CloseDesk(); });
    document.addEventListener("keydown", Event => { if (Event.key === "Escape" && !document.getElementById("ZipSupportDesk")?.hidden) CloseDesk(); });
    document.getElementById("ZipOpenAppSettings")?.addEventListener("click", () => {
      if (typeof ShowSection === "function") ShowSection("Apps");
      window.setTimeout(() => { if (typeof RenderApplicationSettings === "function") RenderApplicationSettings(SelectedApp); }, 220);
    });
    document.getElementById("ZipTicketForm")?.addEventListener("submit", Event => {
      Event.preventDefault();
      const Tickets = ReadTickets();
      const Ticket = {
        id:TicketNumber(Tickets.length),
        category:document.getElementById("ZipTicketCategory").value,
        priority:document.getElementById("ZipTicketPriority").value,
        subject:document.getElementById("ZipTicketSubject").value.trim(),
        message:document.getElementById("ZipTicketMessage").value.trim(),
        status:"open",
        createdAt:Date.now()
      };
      Tickets.push(Ticket);
      WriteTickets(Tickets);
      Event.currentTarget.reset();
      document.getElementById("ZipTicketFormStatus").textContent = `${Ticket.id} created successfully.`;
      if (typeof ShowControlToast === "function") ShowControlToast("Ticket created", `${Ticket.id} is now open in your support desk.`);
    });
    document.addEventListener("click", () => window.setTimeout(RenderHomeProfile, 80));
  });
})();
