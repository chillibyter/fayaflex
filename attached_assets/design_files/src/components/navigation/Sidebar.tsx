import { Home, Plus, Trophy, Users, User, HelpCircle, Menu, X } from 'lucide-react';
import { Screen } from '../../App';
import { useState } from 'react';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { screen: 'dashboard' as Screen, icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { screen: 'track' as Screen, icon: <Plus className="w-5 h-5" />, label: 'Track Activity' },
    { screen: 'leaderboard' as Screen, icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard' },
    { screen: 'teams' as Screen, icon: <Users className="w-5 h-5" />, label: 'Teams' },
    { screen: 'profile' as Screen, icon: <User className="w-5 h-5" />, label: 'Profile' },
    { screen: 'how-it-works' as Screen, icon: <HelpCircle className="w-5 h-5" />, label: 'How It Works' },
  ];

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <h1 className="text-green-600 mb-8">UFC</h1>
          
          <nav className="space-y-2">
            {menuItems.map(item => (
              <button
                key={item.screen}
                onClick={() => handleNavigate(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentScreen === item.screen
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
