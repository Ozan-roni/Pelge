const PopupApplications = [
  ["Instagram", "https://www.instagram.com/direct/inbox/"],
  ["X", "https://x.com/messages"],
  ["Snapchat", "https://web.snapchat.com/"],
  ["YouTube", "https://www.youtube.com/"],
  ["TikTok", "https://www.tiktok.com/messages"],
];

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

async function OpenProtectedPage(Url) {
  await chrome.runtime.sendMessage({ Type: "OpenProtectedPage", Url });
  window.close();
}

async function UpdateUsageTotal() {
  const Response = await chrome.runtime.sendMessage({ Type: "GetUsageStats" });
  const TodayUsage = Response?.UsageState?.Days?.[GetLocalDateKey()] ?? {};
  const Total = PopupApplications.reduce((Duration, [ApplicationKey]) => Duration + (Number(TodayUsage[ApplicationKey]) || 0), 0);
  document.getElementById("PopupUsageTotal").textContent = FormatDuration(Total);
}

function GetPopupLaunchUrl(ApplicationKey, DefaultUrl, Rules) {
  if (ApplicationKey !== "Instagram") {
    return DefaultUrl;
  }

  const InstagramRules = Rules?.Instagram;
  if (InstagramRules?.DMsOnly || InstagramRules?.HomeFeed) {
    return "https://www.instagram.com/direct/inbox/";
  }
  if (InstagramRules?.FollowingOnly) {
    return "https://www.instagram.com/?variant=following";
  }
  return "https://www.instagram.com/";
}

async function InitializePopup() {
  const StoredData = await chrome.storage.sync.get("Rules");
  for (const [ApplicationKey, Url] of PopupApplications) {
    const LaunchUrl = GetPopupLaunchUrl(ApplicationKey, Url, StoredData.Rules);
    document.getElementById("Popup" + ApplicationKey + "Button").onclick = () => OpenProtectedPage(LaunchUrl);
  }
  document.getElementById("PopupSettingsButton").onclick = () => chrome.runtime.openOptionsPage();
  const AutoLaunchApplication = StoredData.Rules?.AutoLaunchApp;
  const AutoLaunchEntry = PopupApplications.find(([ApplicationKey]) => ApplicationKey === AutoLaunchApplication);
  if (AutoLaunchEntry) {
    const [ApplicationKey, Url] = AutoLaunchEntry;
    await OpenProtectedPage(GetPopupLaunchUrl(ApplicationKey, Url, StoredData.Rules));
  }
  await UpdateUsageTotal();
}

void InitializePopup();