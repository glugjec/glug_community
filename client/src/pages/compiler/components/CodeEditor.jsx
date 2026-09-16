import { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Plus,
  X,
  Pencil
} from 'lucide-react';
import { LANGUAGES } from '../utils/languageConfig';

export default function CodeEditor({
  language,
  code,
  onChange,
  errorLines,
  onRun,
  files = [],
  activeFileName = '',
  onActiveFileChange,
  onAddFile,
  onCloseFile,
  onRenameFile,
  fontSize = 14,
  onResetCode,
  onDownloadCode,
  onUploadCode
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileName, setEditingFileName] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const langConfig = LANGUAGES[language] || { monacoLang: 'plaintext' };

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('glug-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '38bdf8' },
        { token: 'number', foreground: 'f472b6' },
        { token: 'type', foreground: 'a78bfa' },
        { token: 'function', foreground: '34d399' },
        { token: 'variable', foreground: 'f1f5f9' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#070b14',
        'editor.foreground': '#f1f5f9',
        'editor.lineHighlightBackground': '#0f172a88',
        'editor.selectionBackground': '#1e3a8a66',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editorGutter.background': '#070b14',
        'editor.inactiveSelectionBackground': '#1e293b44',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorCursor.foreground': '#60a5fa',
        'minimap.background': '#070b14',
      },
    });

    monaco.editor.setTheme('glug-dark');
    editor.focus();
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = (errorLines || []).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'error-line-decoration',
        glyphMarginClassName: 'error-line-glyph',
        glyphMarginHoverMessage: { value: `Error on line ${line}` },
        overviewRuler: {
          color: '#ef4444',
          position: monaco.editor.OverviewRulerLane.Full,
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    if (errorLines && errorLines.length > 0) {
      editor.revealLineInCenter(errorLines[0]);
    }
  }, [errorLines]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const actionId = editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        if (onRun) onRun();
      },
    });

    return () => actionId.dispose();
  }, [onRun]);

  const handleFormatCode = () => {
    if (editorRef.current) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
      }
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string' && onUploadCode) {
        onUploadCode(file.name, content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartRename = (fileName) => {
    setEditingFileName(fileName);
    setEditingValue(fileName);
  };

  const handleCommitRename = () => {
    if (editingFileName && editingValue.trim() && editingValue.trim() !== editingFileName) {
      if (onRenameFile) {
        onRenameFile(editingFileName, editingValue.trim());
      }
    }
    setEditingFileName(null);
    setEditingValue('');
  };

  const handleCancelRename = () => {
    setEditingFileName(null);
    setEditingValue('');
  };

  return (
    <div className="editor-panel">
      <div className="editor-panel-header">
        <div className="editor-tabs-container">
          {files.map((file) => {
            const fileLangConfig = LANGUAGES[file.language] || { name: 'Plain Text', logo: '' };
            const isActive = file.name === activeFileName;
            const isEditingThis = editingFileName === file.name;

            if (isEditingThis) {
              return (
                <div
                  key={file.name}
                  className="editor-tab active editor-tab-editing"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fileLangConfig.logo ? (
                    <img src={fileLangConfig.logo} alt={fileLangConfig.name} className="tab-logo-img" />
                  ) : (
                    <FileCode size={13} className="tab-file-icon" />
                  )}
                  <input
                    type="text"
                    className="editor-tab-rename-input"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCommitRename();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelRename();
                      }
                    }}
                    onBlur={handleCommitRename}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="tab-action-btn confirm"
                    onClick={handleCommitRename}
                    title="Save filename"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    type="button"
                    className="tab-action-btn cancel"
                    onClick={handleCancelRename}
                    title="Cancel rename"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={file.name}
                className={`editor-tab ${isActive ? 'active' : ''}`}
                onClick={() => onActiveFileChange && onActiveFileChange(file.name)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartRename(file.name);
                }}
                title="Double-click to rename file"
              >
                {fileLangConfig.logo ? (
                  <img src={fileLangConfig.logo} alt={fileLangConfig.name} className="tab-logo-img" />
                ) : (
                  <FileCode size={13} className="tab-file-icon" />
                )}
                <span className="tab-name-text">{file.name}</span>
                <button
                  type="button"
                  className="tab-rename-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(file.name);
                  }}
                  title="Rename file"
                >
                  <Pencil size={11} />
                </button>
                {files.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile && onCloseFile(file.name);
                    }}
                    title="Close file"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {isAdding ? (
            <div className="editor-add-tab-input-container">
              <input
                type="text"
                className="editor-add-tab-input"
                placeholder="filename.py"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newFileName.trim()) {
                      onAddFile && onAddFile(newFileName.trim());
                      setIsAdding(false);
                      setNewFileName('');
                    }
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewFileName('');
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className="editor-add-tab-btnconfirm"
                onClick={() => {
                  if (newFileName.trim()) {
                    onAddFile && onAddFile(newFileName.trim());
                    setIsAdding(false);
                    setNewFileName('');
                  }
                }}
              >
                <Check size={11} />
              </button>
              <button
                type="button"
                className="editor-add-tab-btncancel"
                onClick={() => {
                  setIsAdding(false);
                  setNewFileName('');
                }}
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="editor-add-tab-btn"
              onClick={() => setIsAdding(true)}
              title="Add new file"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        <div className="editor-toolbar-actions">
          <button
            type="button"
            className="editor-tool-btn"
            onClick={handleFormatCode}
            title="Format Code"
          >
            <Sparkles size={13} />
            <span className="editor-tool-text">Format</span>
          </button>

          <button
            type="button"
            className="editor-tool-btn"
            onClick={handleCopyCode}
            title="Copy Code"
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
            <span className="editor-tool-text">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            className="editor-tool-btn"
            onClick={onDownloadCode}
            title="Download File"
          >
            <Download size={13} />
            <span className="editor-tool-text">Download</span>
          </button>

          <button
            type="button"
            className="editor-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload File"
          >
            <Upload size={13} />
            <span className="editor-tool-text">Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            className="editor-tool-btn"
            onClick={onResetCode}
            title="Reset to Template"
          >
            <RotateCcw size={13} />
            <span className="editor-tool-text">Reset</span>
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={langConfig?.monacoLang || 'plaintext'}
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          theme="glug-dark"
          options={{
            fontSize: Number(fontSize) || 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineHeight: Math.round((Number(fontSize) || 14) * 1.55),
            padding: { top: 12, bottom: 12 },
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            glyphMargin: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            automaticLayout: true,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className="output-loading" style={{ height: '100%' }}>
              <div className="loading-spinner" />
              <span className="loading-text">Loading editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
