export interface TabItem {
  id: string;
  label: string;
}

interface HeaderProps {
  tabs: readonly TabItem[];
  activeTab: string;
  onSelect: (id: string) => void;
}

export function Header({ tabs, activeTab, onSelect }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container">
        <p className="brand">
          <span aria-hidden="true">🌿</span>
          CarbonWise
          <span className="brand-tag">Carbon Footprint Awareness</span>
        </p>
        <nav aria-label="Primary">
          <ul className="tablist">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  className="tab"
                  aria-current={tab.id === activeTab ? "page" : undefined}
                  onClick={() => onSelect(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
