import React from 'react';
import Post, { PostProps } from './Post';

type PostDetailsProps = Omit<PostProps, 'defaultShowReply' | 'loadChildren'>;

const PostDetails: React.FC<PostDetailsProps> = ({ showChildren = true, ...restProps }) => {
  return (
    <Post
      {...restProps}
      showChildren={showChildren}
      defaultShowReply={true}
      loadChildren={true}
    />
  );
};

export default PostDetails;

