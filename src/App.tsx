import { useState, useCallback, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TreeProvider } from './TreeContext';
import { TreeView } from './components/TreeView';
import { ChatView } from './components/ChatView';
import { ConversationList } from './components/ConversationList';
import { ApiKeyModal } from './components/ApiKeyModal';
import './App.css';

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_SIDEBAR_WIDTH = 600;
const STORAGE_KEY = 'tree-chat-sidebar-width';

function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <button className="auth-button" onClick={signOut}>
        Sign Out
      </button>
    );
  }

  return (
    <button className="auth-button" onClick={signInWithGoogle}>
      Sign in with Google
    </button>
  );
}

function AppContent() {
  const [forkFromId, setForkFromId] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      localStorage.setItem(STORAGE_KEY, sidebarWidth.toString());
    }
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>🌳 Deep Research</h1>
          <span className="subtitle">Voice-first Knowledge Tree</span>
        </div>
        <div className="header-actions">
          <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
            ⚙️
          </button>
          <AuthButton />
        </div>
      </header>
      <ApiKeyModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="app-content">
        <aside
          className="tree-panel"
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
        >
          <ConversationList />
          <h2>Knowledge Tree</h2>
          <TreeView />
        </aside>

        <div
          className={`resize-handle ${isResizing ? 'active' : ''}`}
          onMouseDown={handleMouseDown}
        />

        <main className="chat-panel">
          <ChatView forkFromId={forkFromId} onClearFork={() => setForkFromId(undefined)} />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TreeProvider>
        <AppContent />
      </TreeProvider>
    </AuthProvider>
  );
}

export default App;
