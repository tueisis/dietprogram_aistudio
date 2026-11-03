import React from 'react';
import { TabType, ThemeType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onDownload: () => void;
  currentTheme: ThemeType;
  onChangeTheme: (theme: ThemeType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onDownload,
  currentTheme,
  onChangeTheme,
}) => {
  return (
    <nav className="nav">
      <button
        type="button"
        className={`nav-tab ${activeTab === 'main' ? 'active' : ''}`}
        onClick={() => onSelectTab('main')}
      >
        Scheda principale
      </button>
      <button
        type="button"
        className={`nav-tab ${activeTab === 'food' ? 'active' : ''}`}
        onClick={() => onSelectTab('food')}
      >
        Diario Alimentare
      </button>
      <button
        type="button"
        className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onSelectTab('history')}
      >
        Storico Pasti
      </button>
      <button
        type="button"
        className={`nav-tab ${activeTab === 'planner' || activeTab === 'constraints' ? 'active' : ''}`}
        onClick={() => onSelectTab('planner')}
      >
        Piano Settimanale
      </button>
      <button
        type="button"
        className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
        onClick={() => onSelectTab('database')}
      >
        Database Alimenti
      </button>

      <span className="nav-right">
        {/* Live Theme Switcher */}
        <div className="theme-selector">
          <label htmlFor="theme-select" style={{ cursor: 'pointer' }}>
            Stile:
          </label>
          <select
            id="theme-select"
            value={currentTheme}
            onChange={(e) => onChangeTheme(e.target.value as ThemeType)}
            title="Seleziona tema estetico"
          >
            <option value="swiss">📐 Swiss Precision (Opzione 3)</option>
            <option value="nordic">🌿 Nordic Minimalist</option>
            <option value="obsidian">⚡ Obsidian Pro</option>
            <option value="mediterranean">🍞 Mediterranean</option>
            <option value="classic">💻 Original Dark</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onDownload}
          className="btn-nav"
          title="Esporta archivio Dati_Dieta.zip"
        >
          &#8681; Scarica
        </button>
      </span>
    </nav>
  );
};
