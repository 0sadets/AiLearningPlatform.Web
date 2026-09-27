import { Link, Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/courses" className="app-logo">
          LearnAI
        </Link>

        <nav className="app-nav">
          <Link to="/courses">Курси</Link>

          <button className="profile-button">
            OR
          </button>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout