import { randomUUID } from 'node:crypto';
import type { ChatMessage, PlayerId, Room, RoomId, RoomPlayer, RoomSettings, RoomSummary } from '@sam-simul/shared';
import { AI_PLAYER_NAME_POOL, CHAT_LOG_MAX_MESSAGES, DISCONNECTED_PLAYER_GRACE_PERIOD_MS, MIN_PLAYERS_TO_START } from '@sam-simul/shared';
import type { RoomRepository } from '../../persistence/RoomRepository.js';
import { InMemoryRoomRepository } from '../../persistence/InMemoryRoomRepository.js';
import { RoomError } from './RoomError.js';
import { validateRoomSettings } from './roomSettingsValidation.js';

export interface LeaveResult {
  room: Room | undefined; // undefined if the room was deleted (last player left)
  newHostPlayerId?: PlayerId;
}

export interface DisconnectResult {
  room: Room;
}

// The single source of truth for room/player state. Every operation keys
// players by their persistent playerId, never by the ephemeral socket id --
// that is what makes a page refresh a reconnect instead of a ghost duplicate.
export class RoomManager {
  private playerToRoom = new Map<PlayerId, RoomId>();

  constructor(private repo: RoomRepository = new InMemoryRoomRepository()) {}

  createRoom(params: { name: string; settings: RoomSettings; hostPlayerId: PlayerId; hostDisplayName: string }): Room {
    validateRoomSettings(params.settings);

    const existingRoomId = this.playerToRoom.get(params.hostPlayerId);
    if (existingRoomId && this.repo.get(existingRoomId)) {
      throw new RoomError('NOT_IN_ROOM', '이미 다른 방에 참여 중입니다. 새 방을 만들려면 먼저 기존 방을 나가세요.');
    }

    const now = Date.now();
    const room: Room = {
      roomId: randomUUID(),
      name: params.name.trim().slice(0, 60) || '이름 없는 방',
      hostPlayerId: params.hostPlayerId,
      settings: params.settings,
      players: [
        {
          playerId: params.hostPlayerId,
          displayName: params.hostDisplayName,
          isHost: true,
          status: 'connected',
          joinedAt: now,
        },
      ],
      status: 'lobby',
      chatLog: [],
      createdAt: now,
    };

    this.repo.set(room);
    this.playerToRoom.set(params.hostPlayerId, room.roomId);
    return room;
  }

  joinRoom(params: { roomId: RoomId; playerId: PlayerId; displayName: string }): Room {
    const room = this.requireRoom(params.roomId);

    const existing = room.players.find((p) => p.playerId === params.playerId);
    if (existing) {
      // Already a member (e.g. duplicate join call) -- treat as reconnect.
      existing.status = 'connected';
      existing.lastDisconnectedAt = undefined;
      this.playerToRoom.set(params.playerId, room.roomId);
      return room;
    }

    if (room.status !== 'lobby') {
      throw new RoomError('ROOM_ALREADY_STARTED', '이미 시작된 방에는 입장할 수 없습니다.');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new RoomError('ROOM_FULL', '방 정원이 가득 찼습니다.');
    }

    room.players.push({
      playerId: params.playerId,
      displayName: params.displayName,
      isHost: false,
      status: 'connected',
      joinedAt: Date.now(),
    });

    this.playerToRoom.set(params.playerId, room.roomId);
    return room;
  }

  /** Host-only: adds a bot player that always counts as 'connected' and never disconnects. Lobby only. */
  addAiPlayer(params: { roomId: RoomId; requestingPlayerId: PlayerId }): Room {
    const room = this.requireRoom(params.roomId);
    this.requireHost(room, params.requestingPlayerId);

    if (room.status !== 'lobby') {
      throw new RoomError('ROOM_ALREADY_STARTED', '게임이 시작된 후에는 AI를 추가할 수 없습니다.');
    }
    if (room.players.length >= room.settings.maxPlayers) {
      throw new RoomError('ROOM_FULL', '방 정원이 가득 찼습니다.');
    }

    const usedNames = new Set(room.players.map((p) => p.displayName));
    const displayName = AI_PLAYER_NAME_POOL.find((name) => !usedNames.has(name)) ?? `AI ${room.players.length + 1}`;

    room.players.push({
      playerId: `ai-${randomUUID()}`,
      displayName,
      isHost: false,
      isAI: true,
      status: 'connected',
      joinedAt: Date.now(),
    });

    return room;
  }

