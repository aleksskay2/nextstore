import { useStoryStore } from "@/stores/storyStore";

function StoriesBar() {
  const stories = useStoryStore((s) => s.stories);
  const openViewer = useStoryStore((s) => s.openViewer);

  return (
    <div className="stories-bar">
      {stories.map((item, index) => (
        <div
          key={item.user.id}
          className="story-circle"
          onClick={() => openViewer(index)}
        >
          <img src={item.user.avatar} />
        </div>
      ))}
    </div>
  );
}
