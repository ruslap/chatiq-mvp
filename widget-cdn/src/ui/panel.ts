import { sounds } from "../sound";

export function initPanel(shadow: ShadowRoot, onClose: () => void): void {
  const closeBtn = shadow.getElementById("close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      onClose();
      sounds.close();
    });
  }
}

export function togglePanel(shadow: ShadowRoot, isOpen: boolean): void {
  const panel = shadow.getElementById("panel");
  if (!panel) return;

  if (isOpen) {
    panel.style.display = "flex";
    // Force reflow to enable transition
    void panel.offsetWidth;
    panel.classList.add("open");
    panel.classList.remove("closing");

    // Focus input on open (desktop only)
    const input = shadow.getElementById("input") as HTMLTextAreaElement;
    if (input && window.innerWidth > 768) {
      setTimeout(() => input.focus(), 300);
    }
  } else {
    panel.classList.remove("open");
    panel.classList.add("closing");

    // Wait for animation to finish then hide
    panel.addEventListener(
      "animationend",
      () => {
        if (panel.classList.contains("closing")) {
          panel.style.display = "none";
          panel.classList.remove("closing");
        }
      },
      { once: true },
    );
  }
}
