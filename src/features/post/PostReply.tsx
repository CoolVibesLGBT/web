import React from 'react';
import CreatePost from './CreatePost';

interface PostReplyProps {
  onReply?: (content: string, parentPostId?: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  parentPostId?: string;
}

const PostReply: React.FC<PostReplyProps> = ({ onReply, isOpen, onClose, parentPostId }) => {
  if (!isOpen) return null;

  return (
    <CreatePost 
      title="Reply" 
      canClose={true}
      onClose={onClose}
      placeholder="Write a reply..."
      buttonText="Reply"
      parentPostId={parentPostId}
      onReply={onReply}
    />
  );
};

export default PostReply;