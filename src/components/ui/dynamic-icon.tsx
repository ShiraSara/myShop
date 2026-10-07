import {
  Baby, Bike, Book, Briefcase, Camera, Car, Dumbbell, Flower2, Gamepad2, Gem, Guitar, Hammer, Headphones, House,
  Lamp, Laptop, Monitor, Music, Package, PawPrint, Puzzle, Refrigerator, Shirt, ShoppingBag, Smartphone, Sofa,
  Sparkles, Tag, Ticket, Trees, Tv, WashingMachine, Watch, Wrench, type LucideIcon,
} from "lucide-react";

/** Icon registry for category icons stored by name in the DB. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  baby: Baby, bike: Bike, book: Book, briefcase: Briefcase, camera: Camera, car: Car, dumbbell: Dumbbell,
  flower: Flower2, gamepad: Gamepad2, gem: Gem, guitar: Guitar, hammer: Hammer, headphones: Headphones,
  house: House, lamp: Lamp, laptop: Laptop, monitor: Monitor, music: Music, package: Package, paw: PawPrint,
  puzzle: Puzzle, fridge: Refrigerator, shirt: Shirt, bag: ShoppingBag, smartphone: Smartphone, sofa: Sofa,
  sparkles: Sparkles, tag: Tag, ticket: Ticket, trees: Trees, tv: Tv, washer: WashingMachine, watch: Watch, wrench: Wrench,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Tag;
  return <Icon className={className} aria-hidden strokeWidth={1.7} />;
}
