const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

// NEXT_PUBLIC_* values are embedded at build time for browser bundles.
export const API_URL =
  envApiUrl ??
  (process.env.NODE_ENV === "production"
    ? "https://kidscup-back.onrender.com/api"
    : "http://localhost:3000/api");

export type Category = {
  id: string;
  _id: string;
  name: string;
};

export type TeamStatus = "pending" | "approved" | "rejected";

export type Team = {
  _id: string;
  name: string;
  logo?: string;
  logoKey?: string;
  city?: string;
  coachName?: string;
  assistantCoachName?: string;
  doctor?: string;
  status?: TeamStatus;
  ageCategory?: { _id: string; name: string };
  createdAt?: string;
};

export type Player = {
  _id: string;
  firstName: string;
  lastName: string;
  number: number;
  position?: string;
  birthDate?: string;
  height?: number;
  photo?: string;
  idDocument?: string;
  teamId:
    | { _id: string; name: string; logo?: string; city?: string }
    | string;
};

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type MatchStage = "GROUP" | "SEMIFINAL" | "FINAL";

export type Match = {
  _id: string;
  homeTeam: Team | string;
  awayTeam: Team | string;
  date: string;
  time?: string;
  location?: string;
  ageCategory?: Category | string;
  refereesInfo?: string;
  status: MatchStatus;
  scoreHome?: number;
  scoreAway?: number;
  season?: string | Season;
  group?: Group | string;
  round?: Round | string;
  stage?: MatchStage;
  createdAt?: string;
  updatedAt?: string;
};

export type Season = {
  _id: string;
  name: string;
  ageCategory?: Category | string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  albums?: Array<{
    _id: string;
    title: string;
    createdAt?: string;
    photos?: Array<{
      url: string;
      key: string;
      createdAt?: string;
    }>;
  }>;
  photos?: Array<{
    url: string;
    key: string;
    createdAt?: string;
  }>;
};

/** When populated by the API, teamId is an object with team details */
export type StandingRowTeamRef = {
  _id: string;
  name?: string;
  logo?: string;
  city?: string;
  coachName?: string;
};

export type StandingRow = {
  teamId: string | StandingRowTeamRef;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  points: number;
};

export type StandingsGroup = {
  categoryId?: string;
  categoryName?: string;
  groupId?: string | null;
  groupName?: string;
  sortOrder?: number;
  seasonId?: string;
  scope?: 'overall';
  standings: StandingRow[];
};

export type Group = {
  _id: string;
  name: string;
  season: string | Season;
  ageCategory?: string | Category;
  sortOrder?: number;
};

export type Round = {
  _id: string;
  name: string;
  group: string | Group;
  roundNumber: number;
  date?: string;
  sortOrder?: number;
};

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getTeams(ageCategory?: string): Promise<Team[]> {
  const url = ageCategory
    ? `${API_URL}/teams?ageCategory=${encodeURIComponent(ageCategory)}`
    : `${API_URL}/teams`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

export async function getTeamById(id: string): Promise<Team | null> {
  const res = await fetch(`${API_URL}/teams/${encodeURIComponent(id)}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

export async function getPlayers(teamId?: string): Promise<Player[]> {
  const url = teamId
    ? `${API_URL}/players?teamId=${encodeURIComponent(teamId)}`
    : `${API_URL}/players`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const res = await fetch(`${API_URL}/players/${encodeURIComponent(id)}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch player");
  return res.json();
}

export async function getStandings(params?: {
  ageCategory?: string | null;
  seasonId?: string | null;
  groupId?: string | null;
  scope?: 'overall';
}): Promise<StandingsGroup[]> {
  const search = new URLSearchParams();
  if (params?.ageCategory) search.set('ageCategory', params.ageCategory);
  if (params?.seasonId) search.set('seasonId', params.seasonId);
  if (params?.groupId) search.set('groupId', params.groupId);
  if (params?.scope) search.set('scope', params.scope);
  const query = search.toString();
  const url = query ? `${API_URL}/standings?${query}` : `${API_URL}/standings`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}

export async function getGroups(params?: {
  seasonId?: string;
  ageCategory?: string;
}): Promise<Group[]> {
  const search = new URLSearchParams();
  if (params?.seasonId) search.set('seasonId', params.seasonId);
  if (params?.ageCategory) search.set('ageCategory', params.ageCategory);
  const query = search.toString();
  const url = query ? `${API_URL}/groups?${query}` : `${API_URL}/groups`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function getRounds(groupId: string): Promise<Round[]> {
  const res = await fetch(`${API_URL}/rounds?groupId=${encodeURIComponent(groupId)}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch rounds');
  return res.json();
}

export async function getMatches(params?: {
  status?: MatchStatus;
  ageCategory?: string | null;
  seasonId?: string | null;
  groupId?: string | null;
  roundId?: string | null;
  stage?: MatchStage | null;
}): Promise<Match[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.ageCategory) search.set("ageCategory", params.ageCategory);
  if (params?.seasonId) search.set("seasonId", params.seasonId);
  if (params?.groupId) search.set("groupId", params.groupId);
  if (params?.roundId) search.set("roundId", params.roundId);
  if (params?.stage) search.set("stage", params.stage);

  const query = search.toString();
  const url = query ? `${API_URL}/matches?${query}` : `${API_URL}/matches`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function getMatchById(id: string): Promise<Match | null> {
  const res = await fetch(`${API_URL}/matches/${encodeURIComponent(id)}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 30 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch match");
  return res.json();
}

export type PlayerMatchStats = {
  playerId: string;
  teamId: string;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  fouls: number;
};

export type MatchStatsResponse = {
  teamScores: Array<{ teamId: string; points: number }>;
  playerStats: PlayerMatchStats[];
};

export async function getMatchStats(matchId: string): Promise<MatchStatsResponse> {
  const res = await fetch(`${API_URL}/matches/${encodeURIComponent(matchId)}/stats`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to fetch match stats");
  return res.json();
}

export async function getSeasons(ageCategory?: string | null): Promise<Season[]> {
  const url = ageCategory
    ? `${API_URL}/seasons?ageCategory=${encodeURIComponent(ageCategory)}`
    : `${API_URL}/seasons`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch seasons");
  return res.json();
}

export type News = {
  _id: string;
  title: string;
  description?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getNews(): Promise<News[]> {
  const res = await fetch(`${API_URL}/news`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
}

export async function getNewsById(id: string): Promise<News | null> {
  const res = await fetch(`${API_URL}/news/${encodeURIComponent(id)}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
}

export type VideoCategory = "Full Match" | "Highlights" | "Interview";

export type Video = {
  _id: string;
  title: string;
  description?: string;
  youtubeId: string;
  category: VideoCategory;
  status?: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
};

export async function getVideos(): Promise<Video[]> {
  const res = await fetch(`${API_URL}/videos`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export async function getVideoById(id: string): Promise<Video | null> {
  const res = await fetch(`${API_URL}/videos/${encodeURIComponent(id)}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch video");
  return res.json();
}
