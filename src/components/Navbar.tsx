import React from 'react';
import {
  Activity,
  UtensilsCrossed,
  History,
  CalendarDays,
  Database,
  Download,
} from 'lucide-react';
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
    <>
      {/* --- Desktop Top Navigation --- */}
      <nav className="nav desktop-nav">
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
          {/* Theme Selector */}
          <div className="theme-selector">
            <label htmlFor="theme-select-desktop" style={{ cursor: 'pointer' }}>
              Stile:
            </label>
            <select
              id="theme-select-desktop"
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Scarica l'archivio offline Dati_Dieta.zip sul tuo computer"
          >
            <Download size={13} />
            Scarica Backup
          </button>
        </span>
      </nav>

      {/* --- Mobile Top App Bar (< 768px) --- */}
      <header className="mobile-top-bar">
        <div className="mobile-brand">
          <span>🥗</span>
          <span>Diet Planner</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={currentTheme}
            onChange={(e) => onChangeTheme(e.target.value as ThemeType)}
            style={{
              padding: '4px 6px',
              fontSize: '8pt',
              background: 'var(--bg-input)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '120px',
            }}
            title="Seleziona tema"
          >
            <option value="swiss">📐 Swiss</option>
            <option value="nordic">🌿 Nordic</option>
            <option value="obsidian">⚡ Obsidian</option>
            <option value="mediterranean">🍞 Medit.</option>
            <option value="classic">💻 Classic</option>
          </select>

          <button
            type="button"
            onClick={onDownload}
            className="btn btn-green"
            style={{ padding: '5px 10px', fontSize: '8pt', minHeight: '32px' }}
            title="Scarica dati"
          >
            <Download size={14} />
          </button>
        </div>
      </header>

      {/* --- Mobile Bottom Tab Bar (< 768px, Thumb Zone) --- */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => onSelectTab('main')}
          aria-label="Scheda principale"
        >
          <Activity size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'food' ? 'active' : ''}`}
          onClick={() => onSelectTab('food')}
          aria-label="Diario Alimentare"
        >
          <UtensilsCrossed size={20} />
          <span>Diario</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
          aria-label="Storico Pasti"
        >
          <History size={20} />
          <span>Storico</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'planner' || activeTab === 'constraints' ? 'active' : ''}`}
          onClick={() => onSelectTab('planner')}
          aria-label="Piano Settimanale"
        >
          <CalendarDays size={20} />
          <span>Planner</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => onSelectTab('database')}
          aria-label="Database Alimenti"
        >
          <Database size={20} />
          <span>Alimenti</span>
        </button>
      </nav>
    </>
  );
};
