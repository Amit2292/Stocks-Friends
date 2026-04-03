import GroupFeedClient from "./GroupFeedClient";

interface Props {
  params: { id: string };
}

export default function GroupFeedPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <GroupFeedClient groupId={params.id} />
    </div>
  );
}
