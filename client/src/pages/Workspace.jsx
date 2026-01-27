import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { Play, Terminal, ChevronDown, Bug, Lightbulb, FileQuestion, Bot } from 'lucide-react';
import { runCode } from '../services/runService';
import { askAi } from '../services/aiService';
import { useLocation } from 'react-router-dom';

const LANGUAGES = {
  cpp: { id: 'cpp', label: 'C++ (GCC)', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello AlgoSaathi!";\n    return 0;\n}' },
  python: { id: 'python', label: 'Python 3', defaultCode: 'print("Hello AlgoSaathi!")' },
  java: { id: 'java', label: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello AlgoSaathi!");\n    }\n}' },
  javascript: { id: 'javascript', label: 'Javascript', defaultCode: 'console.log("Hello AlgoSaathi!");' },
  c: { id: 'c', label: 'C (GCC)', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello AlgoSaathi!");\n    return 0;\n}' }
};

const Workspace = () => {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('output');
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(LANGUAGES['cpp'].defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const [loadingAction, setLoadingAction] = useState(null); 
  
  const [problemStatement, setProblemStatement] = useState(''); 
  const [showProblemInput, setShowProblemInput] = useState(false);

  useEffect(() => {
    // Check if we navigated here with state (from Profile history)
    if (location.state && location.state.code) {
      setCode(location.state.code);
      if (location.state.language) {
        setLanguage(location.state.language);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(LANGUAGES[newLang].defaultCode);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setOutput('Running code...');

    try {
      const data = await runCode(language, code);
      if (data.error) {
        setOutput(`Error:\n${data.error}`);
      } else {
        setOutput(data.output || "Program finished with no output.");
      }
    } catch (err) {
      setOutput(`Failed to run: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiAction = async (actionType) => {
    setActiveTab('chat'); 
    
    setLoadingAction(actionType); 
    setAiResponse("AlgoSaathi is thinking...");

    try {
      const reply = await askAi(code, language, actionType, problemStatement);
      setAiResponse(reply);
    } catch (err) {
      setAiResponse("Error: " + err.message);
    } finally {
      setLoadingAction(null); 
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      <Navbar isLoggedIn={true} />

      <div className="flex-1 flex flex-col md:flex-row pt-16 overflow-hidden">

        {/* LEFT PANEL: Editor */}
        <div className="h-1/2 md:h-full md:w-3/5 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          {/* ... Editor Toolbar & Editor ... (No changes here) */}
          <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="relative">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="appearance-none bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {Object.values(LANGUAGES).map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <Button
              variant="primary"
              onClick={handleRun}
              className="h-8 text-xs gap-2"
              isLoading={isRunning}
            >
              {!isRunning && <Play className="w-3 h-3 fill-current" />}
              Run Code
            </Button>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: 'JetBrains Mono, monospace',
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Output & AI */}
        <div className="h-1/2 md:h-full md:w-2/5 flex flex-col bg-slate-900">

          <div className="flex border-b border-slate-800 bg-slate-950">
            <button
              onClick={() => setActiveTab('output')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'output' ? 'border-blue-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Terminal className="w-4 h-4" /> Output
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'chat' ? 'border-blue-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Bot className="w-4 h-4" /> AI Tutor
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-slate-900 text-slate-300">
            {activeTab === 'output' ? (
              <div className="whitespace-pre-wrap">{output || "Run code to see output"}</div>
            ) : (
              <div className="flex flex-col h-full">

                {/* Problem Statement Input */}
                <div className="mb-4 bg-slate-950 rounded-lg border border-slate-800 p-2">
                  <button 
                    onClick={() => setShowProblemInput(!showProblemInput)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white w-full transition"
                  >
                    <FileQuestion className="w-4 h-4" /> 
                    {showProblemInput ? "Hide Problem Context" : "Paste Problem Statement"}
                  </button>
                  
                  {showProblemInput && (
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="Paste the problem description here (e.g. from LeetCode)..."
                      className="w-full h-24 mt-2 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-600"
                    />
                  )}
                </div>

                {/* AI Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                   <Button
                    variant="secondary"
                    className="text-[18px] px-1 bg-blue-900/20 text-blue-400 border-blue-900/50 hover:bg-blue-900/40"
                    onClick={() => handleAiAction('explain_problem')}
                    isLoading={loadingAction === 'explain_problem'}
                  >
                    <FileQuestion className="w-5 h-5 mr-1" /> Explain
                  </Button>

                  <Button
                    variant="secondary"
                    className="text-[18px] px-1 bg-yellow-900/20 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/40"
                    onClick={() => handleAiAction('hint')}
                    isLoading={loadingAction === 'hint'}
                  >
                    <Lightbulb className="w-5 h-5 mr-1" /> Hint
                  </Button>

                  <Button
                    variant="secondary"
                    className="text-[18px] px-1 bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40"
                    onClick={() => handleAiAction('debug')}
                    isLoading={loadingAction === 'debug'}
                  >
                    <Bug className="w-5 h-5 mr-1" /> Debug
                  </Button>
                </div>

                {/* AI Response Box */}
                <div className="flex-1 bg-slate-950 rounded-lg p-4 border border-slate-800 overflow-y-auto">
                  {aiResponse ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {aiResponse}
                    </div>
                  ) : (
                    <div className="text-slate-600 text-center mt-10 italic text-xs">
                      "Paste a problem above and ask me to explain it!" <br /> - AlgoSaathi
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