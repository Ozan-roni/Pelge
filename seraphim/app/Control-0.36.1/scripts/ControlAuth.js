(() => {
  "use strict";
  const root = document.getElementById("Login");
  if (!root) return;
  const form = document.getElementById("ControlAuthForm");
  const email = document.getElementById("AuthEmail");
  const password = document.getElementById("AuthPassword");
  const name = document.getElementById("AuthName");
  const code = document.getElementById("AuthCode");
  const notice = document.getElementById("AuthNotice");
  const submit = form.querySelector('[type="submit"]');
  const dialog = document.getElementById("AuthInfoDialog");
  let mode = "signin";
  let busy = false;

  function setNotice(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function syncCodeField() {
    // Preserve access for existing local accounts with the optional second code.
    const account = ReadAccounts()[NormalizeEmail(email.value)];
    const needed = mode === "signin" && Boolean(account?.TwoFactorEnabled);
    document.getElementById("AuthCodeField").hidden = !needed;
    code.required = needed;
    if (!needed) code.value = "";
  }

  function setMode(nextMode) {
    if (busy) return;
    mode = nextMode === "create" ? "create" : "signin";
    const creating = mode === "create";
    root.dataset.authMode = mode;
    document.getElementById("AuthNameField").hidden = !creating;
    name.required = creating;
    password.autocomplete = creating ? "new-password" : "current-password";
    if (creating) password.minLength = 12;
    else password.removeAttribute("minlength");
    password.type = "password";
    password.value = "";
    const showPassword = root.querySelector(".AuthShowPassword");
    showPassword.setAttribute("aria-pressed", "false");
    showPassword.setAttribute("aria-label", "Show password");
    document.getElementById("AuthPasswordHint").hidden = !creating;
    password.setAttribute("aria-describedby", creating ? "AuthPasswordHint" : "AuthNotice");
    document.getElementById("AuthForgot").hidden = creating;
    document.getElementById("AuthTitle").textContent = creating ? "Create your account" : "Welcome back";
    document.getElementById("AuthSubtitle").textContent = creating ? "A calmer, more focused you starts here." : "Sign in to continue your focused journey.";
    document.getElementById("AuthSubmitLabel").textContent = creating ? "Create account" : "Sign in";
    document.getElementById("AuthTopPrompt").textContent = creating ? "Already with Control?" : "New to Control?";
    document.getElementById("AuthTopAction").textContent = creating ? "Sign in" : "Create account";
    document.getElementById("AuthSwitchPrompt").textContent = creating ? "Already have an account?" : "Don’t have an account?";
    document.getElementById("AuthSwitchAction").textContent = creating ? "Sign in" : "Create account";
    root.querySelectorAll("[data-auth-mode]").forEach(button => { button.dataset.authMode = creating ? "signin" : "create"; });
    setNotice(creating ? "Your profile is saved on this device. Cloud synchronization is not connected yet." : "");
    syncCodeField();
  }

  function showInfo(title, message) {
    document.getElementById("AuthInfoTitle").textContent = title;
    document.getElementById("AuthInfoMessage").textContent = message;
    dialog.showModal();
  }

  root.querySelectorAll("[data-auth-mode]").forEach(button => {
    button.addEventListener("click", () => {
      setMode(button.dataset.authMode);
      (mode === "create" ? name : email).focus({ preventScroll: true });
    });
  });
  root.querySelector(".AuthShowPassword").addEventListener("click", event => {
    const shown = password.type === "password";
    password.type = shown ? "text" : "password";
    event.currentTarget.setAttribute("aria-pressed", String(shown));
    event.currentTarget.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  });
  email.addEventListener("input", syncCodeField);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    setNotice("");
    document.getElementById("AuthSubmitLabel").textContent = mode === "create" ? "Creating account…" : "Signing in…";
    try {
      const result = mode === "create"
        ? await CreateLocalAccount({ Name: name.value.trim(), Email: email.value, Password: password.value })
        : await VerifyLocalAccount(email.value, password.value, code.value);
      if (!result.Success) {
        setNotice(result.Message);
        return;
      }
      form.reset();
      RenderLocalProfile();
      if (window.ControlStudio) window.ControlStudio.enter();
      else ShowSection("Profile");
      document.getElementById("ProfileDisplayName")?.focus({ preventScroll: true });
    } catch (error) {
      setNotice(error.message || "Unable to sign in. Please try again.");
    } finally {
      busy = false;
      submit.disabled = false;
      form.removeAttribute("aria-busy");
      document.getElementById("AuthSubmitLabel").textContent = mode === "create" ? "Create account" : "Sign in";
    }
  });
  document.getElementById("AuthForgot").addEventListener("click", () => showInfo("Forgot your password?", "Your current Control profile is stored only on this device. Email password recovery is not available yet. If you still have a signed-in session, keep it open. No password reset email has been sent."));
  root.querySelectorAll("[data-auth-provider]").forEach(button => button.addEventListener("click", () => {
    showInfo(`Continue with ${button.dataset.authProvider}`, `${button.dataset.authProvider} sign-in is not connected yet. You can sign in with your existing local Control account, or create a profile using your email.`);
  }));
  root.querySelectorAll("[data-auth-legal]").forEach(button => button.addEventListener("click", () => {
    const privacy = button.dataset.authLegal === "privacy";
    showInfo(privacy ? "Privacy Policy" : "Terms of Service", privacy
      ? "Control stores your local profile, filter preferences and usage statistics on this device. This version does not synchronize accounts with a Control server or sell your browsing history. Apple and Google sign-in are not connected."
      : "Control is an independent digital wellbeing tool. Your current profile and preferences are local to this device. Filters depend on the applications they support and may need updates when those applications change.");
  }));
  document.getElementById("AuthCloseDialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  window.ControlAuth = { setMode };
  window.addEventListener("hashchange", () => {
    if (location.hash === "#Login" || location.hash === "#Signup") {
      setMode(location.hash === "#Signup" ? "create" : "signin");
      ShowSection("Login");
    }
  });
  setMode(location.hash === "#Signup" ? "create" : "signin");
})();
