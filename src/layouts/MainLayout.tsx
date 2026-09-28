import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

function MainLayout() {
  const navigate = useNavigate()

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const profileMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')

    navigate('/login')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/courses" className="app-logo">
          LearnAI
        </Link>

        <nav className="app-nav">
          <Link to="/courses">
            Курси
          </Link>

          <div
            className="profile-menu-wrapper"
            ref={profileMenuRef}
          >
            <button
              className="profile-button"
              onClick={() =>
                setIsProfileMenuOpen((current) => !current)
              }
            >
              OR
            </button>

            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    navigate('/profile')
                  }}
                >
                  Мій кабінет
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  Вийти
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout