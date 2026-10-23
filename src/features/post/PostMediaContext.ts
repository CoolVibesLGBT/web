import { createContext } from 'react';

// Limit post concealment to published content, never the editable composer.
export const PostMediaContext = createContext(false);
