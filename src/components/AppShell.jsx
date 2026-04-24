import { Plus } from 'lucide-react'
import BottomNav from './BottomNav'

function AppShell({
  activeTab,
  children,
  isModalOpen,
  modalContent,
  onOpenModal,
  onTabChange,
}) {
  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <div className="app-shell__content">{children}</div>

        <div className={`app-shell__dock ${isModalOpen ? 'is-hidden' : ''}`}>
          <button className="fab-button" onClick={onOpenModal} type="button" aria-label="Nuevo recordatorio">
            <Plus size={28} />
          </button>
          <BottomNav activeTab={activeTab} onChange={onTabChange} />
        </div>

        {isModalOpen ? <div className="modal-layer">{modalContent}</div> : null}
      </div>
    </div>
  )
}

export default AppShell
