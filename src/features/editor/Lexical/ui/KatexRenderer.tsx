import type {JSX} from 'react';
import {useEffect, useRef} from 'react';
import katex from 'katex';

export default function KatexRenderer({
  equation,
  inline,
  onDoubleClick,
}: {
  equation: string;
  inline: boolean;
  onDoubleClick: () => void;
}): JSX.Element {
  const katexElementRef = useRef(null);

  useEffect(() => {
    const katexElement = katexElementRef.current;

    if (katexElement !== null) {
      katex.render(equation, katexElement, {
        displayMode: !inline,
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      });
    }
  }, [equation, inline]);

  return (
    <span
      onDoubleClick={onDoubleClick}
      ref={katexElementRef}
    />
  );
}
