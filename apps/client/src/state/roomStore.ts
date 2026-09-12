import { create } from 'zustand';
import type { ChatMessage, Room, RoomErrorPayload, RoomSummary } from '@sam-simul/shared';

interface RoomState {
  playerId: string | null;
  displayName: string;
  rooms: RoomSummary[];
  currentRoom: Room | null;
  lastError: RoomErrorPayload | null;
  setIdentity: (playerId: string, displayName: string) => void;
  setRooms: (rooms: RoomSummary[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  appendChatMessage: (message: ChatMessage) => void;
  setError: (error: RoomErrorPayload | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  playerId: null,
  displayName: '',
  rooms: [],
  currentRoom: null,
  lastError: null,
  setIdentity: (playerId, displayName) => set({ playerId, displayName }),
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  appendChatMessage: (message) =>
    set((state) => {
      if (!state.currentRoom || state.currentRoom.roomId !== message.roomId) return state;
      return { currentRoom: { ...state.currentRoom, chatLog: [...state.currentRoom.chatLog, message] } };
    }),
  setError: (error) => set({ lastError: error }),
}));
