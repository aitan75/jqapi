import { useEffect, useRef, useState, type ComponentProps } from 'react';
import type { Messages } from '../i18n';
import { lineSelection } from '../model/qasm';
import { startJob } from '../wasm/client';
import { BROWSER_BUDGET } from '../wasm/policy';
import type { QasmLintResult } from '../wasm/types';
import { LintPanel } from './LintPanel';

type SharedLintProps = Pick<ComponentProps<typeof LintPanel>, 'disabledRules' | 'dismissed' | 'onToggleRule' | 'onDismiss'>;

/** Editable QASM text linted as you type; results always name the exact source they belong to. */
export function QasmEditor({ value, onChange, onApply, onFromCircuit, busy, messages, ...lintProps }: SharedLintProps & {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onFromCircuit: () => void;
  busy: boolean;
  messages: Messages;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [lint, setLint] = useState<{ source: string; result: QasmLintResult } | null>(null);
  const text = messages.qasmEditor;
  const { disabledRules } = lintProps;

  useEffect(() => {
    if (!value.trim()) return;
    let current = true;
    let cancel = () => {};
    const timer = window.setTimeout(() => {
      const job = startJob({ kind: 'lintQasm', source: value, disabledRules: [...disabledRules] });
      cancel = job.cancel;
      void job.result.then((result) => { if (current) setLint({ source: value, result }); });
    }, 300);
    return () => { current = false; window.clearTimeout(timer); cancel(); };
  }, [value, disabledRules]);

  const goTo = (line: number, column: number) => {
    const textarea = area.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(...lineSelection(value, line, column));
    textarea.scrollTop = Math.max(0, (line - 2) * parseFloat(getComputedStyle(textarea).lineHeight));
  };

  // Findings for an older source are shown dimmed and inert until the new source is checked.
  const stale = lint !== null && lint.source !== value;
  const result = value.trim() ? lint?.result : undefined;
  return (
    <details className="qasm-editor">
      <summary>{text.title}</summary>
      <textarea ref={area} aria-label={text.source} spellCheck={false} rows={10} maxLength={BROWSER_BUDGET.maxInputChars} value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="editor-actions">
        <button type="button" onClick={onFromCircuit} disabled={busy}>{text.fromCircuit}</button>
        <button type="button" onClick={onApply} disabled={busy || !value.trim()}>{text.apply}</button>
      </div>
      {result && (
        <div className={stale ? 'lint-stale' : undefined} aria-busy={stale}>
          {stale && <p role="status">{text.updating}</p>}
          <fieldset disabled={stale}>
            {result.ok
              ? <LintPanel title={text.hints} messages={messages} spec={result.spec} diagnostics={result.diagnostics} names={result.qubitNames} onLocation={goTo} {...lintProps} />
              : <p role="alert">{messages.errors[result.error.code]}{result.error.detail && <> <span lang="en">{result.error.detail}</span></>}</p>}
          </fieldset>
        </div>
      )}
    </details>
  );
}
