"use client";

import { useState, useTransition } from "react";
import { deleteAssessment } from "@/lib/actions";

export default function DeleteAssessmentButton({ id, athleteName }: { id: string; athleteName: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        className="btn btn-danger"
        style={{ padding: "6px 12px", fontSize: 11 }}
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span className="muted" style={{ fontSize: 11 }}>
        Delete {athleteName}&apos;s report?
      </span>
      <button
        className="btn btn-danger"
        style={{ padding: "6px 12px", fontSize: 11 }}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteAssessment(id);
          })
        }
      >
        {pending ? "Deleting…" : "Confirm"}
      </button>
      <button
        className="btn"
        style={{ padding: "6px 12px", fontSize: 11 }}
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </span>
  );
}
