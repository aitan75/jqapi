import type { Messages } from '../i18n';
import { formatExpectation, type ObservableParseError } from '../model/observable';
import type { EngineErrorCode, ExpectationSuccess, SampledExpectationSuccess } from '../wasm/types';

/** Result of the last Run; each value fails independently and a code explains why it is missing. */
export interface ObservableOutcome {
  exact: ExpectationSuccess | EngineErrorCode;
  sampled: SampledExpectationSuccess | EngineErrorCode | 'NEEDS_TWO_SHOTS';
}

interface ObservablePanelProps {
  messages: Messages;
  numQubits: number;
  text: string;
  onChangeText: (text: string) => void;
  parseError: ObservableParseError | null;
  outcome: ObservableOutcome | null;
  disabled: boolean;
}

/** Hamiltonian input evaluated by Run, with exact and sampled ⟨H⟩ per term. */
export function ObservablePanel({ messages, numQubits, text, onChangeText, parseError, outcome, disabled }: ObservablePanelProps) {
  const exact = outcome && typeof outcome.exact !== 'string' ? outcome.exact : null;
  const sampled = outcome && typeof outcome.sampled !== 'string' ? outcome.sampled : null;
  const note = (reason: string) => (reason === 'NEEDS_TWO_SHOTS' ? messages.sampledNeedsTwoShots : messages.errors[reason as EngineErrorCode]);
  const rows = exact?.terms ?? sampled?.terms ?? [];
  return (
    <section className="results observable-panel">
      <div className="results-header"><h2><label htmlFor="observable-input">{messages.observable}</label></h2></div>
      <p id="observable-help" className="observable-help">{messages.observableHelp}</p>
      <textarea
        id="observable-input"
        className="observable-input"
        rows={3}
        spellCheck={false}
        value={text}
        placeholder={'Z' + 'I'.repeat(Math.max(0, numQubits - 1))}
        onChange={(event) => onChangeText(event.target.value)}
        disabled={disabled}
        aria-invalid={parseError ? true : undefined}
        aria-describedby={parseError ? 'observable-help observable-error' : 'observable-help'}
      />
      {parseError && <p id="observable-error" className="observable-error" role="status">{messages.observableErrors[parseError.code](parseError.line, numQubits)}</p>}
      {outcome && <>
        <dl className="observable-summary">
          <div><dt>{messages.exactExpectation}</dt>{exact
            ? <dd data-testid="exact-expectation">{formatExpectation(exact.value)}</dd>
            : <dd className="observable-note">{note(outcome.exact as string)}</dd>}</div>
          <div><dt>{messages.sampledExpectation}</dt>{sampled
            ? <dd data-testid="sampled-expectation">{formatExpectation(sampled.value, sampled.standardError)}</dd>
            : <dd className="observable-note">{note(outcome.sampled as string)}</dd>}</div>
          {sampled && <div><dt>{messages.totalShots}</dt><dd data-testid="total-shots">{sampled.totalShots}</dd></div>}
        </dl>
        {rows.length > 0 && <table className="observable-table">
          <thead><tr>
            <th scope="col">{messages.coefficient}</th>
            <th scope="col" className="observable-pauli">{messages.pauliString}</th>
            <th scope="col">{messages.exactValue}</th>
            <th scope="col">{messages.sampledMean}</th>
            <th scope="col">{messages.shotsUsed}</th>
          </tr></thead>
          <tbody>{rows.map((term, i) => (
            <tr key={i}>
              <td>{term.coeff}</td>
              <td className="observable-pauli">{term.pauli}</td>
              <td>{exact ? formatExpectation(exact.terms[i].value) : '—'}</td>
              <td>{sampled ? formatExpectation(sampled.terms[i].mean) : '—'}</td>
              <td>{sampled ? sampled.terms[i].shots : '—'}</td>
            </tr>
          ))}</tbody>
        </table>}
      </>}
    </section>
  );
}
