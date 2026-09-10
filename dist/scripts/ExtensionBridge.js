const DashboardSender = "ControlDashboard";
const ExtensionSender = "ControlExtension";

document.documentElement.setAttribute("data-control-extension-active", "true");
document.documentElement.setAttribute("data-control-extension-version", chrome.runtime.getManifest().version);

function SendResponse(Type, RequestId, Payload = {}) {
  window.postMessage({
    Sender: ExtensionSender,
    Type,
    RequestId,
    ...Payload,
  }, location.origin);
}

window.addEventListener("message", async (Event) => {
  if (Event.origin !== location.origin || Event.data?.Sender !== DashboardSender) {
    return;
  }

  const { Type, RequestId, Rules } = Event.data;

  if (typeof RequestId !== "string") {
    return;
  }

  if (Type === "ReadRules") {
    const StoredData = await chrome.storage.sync.get("Rules");
    SendResponse("RulesRead", RequestId, { Rules: StoredData.Rules ?? null });
    return;
  }

  if (Type === "WriteRules" && Rules && typeof Rules === "object") {
    await chrome.storage.sync.set({ Rules });
    SendResponse("RulesWritten", RequestId);
    return;
  }

  if (Type === "OpenProtectedPage" && typeof Event.data.Url === "string") {
    const Result = await chrome.runtime.sendMessage({
      Type: "OpenProtectedPage",
      Url: Event.data.Url,
    });
    SendResponse("ProtectedPageOpened", RequestId, { Success: Result?.Success === true });
    return;
  }

  if (Type === "ReadUsageStats" || Type === "ResetUsageStats") {
    const Result = await chrome.runtime.sendMessage({
      Type: Type === "ReadUsageStats" ? "GetUsageStats" : "ResetUsageStats",
    });
    SendResponse("UsageStatsRead", RequestId, {
      Success: Result?.Success === true,
      UsageState: Result?.UsageState ?? null,
    });
  }
});
