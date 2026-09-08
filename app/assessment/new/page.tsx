import AssessmentTool from "@/components/AssessmentTool";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tier?: string; clinician?: string }>;
}) {
  const { type, tier, clinician } = await searchParams;
  return <AssessmentTool presetType={type ?? null} presetTier={tier ?? null} presetClinician={clinician ?? null} />;
}
