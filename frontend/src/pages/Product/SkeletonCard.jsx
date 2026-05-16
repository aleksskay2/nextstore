export default function SkeletonCard({ count = 6 }) {
  return (
    <div >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          
        />
      ))}
    </div>
  );
}
