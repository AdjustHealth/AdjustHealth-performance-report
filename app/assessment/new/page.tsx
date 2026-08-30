import AssessmentTool from "@/components/AssessmentTool";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tier?: string }>;
}) {
  const { type, tier } = await searchParams;
  return <AssessmentTool presetType={type ?? null} presetTier={tier ?? null} />;
}
