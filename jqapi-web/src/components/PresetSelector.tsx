import { useState } from 'react';
import type { Messages, PresetId } from '../i18n';
import { PRESETS, type Preset } from '../model/presets';

interface PresetSelectorProps {
  onSelectPreset: (preset: Preset) => void;
  messages: Messages;
}

export function PresetSelector({ onSelectPreset, messages }: PresetSelectorProps) {
  const [activePresetId, setActivePresetId] = useState<PresetId | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<Preset | null>(null);

  const handleSelect = (preset: Preset) => {
    setActivePresetId(preset.id);
    onSelectPreset(preset);
  };

  const currentDesc = hoveredPreset ? messages.presets[hoveredPreset.id].description : activePresetId ? messages.presets[activePresetId].description : messages.presetDescription;

  return (
    <details className="editor-menu algorithms-menu">
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
              title={messages.presets[preset.id].description}
            >
              <span className="preset-name">{messages.presets[preset.id].name}</span>
              <span className="preset-badge">{messages.qubitCount(preset.qubits)}</span>
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
