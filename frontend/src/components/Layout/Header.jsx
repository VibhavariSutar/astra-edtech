import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Astralearn</h1>
          <span className="bg-blue-500 px-2 py-1 rounded text-sm">
            {user?.role}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Welcome, {user?.name}</span>
          <span>XP: {user?.xp}</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;