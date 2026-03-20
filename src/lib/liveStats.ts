export type MatchEventType =
  | "POINT_1"
  | "POINT_2"
  | "POINT_3"
  | "ASSIST"
  | "REBOUND"
  | "STEAL"
  | "BLOCK"
  | "FOUL";

export type TeamScore = { teamId: string; points: number };

export type MatchStats = {
  teamScores: TeamScore[];
};

