import { useState } from 'react';
import type { Messages } from '../i18n';
import { PRESETS, type Preset } from '../model/presets';

interface PresetSelectorProps {
  onSelectPreset: (preset: Preset) => void;
  messages: Messages;
}

export function PresetSelector({ onSelectPreset, messages }: PresetSelectorProps) {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<Preset | null>(null);

  const handleSelect = (preset: Preset) => {
    setActivePresetId(preset.id);
    onSelectPreset(preset);
  };

  const currentDesc = hoveredPreset?.description || 
    PRESETS.find((p) => p.id === activePresetId)?.description ||
    'Choose a quantum state or a well-known algorithm to load and run instantly.';

  return (
    <details className="editor-menu algorithms-menu" open>
      <summary>{messages.algorithms}</summary>
      <div className="presets-container">
      <div className="presets-list">
        {PRESETS.map((preset) => {
          const isSelected = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelect(preset)}
              onMouseEnter={() => setHoveredPreset(preset)}
              onMouseLeave={() => setHoveredPreset(null)}
              title={messages.presets[preset.id]}
            >
              <span className="preset-name">{messages.presets[preset.id]}</span>
              <span className="preset-badge">{preset.badge}</span>
            </button>
          );
        })}
      </div>

      <div className="preset-description">
        <span style={{ color: 'var(--accent-cyan)', opacity: 0.85 }}>ℹ</span>
        <span>{currentDesc}</span>
      </div>
      </div>
    </details>
  );
}
