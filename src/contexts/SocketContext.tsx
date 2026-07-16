import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { defaultSocketServerId, socketURL } from '../appSettings';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(socketURL[defaultSocketServerId]); // Backend URL

    setSocket(socketIo);
    socketIo.on('connect', () => {
      setConnected(true);
      const savedToken = localStorage.getItem("authToken")
      if(savedToken){
        socketIo.emit('auth', savedToken);
      }
      console.log('Socket connected:', socketIo.id);
    });

    socketIo.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    const applyAuthToken = (nextToken: string | null) => {
      if (!nextToken) {
        if (socketIo.connected) {
          socketIo.disconnect();
        }
        return;
      }

      if (!socketIo.connected) {
        socketIo.connect();
        return;
      }

      socketIo.emit('auth', nextToken);
    };

    const handleAuthTokenChange = (event: Event) => {
      const detail = (event as CustomEvent)?.detail as { token?: string } | undefined;
      const token = detail?.token ?? localStorage.getItem('authToken');
      applyAuthToken(token ?? null);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        applyAuthToken(event.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-token-changed', handleAuthTokenChange);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-token-changed', handleAuthTokenChange);
        window.removeEventListener('storage', handleStorage);
      }
      socketIo.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