  /** Host-only: removes a previously-added AI player. Lobby only -- once a game starts, GameSessionManager owns that AI's city, so removing it from the roster only would desync the two. */
  removeAiPlayer(params: { roomId: RoomId; requestingPlayerId: PlayerId; aiPlayerId: PlayerId }): Room {
    const room = this.requireRoom(params.roomId);
    this.requireHost(room, params.requestingPlayerId);

    if (room.status !== 'lobby') {
      throw new RoomError('ROOM_ALREADY_STARTED', '게임이 시작된 후에는 AI를 제거할 수 없습니다.');
    }

    const index = room.players.findIndex((p) => p.playerId === params.aiPlayerId && p.isAI);
    if (index === -1) {
      throw new RoomError('NOT_IN_ROOM', 'AI 플레이어를 찾을 수 없습니다.');
    }

    room.players.splice(index, 1);
    return room;
  }

  rejoinRoom(params: { roomId: RoomId; playerId: PlayerId }): Room {
    const room = this.requireRoom(params.roomId);
    const player = room.players.find((p) => p.playerId === params.playerId);
    if (!player) {
      throw new RoomError('NOT_IN_ROOM', '이 방의 참여자가 아닙니다.');
    }

    player.status = 'connected';
    player.lastDisconnectedAt = undefined;
    this.playerToRoom.set(params.playerId, room.roomId);
    return room;
  }

  leaveRoom(params: { roomId: RoomId; playerId: PlayerId }): LeaveResult {
    const room = this.requireRoom(params.roomId);
    const index = room.players.findIndex((p) => p.playerId === params.playerId);
    if (index === -1) {
      throw new RoomError('NOT_IN_ROOM', '이 방의 참여자가 아닙니다.');
    }

    const wasHost = room.players[index].isHost;
    room.players.splice(index, 1);
    this.playerToRoom.delete(params.playerId);

    if (room.players.length === 0) {
      this.repo.delete(room.roomId);
      return { room: undefined };
    }

    let newHostPlayerId: PlayerId | undefined;
    if (wasHost) {
      newHostPlayerId = this.promoteNewHost(room);
    }

    return { room, newHostPlayerId };
  }

  handleDisconnect(playerId: PlayerId): DisconnectResult | undefined {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return undefined;

    const room = this.repo.get(roomId);
    if (!room) {
      this.playerToRoom.delete(playerId);
      return undefined;
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) return undefined;

    player.status = 'disconnected';
    player.lastDisconnectedAt = Date.now();
    return { room };
  }

  updateSettings(params: { roomId: RoomId; playerId: PlayerId; settings: Partial<RoomSettings> }): Room {
    const room = this.requireRoom(params.roomId);
    this.requireHost(room, params.playerId);

    if (room.status !== 'lobby') {
      throw new RoomError('ROOM_ALREADY_STARTED', '게임이 시작된 후에는 설정을 변경할 수 없습니다.');
    }

    const merged: RoomSettings = { ...room.settings, ...params.settings };
    validateRoomSettings(merged);
    room.settings = merged;
    return room;
  }

  startRoom(params: { roomId: RoomId; playerId: PlayerId }): Room {
    const room = this.requireRoom(params.roomId);
    this.requireHost(room, params.playerId);

    if (room.status !== 'lobby') {
      throw new RoomError('ROOM_ALREADY_STARTED', '이미 시작된 방입니다.');
    }

    const connectedCount = room.players.filter((p) => p.status === 'connected').length;
    if (connectedCount < MIN_PLAYERS_TO_START) {
      throw new RoomError('NOT_ENOUGH_PLAYERS', `시작하려면 연결된 플레이어가 최소 ${MIN_PLAYERS_TO_START}명 필요합니다.`);
    }

    room.status = 'in_progress';
    return room;
  }

