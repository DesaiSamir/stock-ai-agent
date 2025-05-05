import { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface TabProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

interface TabsProps {
  tabs: {
    label: string;
    content: ReactNode;
  }[];
  activeTab: string;
  onTabChange: (label: string) => void;
  className?: string;
}

export function Tab({ label, isActive, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        isActive
          ? "border-primary-500 text-primary-500"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
      )}
    >
      {label}
      {children}
    </button>
  );
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex border-b bg-white">
        {tabs.map((tab) => (
          <Tab
            key={tab.label}
            label={tab.label}
            isActive={activeTab === tab.label}
            onClick={() => onTabChange(tab.label)}
          />
        ))}
      </div>
      <div className="flex-1 overflow-auto bg-white">
        {tabs.find((tab) => tab.label === activeTab)?.content}
      </div>
    </div>
  );
}
