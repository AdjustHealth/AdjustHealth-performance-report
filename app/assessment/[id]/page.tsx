import { notFound } from "next/navigation";
import { sql, isDbConfigured } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import AssessmentTool from "@/components/AssessmentTool";
import SetupNotice from "@/components/SetupNotice";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDbConfigured() || !isAuthConfigured()) return <SetupNotice />;
  const { id } = await params;

  const rows = await sql()`select id, form_data from assessments where id = ${id}`;
  if (rows.length === 0) notFound();

  return (
    <AssessmentTool
      assessmentId={rows[0].id as string}
      initialFormData={rows[0].form_data as Record<string, unknown>}
    />
  );
}
