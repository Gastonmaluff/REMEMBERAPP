import MainAppView from './MainAppView'
import MariaPortalView from './MariaPortalView'
import { getPortalRequest } from './portalConfig'

function InvalidPortalView() {
  function goToMainApp() {
    window.location.href = window.location.pathname
  }

  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <div className="app-shell__content portal-screen portal-screen--compact">
          <section className="portal-card portal-card--centered">
            <p className="dashboard-header__eyebrow">Portal especial</p>
            <h1>Link no valido</h1>
            <p className="portal-header__subtitle">
              Revisa el enlace de Mar&iacute;a o vuelve a la app principal.
            </p>
            <button className="primary-button" onClick={goToMainApp} type="button">
              Ir a Rememberapp
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function App() {
  const portalRequest = getPortalRequest()

  if (portalRequest.isMariaPortal) {
    if (!portalRequest.isMariaPortalValid) {
      return <InvalidPortalView />
    }

    return <MariaPortalView />
  }

  return <MainAppView />
}

export default App
