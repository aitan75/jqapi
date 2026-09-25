import { describe, expect, it } from 'vitest';
import { messages } from './i18n';
import { PRESETS } from './model/presets';
import type { ObservableParseErrorCode } from './model/observable';

describe('translations', () => {
  it('has every preset and tool label in both supported languages', () => {
    for (const language of Object.values(messages)) {
      for (const preset of PRESETS) {
        expect(language.presets[preset.id].name).not.toBe('');
        expect(language.presets[preset.id].description).not.toBe('');
      }
      expect(Object.keys(language.tools).length).toBeGreaterThanOrEqual(20);
    }
  });

  it('explains every observable parse error with its line in both languages', () => {
    const codes: ObservableParseErrorCode[] = ['EMPTY', 'BAD_LINE', 'BAD_LABEL', 'WRONG_LENGTH', 'BAD_COEFF', 'TOO_MANY_TERMS'];
    for (const language of Object.values(messages)) {
      for (const code of codes) {
        const text = language.observableErrors[code](7, 3);
        expect(text).not.toBe('');
        if (code !== 'EMPTY') expect(text).toContain('7');
      }
      expect(language.observableErrors.WRONG_LENGTH(7, 3)).toContain('3');
      for (const key of ['observable', 'observableHelp', 'exactExpectation', 'sampledExpectation', 'totalShots',
        'coefficient', 'pauliString', 'exactValue', 'sampledMean', 'shotsUsed', 'sampledNeedsTwoShots'] as const) {
        expect(language[key]).not.toBe('');
      }
    }
  });
});
