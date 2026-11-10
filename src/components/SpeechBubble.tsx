import { useState } from 'react';
import { usePlayer } from '../store/playerStore';

type SpeechBubbleProps = {
  topOffset?: number;
};

export default function SpeechBubble({ topOffset = 0 }: SpeechBubbleProps) {
  const { message, setMessage } = usePlayer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);

  const save = () => {
    setMessage(draft.trim());
    setEditing(false);
    // TODO: POST /me/status
  };

  return (
    <div className="bubble" style={{ top: topOffset }} onClick={() => !editing && setEditing(true)}>
      {editing ? (
        <>
          <textarea
            value={draft}
            maxLength={60}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
            }}
          />
          <button onClick={save}>OK</button>
        </>
      ) : (
        <span>{message || 'Нажми и напиши...'}</span>
      )}
    </div>
  );
}