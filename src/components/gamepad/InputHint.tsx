import React from 'react';
import { useTranslation } from 'react-i18next';
import { useActiveInputSource } from '../../utils/gamepad/inputSourceStore';
import { detectLayoutFamily, getButtonGlyph } from '../../utils/gamepad/layout';
import { useGameSelector } from '../../context/GameState';
import { useGamepadInputOptional } from '../../context/GamepadInputContext';

export interface InputHintProps {
  /** Abstract action type or explicit button index */
  action?: 'confirm' | 'back' | 'menu' | 'direction' | 'lane0' | 'lane1' | 'lane2';
  buttonIndex?: number;
  /** Custom fallback text or keyboard hint when input source is not gamepad */
  keyboardText?: string;
  className?: string;
}

/**
 * Component displaying dynamic controller button glyphs or keyboard hints
 * depending on active input source and current settings.
 */
export const InputHint: React.FC<InputHintProps> = ({
  action,
  buttonIndex,
  keyboardText,
  className = '',
}) => {
  const { t } = useTranslation('ui');
  const activeSource = useActiveInputSource();
  let settings;
  try {
    settings = useGameSelector((s) => s?.settings);
  } catch {
    settings = undefined;
  }
  const laneBindings = settings?.gamepadLaneBindings ?? [2, 0, 1];

  if (activeSource !== 'gamepad') {
    if (!keyboardText) return null;
    return <span className={`inline-block text-xs opacity-75 ${className}`}>{keyboardText}</span>;
  }

  // Determine button index
  let targetButton: number | undefined = buttonIndex;
  if (action === 'confirm') targetButton = 0;
  else if (action === 'back') targetButton = 1;
  else if (action === 'menu') targetButton = 9;
  else if (action === 'lane0') targetButton = laneBindings[0];
  else if (action === 'lane1') targetButton = laneBindings[1];
  else if (action === 'lane2') targetButton = laneBindings[2];

  if (action === 'direction') {
    return (
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-mono bg-stone-800 text-stone-200 border border-stone-600 ${className}`}
        aria-label={t('ui:controller.direction_hint', { defaultValue: 'D-Pad / Left Stick' })}
      >
        ❖ {t('ui:controller.dpad_stick', { defaultValue: 'D-Pad / Stick' })}
      </span>
    );
  }

  if (targetButton === undefined) return null;

  const gamepadCtx = useGamepadInputOptional();
  const layout = gamepadCtx?.activeLayoutFamily ?? detectLayoutFamily('xbox');
  const glyph = getButtonGlyph(targetButton, layout);

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ${className}`}
      aria-label={`Button ${glyph}`}
    >
      [{glyph}]
    </span>
  );
};

export default InputHint;
