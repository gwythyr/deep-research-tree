import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TreeProvider } from './TreeContext';
import { TreeView } from './components/TreeView';
import { ChatView } from './components/ChatView';
import { ConversationList } from './components/ConversationList';
import { ApiKeyModal } from './components/ApiKeyModal';
import './App.css';

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
        <aside className="tree-panel">
          <ConversationList />
          <h2>Knowledge Tree</h2>
          <TreeView />
        </aside>

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
