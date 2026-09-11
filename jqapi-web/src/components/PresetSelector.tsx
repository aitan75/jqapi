import { useState } from 'react';
import { PRESETS, type Preset } from '../model/presets';

interface PresetSelectorProps {
  onSelectPreset: (preset: Preset) => void;
  onClearCircuit: () => void;
}

export function PresetSelector({ onSelectPreset, onClearCircuit }: PresetSelectorProps) {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<Preset | null>(null);

  const handleSelect = (preset: Preset) => {
    setActivePresetId(preset.id);
    onSelectPreset(preset);
  };

  const handleClear = () => {
    setActivePresetId(null);
    onClearCircuit();
  };

  const currentDesc = hoveredPreset?.description || 
    PRESETS.find((p) => p.id === activePresetId)?.description ||
    'Choose a quantum state or a well-known algorithm to load and run instantly.';

  return (
    <div className="presets-container">
      <div className="presets-header">
        <div className="presets-title">
          <span style={{ color: 'var(--accent-purple)', fontSize: '1.1rem' }}>⚡</span>
          <span>Preset Circuits</span>
        </div>
        <button
          type="button"
          className="btn-clear"
          onClick={handleClear}
          title="Clear all gates from the circuit"
        >
          <span>⌫</span> Clear Circuit
        </button>
      </div>

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
              title={preset.description}
            >
              <span className="preset-name">{preset.name}</span>
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
  );
}
