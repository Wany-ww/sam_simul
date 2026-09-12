import { useEffect } from 'react';
import type { ServerToClientEvents } from '@sam-simul/shared';
import { getSocket } from './socket';

export function useSocketEvent<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): void {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler as never);
    return () => {
      socket.off(event, handler as never);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, handler]);
}
