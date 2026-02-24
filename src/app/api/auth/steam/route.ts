import { NextRequest, NextResponse } from "next/server";
import { STEAM_OPENID } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    // Get the claimed identity from the request body
    const body = await request.json();
    const { claimedIdentity } = body;

    if (!claimedIdentity) {
      return NextResponse.json(
        { success: false, error: "Missing claimed identity" },
        { status: 400 }
      );
    }

    // Extract Steam ID from the claimed identity
    // Format: https://steamcommunity.com/openid/id/<steamid>
    const steamIdMatch = claimedIdentity.match(/id\/(\d+)/);

    if (!steamIdMatch || !steamIdMatch[1]) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID format" },
        { status: 400 }
      );
    }

    const steamId = steamIdMatch[1];

    // In a real implementation, you would:
    // 1. Validate the OpenID response
    // 2. Store the user in your database
    // 3. Create a session/token

    // For now, return the Steam ID
    return NextResponse.json({
      success: true,
      data: {
        steamId,
        message: "Steam authentication initiated. In production, this would create a session.",
      },
    });
  } catch (error) {
    console.error("Error in Steam auth:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Redirect to Steam OpenID login
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": STEAM_OPENID.RETURN_URL,
    "openid.realm": STEAM_OPENID.REALM,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const redirectUrl = `${STEAM_OPENID.URL}?${params.toString()}`;

  return NextResponse.redirect(redirectUrl);
}
