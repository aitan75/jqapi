import type { Messages } from '../i18n';
import type { CircuitSpec, LintDiagnostic, LintRule } from '../wasm/types';

const RULES: LintRule[] = ['QED001', 'QED002', 'QED003'];

export function LintPanel({ title, diagnostics: all, spec, names, messages, disabledRules, dismissed, onToggleRule, onDismiss, onShow, onLocation }: {
  title: string;
  diagnostics: LintDiagnostic[];
  /** The analysed circuit; the involved operations (not source positions) key a dismissal, so editing them shows the hint again. */
  spec: CircuitSpec;
  /** Display name per qubit index, e.g. q0 or a[1]. */
  names: string[];
  messages: Messages;
  disabledRules: ReadonlySet<LintRule>;
  dismissed: ReadonlySet<string>;
  onToggleRule: (rule: LintRule) => void;
  onDismiss: (key: string) => void;
  onShow?: (diagnostic: LintDiagnostic) => void;
  onLocation?: (line: number, column: number) => void;
}) {
  // Disabled rules keep the panel visible so they can be switched back on.
  if (!all.length && !disabledRules.size) return null;
  const text = messages.lint;
  const involved = (d: LintDiagnostic) => d.levels.map((level) => spec.levels[level].gates.filter((gate) => [...gate.targets, ...gate.controls].some((q) => d.qubits.includes(q))));
  const lintKey = (d: LintDiagnostic) => JSON.stringify([d.rule, d.levels, d.qubits, involved(d)]);
  // The engine already skips disabled rules; filtering again hides old results until the re-lint arrives.
  const diagnostics = all.filter((d) => !disabledRules.has(d.rule) && !dismissed.has(lintKey(d)));
  return (
    <section className="lint-panel" aria-label={title}>
      <h2>{title}</h2>
      <fieldset className="lint-rules">
        <legend>{text.rulesLegend}</legend>
        {RULES.map((rule) => (
          <label key={rule}><input type="checkbox" checked={!disabledRules.has(rule)} onChange={() => onToggleRule(rule)} />{rule} · {text.ruleNames[rule]}</label>
        ))}
      </fieldset>
      <ul>
        {diagnostics.map((d) => (
          <li key={lintKey(d)} className={`lint-${d.severity.toLowerCase()}`}>
            <span><strong>{d.rule}</strong> · {text.severity[d.severity]}: {text.rules[d.rule](d.qubits.map((q) => names[q]), names.length)}</span>
            {onShow && d.levels.length > 0 && <button type="button" onClick={() => onShow(d)}>{text.show}</button>}
            {onLocation && d.locations.map(({ line, column }) => (
              <button key={`${line}:${column}`} type="button" onClick={() => onLocation(line, column)}>{text.goTo(line, column)}</button>
            ))}
            <button type="button" onClick={() => onDismiss(lintKey(d))}>{messages.dismiss}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
