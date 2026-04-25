import sys

with open("src/ui/overworld/OverworldHUD.tsx", "r") as f:
    content = f.read()

import re

# Update Band type
interface_code = """
import { useTranslation } from 'react-i18next';
import { type BandState } from '../../types/game';

export interface OverworldHUDProps {
  player: {
    money?: number;
    day?: number;
    location?: string;
    van?: {
      fuel?: number;
      condition?: number;
    };
  };
  band: BandState;
  harmony?: number;
  muted?: boolean;
  onToggleMute?: () => void;
}
"""
content = re.sub(
    r"\nimport \{ useTranslation \} from 'react-i18next';\nexport interface OverworldHUDProps \{.*?\n  band: Record<string, \{ id: string; name: string; mood: number; stamina: number; \}>;\n  harmony\?: number;\n  muted\?: boolean;\n  onToggleMute\?: \(\) => void;\n\}\n",
    interface_code,
    content,
    flags=re.DOTALL
)

# Remove `any` from maps
content = content.replace("memberStatus = (m: any)", "memberStatus = (m: NonNullable<BandState['members']>[number])")
content = content.replace("{Object.values((band as any)?.members || {}).map((m: any)=>{", "{Object.values(band?.members || {}).map((m)=>{")

with open("src/ui/overworld/OverworldHUD.tsx", "w") as f:
    f.write(content)
