import type { GeneralRole, ResourceType, UnitType } from '@sam-simul/shared';

// A small, self-contained set of custom line icons for resources, unit
// types, and facilities -- no external icon font/library and no art
// pipeline, just plain inline SVG at a shared 24x24 viewBox so every icon
// drops in at a consistent visual weight (stroke-based, currentColor) no
// matter where it's used (warehouse list, recruit form, general skills...).

export type FacilityIconId =
  | 'agriculture'
  | 'animalHusbandry'
  | 'tradingPost'
  | 'taxOffice'
  | 'market'
  | 'armory'
  | 'weaponsWorkshop'
  | 'blacksmith'
  | 'publicWorks';

const RESOURCE_PATHS: Record<ResourceType, string> = {
  gold: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  rice: 'M6 20h12M8 20c0-4 1-8-1-11M12 20c0-5 .5-9-1-13M16 20c0-4-1-8 1-11',
  wheat: 'M12 21V6M12 6 8 9M12 6l4 3M12 10 8 13M12 10l4 3M12 14l-4 3M12 14l4 3',
  potato: 'M6 15c-1-3 1-7 5-8 5-1.5 9 2 8 6-1 4-5 6-9 5-2-.5-3.5-1.5-4-3Zm2-3.5.01.01M13 9.5l.01.01',
  cotton: 'M12 20v-6M12 14a3 3 0 1 1 -3-3M12 14a3 3 0 1 0 3-3M12 14a3 3 0 1 1 3 -5M12 14a3 3 0 1 0 -3 -5',
  hemp: 'M12 21V5M12 9 7 6M12 9l5-3M12 13 7 11M12 13l5-2M12 17l-4 1M12 17l4 1',
  cattle: 'M7 10 5 7m12 3 2-3M7 10a5 5 0 0 1 10 0c1 1 1.5 2.5.5 4-.5 3-2 5-5.5 5s-5-2-5.5-5c-1-1.5-.5-3 .5-4Zm2 3h.01M15 13h.01',
  horse: 'M6 20c0-3 .5-5 2-6l-1-4 3-3 2 2h3l2-2 2 3-2 2v3l2 5h-3l-1-3H9l-1 3H6Zm3-9h.01',
  pig: 'M5 13a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-1Zm3 5v2m8-2v2M8 12h.01M12 12h1.5v1.5H12z',
  leather: 'M6 6c3-1 9-1 12 0-1 3-1 9 0 12-3 1-9 1-12 0 1-3 1-9 0-12Z',
  spear: 'M4 20 17 7m0 0-3-1 1-3 3 3 1 3-2-2Z',
  bow: 'M7 3a13 13 0 0 0 0 18M7 3l13 9L7 21',
  crossbow: 'M4 12h16M8 8v8M16 8v8M12 6v12M9 12l-3-2m3 2-3 2m9-4 3-2m-3 2 3 2',
  shield: 'M12 3l7 3v6c0 5-3 7.5-7 9-4-1.5-7-4-7-9V6l7-3Z',
  horseArmor: 'M12 3l7 3v6c0 5-3 7.5-7 9-4-1.5-7-4-7-9V6l7-3Zm-4 6h8M8 12h8M8 15h5',
  armor: 'M8 4h8l2 4-2 2v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9L6 8l2-4Zm4 6v9',
};

const UNIT_PATHS: Record<UnitType, string> = {
  spearman: 'M9 21v-6a3 3 0 1 1 6 0v6M12 12V9M4 21 19 6m0 0-3-1 1-3 3 3 1 3-2-2Z',
  crossbowman: 'M9 21v-6a3 3 0 1 1 6 0v6M12 12V9M4 12h9M6 9v6M11 9v6M4.5 12l-1.5-1M4.5 12l-1.5 1',
  cavalry: 'M4 20c0-3 .5-5 2-6l-1-4 3-3 2 2h3l2-2 2 3-2 2v3l2 5h-3l-1-3H9l-1 3H6Zm3-9h.01M13 6l3-3 2 2-2 2',
  engineer: 'M14.5 3.5a3 3 0 0 1 4 4l-8 8-4-4 8-8Zm-9 9-3.5 7 7-3.5Z',
};