  addChatMessage(params: { roomId: RoomId; playerId: PlayerId; text: string }): ChatMessage {
    const room = this.requireRoom(params.roomId);
    const player = room.players.find((p) => p.playerId === params.playerId);
    if (!player) {
      throw new RoomError('NOT_IN_ROOM', '이 방의 참여자가 아닙니다.');
    }

    const text = params.text.trim().slice(0, 500);
    if (!text) {
      throw new RoomError('INVALID_NAME', '메시지 내용을 입력해주세요.');
    }

    const message: ChatMessage = {
      id: randomUUID(),
      roomId: room.roomId,
      playerId: player.playerId,
      displayName: player.displayName,
      text,
      sentAt: Date.now(),
    };

    room.chatLog.push(message);
    if (room.chatLog.length > CHAT_LOG_MAX_MESSAGES) {
      room.chatLog.splice(0, room.chatLog.length - CHAT_LOG_MAX_MESSAGES);
    }

    return message;
  }

  getRoom(roomId: RoomId): Room | undefined {
    return this.repo.get(roomId);
  }

  getRoomForPlayer(playerId: PlayerId): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.repo.get(roomId) : undefined;
  }

  listSummaries(): RoomSummary[] {
    return this.repo.list().map((room) => ({
      roomId: room.roomId,
      name: room.name,
      hostDisplayName: room.players.find((p) => p.playerId === room.hostPlayerId)?.displayName ?? '알 수 없음',
      playerCount: room.players.length,
      maxPlayers: room.settings.maxPlayers,
      status: room.status,
    }));
  }

  /** Removes players disconnected past the grace period and cleans up empty rooms; promotes a new host if needed. */
  sweepStaleDisconnections(now = Date.now()): { roomId: RoomId; removedPlayerIds: PlayerId[]; newHostPlayerId?: PlayerId; deleted: boolean }[] {
    const results: { roomId: RoomId; removedPlayerIds: PlayerId[]; newHostPlayerId?: PlayerId; deleted: boolean }[] = [];

    for (const room of this.repo.list()) {
      const toRemove = room.players.filter(
        (p) => p.status === 'disconnected' && p.lastDisconnectedAt !== undefined && now - p.lastDisconnectedAt > DISCONNECTED_PLAYER_GRACE_PERIOD_MS,
      );
      if (toRemove.length === 0) continue;

      const removedPlayerIds = toRemove.map((p) => p.playerId);
      const hadHostRemoved = toRemove.some((p) => p.isHost);
      room.players = room.players.filter((p) => !removedPlayerIds.includes(p.playerId));
      for (const playerId of removedPlayerIds) this.playerToRoom.delete(playerId);

      if (room.players.length === 0) {
        this.repo.delete(room.roomId);
        results.push({ roomId: room.roomId, removedPlayerIds, deleted: true });
        continue;
      }

      const newHostPlayerId = hadHostRemoved ? this.promoteNewHost(room) : undefined;
      results.push({ roomId: room.roomId, removedPlayerIds, newHostPlayerId, deleted: false });
    }

    return results;
  }

  private promoteNewHost(room: Room): PlayerId {
    const candidates = room.players.filter((p) => p.status === 'connected');
    const next = (candidates.length > 0 ? candidates : room.players).sort((a, b) => a.joinedAt - b.joinedAt)[0];
    for (const p of room.players) p.isHost = p.playerId === next.playerId;
    room.hostPlayerId = next.playerId;
    return next.playerId;
  }

  private requireRoom(roomId: RoomId): Room {
    const room = this.repo.get(roomId);
    if (!room) throw new RoomError('ROOM_NOT_FOUND', '방을 찾을 수 없습니다.');
    return room;
  }

  private requireHost(room: Room, playerId: PlayerId): RoomPlayer {
    const player = room.players.find((p) => p.playerId === playerId);
    if (!player || !player.isHost) {
      throw new RoomError('NOT_HOST', '호스트만 이 작업을 수행할 수 있습니다.');
    }
    return player;
  }
}
