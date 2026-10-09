import {
  Wifi, Utensils, Car, Waves, Snowflake, Shirt, Tv, Bath, Dumbbell, Flame, Umbrella, Mountain, Sailboat, Heater,
  Laptop, PawPrint, Coffee, BellRing, Trees, DoorOpen, Sparkles, Flower2, Castle, Tent, Tractor, Gem, Home, Building2,
  Palmtree, TreePine, BedDouble, Eye, TrendingUp, Anchor, Landmark,
} from "lucide-react";

const AMENITY: Record<string, any> = {
  wifi: Wifi, utensils: Utensils, car: Car, waves: Waves, snowflake: Snowflake, shirt: Shirt, tv: Tv, bath: Bath,
  dumbbell: Dumbbell, flame: Flame, umbrella: Umbrella, mountain: Mountain, sailboat: Sailboat, heater: Heater,
  laptop: Laptop, "paw-print": PawPrint, coffee: Coffee, bell: BellRing, trees: Trees, "door-open": DoorOpen,
};
export function AmenityIcon({ name, size = 24 }: { name: string; size?: number }) {
  const I = AMENITY[name] || Sparkles;
  return <I size={size} strokeWidth={1.5} />;
}

const CATEGORY: Record<string, any> = {
  trending: TrendingUp, "amazing-views": Eye, beachfront: Umbrella, cabins: Home, "amazing-pools": Waves,
  countryside: Flower2, castles: Castle, camping: Tent, farms: Tractor, design: Gem, "tiny-homes": Home,
  lakefront: Anchor, mansions: Landmark, islands: Palmtree, treehouses: TreePine, rooms: BedDouble,
};
export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  const I = CATEGORY[name] || Building2;
  return <I size={size} strokeWidth={1.5} />;
}
