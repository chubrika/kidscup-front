import type { MatchStage } from "@/lib/matchStage";
import { getMatchStageLabel, resolveMatchStage } from "@/lib/matchStage";

type MatchStageBadgeProps = {
  stage?: MatchStage | null;
  className?: string;
};

const STAGE_STYLES: Record<MatchStage, string> = {
  GROUP: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  SEMIFINAL: "bg-amber-50 text-amber-800 ring-amber-200",
  FINAL: "bg-[#00306d]/10 text-[#00306d] ring-[#00306d]/20",
};

export function MatchStageBadge({ stage, className = "" }: MatchStageBadgeProps) {
  const styleKey = resolveMatchStage(stage);
  const resolved = getMatchStageLabel(stage);
  const styles = STAGE_STYLES[styleKey];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles} ${className}`}
    >
      {resolved}
    </span>
  );
}
