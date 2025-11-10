import React from 'react';  // veya
;
import { useAtom } from 'jotai';
import { globalState } from '../state/nearby';
import { textState } from '../state/textstate';

const TestPage: React.FC = () => {
  
  const [text, setText] = useAtom(textState);

  const onChange = (event:any) => {
    setText(event.target.value);
  };

  return (
   <div>
 <div>
      <input type="text" value={text} onChange={onChange} />
      <br />
      Echo: {text}
    </div>
    </div>
    
  );
};

export default TestPage;