import * as React from 'react';
import {ChangeEvent, forwardRef} from 'react';

type Props = {
  equation: string;
  setEquation: (equation: string) => void;
  inline: boolean;
};

const EquationEditor = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({equation, setEquation, inline}, ref) => {
    const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEquation(event.target.value);
    };

    return inline ? (
      <span className="EquationEditor_inputBackground">
        <span className="EquationEditor_dollarSign">$</span>
        <input
          className="EquationEditor_inlineInput"
          value={equation}
          onChange={onChange}
          autoFocus={true}
          ref={ref as React.RefObject<HTMLInputElement>}
        />
        <span className="EquationEditor_dollarSign">$</span>
      </span>
    ) : (
      <div className="EquationEditor_inputBackground">
        <span className="EquationEditor_dollarSign">{'$$\n'}</span>
        <textarea
          className="EquationEditor_blockInput"
          value={equation}
          onChange={onChange}
          autoFocus={true}
          ref={ref as React.RefObject<HTMLTextAreaElement>}
        />
        <span className="EquationEditor_dollarSign">{'\n$$'}</span>
      </div>
    );
  },
);

export default EquationEditor;
