import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";

export default function FloatingNavbar() {

  const context = useContext(AuthContext);

  if (context === null) {
    return null;
  }

  const { signOut } = context;

  const navigate = useNavigate();

  return (
    <nav className="floating-nav d-flex flex-column align-items-center p-3 shadow rounded">


      {/* Create */}
      <button className="nav-item" data-label="Skapa" onClick={() => navigate('/add')}>
        <i className="bi bi-plus-circle fs-3"></i>
      </button>

      {/* Browse */}
      <button className="nav-item" data-label="Bläddra" onClick={() => navigate('/')}>
        <i className="bi bi-search fs-3"></i>
      </button>

      {/* Browse */}
      <button className="nav-item" data-label="Logga ut" onClick={signOut}>
        <i className="bi bi-door-closed"></i>
      </button>
    </nav>
  );
}
