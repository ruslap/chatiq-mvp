export interface ComposerControls {
  setLoading: (loading: boolean) => void;
  setSendDisabled: (disabled: boolean) => void;
  clear: () => void;
}

export function initComposer(
  shadow: ShadowRoot,
  onSend: (text: string) => void,
  onTyping?: () => void
): ComposerControls | undefined {
  const input = shadow.getElementById("input") as HTMLTextAreaElement;
  const sendBtn = shadow.getElementById("send-btn") as HTMLButtonElement;
  
  if (!input || !sendBtn) return undefined;

  const checkSendButton = () => {
     // This logic should be external or we expose a method to trigger it?
     // For now, let's just use the external setSendDisabled if needed
     // But internal input listener also toggles it.
     // We should respect external disabled state if loading.
  };

  const handleSend = () => {
    const text = input.value.trim();
    // Allow sending if text exists OR if we are just triggering the callback (logic handled by caller)
    // Actually caller handles "if text or file".
    // Here we just pass text.
    if (text) { // Caller might send empty text if file?
       // Let's rely on caller to check?
       // But checking text here prevents empty messages.
       // If file is present, text might be empty.
       // So we should relax this check if we want to allow file-only messages?
       // For now, let's pass text even if empty string?
       // But standard behavior is block empty.
       // Let's assume onSend handles logic.
        onSend(text);
        // We don't clear here anymore, caller should clear?
        // Or we return controls to clear.
    } else {
        // Empty text, maybe calling for file?
        onSend("");
    }
  };
  
  // Update: logic moved to main to handle text+file check.
  // But we need to update UI based on input.
  
  input.addEventListener("input", () => {
     sendBtn.disabled = input.value.trim().length === 0; // Local check
     // If we have a file, sendBtn should be enabled.
     // This suggests we need to tell composer about file state.
     // OR providing `setSendDisabled` is enough for main to override.
     input.style.height = "auto";
     const newHeight = Math.min(input.scrollHeight, 120);
     input.style.height = newHeight + "px";
     
     if (onTyping) onTyping();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(); // This checks text.trim()
    }
  });

  sendBtn.addEventListener("click", handleSend);

  return {
      setLoading: (loading: boolean) => {
          if (loading) {
              sendBtn.innerHTML = "⏳";
              sendBtn.disabled = true;
          } else {
              sendBtn.innerHTML = "➤"; // Replace with SVG if needed
              sendBtn.disabled = input.value.trim().length === 0; 
          }
      },
      setSendDisabled: (disabled: boolean) => {
          sendBtn.disabled = disabled;
      },
      clear: () => {
          input.value = "";
          input.style.height = "auto";
          sendBtn.disabled = true;
      }
  };
}
