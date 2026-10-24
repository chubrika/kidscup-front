import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type InstagramRefreshResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string };
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const provided = Buffer.from(header.slice(prefix.length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = "IGAAZAOQYx6s69BZAGFvQVI5UHY3aUFJX2U4d19mN1ROZAjRJUVNpQmdkYU55MERubUhIQmpZAdl9EeFJPd0tWTFo2Y1o0WHBGM2dZARjh1UnlfYU1XQVhnZAE95LWN5S1dmbTJYRjNzcXJQdEx6Yjh5eTdhWVVfMDgyOW9nT0U1ZAV9qdwZDZD";
  if (!token) {
    return NextResponse.json({ error: "Missing Instagram access token" }, { status: 500 });
  }

  try {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", token);

    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json()) as InstagramRefreshResponse;

    if (!response.ok || !payload.access_token) {
      return NextResponse.json(
        { error: payload.error?.message || "Failed to refresh Instagram token" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      access_token: payload.access_token,
      token_type: payload.token_type ?? "bearer",
      expires_in: payload.expires_in ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to refresh Instagram token" }, { status: 502 });
  }
}
