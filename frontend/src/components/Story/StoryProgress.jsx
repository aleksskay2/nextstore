export default function StoryProgress({ total, active }) {
  return (
    <div className="story-progress">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`bar ${i <= active ? "active" : ""}`}
        />
      ))}
    </div>
  );
}
