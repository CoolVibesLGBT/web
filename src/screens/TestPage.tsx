import React from 'react';
import InfiniteMenu from '../features/post/BubbleView';

const TestPage: React.FC = () => {

  return (
    <div className="skyline-page-scroll w-full">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-1 pb-8 pt-4 md:px-2 md:pt-6">
        <InfiniteMenu />
      </div>
    </div>
  );
};

export default TestPage;
