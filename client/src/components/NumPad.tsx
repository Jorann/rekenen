const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'] as const;

/** Big candy-coloured keys; the iPad keyboard would cover half the screen. */
export function NumPad({
  onDigit,
  onBack,
  onOk,
  locked,
  canSubmit,
}: {
  onDigit: (digit: string) => void;
  onBack: () => void;
  onOk: () => void;
  locked: boolean;
  canSubmit: boolean;
}) {
  return (
    <div className="numpad">
      {KEYS.map((k, i) => {
        if (k === 'back') {
          return (
            <button key={k} className="key key-back" onClick={onBack} disabled={locked} aria-label="Wissen">
              ⌫
            </button>
          );
        }
        if (k === 'ok') {
          return (
            <button key={k} className="key key-ok" onClick={onOk} disabled={locked || !canSubmit} aria-label="Klaar">
              ✓
            </button>
          );
        }
        return (
          <button key={k} className={`key c${i % 6}`} onClick={() => onDigit(k)} disabled={locked}>
            {k}
          </button>
        );
      })}
    </div>
  );
}
