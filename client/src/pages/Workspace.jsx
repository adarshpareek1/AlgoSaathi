import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { 
  Play, 
  Terminal, 
  ChevronDown, 
  Bug, 
  Lightbulb, 
  FileQuestion, 
  Bot, 
  Gauge, 
  FileText, 
  Zap, 
  AlertCircle, 
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { runCode } from '../services/runService';
import { askAi } from '../services/aiService';
import { useLocation } from 'react-router-dom';

const LANGUAGES = {
  cpp: { id: 'cpp', label: 'C++ (GCC)', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello AlgoSaathi!";\n    return 0;\n}' },
  python: { id: 'python', label: 'Python 3', defaultCode: 'print("Hello AlgoSaathi!")' },
  java: { id: 'java', label: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello AlgoSaathi!");\n    }\n}' },
  javascript: { id: 'javascript', label: 'JavaScript', defaultCode: 'console.log("Hello AlgoSaathi!");' },
  c: { id: 'c', label: 'C (GCC)', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello AlgoSaathi!");\n    return 0;\n}' }
};

const Workspace = () => {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('output');
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(LANGUAGES['cpp'].defaultCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionMeta, setExecutionMeta] = useState(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const [aiResponse, setAiResponse] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); 
  const [problemStatement, setProblemStatement] = useState(''); 
  const [showProblemInput, setShowProblemInput] = useState(false);

  const editorRef = useRef(null);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  useEffect(() => {
    // Check if we navigated here with state (from Profile history)
    if (location.state && location.state.code) {
      setCode(location.state.code);
      if (location.state.language && LANGUAGES[location.state.language]) {
        setLanguage(location.state.language);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(LANGUAGES[newLang].defaultCode);
    setExecutionMeta(null);
  };

  const handleResetCode = () => {
    if (window.confirm("Reset editor to default starter template?")) {
      setCode(LANGUAGES[language].defaultCode);
    }
  };

  const handleRun = async () => {
    if (isRunning) return;

    if (rateLimitCountdown > 0) {
      setOutput(`Rate limit active. Please wait ${rateLimitCountdown} seconds before running again.`);
      return;
    }

    setIsRunning(true);
    setActiveTab('output');
    setOutput('Compiling and running code...');
    setExecutionMeta(null);

    try {
      const data = await runCode(language, code, stdin);
      
      setExecutionMeta({
        executionTimeMs: data.executionTimeMs,
        engine: data.engine,
        attempts: data.attempts,
        failoverTriggered: data.failoverTriggered,
        isSuccess: data.code === 0 && !data.error
      });

      if (data.error) {
        setOutput(`Error:\n${data.error}`);
      } else {
        setOutput(data.output || "Program finished with exit code 0 (no output).");
      }
    } catch (err) {
      if (err.isRateLimited || err.status === 429) {
        const waitSec = err.retryAfter || 15;
        setRateLimitCountdown(waitSec);
        setOutput(`⚠️ RATE LIMIT EXCEEDED:\n${err.message}\nCooldown: ${waitSec}s remaining.`);
      } else {
        setOutput(`Execution Failed:\n${err.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiAction = async (actionType) => {
    setActiveTab('chat'); 
    setLoadingAction(actionType); 
    setAiResponse("AlgoSaathi is analyzing your code...");

    try {
      const reply = await askAi(code, language, actionType, problemStatement);
      setAiResponse(reply);
    } catch (err) {
      setAiResponse("Error: " + err.message);
    } finally {
      setLoadingAction(null); 
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Bind Ctrl+Enter or Cmd+Enter to Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white selection:bg-blue-600/30">
      <Navbar isLoggedIn={true} />

      <div className="flex-1 flex flex-col md:flex-row pt-16 overflow-hidden">

        {/* LEFT PANEL: Monaco Code Editor */}
        <div className="h-1/2 md:h-full md:w-3/5 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          
          {/* Editor Header Toolbar */}
          <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="appearance-none bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.values(LANGUAGES).map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={handleResetCode}
                title="Reset to default code template"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Run Button & Shortcut Hint */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 hidden lg:inline font-mono">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Enter</kbd>
              </span>

              <Button
                variant="primary"
                onClick={handleRun}
                className="h-8 text-xs gap-1.5 shadow-md shadow-blue-500/20"
                isLoading={isRunning}
                disabled={rateLimitCountdown > 0}
              >
                {!isRunning && <Play className="w-3.5 h-3.5 fill-current" />}
                {rateLimitCountdown > 0 ? `Wait (${rateLimitCountdown}s)` : 'Run Code'}
              </Button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language === 'c' || language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onMount={handleEditorDidMount}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: 'JetBrains Mono, monospace',
                automaticLayout: true,
                tabSize: 4,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Multi-tab Terminal, Custom Stdin & AI Assistant */}
        <div className="h-1/2 md:h-full md:w-2/5 flex flex-col bg-slate-900 border-l border-slate-800/80">

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/80">
            <button
              onClick={() => setActiveTab('output')}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === 'output' ? 'border-blue-500 text-white bg-slate-900/90' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Terminal className="w-4 h-4 text-blue-400" /> Output
            </button>

            <button
              onClick={() => setActiveTab('stdin')}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === 'stdin' ? 'border-blue-500 text-white bg-slate-900/90' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-4 h-4 text-emerald-400" /> Input (stdin)
              {stdin.trim() && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === 'chat' ? 'border-blue-500 text-white bg-slate-900/90' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Bot className="w-4 h-4 text-purple-400" /> AI Tutor
            </button>
          </div>

          {/* Telemetry Bar (Shown when execution metadata exists) */}
          {executionMeta && activeTab === 'output' && (
            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/70 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 font-semibold ${executionMeta.isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                  {executionMeta.isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {executionMeta.isSuccess ? 'Success' : 'Error'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Zap className="w-3 h-3 text-amber-400" /> {executionMeta.executionTimeMs}ms
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="uppercase text-slate-400">
                  {executionMeta.engine} {executionMeta.failoverTriggered && '(Fallback)'}
                </span>
                {executionMeta.attempts > 1 && (
                  <span className="text-amber-400 font-medium">({executionMeta.attempts} attempts)</span>
                )}
              </div>
            </div>
          )}

          {/* Rate Limit Active Warning Banner */}
          {rateLimitCountdown > 0 && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>Rate limiter cooling down: <strong>{rateLimitCountdown}s</strong> remaining before next run.</span>
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-slate-900 text-slate-300">
            
            {/* 1. OUTPUT TAB */}
            {activeTab === 'output' && (
              <div className="whitespace-pre-wrap font-mono leading-relaxed select-text">
                {output || (
                  <div className="text-slate-600 text-center mt-12 italic text-xs font-sans">
                    Press "Run Code" or <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded">Ctrl+Enter</kbd> to execute your solution.
                  </div>
                )}
              </div>
            )}

            {/* 2. CUSTOM STDIN TAB */}
            {activeTab === 'stdin' && (
              <div className="flex flex-col h-full font-sans">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Standard Input (stdin):
                  </label>
                  {stdin && (
                    <button
                      onClick={() => setStdin('')}
                      className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Provide custom test inputs passed into your program's <code className="text-slate-400 font-mono">cin</code> / <code className="text-slate-400 font-mono">input()</code> / <code className="text-slate-400 font-mono">stdin</code>.
                </p>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="5&#10;1 2 3 4 5"
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-700"
                />
              </div>
            )}

            {/* 3. AI TUTOR TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full font-sans">

                {/* Problem Statement Input */}
                <div className="mb-3 bg-slate-950 rounded-xl border border-slate-800/80 p-2.5">
                  <button 
                    onClick={() => setShowProblemInput(!showProblemInput)}
                    className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white w-full transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-blue-400" /> 
                      {showProblemInput ? "Hide Problem Context" : "Add Problem Context (LeetCode / Codeforces)"}
                    </span>
                    <span className="text-[10px] text-slate-500">{showProblemInput ? "▲" : "▼"}</span>
                  </button>
                  
                  {showProblemInput && (
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="Paste the problem description or testcase requirements here..."
                      className="w-full h-24 mt-2.5 bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-600 font-mono"
                    />
                  )}
                </div>

                {/* AI Action Buttons Grid (Explain, Hint, Debug, Complexity Analysis) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <Button
                    variant="secondary"
                    className="text-xs py-2 px-1 bg-blue-900/20 text-blue-300 border-blue-900/40 hover:bg-blue-900/40 gap-1"
                    onClick={() => handleAiAction('explain_problem')}
                    isLoading={loadingAction === 'explain_problem'}
                  >
                    <FileQuestion className="w-3.5 h-3.5 shrink-0" /> Explain
                  </Button>

                  <Button
                    variant="secondary"
                    className="text-xs py-2 px-1 bg-yellow-900/20 text-yellow-300 border-yellow-900/40 hover:bg-yellow-900/40 gap-1"
                    onClick={() => handleAiAction('hint')}
                    isLoading={loadingAction === 'hint'}
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Hint
                  </Button>

                  <Button
                    variant="secondary"
                    className="text-xs py-2 px-1 bg-red-900/20 text-red-300 border-red-900/40 hover:bg-red-900/40 gap-1"
                    onClick={() => handleAiAction('debug')}
                    isLoading={loadingAction === 'debug'}
                  >
                    <Bug className="w-3.5 h-3.5 shrink-0" /> Debug
                  </Button>

                  <Button
                    variant="secondary"
                    className="text-xs py-2 px-1 bg-purple-900/20 text-purple-300 border-purple-900/40 hover:bg-purple-900/40 gap-1"
                    onClick={() => handleAiAction('complexity')}
                    isLoading={loadingAction === 'complexity'}
                  >
                    <Gauge className="w-3.5 h-3.5 shrink-0" /> Big-O
                  </Button>
                </div>

                {/* AI Response Display */}
                <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-y-auto">
                  {aiResponse ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm text-slate-200 selection:bg-purple-500/30">
                      {aiResponse}
                    </div>
                  ) : (
                    <div className="text-slate-600 text-center mt-8 italic text-xs">
                      "Select an AI action above to get algorithmic explanations, progressive hints, code debugging, or Big-O complexity breakdown!" <br />
                      <span className="font-semibold text-slate-500">— AlgoSaathi AI Tutor</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;