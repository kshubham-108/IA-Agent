"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ClassifyStreamEvent, UploadedClassifiedFile } from "@/lib/classify-types";
import { docTypeIcon, docTypeLabel } from "@/lib/classify-client.mock";
import { formatFileSize } from "@/lib/format";
import {
  CHECKLIST_ITEMS,
  checklistAnnouncement,
  confidenceBandLabel,
  deriveConfidenceFlow,
  isSubmitEnabled,
  mergeChecklistState,
} from "@/lib/readiness";
import type { CoverageStatus } from "@/lib/classify-types";

const ACCEPTED = ".pdf,.docx,.xlsx";

interface ReadinessGateProps {
  onSubmit: (files: UploadedClassifiedFile[]) => void;
  disabled?: boolean;
}

function newFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function readClassifyStream(
  file: File,
  fileId: string,
  onEvent: (event: ClassifyStreamEvent) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileId", fileId);

  const response = await fetch("/api/classify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Classification failed",
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line) as ClassifyStreamEvent);
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as ClassifyStreamEvent);
  }
}

function StatusIcon({ status }: { status: CoverageStatus }) {
  if (status === "satisfied") {
    return (
      <span className="checklist-icon checklist-icon-satisfied" aria-hidden="true">
        ✓
      </span>
    );
  }
  if (status === "partial" || status === "contradictory") {
    return (
      <span className="checklist-icon checklist-icon-warning" aria-hidden="true">
        !
      </span>
    );
  }
  if (status === "checking") {
    return <span className="checklist-spinner" aria-hidden="true" />;
  }
  return (
    <span className="checklist-icon checklist-icon-pending" aria-hidden="true">
      ›
    </span>
  );
}

export function ReadinessGate({ onSubmit, disabled }: ReadinessGateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedClassifiedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const liveRegionId = useId();

  const checklist = useMemo(() => mergeChecklistState(files), [files]);
  const confidenceFlow = deriveConfidenceFlow(checklist);
  const bandLabel = confidenceBandLabel(confidenceFlow);
  const submitEnabled = isSubmitEnabled(checklist) && !disabled;

  useEffect(() => {
    setAnnouncement(checklistAnnouncement(checklist));
  }, [checklist]);

  const classifyFile = useCallback(async (uploaded: UploadedClassifiedFile) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== uploaded.id) return f;
        const next = { ...f, classifying: true };
        delete next.error;
        return next;
      }),
    );

    try {
      await readClassifyStream(uploaded.file, uploaded.id, (event) => {
        if (event.type === "checking") {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === event.fileId ? { ...f, classifying: true } : f,
            ),
          );
        } else if (event.type === "classified") {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === event.fileId
                ? { ...f, classifying: false, result: event.result }
                : f,
            ),
          );
        } else if (event.type === "error") {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === event.fileId
                ? { ...f, classifying: false, error: event.message }
                : f,
            ),
          );
        }
      });
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploaded.id
            ? {
                ...f,
                classifying: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Classification failed",
              }
            : f,
        ),
      );
    }
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming?.length || disabled) return;

      const additions: UploadedClassifiedFile[] = Array.from(incoming).map(
        (file) => ({
          id: newFileId(),
          file,
          classifying: true,
        }),
      );

      setFiles((prev) => [...prev, ...additions]);
      for (const uploaded of additions) {
        void classifyFile(uploaded);
      }
    },
    [classifyFile, disabled],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!submitEnabled) return;
    onSubmit(files);
  }, [files, onSubmit, submitEnabled]);

  return (
    <div className="readiness-gate">
      <div className="prompt-tab" data-testid="readiness-gate">
        {files.length > 0 && (
          <div className="uploaded-files" data-testid="uploaded-files">
            {files.map((uploaded) => (
              <div
                key={uploaded.id}
                className="file-chip"
                data-testid="file-chip"
                data-classifying={uploaded.classifying ? "true" : "false"}
              >
                <span className="file-chip-icon" aria-hidden="true">
                  {uploaded.result
                    ? docTypeIcon(uploaded.result.doc_type)
                    : "…"}
                </span>
                <span className="file-chip-meta">
                  <span className="file-chip-name">{uploaded.file.name}</span>
                  <span className="file-chip-type">
                    {uploaded.result
                      ? docTypeLabel(uploaded.result.doc_type)
                      : "Classifying…"}{" "}
                    · {formatFileSize(uploaded.file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  className="file-chip-remove"
                  aria-label={`Remove ${uploaded.file.name}`}
                  disabled={disabled || uploaded.classifying}
                  onClick={() => removeFile(uploaded.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <ul className="checklist" aria-label="Document readiness checklist">
          {CHECKLIST_ITEMS.map((item) => {
            const state = checklist[item.id];
            const statusClass = `checklist-item-${state.status}`;
            return (
              <li
                key={item.id}
                className={`checklist-item ${statusClass}${item.optional ? " checklist-item-optional" : ""}`}
                data-testid={`checklist-${item.id}`}
                data-status={state.status}
                tabIndex={0}
                aria-label={`${item.label}, ${state.status}${state.reason ? `, ${state.reason}` : ""}`}
              >
                <StatusIcon status={state.status} />
                <span className="checklist-label">
                  {item.label}
                  {item.optional && (
                    <em className="checklist-optional"> (optional)</em>
                  )}
                </span>
                {(state.status === "partial" || state.status === "contradictory") &&
                  state.reason && (
                    <span className="checklist-reason">{state.reason}</span>
                  )}
              </li>
            );
          })}
        </ul>

        <div className="prompt-tab-footer">
          <button
            type="button"
            className="gate-btn gate-btn-upload"
            aria-label="Upload documents"
            disabled={disabled}
            data-testid="upload-button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!disabled) addFiles(e.dataTransfer.files);
            }}
          >
            <span className={`gate-btn-upload-inner${dragging ? " dragging" : ""}`}>
              +
            </span>
          </button>

          <span
            className="confidence-chip"
            data-testid="confidence-chip"
            data-flow={confidenceFlow}
            title="Expected confidence band for current checklist state"
          >
            {bandLabel}
          </span>

          <button
            type="button"
            className={`gate-btn gate-btn-submit${submitEnabled ? " enabled" : ""}`}
            aria-label="Submit to agent"
            disabled={!submitEnabled}
            data-testid="submit-button"
            data-enabled={submitEnabled ? "true" : "false"}
            onClick={handleSubmit}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        id={liveRegionId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="aria-live-region"
      >
        {announcement}
      </div>
    </div>
  );
}
