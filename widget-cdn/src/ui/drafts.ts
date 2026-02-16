export function initDrafts(
  shadow: ShadowRoot,
  organizationId: string
): { saveDraft: () => void; loadDraft: () => void; clearDraft: () => void } {
  const input = shadow.getElementById("input") as HTMLTextAreaElement;
  const sendBtn = shadow.getElementById("send-btn") as HTMLButtonElement;
  const DRAFT_KEY = `chatiq_draft_${organizationId}`;

  if (!input) {
      return { saveDraft: () => {}, loadDraft: () => {}, clearDraft: () => {} };
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, input.value);
  }

  function loadDraft() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      input.value = draft;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
      if (sendBtn) sendBtn.disabled = !draft.trim(); 
      // Note: we don't know about currentFile here easily without coupling. 
      // But initComposer logic handles input events. 
      // We might need to trigger an input event?
      input.dispatchEvent(new Event('input'));
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  // Auto-save on input is handled by caller or we add listener here?
  // widget.js added it to input listener.
  input.addEventListener("input", saveDraft);

  return { saveDraft, loadDraft, clearDraft };
}
