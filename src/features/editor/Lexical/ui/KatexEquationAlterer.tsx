import type {JSX} from 'react';
import {useCallback, useState} from 'react';

type Props = {
  initialEquation?: string;
  onConfirm: (equation: string, inline: boolean) => void;
};

export default function KatexEquationAlterer({
  initialEquation = '',
  onConfirm,
}: Props): JSX.Element {
  const [equation, setEquation] = useState(initialEquation);
  const [inline, setInline] = useState(true);

  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);

  return (
    <div className="KatexEquationAlterer_container">
      <div className="KatexEquationAlterer_form">
        <div className="KatexEquationAlterer_row">
          <label>Equation</label>
          <input
            className="KatexEquationAlterer_input"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
          />
        </div>
        <div className="KatexEquationAlterer_row">
          <label>Inline</label>
          <input
            type="checkbox"
            checked={inline}
            onChange={(e) => setInline(e.target.checked)}
          />
        </div>
        <button onClick={onClick} className="KatexEquationAlterer_button">
          Confirm
        </button>
      </div>
    </div>
  );
}
