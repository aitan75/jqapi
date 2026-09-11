import { describe, expect, it } from 'vitest';
import { messages } from './i18n';
import { PRESETS } from './model/presets';

describe('translations', () => {
  it('has every preset and tool label in both supported languages', () => {
    for (const language of Object.values(messages)) {
      for (const preset of PRESETS) {
        expect(language.presets[preset.id].name).not.toBe('');
        expect(language.presets[preset.id].description).not.toBe('');
      }
      expect(Object.keys(language.tools)).toHaveLength(20);
    }
  });
});
