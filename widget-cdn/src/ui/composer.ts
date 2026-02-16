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

  const handleSend = () => {
    const text = input.value.trim();
    onSend(text);
  };
  
  input.addEventListener("input", () => {
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
