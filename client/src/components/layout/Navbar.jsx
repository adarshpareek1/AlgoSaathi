import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Layout, ChevronDown, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { useAuth } from '../../context/AuthContext';
import Brand from '../Brand';
import Button from '../ui/Button';

const Navbar = ({ isLoggedIn = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const logoLink = user ? '/workspace' : '/';

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <Link to={logoLink}>
          <Brand />
        </Link>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              {/* 1. NEW: Back to Workspace Button (Only shows on Profile page) */}
              {location.pathname === '/profile' && (
                <Link to="/workspace">
                  <Button 
                    variant="ghost" 
                    className="gap-2 text-slate-400 hover:text-white hidden sm:flex"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Workspace
                  </Button>
                </Link>
              )}

              {/* 2. Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:bg-slate-800/50 p-1.5 pr-3 rounded-full transition border border-transparent hover:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 overflow-hidden border border-slate-700">
                     <img 
                       src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`} 
                       alt="User"
                       className="w-full h-full object-cover"
                     />
                  </div>
                  <span className="text-sm font-medium text-slate-300 hidden md:block">
                    {user?.name || user?.username || "User"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    
                    {location.pathname === '/workspace' ? (
                      <Link 
                        to="/profile" 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                    ) : (
                      <Link 
                        to="/workspace" 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Layout className="w-4 h-4" /> Workspace
                      </Link>
                    )}

                    <div className="h-px bg-slate-800 my-1"></div>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Log in</Button></Link>
              <Link to="/signup"><Button variant="primary">Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;