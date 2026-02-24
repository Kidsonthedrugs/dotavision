import { NextResponse } from "next/server";
import { getHeroes } from "@/lib/opendota";
import { Hero } from "@/types";

export async function GET() {
  try {
    const heroes = await getHeroes();

    // Transform to our Hero type
    const transformedHeroes: Hero[] = heroes.map((hero) => ({
      id: hero.id,
      name: hero.name,
      localizedName: hero.localized_name,
      attackType: hero.attack_type as "melee" | "ranged",
      primaryAttr: hero.primary_attr as "str" | "agi" | "int",
      roles: hero.roles || [],
      icon: `/apps/dota2/images/heroes/${hero.name?.replace("npc_dota_hero_", "")}_icon.png`,
      img: `/apps/dota2/images/heroes/${hero.name?.replace("npc_dota_hero_", "")}.png`,
    }));

    return NextResponse.json({
      success: true,
      data: transformedHeroes,
    });
  } catch (error) {
    console.error("Error fetching heroes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch heroes" },
      { status: 500 }
    );
  }
}
