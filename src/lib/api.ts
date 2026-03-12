export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type Category = {
  id: string;
  _id: string;
  name: string;
};

export type Team = {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  coachName?: string;
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
  teamId:
    | { _id: string; name: string; logo?: string; city?: string }
    | string;
};

export type StandingRow = {
  teamId: string;
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
  categoryId: string;
  categoryName: string;
  standings: StandingRow[];
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

export async function getStandings(ageCategory?: string | null): Promise<StandingsGroup[]> {
  const url = ageCategory
    ? `${API_URL}/standings?ageCategory=${encodeURIComponent(ageCategory)}`
    : `${API_URL}/standings`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}
