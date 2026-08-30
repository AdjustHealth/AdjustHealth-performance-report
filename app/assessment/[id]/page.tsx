import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AssessmentTool from "@/components/AssessmentTool";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, form_data")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return (
    <AssessmentTool
      assessmentId={data.id}
      initialFormData={data.form_data as Record<string, unknown>}
    />
  );
}
