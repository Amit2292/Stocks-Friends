import GroupsClient from "./GroupsClient";

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Groups</h1>
      <GroupsClient />
    </div>
  );
}
