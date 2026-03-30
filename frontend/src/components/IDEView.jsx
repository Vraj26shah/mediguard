import { useState } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import AIAssistant from './AIAssistant';

const DEFAULT_FILE = {
  name: 'auth.js',
  path: 'src/api/auth.js',
  language: 'javascript',
  content: `const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verify credentials against database
    const user = await db.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (!user.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  // Invalidate session token
  res.json({ success: true });
});

module.exports = router;`,
};

export default function IDEView({ role, onRoleChange, sendCommand, isConnected }) {
  const [activeFile, setActiveFile] = useState(DEFAULT_FILE);
  const [code, setCode] = useState(DEFAULT_FILE.content);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('file');

  const handleFileSelect = (file) => {
    setActiveFile(file);
    setCode(file.content);
  };

  const handleCreateItem = () => {
    if (newItemName.trim()) {
      console.log(`Created ${newItemType}: ${newItemName}`);
      setNewItemName('');
      setShowNewFileDialog(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-950">
      {/* LEFT SIDEBAR - File Explorer */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Explorer</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setNewItemType('file');
                setShowNewFileDialog(true);
              }}
              className="text-gray-500 hover:text-gray-300 p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="New File"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </button>
            <button
              onClick={() => {
                setNewItemType('folder');
                setShowNewFileDialog(true);
              }}
              className="text-gray-500 hover:text-gray-300 p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="New Folder"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
            </button>
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto">
          <FileExplorer
            onFileSelect={handleFileSelect}
            selectedFile={activeFile}
          />
        </div>
      </div>

      {/* CENTER - Code Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
        {/* File Tabs */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 overflow-x-auto">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 bg-gray-800 border-b-2 border-blue-500 font-mono whitespace-nowrap hover:bg-gray-700 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {activeFile.name}
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={code}
            onChange={setCode}
            fileName={activeFile.name}
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR - AI Assistant */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* AI Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Assistant</span>
        </div>

        {/* AI Chat */}
        <div className="flex-1 overflow-hidden">
          <AIAssistant
            role={role}
            onSend={sendCommand}
            isConnected={isConnected}
            activeFile={activeFile}
          />
        </div>
      </div>

      {/* New File/Folder Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl p-8 w-96">
            <h2 className="text-xl font-bold text-white mb-6">New {newItemType === 'file' ? 'File' : 'Folder'}</h2>

            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem();
                if (e.key === 'Escape') setShowNewFileDialog(false);
              }}
              autoFocus
              placeholder={newItemType === 'file' ? 'filename.js' : 'folder-name'}
              className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-6"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
