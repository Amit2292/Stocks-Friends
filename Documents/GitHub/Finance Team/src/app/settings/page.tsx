import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SettingsClient />
    </div>
  );
}
