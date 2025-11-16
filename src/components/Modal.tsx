import ReactDOM from "react-dom";

interface ModalProps {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}

export const Modal = ({ children, onClose, isOpen }: ModalProps) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose}>
      <div className="m__content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>  
    </div>,
    document.body
  )
}