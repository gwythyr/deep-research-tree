import { useState } from 'react';
import { TreeProvider } from './TreeContext';
import { TreeView } from './components/TreeView';
import { ChatView } from './components/ChatView';
import './App.css';

function AppContent() {
  const [forkFromId, setForkFromId] = useState<string | undefined>();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌳 Deep Research</h1>
        <span className="subtitle">Voice-first Knowledge Tree</span>
      </header>

      <div className="app-content">
        <aside className="tree-panel">
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
    <TreeProvider>
      <AppContent />
    </TreeProvider>
  );
}

export default App;
