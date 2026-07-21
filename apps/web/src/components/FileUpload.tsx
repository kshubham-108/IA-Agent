"use client";

import { useCallback, useRef, useState } from "react";

import { formatFileSize } from "@/lib/format";

const ACCEPTED = ".pdf,.docx,.xlsx";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUpload({ file, onFileChange, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const selected = files?.[0] ?? null;
      onFileChange(selected);
    },
    [onFileChange],
  );

  return (
    <div>
      <label
        className={`upload-zone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p>{file ? "Replace file" : "Drop file or click to upload"}</p>
        <p className="hint">PDF, DOCX, or XLSX</p>
      </label>
      {file && (
        <div className="file-selected">
          {file.name} · {formatFileSize(file.size)}
        </div>
      )}
    </div>
  );
}
