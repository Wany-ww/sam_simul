import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_SETTINGS } from '@sam-simul/shared';
import { RoomManager } from '../../../src/domain/room/RoomManager.js';
import { RoomError } from '../../../src/domain/room/RoomError.js';

function makeManager() {
  return new RoomManager();
}

describe('RoomManager', () => {
  it('creates a room with the creator as host', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '위나라 방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });

    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);
    expect(room.hostPlayerId).toBe('p1');
    expect(room.status).toBe('lobby');
  });

  it('allows a second player to join and lists both players', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    const joined = rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });

    expect(joined.players.map((p) => p.playerId)).toEqual(['p1', 'p2']);
  });

  it('rejects joining a full room', () => {
    const rm = makeManager();
    const room = rm.createRoom({
      name: '방',
      settings: { ...DEFAULT_ROOM_SETTINGS, maxPlayers: 2 },
      hostPlayerId: 'p1',
      hostDisplayName: '조조',
    });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });

    expect(() => rm.joinRoom({ roomId: room.roomId, playerId: 'p3', displayName: '손권' })).toThrow(RoomError);
  });

  it('marks a player disconnected without removing them, and reconnect restores them by playerId (not socket id)', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });

    const disconnectResult = rm.handleDisconnect('p2');
    expect(disconnectResult?.room.players.find((p) => p.playerId === 'p2')?.status).toBe('disconnected');
    // still present, not removed
    expect(disconnectResult?.room.players).toHaveLength(2);

    const rejoined = rm.rejoinRoom({ roomId: room.roomId, playerId: 'p2' });
    const p2 = rejoined.players.find((p) => p.playerId === 'p2');
    expect(p2?.status).toBe('connected');
    expect(p2?.lastDisconnectedAt).toBeUndefined();
  });

  it('explicit leave removes the player immediately and transfers host if the host left', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });

    const { room: afterLeave, newHostPlayerId } = rm.leaveRoom({ roomId: room.roomId, playerId: 'p1' });

    expect(afterLeave?.players).toHaveLength(1);
    expect(afterLeave?.players[0].playerId).toBe('p2');
    expect(afterLeave?.players[0].isHost).toBe(true);
    expect(newHostPlayerId).toBe('p2');
  });

  it('deletes the room when the last player leaves', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });

    const { room: afterLeave } = rm.leaveRoom({ roomId: room.roomId, playerId: 'p1' });

    expect(afterLeave).toBeUndefined();
    expect(rm.getRoom(room.roomId)).toBeUndefined();
  });

  it('only the host can update settings or start the game', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });

    expect(() => rm.updateSettings({ roomId: room.roomId, playerId: 'p2', settings: { maxPlayers: 4 } })).toThrow(RoomError);
    expect(() => rm.startRoom({ roomId: room.roomId, playerId: 'p2' })).toThrow(RoomError);

    const updated = rm.updateSettings({ roomId: room.roomId, playerId: 'p1', settings: { maxPlayers: 4 } });
    expect(updated.settings.maxPlayers).toBe(4);
  });

  it('requires at least the minimum number of connected players to start', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });

    expect(() => rm.startRoom({ roomId: room.roomId, playerId: 'p1' })).toThrow(RoomError);

    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });
    const started = rm.startRoom({ roomId: room.roomId, playerId: 'p1' });
    expect(started.status).toBe('in_progress');
  });

  it('does not count a disconnected player toward the minimum-players-to-start threshold', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });
    rm.handleDisconnect('p2');

    expect(() => rm.startRoom({ roomId: room.roomId, playerId: 'p1' })).toThrow(RoomError);
  });

  it('sweeps stale disconnections past the grace period and promotes a new host if needed', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });
    rm.joinRoom({ roomId: room.roomId, playerId: 'p2', displayName: '유비' });
    rm.handleDisconnect('p1'); // host disconnects

    const future = Date.now() + 31 * 60 * 1000; // past the 30-minute grace period
    const results = rm.sweepStaleDisconnections(future);

    expect(results).toHaveLength(1);
    expect(results[0].removedPlayerIds).toEqual(['p1']);
    expect(results[0].newHostPlayerId).toBe('p2');

    const afterSweep = rm.getRoom(room.roomId);
    expect(afterSweep?.players).toHaveLength(1);
    expect(afterSweep?.players[0].isHost).toBe(true);
  });

  it('appends chat messages and caps the chat log length', () => {
    const rm = makeManager();
    const room = rm.createRoom({ name: '방', settings: DEFAULT_ROOM_SETTINGS, hostPlayerId: 'p1', hostDisplayName: '조조' });

    const message = rm.addChatMessage({ roomId: room.roomId, playerId: 'p1', text: '안녕하세요' });
    expect(message.displayName).toBe('조조');
    expect(rm.getRoom(room.roomId)?.chatLog).toHaveLength(1);
  });

  it('rejects invalid settings', () => {
    const rm = makeManager();
    expect(() =>
      rm.createRoom({
        name: '방',
        settings: { ...DEFAULT_ROOM_SETTINGS, maxPlayers: 99 },
        hostPlayerId: 'p1',
        hostDisplayName: '조조',
      }),
    ).toThrow(RoomError);
  });
});
