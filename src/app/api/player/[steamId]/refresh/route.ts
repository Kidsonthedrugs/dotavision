import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: "Steam ID is required" },
        { status: 400 }
      );
    }

    // In production, this would add a job to the Bull queue
    // For now, we'll simulate the sync
    console.log(`Triggering sync for player ${steamId}`);

    // TODO: Add to Bull queue
    // const syncJob = await syncQueue.add('sync-matches', {
    //   steamId,
    //   lastSynced: user.lastSynced,
    // });

    return NextResponse.json({
      success: true,
      message: "Sync triggered successfully",
      data: {
        jobId: `sync-${steamId}-${Date.now()}`,
        status: "queued",
      },
    });
  } catch (error) {
    console.error("Error triggering refresh:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger sync" },
      { status: 500 }
    );
  }
}
