import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage, PlayerId, RoomId } from '@sam-simul/shared';
import { getSocket } from '../../net/socket';

export function ChatPanel({ roomId, chatLog, playerId }: { roomId: RoomId; chatLog: ChatMessage[]; playerId: PlayerId | null }) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chatLog.length]);

  function send(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    getSocket().emit('room:chat', { roomId, text: trimmed });
    setText('');
  }

  return (
    <div className="card chat-panel">
      <h2>채팅</h2>
      <div className="chat-log" ref={scrollRef}>
        {chatLog.map((m) => (
          <div key={m.id} className={m.playerId === playerId ? 'chat-message chat-message-own' : 'chat-message'}>
            <span className="chat-author">{m.displayName}</span>
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="chat-input-row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력..." maxLength={500} />
        <button type="submit">보내기</button>
      </form>
    </div>
  );
}
