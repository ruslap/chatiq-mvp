import { formatFileSize } from "../utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function initFileUpload(
  shadow: ShadowRoot,
  onFileChange: (file: File | null) => void
): void {
  const attachBtn = shadow.getElementById("attach-btn");
  const fileInput = shadow.getElementById("file-input") as HTMLInputElement;
  const uploadRemove = shadow.getElementById("upload-remove");
  const uploadPreview = shadow.getElementById("upload-preview");
  const uploadName = shadow.getElementById("upload-name");
  const uploadSize = shadow.getElementById("upload-size");
  const uploadThumb = shadow.getElementById("upload-thumb");
  const dropOverlay = shadow.getElementById("drop-overlay");
  const panel = shadow.getElementById("panel");

  if (!attachBtn || !fileInput || !uploadRemove || !uploadPreview || !uploadName || !uploadSize || !uploadThumb || !dropOverlay || !panel) {
    return;
  }

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be less than 10MB");
      return;
    }

    onFileChange(file);
    
    uploadName.textContent = file.name;
    uploadSize.textContent = formatFileSize(file.size);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
            uploadThumb.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
        }
      };
      reader.readAsDataURL(file);
    } else {
      uploadThumb.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
        </svg>
      `;
    }

    uploadPreview.classList.add("visible");
  };

  const clearFileUpload = () => {
    onFileChange(null);
    fileInput.value = "";
    uploadPreview.classList.remove("visible");
  };

  // Event Listeners
  attachBtn.addEventListener("click", () => fileInput.click());
  
  fileInput.addEventListener("change", (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  });

  uploadRemove.addEventListener("click", clearFileUpload);

  // Drag & Drop
  let dragCounter = 0;

  const onDragEnter = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    dropOverlay.classList.add("visible");
  };

  const onDragLeave = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.remove("visible");
    }
  };

  const onDragOver = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dropOverlay.classList.remove("visible");

    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  panel.addEventListener("dragenter", onDragEnter);
  panel.addEventListener("dragleave", onDragLeave);
  panel.addEventListener("dragover", onDragOver);
  panel.addEventListener("drop", onDrop);
}

export function clearUploadUI(shadow: ShadowRoot): void {
    const fileInput = shadow.getElementById("file-input") as HTMLInputElement;
    const uploadPreview = shadow.getElementById("upload-preview");
    
    if (fileInput) fileInput.value = "";
    if (uploadPreview) uploadPreview.classList.remove("visible");
}