const FACILITY_PATHS: Record<FacilityIconId, string> = {
  agriculture: 'M12 21V11M12 11c0-4-3-6-7-6 0 4 3 7 7 6Zm0 0c0-5 3-8 7-8 0 5-3 8-7 8Z',
  animalHusbandry: 'M4 20V10l8-5 8 5v10H4Zm4 0v-6h8v6',
  tradingPost: 'M4 8h16l-1 5H5L4 8Zm2 5v6h12v-6M9 19a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  taxOffice: 'M7 3h10v16l-5-2-5 2V3Zm3 5h4m-4 4h4',
  market: 'M4 9 6 4h12l2 5M4 9v2a2 2 0 0 0 4 0V9m0 2a2 2 0 0 0 4 0V9m0 2a2 2 0 0 0 4 0V9m0 2a2 2 0 0 0 4 0V9M6 11v9h12v-9',
  armory: 'M6 4 4 6l3 3 1-1 6 6-2 2 3 3 2-2-3-3 2-2-6-6 1-1-3-3ZM16 4l4 4-2 2-4-4 2-2Z',
  weaponsWorkshop: 'M14 3l-9 9 2 2 9-9-2-2Zm-2 4 3 3M4 20l3-6 3 3-6 3Z',
  blacksmith: 'M3 15h9v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3Zm3-3V9h3v3M14 8l6-4 2 2-4 6-2-1-3 3-2-2 3-3-2-1Z',
  publicWorks: 'M5 21V10l7-6 7 6v11M9 21v-6h6v6M5 10h14',
};

function Svg({ path, size, className }: { path: string; size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function ResourceIcon({ resource, size = 18, className }: { resource: ResourceType; size?: number; className?: string }) {
  return <Svg path={RESOURCE_PATHS[resource]} size={size} className={className} />;
}

export function UnitIcon({ unitType, size = 18, className }: { unitType: UnitType; size?: number; className?: string }) {
  return <Svg path={UNIT_PATHS[unitType]} size={size} className={className} />;
}

export function FacilityIcon({ facility, size = 18, className }: { facility: FacilityIconId; size?: number; className?: string }) {
  return <Svg path={FACILITY_PATHS[facility]} size={size} className={className} />;
}

function hashHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}

// Combat generals get a sword glyph badge, domestic generals a scroll glyph
// -- a quick visual role tell at a glance, without needing real portrait art.
const ROLE_GLYPH_PATH: Record<GeneralRole, string> = {
  combat: 'M-3 3 3 -3m0 0-1-3 3 1 1 3-2-1Zm-6 6-1 3 3-1Z',
  domestic: 'M-3 -3h6v7l-3 1-3-1v-7Zm0 2.5h6M-3 5h6',
};

// An "improved icon-style portrait" (per the roadmap's art-pipeline
// limitation): no real illustrations, but a two-tone shaded badge with a
// role glyph and initial, consistently derived from portraitSeed so the
// same general always renders the same way across the roster panel, the
// codex, and anywhere else it's used.
export function GeneralPortrait({
  general,
  size = 40,
  className,
}: {
  general: { name: string; role: GeneralRole; portraitSeed: string };
  size?: number;
  className?: string;
}) {
  const hue = hashHue(general.portraitSeed);
  const base = `hsl(${hue}, 45%, 36%)`;
  const highlight = `hsl(${hue}, 55%, 58%)`;
  const ring = general.role === 'combat' ? '#b8564f' : '#4f7ab8';

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <circle cx={20} cy={20} r={18.5} fill={base} stroke={ring} strokeWidth={2} />
      <circle cx={14} cy={11} r={11} fill={highlight} opacity={0.3} />
      <text x={20} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff" fontFamily="inherit">
        {general.name.charAt(0)}
      </text>
      <g transform="translate(30,30)">
        <circle r={7} fill={ring} stroke="#1a1410" strokeWidth={1} />
        <path d={ROLE_GLYPH_PATH[general.role]} stroke="#fff" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
