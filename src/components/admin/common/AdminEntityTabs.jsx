import TabNavigation from "../../ui/TabNavigation";

export default function AdminEntityTabs({ activeTab, children, onChange, tabs }) {
  return (
    <div className="space-y-5 mt-4">
      <TabNavigation activeTab={activeTab} onChange={onChange} tabs={tabs} />
      {children}
    </div>
  );
}
