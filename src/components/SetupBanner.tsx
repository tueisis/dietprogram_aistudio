import React, { useRef } from 'react';

interface SetupBannerProps {
  hasData: boolean;
  onUpload: (files: FileList) => void;
  onClear: () => void;
}

export const SetupBanner: React.FC<SetupBannerProps> = ({
  hasData,
  onUpload,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      onUpload(fileInputRef.current.files);
      fileInputRef.current.value = '';
    }
  };

  const handleClearClick = () => {
    if (window.confirm('Cancellare i dati caricati?')) {
      onClear();
    }
  };

  return (
    <div className={`setup-banner ${hasData ? 'setup-ok' : 'setup-warn'}`}>
      <div className="setup-warn-header">
        <span className={`setup-dot ${hasData ? 'setup-dot-ok' : 'setup-dot-warn'}`}></span>
        <strong>{hasData ? 'Dati caricati' : 'Nessun dato trovato'}</strong>
      </div>
      <div className="setup-forms" style={{ marginLeft: 'auto' }}>
        <form onSubmit={handleUploadSubmit} className="setup-form">
          <input
            ref={fileInputRef}
            type="file"
            name="data_file"
            accept=".zip,.json"
            multiple
            style={{ maxWidth: '210px', fontSize: '0.8rem', padding: '4px 8px' }}
          />
          <button
            type="submit"
            className="btn btn-green"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            Carica
          </button>
          <button
            type="button"
            onClick={handleClearClick}
            className="btn btn-red"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            Cancella
          </button>
        </form>
      </div>
    </div>
  );
};
