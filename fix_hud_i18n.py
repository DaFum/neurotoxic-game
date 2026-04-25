import sys

with open("src/ui/overworld/OverworldHUD.tsx", "r") as f:
    content = f.read()

import re

# We need to add `t` to OverworldHUDProps and then translate the hardcoded strings
interface_code = """
import { useTranslation } from 'react-i18next';
export interface OverworldHUDProps {
"""
content = content.replace("export interface OverworldHUDProps {", interface_code)

# Ensure the component signature extracts `t`? No, just use `useTranslation` inside the component
translation_hook = """export const OverworldHUD = React.memo(({ player, band, harmony, muted, onToggleMute }: OverworldHUDProps) => {
  const { t } = useTranslation(['ui']);"""
content = content.replace("export const OverworldHUD = React.memo(({ player, band, harmony, muted, onToggleMute }: OverworldHUDProps) => {", translation_hook)

# Replace hardcoded strings
content = content.replace("Day {player.day || 1} — {player.location || 'UNKNOWN'}", "Day {player.day || 1} — {player.location || t('ui:map.unknown', { defaultValue: 'UNKNOWN' })}")
content = content.replace("⚠ LOW FUEL", "{t('ui:overworld.low_fuel', { defaultValue: '⚠ LOW FUEL' })}")
content = content.replace("<div className=\"sc-title\">Keyboard Shortcuts</div>", "<div className=\"sc-title\">{t('ui:overworld.keyboard_shortcuts', { defaultValue: 'Keyboard Shortcuts' })}</div>")
content = content.replace("['?, h','Toggle Help'],['M','Mute / Unmute'],['1–4','Select Event Option'],['← ↓ →','Hit Notes (Gig)'],['ESC','Close Overlays']", "['?, h', t('ui:overworld.shortcuts.help', { defaultValue: 'Toggle Help' })], ['M', t('ui:overworld.shortcuts.mute', { defaultValue: 'Mute / Unmute' })], ['1–4', t('ui:overworld.shortcuts.event', { defaultValue: 'Select Event Option' })], ['← ↓ →', t('ui:overworld.shortcuts.hit_notes', { defaultValue: 'Hit Notes (Gig)' })], ['ESC', t('ui:overworld.shortcuts.close', { defaultValue: 'Close Overlays' })]")
content = content.replace("<div className=\"band-hdr\">Band Status</div>", "<div className=\"band-hdr\">{t('ui:overworld.band_status', { defaultValue: 'Band Status' })}</div>")
content = content.replace("<span className=\"harmony-label\">Harmony</span>", "<span className=\"harmony-label\">{t('ui:overworld.harmony', { defaultValue: 'Harmony' })}</span>")

with open("src/ui/overworld/OverworldHUD.tsx", "w") as f:
    f.write(content)
