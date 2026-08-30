"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth";

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
  try {
    const rows = await sql()`
      insert into assessments
        (athlete_name, assess_type, youth_tier, clinician, assessment_date, overall_score, form_data)
      values (
        ${summary.athleteName},
        ${summary.assessType},
        ${summary.youthTier},
        ${summary.clinician},
        ${summary.assessmentDate || null},
        ${summary.overallScore},
        ${sql().json(JSON.parse(JSON.stringify(formData)))}
      )
      returning id
    `;
    revalidatePath("/");
    return { id: rows[0].id as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateAssessment(
  id: string,
  formData: Record<string, unknown>,
  summary: AssessmentSummary
): Promise<{ ok: true } | { error: string }> {
  try {
    await sql()`
      update assessments set
        athlete_name = ${summary.athleteName},
        assess_type = ${summary.assessType},
        youth_tier = ${summary.youthTier},
        clinician = ${summary.clinician},
        assessment_date = ${summary.assessmentDate || null},
        overall_score = ${summary.overallScore},
        form_data = ${sql().json(JSON.parse(JSON.stringify(formData)))}
      where id = ${id}
    `;
    revalidatePath("/");
    revalidatePath(`/assessment/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteAssessment(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    await sql()`delete from assessments where id = ${id}`;
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function login(password: string): Promise<{ error: string } | void> {
  if (password !== process.env.AUTH_PASSWORD) {
    return { error: "Incorrect password." };
  }
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
