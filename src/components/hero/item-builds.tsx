"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item {
  id: number;
  name: string;
  count: number;
}

interface ItemBuildsProps {
  builds: {
    startingItems: Item[];
    coreItems: Item[];
    situationalItems: Item[];
  };
}

// Map of item IDs to image URLs
const ITEM_IMAGES: Record<number, string> = {
  84: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/iron_branch_lg.png",
  23: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/tango_lg.png",
  63: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/ultimate_orb_lg.png",
  111: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/arcane_boots_lg.png",
  112: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/force_staff_lg.png",
  98: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/glimmer_cape_lg.png",
};

function ItemIcon({ item, size = 40 }: { item: Item; size?: number }) {
  const imageUrl = ITEM_IMAGES[item.id];
  
  return (
    <div 
      className="relative rounded bg-slate-700 overflow-hidden"
      style={{ width: size, height: size }}
      title={item.name}
    >
      {imageUrl ? (
        <img 
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
          {item.id}
        </div>
      )}
      {item.count > 1 && (
        <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
          x{item.count}
        </div>
      )}
    </div>
  );
}

export function ItemBuilds({ builds }: ItemBuildsProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Item Builds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Starting Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Starting Items</h4>
          <div className="flex flex-wrap gap-2">
            {builds.startingItems.map((item) => (
              <ItemIcon key={item.id} item={item} />
            ))}
            {builds.startingItems.length === 0 && (
              <span className="text-gray-500 text-sm">No data available</span>
            )}
          </div>
        </div>

        {/* Core Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Core Items</h4>
          <div className="flex flex-wrap gap-2">
            {builds.coreItems.map((item) => (
              <ItemIcon key={item.id} item={item} />
            ))}
            {builds.coreItems.length === 0 && (
              <span className="text-gray-500 text-sm">No data available</span>
            )}
          </div>
        </div>

        {/* Situational Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Situational Items</h4>
          <div className="flex flex-wrap gap-2">
            {builds.situationalItems.map((item) => (
              <ItemIcon key={item.id} item={item} />
            ))}
            {builds.situationalItems.length === 0 && (
              <span className="text-gray-500 text-sm">No data available</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
