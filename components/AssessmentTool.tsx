"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAssessment, updateAssessment, type AssessmentSummary } from "@/lib/actions";

type SaveMessage = {
  type: "save";
  formData: Record<string, unknown>;
  summary: AssessmentSummary;
};

type ReadyMessage = { type: "embedded-ready" };

function isToolMessage(data: unknown): data is SaveMessage | ReadyMessage {
  return !!data && typeof data === "object" && "type" in data;
}

export default function AssessmentTool({
  assessmentId = null,
  initialFormData = null,
}: {
  assessmentId?: string | null;
  initialFormData?: Record<string, unknown> | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const [id, setId] = useState<string | null>(assessmentId);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (!isToolMessage(e.data)) return;

      if (e.data.type === "embedded-ready" && initialFormData) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "hydrate", formData: initialFormData },
          "*"
        );
      }

      if (e.data.type === "save") {
        void handleSave(e.data.formData, e.data.summary);
      }
    }

    async function handleSave(formData: Record<string, unknown>, summary: AssessmentSummary) {
      setStatus("saving");
      setErrorMsg(null);
      let result;
      try {
        result = id
          ? await updateAssessment(id, formData, summary)
          : await createAssessment(formData, summary);
      } catch {
        setStatus("error");
        setErrorMsg("Supabase isn't configured yet — see SETUP.md.");
        return;
      }

      if ("error" in result && result.error) {
        setStatus("error");
        setErrorMsg(result.error);
        return;
      }
      if ("id" in result) {
        setId(result.id);
        router.replace(`/assessment/${result.id}`);
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, initialFormData, router]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          background: "#131b24",
          borderBottom: "1px solid #1c2733",
          flexShrink: 0,
        }}
      >
        <Link href="/" className="btn" style={{ padding: "7px 14px", fontSize: 12 }}>
          ← All Assessments
        </Link>
        <div style={{ fontSize: 12 }}>
          {status === "saving" && <span className="muted">Saving…</span>}
          {status === "saved" && <span style={{ color: "#4cdb7a" }}>Saved ✓</span>}
          {status === "error" && <span style={{ color: "#e05252" }}>Save failed: {errorMsg}</span>}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src="/tool.html"
        title="Performance Report Tool"
        style={{ flex: 1, border: "none", width: "100%" }}
      />
    </div>
  );
}
