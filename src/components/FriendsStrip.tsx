const mock = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  avatar: '',
  score: 1_700_000_000 - i * 12_000_000,
}));

export default function FriendsStrip() {
  return (
    <div className="friends">
      {mock.map((f) => (
        <div key={f.id} className="friend">
          <div className="friend-ava">👤</div>
          <div className="friend-score">🤘 {f.score.toLocaleString('ru-RU')}</div>
        </div>
      ))}
    </div>
  );
}