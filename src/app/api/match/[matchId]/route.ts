import { NextRequest, NextResponse } from "next/server";
import { getMatch } from "@/lib/opendota";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "Match ID is required" },
        { status: 400 }
      );
    }

    const match = await getMatch(matchId);

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
