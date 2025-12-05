import '../../styles/group-modals.css';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  variant?: 'danger' | 'default';
}

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  onClose,
  onConfirm,
  variant = 'danger',
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="group-modal-overlay">
      <div className="group-modal">
        <header className="group-modal__header">
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <div className="group-modal__body">
          <p>{description}</p>
        </div>
        <footer className="group-modal__footer">
          <button className="secondary-btn" onClick={onClose}>
            Hủy
          </button>
          <button className={`primary-btn ${variant === 'danger' ? 'danger' : ''}`} onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

