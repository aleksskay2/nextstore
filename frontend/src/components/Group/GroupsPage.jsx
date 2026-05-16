import GroupList from "./GroupList";
import GroupChat from "./GroupChat";

export default function GroupsPage() {
  return (
    <div className="flex h-screen">
      <GroupList />
      <GroupChat />
    </div>
  );
}
