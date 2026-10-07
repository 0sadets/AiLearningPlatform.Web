import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function MainLayout() {
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { currentUser, setCurrentUser } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/courses" className="app-logo">
          LearnAI
        </Link>

        <nav className="app-nav">
          <Link to="/courses">Курси</Link>

          <Link to="/my-courses">Мої курси</Link>

          <div className="profile-menu-wrapper" ref={profileMenuRef}>
            <button
              className="profile-button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Профіль"
                  className="header-avatar"
                />
              ) : currentUser ? (
                `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
              ) : (
                ""
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate("/profile");
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
  );
}

export default MainLayout;
