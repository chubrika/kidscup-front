export const MATCH_STAGES = ["GROUP", "SEMIFINAL", "FINAL"] as const;

export type MatchStage = (typeof MATCH_STAGES)[number];

export const DEFAULT_MATCH_STAGE: MatchStage = "GROUP";

export const MATCH_STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: "ჯგუფური ეტაპი",
  SEMIFINAL: "ნახევარფინალი",
  FINAL: "ფინალი",
};

/** Treat missing stage as GROUP for backward compatibility. */
export function resolveMatchStage(stage?: MatchStage | null): MatchStage {
  return stage ?? DEFAULT_MATCH_STAGE;
}

export function isGroupStage(stage?: MatchStage | null): boolean {
  return resolveMatchStage(stage) === "GROUP";
}

export function getMatchStageLabel(stage?: MatchStage | null): string {
  return MATCH_STAGE_LABELS[resolveMatchStage(stage)];
}

export const MATCH_STAGE_SECTIONS: Array<{
  stage: MatchStage;
  title: string;
}> = [
  { stage: "GROUP", title: "ჯგუფური ეტაპი" },
  { stage: "SEMIFINAL", title: "ნახევარფინალი" },
  { stage: "FINAL", title: "ფინალი" },
];
