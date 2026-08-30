"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AssessmentSummary = {
  athleteName: string;
  assessType: string;
  youthTier: string | null;
  clinician: string | null;
  assessmentDate: string | null;
  overallScore: number | null;
};

export async function createAssessment(
  formData: Record<string, unknown>,
  summary: AssessmentSummary
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      athlete_name: summary.athleteName,
      assess_type: summary.assessType,
      youth_tier: summary.youthTier,
      clinician: summary.clinician,
      assessment_date: summary.assessmentDate || null,
      overall_score: summary.overallScore,
      form_data: formData,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/");
  return { id: data.id as string };
}

export async function updateAssessment(
  id: string,
  formData: Record<string, unknown>,
  summary: AssessmentSummary
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .update({
      athlete_name: summary.athleteName,
      assess_type: summary.assessType,
      youth_tier: summary.youthTier,
      clinician: summary.clinician,
      assessment_date: summary.assessmentDate || null,
      overall_score: summary.overallScore,
      form_data: formData,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/assessment/${id}`);
  return { ok: true };
}

export async function deleteAssessment(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
