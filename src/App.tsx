import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Save, Code2, LayoutTemplate, Share2 } from 'lucide-react';
import { db } from './lib/db';
import { cn } from './lib/utils';

const DEFAULT_HTML = `<h1>Instant Web Builder</h1>
<p>Edit HTML, CSS, and JS in the tabs above and click RUN</p>
<button id="test-btn">Test Button</button>`;

const DEFAULT_CSS = `body { 
  font-family: Arial; 
  text-align: center; 
  background: #f0f4f8; 
  padding: 2rem; 
}
h1 { color: #2563eb; }
button { 
  padding: 10px 20px; 
  background: #2563eb; 
  color: white; 
  border: none; 
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
button:hover { background: #1d4ed8; }`;

const DEFAULT_JS = `document.getElementById('test-btn').addEventListener('click', () => {
  alert('Hello from the preview!');
});`;

const generatePreview = (html: string, css: string, js: string) => {
  return `<!DOCTYPE html>
<html>
<head>
<style>${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;
};

export default function App() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  
  const [previewCode, setPreviewCode] = useState(() => generatePreview(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS));
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [activeEditorTab, setActiveEditorTab] = useState<'html' | 'css' | 'js'>('html');
  
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check URL for snippet ID on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setSnippetId(id);
    }
  }, []);

  // Fetch snippet if ID exists
  const { data, error } = db.useQuery(
    snippetId ? { snippets: { $: { where: { id: snippetId } } } } : null
  );

  useEffect(() => {
    if (data?.snippets && data.snippets.length > 0) {
      const snippet = data.snippets[0] as any;
      
      // Support for new format (split tabs)
      if (snippet.html !== undefined) {
        setHtml(snippet.html || '');
        setCss(snippet.css || '');
        setJs(snippet.js || '');
        setPreviewCode(generatePreview(snippet.html || '', snippet.css || '', snippet.js || ''));
      } else {
        // Fallback for older snippets that were saved as a single 'code' string
        setHtml(snippet.code || '');
        setCss('');
        setJs('');
        setPreviewCode(snippet.code || '');
      }
    }
  }, [data]);

  const handleRun = () => {
    setPreviewCode(generatePreview(html, css, js));
    setActiveTab('preview');
  };

  const handleReset = () => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setJs(DEFAULT_JS);
    setPreviewCode(generatePreview(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS));
    setSnippetId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newId = crypto.randomUUID();
      await db.transact([
        db.tx.snippets[newId].update({
          html,
          css,
          js,
          createdAt: Date.now(),
        }),
      ]);
      setSnippetId(newId);
      const url = new URL(window.location.href);
      url.searchParams.set('id', newId);
      window.history.replaceState({}, '', url.toString());
      alert('Snippet saved! You can share this URL.');
    } catch (err) {
      console.error('Failed to save snippet:', err);
      alert('Failed to save snippet. Check your InstantDB App ID.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!snippetId) {
      alert('Please save the snippet first before sharing.');
      return;
    }
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white hidden sm:block">
            Instant Web Builder
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          {snippetId && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors ml-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Run
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="flex sm:hidden border-b border-gray-800 shrink-0">
        <button
          onClick={() => setActiveTab('editor')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            activeTab === 'editor' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-400 hover:text-gray-200"
          )}
        >
          <Code2 className="w-4 h-4" />
          Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            activeTab === 'preview' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-400 hover:text-gray-200"
          )}
        >
          <LayoutTemplate className="w-4 h-4" />
          Preview
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Editor Panel */}
        <div 
          className={cn(
            "flex-1 flex-col bg-[#1e1e1e] sm:flex sm:border-r border-gray-800",
            activeTab === 'editor' ? "flex" : "hidden"
          )}
        >
          <div className="flex bg-[#2d2d2d] text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0">
            <button 
              onClick={() => setActiveEditorTab('html')}
              className={cn("px-4 py-2 hover:bg-[#3d3d3d] transition-colors", activeEditorTab === 'html' && "bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-400")}
            >
              HTML
            </button>
            <button 
              onClick={() => setActiveEditorTab('css')}
              className={cn("px-4 py-2 hover:bg-[#3d3d3d] transition-colors", activeEditorTab === 'css' && "bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-400")}
            >
              CSS
            </button>
            <button 
              onClick={() => setActiveEditorTab('js')}
              className={cn("px-4 py-2 hover:bg-[#3d3d3d] transition-colors", activeEditorTab === 'js' && "bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-400")}
            >
              JS
            </button>
            <div className="flex-1 flex justify-end items-center px-4">
              {error && <span className="text-red-400 normal-case">DB Error: Check App ID</span>}
            </div>
          </div>
          <textarea
            value={activeEditorTab === 'html' ? html : activeEditorTab === 'css' ? css : js}
            onChange={(e) => {
              if (activeEditorTab === 'html') setHtml(e.target.value);
              else if (activeEditorTab === 'css') setCss(e.target.value);
              else setJs(e.target.value);
            }}
            className="flex-1 w-full p-4 bg-transparent text-emerald-400 font-mono text-sm sm:text-base resize-none outline-none focus:ring-0"
            spellCheck="false"
            placeholder={`Write your ${activeEditorTab.toUpperCase()} here...`}
          />
        </div>

        {/* Preview Panel */}
        <div 
          className={cn(
            "flex-1 flex-col bg-white sm:flex",
            activeTab === 'preview' ? "flex" : "hidden"
          )}
        >
          <div className="px-4 py-2 bg-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0 border-b border-gray-200">
            Preview
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={previewCode}
            title="preview"
            sandbox="allow-scripts allow-forms allow-modals"
            className="flex-1 w-full h-full border-none bg-white"
          />
        </div>
      </main>
    </div>
  );
}
