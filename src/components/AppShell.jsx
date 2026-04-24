import { Plus } from 'lucide-react'
import BottomNav from './BottomNav'

function AppShell({
  activeTab,
  children,
  isOverlayOpen,
  overlayContent,
  onOpenModal,
  onTabChange,
}) {
  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <div className="app-shell__content">{children}</div>

        <div className={`app-shell__dock ${isOverlayOpen ? 'is-hidden' : ''}`}>
          <button className="fab-button" onClick={onOpenModal} type="button" aria-label="Nuevo recordatorio">
            <Plus size={28} />
          </button>
          <BottomNav activeTab={activeTab} onChange={onTabChange} />
        </div>

        {isOverlayOpen ? <div className="modal-layer">{overlayContent}</div> : null}
      </div>
    </div>
  )
}

export default AppShell
