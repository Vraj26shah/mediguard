import Editor from '@monaco-editor/react';

const EDITOR_OPTIONS = {
  theme: 'mediguard-dark',
  fontSize: 13,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  tabSize: 2,
  insertSpaces: true,
  renderLineHighlight: 'line',
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
  },
  padding: { top: 12, bottom: 12 },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  renderWhitespace: 'none',
  smoothScrolling: true,
  cursorSmoothCaretAnimation: 'on',
  bracketPairColorization: { enabled: true },
};

const LANGUAGE_MAP = {
  js: 'javascript',
  sql: 'sql',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'shell',
  json: 'json',
  conf: 'plaintext',
  env: 'plaintext',
  Dockerfile: 'dockerfile',
};

function getLanguage(fileName) {
  if (!fileName) return 'plaintext';
  const ext = fileName.split('.').pop();
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export default function CodeEditor({ value, onChange, language, fileName = 'file.js' }) {
  function handleBeforeMount(monaco) {
    monaco.editor.defineTheme('mediguard-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '#6b7280' },
        { token: 'string', foreground: '#34d399' },
        { token: 'number', foreground: '#f59e0b' },
        { token: 'keyword', foreground: '#60a5fa' },
      ],
      colors: {
        'editor.background': '#030712',
        'editor.foreground': '#f3f4f6',
        'editor.lineHighlightBackground': '#111827',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#60a5fa',
        'editor.selectionBackground': '#1e3a5f',
        'editor.cursorForeground': '#60a5fa',
        'editorWhitespace.foreground': '#374151',
      },
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-sm text-blue-400 font-mono">
        {fileName}
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguage(fileName)}
          value={value}
          onChange={onChange}
          options={EDITOR_OPTIONS}
          beforeMount={handleBeforeMount}
          theme="mediguard-dark"
          loading={
            <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
