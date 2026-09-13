export type EffectDomain = 'agriculture' | 'animalHusbandry' | 'commerce' | 'industry';
export type EffectKind = 'disaster' | 'event';

export interface EffectDefinition {
  id: string; // e.g. "locusts", "silkRoadTrade"
  kind: EffectKind;
  name: string; // short name, e.g. "메뚜기 떼"
  description: string; // flavor sentence shown when it triggers, e.g. "메뚜기 떼가 몰려와 농작물을 갉아먹었습니다."
  domain: EffectDomain;
  magnitude: number; // contributes additively toward that domain's production multiplier (e.g. -0.5, +0.3)
  durationTurns: number;
}

export interface ActiveEffect {
  id: string; // unique per instance, not the definition id
  definitionId: string;
  kind: EffectKind;
  name: string;
  domain: EffectDomain;
  magnitude: number;
  turnsRemaining: number;
}
