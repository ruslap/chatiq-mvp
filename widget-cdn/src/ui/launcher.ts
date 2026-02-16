import { sounds } from "../sound";

export function initLauncher(shadow: ShadowRoot, onToggle: () => void): void {
  const launcher = shadow.getElementById("launcher");
  if (!launcher) return;

  launcher.addEventListener("click", () => {
    onToggle();
    sounds.click();
  });

  // Animate in
  setTimeout(() => launcher.classList.add("ready"), 100);
}

export function updateLauncherState(shadow: ShadowRoot, isOpen: boolean): void {
  const launcher = shadow.getElementById("launcher");
  if (!launcher) return;

  if (isOpen) {
    launcher.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close chat");
  } else {
    launcher.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open chat");
  }
}

export function setUnreadBadge(shadow: ShadowRoot, count: number): void {
  const badge = shadow.getElementById("badge");
  const launcher = shadow.getElementById("launcher");
  if (!badge || !launcher) return;

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.add("visible");
    launcher.classList.add("pulse");
  } else {
    badge.classList.remove("visible");
    launcher.classList.remove("pulse");
  }
}
