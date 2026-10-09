import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled, className = '', ...rest }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      data-checked={checked}
      className={`cv-switch ${className}`}
      {...rest}
    >
      <span className="cv-switch-thumb" />
    </button>
  );
};

export default Switch;
