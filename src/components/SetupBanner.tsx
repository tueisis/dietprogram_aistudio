import React, { useRef, useState } from 'react';
import { Upload, Trash2, ShieldCheck, Database, Sparkles, AlertTriangle } from 'lucide-react';

interface SetupBannerProps {
  hasData: boolean;
  persistInBrowser: boolean;
  onTogglePersist: (persist: boolean) => void;
  onUpload: (files: FileList) => void;
  onClear: () => void;
  onLoadDemo: () => void;
}

export const SetupBanner: React.FC<SetupBannerProps> = ({
  hasData,
  persistInBrowser,
  onTogglePersist,
  onUpload,
  onClear,
  onLoadDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      onUpload(fileInputRef.current.files);
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteClear = () => {
    setShowClearConfirm(false);
    onClear();
  };

  return (
    <div className={`setup-banner ${hasData ? 'setup-ok' : 'setup-warn'}`}>
      <div className="setup-warn-header">
        <span className={`setup-dot ${hasData ? 'setup-dot-ok' : 'setup-dot-warn'}`}></span>
        <strong>{hasData ? 'Dati caricati in memoria' : 'Nessun dato trovato'}</strong>
        <span
          style={{
            fontSize: '8pt',
            padding: '2px 8px',
            borderRadius: '4px',
            background: hasData ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500,
          }}
          title={
            persistInBrowser
              ? 'I dati sono salvati anche in questo browser (localStorage)'
              : 'I dati sono in memoria solo per la sessione corrente e NON vengono memorizzati nel browser'
          }
        >
          <ShieldCheck size={12} />
          {persistInBrowser ? 'Browser persistente' : 'Modalità Offline (Solo memoria)'}
        </span>
      </div>

      <div className="setup-forms" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Upload form */}
        <form onSubmit={handleUploadSubmit} className="setup-form" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            ref={fileInputRef}
            type="file"
            name="data_file"
            accept=".zip,.json"
            multiple
            title="Seleziona Dati_Dieta.zip o singoli file .json salvati sul computer"
            style={{ maxWidth: '210px', fontSize: '0.8rem', padding: '4px 8px' }}
          />
          <button
            type="submit"
            className="btn btn-green"
            style={{ padding: '5px 11px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Carica file selezionato in memoria"
          >
            <Upload size={13} />
            Carica
          </button>
        </form>

        {/* Demo data button when empty */}
        {!hasData && (
          <button
            type="button"
            onClick={onLoadDemo}
            className="btn btn-blue"
            style={{ padding: '5px 11px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Carica dataset dimostrativo di esempio per esplorare l'app"
          >
            <Sparkles size={13} />
            Dati Demo
          </button>
        )}

        {/* Clear button with reliable inline confirmation (no window.confirm dialogs) */}
        {hasData && (
          <>
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="btn btn-red"
                style={{ padding: '5px 11px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Svuota tutti i dati caricati in memoria"
              >
                <Trash2 size={13} />
                Svuota
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#dc2626',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertTriangle size={12} />
                  Svuotare tutto?
                </span>
                <button
                  type="button"
                  onClick={handleExecuteClear}
                  className="btn btn-red"
                  style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}
                  title="Conferma svuotamento immediato di tutti i dati"
                >
                  Sì, svuota
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                >
                  Annulla
                </button>
              </div>
            )}
          </>
        )}

        {/* Persistence checkbox option */}
        <label
          style={{
            fontSize: '8pt',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            userSelect: 'none',
            color: 'var(--text-muted)',
            marginLeft: '4px',
          }}
          title="Se disattivato (modalità offline predefinita), nessun dato viene salvato nel browser. Se attivato, i dati persistono nel localStorage."
        >
          <input
            type="checkbox"
            checked={persistInBrowser}
            onChange={(e) => onTogglePersist(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <Database size={11} />
          Salva nel browser
        </label>
      </div>
    </div>
  );
};
