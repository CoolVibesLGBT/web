import type { LexicalEditor } from 'lexical'
import type { Provider } from '@lexical/yjs'
import { useEffect, useState } from 'react'

export type Comment = {
  id: string
  type: 'comment'
  author: string
  content: string
  time: string
  timeStamp: number
  deleted?: boolean
}

export type Thread = {
  id: string
  type: 'thread'
  quote: string
  comments: Comment[]
}

export type Comments = Array<Comment | Thread>

export function createComment(content: string, author: string): Comment {
  const timeStamp = Date.now()
  return {
    id: `comment-${Math.random().toString(36).slice(2)}`,
    type: 'comment',
    author,
    content,
    time: new Date(timeStamp).toISOString(),
    timeStamp,
    deleted: false,
  }
}

export function createThread(quote: string, comments: Comment[]): Thread {
  return {
    id: `thread-${Math.random().toString(36).slice(2)}`,
    type: 'thread',
    quote,
    comments,
  }
}

export class CommentStore {
  private comments: Comments = []
  private listeners = new Set<() => void>()

  constructor(_editor: LexicalEditor) {}

  getComments() {
    return this.comments
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  addComment(commentOrThread: Comment | Thread, thread?: Thread, index?: number) {
    if (thread && thread.type === 'thread' && commentOrThread.type === 'comment') {
      const insertAt = typeof index === 'number' ? index : thread.comments.length
      thread.comments.splice(insertAt, 0, commentOrThread)
      this.notify()
      return
    }

    this.comments = [...this.comments, commentOrThread]
    this.notify()
  }

  deleteCommentOrThread(commentOrThread: Comment | Thread, thread?: Thread) {
    if (commentOrThread.type === 'comment' && thread?.type === 'thread') {
      const index = thread.comments.findIndex((item) => item.id === commentOrThread.id)
      if (index >= 0) {
        thread.comments.splice(index, 1)
        this.notify()
      }
      return null
    }

    this.comments = this.comments.filter((item) => item.id !== commentOrThread.id)
    this.notify()
    return null
  }

  registerCollaboration(_provider: Provider) {
    return () => undefined
  }
}

export function useCommentStore(store: CommentStore): Comments {
  const [comments, setComments] = useState(store.getComments())

  useEffect(() => {
    return store.subscribe(() => {
      setComments([...store.getComments()])
    })
  }, [store])

  return comments
}
