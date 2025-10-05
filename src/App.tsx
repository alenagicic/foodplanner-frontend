import { Routes, Route } from 'react-router-dom';
import AddPage from './Pages/AddPage';
import Browsepage from './Pages/BrowsePage';
import AuthPage from './Pages/AuthPage';
import Header from './Component/Header';
import FloatingNavbar from './Component/FloatingNavbar';
import { AuthContext } from './Context/AuthContext';
import { useContext } from 'react';

function App() {
  const authContext = useContext(AuthContext);

  if (authContext === null) {
    return null;
  }

  const { user } = authContext;

  return (
    <main>
      <Header></Header>

      <div className='wrapper-nav-partial'>

        {user && (
          <FloatingNavbar></FloatingNavbar>
        )}
        
        <Routes>
          <Route path="/" element={user ? <Browsepage /> : <AuthPage />} />
          <Route path="/add" element={user ? <AddPage /> : <AuthPage />} />
        </Routes>

      </div>
 
    </main>
  
  );
}

export default App;