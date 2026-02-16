export const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '💪', '🦾', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👯', '🧘', '🛀', '🛌', '👥', '🗣', '👤', '🔥', '⭐', '✨', '💫', '💥', '💯', '💢', '💬', '👁', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👃', '👂', '🦻', '🧏', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂'];

export function initEmojiPicker(shadow: ShadowRoot): void {
  const emojiBtn = shadow.getElementById("emoji-btn");
  const emojiPicker = shadow.getElementById("emoji-picker");
  const emojiGrid = shadow.getElementById("emoji-grid");
  const emojiSearch = shadow.getElementById("emoji-search") as HTMLInputElement;
  const input = shadow.getElementById("input") as HTMLTextAreaElement;
  const sendBtn = shadow.getElementById("send-btn") as HTMLButtonElement;

  if (!emojiBtn || !emojiPicker || !emojiGrid || !emojiSearch || !input) return;

  // Toggle visibility
  emojiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle("visible");
    if (emojiPicker.classList.contains("visible")) {
      populateEmojis(emojiGrid, "");
      emojiSearch.focus();
    }
  });

  // Close when clicking outside
  shadow.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!emojiPicker.contains(target) && !emojiBtn.contains(target)) {
      emojiPicker.classList.remove("visible");
    }
  });

  // Search
  emojiSearch.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    populateEmojis(emojiGrid, target.value.toLowerCase());
  });

  // Insert emoji
  emojiGrid.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".emoji-btn") as HTMLElement;
    if (btn && btn.dataset.emoji) {
      const emoji = btn.dataset.emoji;
      insertAtCursor(input, emoji);
      
      // Update UI state
      sendBtn.disabled = input.value.trim().length === 0;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
      
      // Close picker and focus input
      emojiPicker.classList.remove("visible");
      input.focus();
    }
  });
}

function populateEmojis(container: HTMLElement, filter: string): void {
  const filtered = filter 
    ? emojis.filter(e => e.includes(filter))
    : emojis;
    
  container.innerHTML = filtered.map(emoji => 
    `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
  ).join("");
}

function insertAtCursor(input: HTMLTextAreaElement, text: string): void {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const value = input.value;
  
  input.value = value.substring(0, start) + text + value.substring(end);
  input.selectionStart = input.selectionEnd = start + text.length;
}
