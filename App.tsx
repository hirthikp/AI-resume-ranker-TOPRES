import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
// Enable dev mock for Gemini locally so example prompts work without API keys
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__MOCK_GEMINI = true;
}
// Using HashRouter instead of BrowserRouter to ensure stability in sandboxed/static hosting environments
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { DEFAULT_JD } from "./constants.tsx";
import {
  User,
  UserRole,
  Resume,
  JobDescription,
  SimilarityAnalysis,
} from "./types.ts";
import { storage } from "./services/storage.ts";
import {
  Card,
  Button,
  ProgressBar,
  Badge,
  LoadingSpinner,
  ErrorBanner,
  RankingChart,
  RankingTable,
  CandidateCharts,
  InterviewKit,
  PlagiarismConflictZone,
  SimilarityThresholdSlider,
} from "./components/UI.tsx";
import { gemini } from "./services/geminiService.ts";
import {
  LogOut,
  UserCircle,
  Upload,
  Trash2,
  LayoutGrid,
  List,
  Zap,
  BrainCircuit,
  Mail,
  Sparkles,
  Plus,
  Eye,
  X,
  Download,
  FileText,
  Star,
  Target,
  ZapIcon,
  TrendingDown,
  BarChart3,
  Table as TableIcon,
  Mic,
  ShieldAlert,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Code,
  Rocket,
  BookOpen,
  Layers,
  CheckCircle2,
  MessageSquare,
  Send,
  Cpu,
  Terminal,
  Play,
  Search,
} from "lucide-react";

/**
 * NEURAL ASSISTANT COMPONENT
 * Implements a command-parsing chatbot for Recruiters.
 */
const NeuralAssistant: React.FC<{
  onAction: (action: string, params: any) => void;
}> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: any }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    params: any;
  } | null>(null);
  const [pendingNameInput, setPendingNameInput] = useState("");

  const examples = [
    { label: "Shortlist Top 3", text: "Shortlist top 3", autoSend: true },
    { label: "Summarize", text: "Summarize candidate ", autoSend: false },
    { label: "Interview Qs", text: "Generate questions for ", autoSend: false },
    {
      label: "Draft Invite",
      text: "Generate invite email for ",
      autoSend: false,
    },
    { label: "Analytics", text: "Analytics summary", autoSend: true },
  ];

  const fillExample = async (ex: {
    label: string;
    text: string;
    autoSend?: boolean;
  }) => {
    setMessage(ex.text);
    // ensure input is visible when an example is chosen
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (ex.autoSend) {
      // give React a tick to update state then call send with override
      await new Promise((r) => setTimeout(r, 50));
      await handleSend(ex.text);
    }
  };

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleSend = async (overrideText?: string) => {
    const payload = (overrideText ?? message) || "";
    if (!payload.trim() || isTyping) return;
    const userMsg = payload;
    // if overrideText used, clear message only if it matches
    if (!overrideText) setMessage("");
    setHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const result = await gemini.parseRecruiterCommand(userMsg);
      // If action requires a name but none was extracted, open a modal to ask the user
      if (
        result?.action === "generate_email" &&
        (!result.params ||
          !result.params.name ||
          result.params.name.trim() === "")
      ) {
        setPendingAction({
          action: "generate_email",
          params: result.params || {},
        });
        setPendingNameInput("");
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: {
              action: "request_name",
              params: {
                message:
                  "Please enter the full candidate name to draft the email.",
              },
            },
          },
        ]);
        setIsTyping(false);
        return;
      }

      setHistory((prev) => [...prev, { role: "assistant", content: result }]);

      // Execute the action in the main dashboard
      if (result.action && result.action !== "none") {
        onAction(result.action, result.params);
      }
    } catch (err: any) {
      console.error(err);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: {
            action: "error",
            params: { message: err?.message || "Neural Link Interrupted" },
          },
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmPending = async () => {
    if (!pendingAction) return;
    const params = { ...(pendingAction.params || {}), name: pendingNameInput };
    // add assistant confirmation to history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: { action: "confirmed", params } },
    ]);
    // execute the pending action
    onAction(pendingAction.action, params);
    setPendingAction(null);
    setPendingNameInput("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-indigo-600 rounded-[32px] shadow-2xl shadow-indigo-300 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>
        <Zap className="w-10 h-10 group-hover:rotate-12 transition-transform" />
      </button>

      <div
        className={`fixed inset-y-0 right-0 w-[450px] bg-white/95 backdrop-blur-2xl shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.15)] border-l border-white/20 transition-transform duration-700 ease-out z-[100] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tighter">
                Neural Assistant
              </h3>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                Active Matrix Node
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-10 selection:bg-indigo-100 bg-gray-50/20"
        >
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 opacity-40">
              <Terminal className="w-16 h-16 text-gray-300" />
              <p className="text-sm font-bold text-gray-400 max-w-[200px]">
                Send a command like "Filter for React skills" or "Shortlist top
                3".
              </p>
            </div>
          )}
          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-fade-in`}
            >
              {msg.role === "user" ? (
                <div className="bg-indigo-600 p-6 rounded-[28px] rounded-br-none text-sm font-bold text-white max-w-[85%] shadow-lg shadow-indigo-100">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        msg.content.action === "error" ? "danger" : "info"
                      }
                    >
                      {msg.content.action === "error"
                        ? "System Fault"
                        : "Execution Plan"}
                    </Badge>
                  </div>
                  <div
                    className={`bg-white border p-6 rounded-[32px] rounded-bl-none shadow-xl w-full ${msg.content.action === "error" ? "border-rose-100 shadow-rose-50" : "border-indigo-100 shadow-indigo-50/50"}`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.content.action === "error" ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        {msg.content.action === "error" ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest ${msg.content.action === "error" ? "text-rose-500" : "text-indigo-600"}`}
                      >
                        {msg.content.action.replace("_", " ")}
                      </span>
                    </div>
                    {msg.content.params &&
                      Object.keys(msg.content.params).length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-2xl overflow-x-auto border border-gray-100">
                          <pre className="text-[10px] font-mono text-gray-500">
                            {JSON.stringify(msg.content.params, null, 2)}
                          </pre>
                        </div>
                      )}
                    {msg.content.action !== "none" &&
                      msg.content.action !== "error" && (
                        <p className="mt-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" /> Command
                          Synchronized
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-300">
                <Cpu className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                Processing Neural Buffer...
              </p>
            </div>
          )}
        </div>

        <div className="p-10 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Try these prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => fillExample(ex)}
                  className="text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-full hover:bg-indigo-50 text-gray-600 transition flex items-center gap-2"
                >
                  <span className="font-black text-[10px]">{ex.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative group">
            <input
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Inject command node..."
              className="w-full h-18 bg-gray-50 border border-gray-100 rounded-[32px] pl-8 pr-20 text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
            />
            <button
              onClick={handleSend}
              className="absolute right-3 top-3 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        {pendingAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl">
              <h4 className="text-lg font-bold mb-3">Provide candidate name</h4>
              <p className="text-sm text-gray-600 mb-4">
                Enter the full candidate name to proceed with drafting the
                email.
              </p>
              <input
                autoFocus
                value={pendingNameInput}
                onChange={(e) => setPendingNameInput(e.target.value)}
                placeholder="e.g. Emily Johnson"
                className="w-full border border-gray-200 rounded-md px-4 py-3 mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setPendingAction(null);
                    setPendingNameInput("");
                  }}
                  className="px-4 py-2 rounded-md bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPending}
                  disabled={!pendingNameInput.trim()}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * GLOBAL PROCESSING OVERLAY
 */
const ProcessingOverlay: React.FC<{ isOpen: boolean; label: string }> = ({
  isOpen,
  label,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white p-14 rounded-[56px] shadow-2xl border border-gray-100 flex flex-col items-center space-y-8 max-w-sm text-center transform scale-110">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-300 rounded-full blur-3xl animate-pulse opacity-40"></div>
          <div className="relative w-24 h-24 bg-indigo-600 rounded-[32px] shadow-2xl flex items-center justify-center transform rotate-12 transition-transform animate-bounce">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
            Scanning.. :-)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
            {label}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * RESUME PREVIEW MODAL
 */
const ResumePreviewModal: React.FC<{
  resume: Resume | null;
  onClose: () => void;
  onUpdateAnalysis: (
    id: string,
    questions: { technical: string[]; behavioral: string[] },
  ) => void;
  jd: JobDescription;
  activeTab: "insights" | "interview";
  setActiveTab: (tab: "insights" | "interview") => void;
}> = ({ resume, onClose, onUpdateAnalysis, jd, activeTab, setActiveTab }) => {
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  if (!resume) return null;

  const handleDownload = () => {
    if (!resume.fileData) return;
    const link = document.createElement("a");
    link.href = resume.fileData;
    link.download = resume.fileName || `${resume.candidateName}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const questions = await gemini.generateInterviewQuestions(
        resume.content,
        jd.content,
      );
      onUpdateAnalysis(resume.id, questions);
    } catch (err) {
      console.error("Critical Failure: Interview synthesis interrupted.", err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-indigo-50 w-full max-w-4xl max-h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-indigo-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-100">
          <div className="flex items-center gap-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                {resume.candidateName}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                  Node Metadata Synchronized
                </p>
              </div>
            </div>
            <div className="flex bg-gray-100 p-2 rounded-[28px] ml-12 shadow-inner">
              <button
                onClick={() => setActiveTab("insights")}
                className={`px-8 py-3 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === "insights" ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
              >
                Neural Insights
              </button>
              <button
                onClick={() => setActiveTab("interview")}
                className={`px-8 py-3 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === "interview" ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
              >
                Interview Matrix
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Button
              onClick={handleDownload}
              variant="secondary"
              className="px-10 h-16 rounded-[28px] shadow-lg"
            >
              <Download className="w-5 h-5" /> Download PDF
            </Button>
            <button
              onClick={onClose}
              className="w-16 h-16 flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-xl rounded-full transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/20">
          {activeTab === "insights" ? (
            <div className="space-y-16 animate-fade-in max-w-6xl mx-auto">
              {resume.analysis ? (
                <>
                  <div className="bg-indigo-600 p-12 rounded-[56px] shadow-2xl shadow-indigo-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <BrainCircuit className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                        <Target className="w-4 h-4" /> Semantic Executive
                        Summary
                      </h4>
                      <p className="text-xl font-black text-white leading-tight tracking-tight max-w-4xl italic">
                        "{resume.analysis.summary}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <CandidateCharts
                      // Use ATS score for pie: matched vs not-matched according to overall ATS index
                      matched={resume.analysis.atsScore}
                      missing={Math.max(0, 100 - resume.analysis.atsScore)}
                      breakdownScores={
                        resume.analysis.breakdown || {
                          skills: resume.analysis.skillScore,
                          experience: resume.analysis.experienceScore,
                          projects: 0,
                          education: 0,
                          clarity: 0,
                        }
                      }
                    />
                    {/* Selected vs Not Selected Parameters (15-parameter checklist) */}
                    {resume.analysis.parameterScores && (
                      <div className="mt-8 bg-white p-8 rounded-[24px] shadow-md border border-gray-100 space-y-6">
                        <div>
                          <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-2">
                            ATS Score Reasoning
                          </h4>
                          <p className="text-sm text-gray-600 font-medium">
                            ATS Score is calculated as a weighted sum of 15
                            parameters. Items with a check mark are strong
                            matches; items without a check mark need
                            improvement.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h5 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">
                              Selected (✓)
                            </h5>
                            <ul className="space-y-3">
                              {resume.analysis.parameterScores
                                .filter((p) => p.status === "selected")
                                .map((p, idx) => (
                                  <li
                                    key={`selected-${idx}`}
                                    className="text-sm text-emerald-700 font-medium"
                                  >
                                    ✓ {p.name}: {p.score.toFixed(0)}% (weight{" "}
                                    {(p.weight * 100).toFixed(0)}%)
                                  </li>
                                ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">
                              Not Selected (✗)
                            </h5>
                            <ul className="space-y-3">
                              {resume.analysis.parameterScores
                                .filter((p) => p.status === "not_selected")
                                .map((p, idx) => (
                                  <li
                                    key={`not-selected-${idx}`}
                                    className="text-sm text-rose-700 font-medium"
                                  >
                                    ✗ {p.name}: {p.score.toFixed(0)}% (weight{" "}
                                    {(p.weight * 100).toFixed(0)}%)
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <ProgressBar
                      value={resume.analysis.atsScore}
                      label="Global ATS Index"
                    />
                    <ProgressBar
                      value={resume.analysis.roleFit}
                      label="Persona Compatibility"
                    />
                    <ProgressBar
                      value={resume.analysis.experienceScore}
                      label="Historical Depth"
                    />
                    <ProgressBar
                      value={resume.analysis.skillScore}
                      label="Competency Density"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6" /> Optimized Neural
                        Pros
                      </h4>
                      <ul className="space-y-5">
                        {resume.analysis.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-5 p-7 bg-emerald-50/50 rounded-[36px] border border-emerald-100/50 transition-colors"
                          >
                            <div className="w-3 h-3 mt-1.5 bg-emerald-500 rounded-full shrink-0 shadow-lg shadow-emerald-200" />
                            <span className="text-base font-bold text-emerald-900 leading-relaxed">
                              {pro}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-sm font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-4">
                        <AlertTriangle className="w-6 h-6" /> Divergence
                        Observations
                      </h4>
                      <ul className="space-y-5">
                        {resume.analysis.gaps.map((gap, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-5 p-7 bg-rose-50/50 rounded-[36px] border border-rose-100/50 transition-colors"
                          >
                            <div className="w-3 h-3 mt-1.5 bg-rose-500 rounded-full shrink-0 shadow-lg shadow-rose-200" />
                            <span className="text-base font-bold text-rose-900 leading-relaxed">
                              {gap}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 space-y-10 text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-[48px] flex items-center justify-center shadow-inner">
                    <BrainCircuit className="w-16 h-16 text-gray-200 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-3xl font-black text-gray-900 tracking-tighter">
                      Node Synchronicity Required
                    </h4>
                    <p className="text-base text-gray-400 font-medium max-w-md mx-auto">
                      This candidate node has not been processed through the
                      multi-stage semantic re-ranking pipeline.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
              {!resume.analysis?.interviewQuestions ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-12 text-center bg-white border-4 border-dashed border-gray-100 rounded-[72px] shadow-2xl shadow-gray-100/50">
                  <div className="w-28 h-28 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-100 rotate-3">
                    <Mic className="w-14 h-14" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                      Synthesize Behavioral Kit
                    </h3>
                    <p className="text-lg text-gray-400 font-medium max-w-xl mx-auto leading-relaxed">
                      Our engine will generate 10 high-fidelity technical and
                      behavioral questions specifically tuned to this
                      candidate's historical divergence.
                    </p>
                  </div>
                  <Button
                    onClick={generateQuestions}
                    isLoading={isGeneratingQuestions}
                    className="px-16 h-20 text-xs shadow-2xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 rounded-[32px] font-black uppercase tracking-widest"
                  >
                    Initialize Matrix Synthesis
                  </Button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <InterviewKit
                    questions={resume.analysis.interviewQuestions}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-10 bg-white border-t border-gray-100 flex justify-between items-center px-20">
          <div className="flex items-center gap-8">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 border-4 border-white"></div>
              <div className="w-10 h-10 rounded-full bg-amber-500 border-4 border-white"></div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-4 border-white"></div>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
              Audit Trace: {resume.id.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-950 transition-colors border-b-2 border-transparent hover:border-indigo-600 pb-1"
          >
            Terminate Secure Link
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * HR GATEWAY COMPONENT
 */
const HRGateway: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jd, setJD] = useState<JobDescription>(DEFAULT_JD);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [batchRanking, setBatchRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "interview">(
    "insights",
  );
  const [viewMode, setViewMode] = useState<"list" | "ranking">("list");
  const [filterQuery, setFilterQuery] = useState<{
    skill?: string;
    minExp?: number;
  } | null>(null);

  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [similarityReports, setSimilarityReports] = useState<
    SimilarityAnalysis[]
  >([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(70);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    processed: number;
    current?: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [duplicateResumeIds, setDuplicateResumeIds] = useState<string[]>([]);
  const [autoScanInProgress, setAutoScanInProgress] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const navigate = useNavigate();

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [loadedResumes, loadedJD] = await Promise.all([
          storage.getAllResumes(), // Recruiters see all resumes
          storage.getJD(),
        ]);
        setResumes(loadedResumes);
        if (loadedJD.title) setJD(loadedJD);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data from database');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Auto-save resumes to Supabase whenever they change (debounced)
  useEffect(() => {
    if (isLoadingData) return; // Don't save during initial load
    
    const saveTimer = setTimeout(async () => {
      try {
        await storage.saveResumes(resumes);
      } catch (err: any) {
        console.error('Failed to save resumes:', err);
        // Don't show error to user for background saves
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(saveTimer);
  }, [resumes, isLoadingData]);

  // Auto-save JD to Supabase whenever it changes (debounced)
  useEffect(() => {
    if (isLoadingData) return;
    
    const saveTimer = setTimeout(async () => {
      try {
        await storage.saveJD(jd);
      } catch (err) {
        console.error('Failed to save JD:', err);
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [jd, isLoadingData]);

  const currentPreviewResume = useMemo(() => {
    return resumes.find((r) => r.id === previewResumeId) || null;
  }, [resumes, previewResumeId]);

  const toggleResumeSelection = useCallback((id: string) => {
    setSelectedResumeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  /**
   * COMMAND EXECUTOR
   * Responds to the Neural Assistant's parsed actions.
   */
  const executeAssistantAction = useCallback(
    async (action: string, params: any) => {
      switch (action) {
        case "filter_candidates":
          setFilterQuery({
            skill: params.skill,
            minExp: params.min_experience,
          });
          setViewMode("list");
          break;
        case "summarize_candidate":
          const target = resumes.find((r) =>
            r.candidateName.toLowerCase().includes(params.name?.toLowerCase()),
          );
          if (target) setPreviewResumeId(target.id);
          break;
        case "generate_questions":
          // find resume by name and request interview questions
          try {
            const t = resumes.find((r) =>
              r.candidateName
                .toLowerCase()
                .includes(params.name?.toLowerCase()),
            );
            if (!t) break;
            const q = await gemini.generateInterviewQuestions(
              t.content,
              jd.content,
            );
            setResumes((prev) => {
              const updated = prev.map((r) =>
                r.id === t.id
                  ? {
                      ...r,
                      analysis: {
                        ...(r.analysis || {}),
                        interviewQuestions: q,
                      },
                    }
                  : r,
              );
              storage.saveResumes(updated);
              return updated;
            });
            setPreviewResumeId(t.id);
            setActiveTab("interview");
          } catch (e) {
            console.error("Failed generating questions", e);
          }
          break;
        case "generate_email":
          try {
            let t2 = resumes.find((r) =>
              r.candidateName
                .toLowerCase()
                .includes(params.name?.toLowerCase()),
            );
            // create a placeholder resume if no match found so drafting still works
            if (!t2 && params.name) {
              const newResume: Resume = {
                id: Math.random().toString(36).substr(2, 9),
                candidateId: Math.random().toString(36).substr(2, 9),
                candidateName: params.name,
                content: `Placeholder resume for ${params.name}`,
                uploadDate: new Date().toISOString(),
                status: "Pending",
              };
              setResumes((prev) => {
                const updated = [...prev, newResume];
                storage.saveResumes(updated);
                return updated;
              });
              t2 = newResume;
            }
            if (!t2) break;
            const draft = await gemini.draftGmail(t2, jd);
            setEmailDraft({ id: t2.id, content: draft });
          } catch (e) {
            console.error("Failed drafting email", e);
          }
          break;
        case "shortlist_top":
          const count = params.count || 3;
          const topIds = [...resumes]
            .sort(
              (a, b) =>
                (b.analysis?.atsScore || 0) - (a.analysis?.atsScore || 0),
            )
            .slice(0, count)
            .map((r) => r.id);
          setSelectedResumeIds(topIds);
          setViewMode("ranking");
          break;
        case "analytics_summary":
          setViewMode("ranking");
          break;
        default:
          console.log("Unmapped assistant action:", action);
      }
    },
    [resumes, jd],
  );

  const runSimilarityAudit = async () => {
    if (selectedResumeIds.length < 2) {
      setError(
        "Audit cluster threshold not met: Select 2+ nodes for similarity synchronization.",
      );
      return;
    }
    setIsAuditing(true);
    setError(null);
    try {
      const candidatesToAudit = resumes.filter((r) =>
        selectedResumeIds.includes(r.id),
      );
      const result = await gemini.compareResumes(
        candidatesToAudit.map((r) => ({
          name: r.candidateName,
          content: r.content,
          analysis: r.analysis,
        })),
      );
      const enrichedResult = {
        ...result,
        candidatesInvolved: candidatesToAudit.map((c) => c.candidateName),
      };
      setSimilarityReports((prev) => [enrichedResult, ...prev]);
      setSelectedResumeIds([]);
    } catch (err: any) {
      setError(`Critical Plagiarism Engine Failure: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const sequesteredReports = useMemo(() => {
    return similarityReports.filter(
      (report) => report.similarity_percentage >= similarityThreshold,
    );
  }, [similarityReports, similarityThreshold]);

  const handleShortlist = useCallback(
    (id: string, isCurrentEligible: boolean) => {
      setResumes((prev) => {
        const updated = prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: (isCurrentEligible ? "Pending" : "Eligible") as any,
              }
            : r,
        );
        storage.saveResumes(updated);
        return updated;
      });
    },
    [],
  );

  const startAnalysis = async (resume: Resume): Promise<Resume | null> => {
    setIsAnalyzing(resume.id);
    try {
      const analysis = await gemini.analyzeResume(resume.content, jd.content);
      const updated = { ...resume, analysis };
      setResumes((prev) => {
        const newList = prev.map((r) => (r.id === resume.id ? updated : r));
        storage.saveResumes(newList);
        return newList;
      });
      // Ensure uniqueness after each analysis
      setTimeout(() => ensureUniqueScores(), 100);
      return updated;
    } catch (err: any) {
      setError(`Node Audit error: ${err.message}`);
      return null;
    } finally {
      setIsAnalyzing(null);
    }
  };

  const rankAllResumes = async () => {
    if (resumes.length === 0) return;
    setBatchRanking(true);
    setError(null);
    for (const resume of resumes) {
      const result = await startAnalysis(resume);
      if (!result) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    // Ensure all scores are unique after batch analysis
    ensureUniqueScores();
    // Auto-scan for duplicates after ranking completes
    setTimeout(() => autoScanForDuplicates(), 500);
    setBatchRanking(false);
  };

  const autoScanForDuplicates = async () => {
    if (resumes.length < 2) return;
    
    setAutoScanInProgress(true);
    try {
      const duplicates = new Set<string>();
      
      // Compare each resume with all others (sampling approach for large sets)
      const step = resumes.length > 50 ? 2 : 1;
      for (let i = 0; i < resumes.length; i += step) {
        for (let j = i + 1; j < resumes.length; j += step) {
          try {
            const result = await gemini.compareResumes([
              {
                name: resumes[i].candidateName,
                content: resumes[i].content,
                analysis: resumes[i].analysis,
              },
              {
                name: resumes[j].candidateName,
                content: resumes[j].content,
                analysis: resumes[j].analysis,
              },
            ]);
            
            // Mark as duplicate if similarity is above 75%
            if (result.similarity_percentage >= 75) {
              duplicates.add(resumes[i].id);
              duplicates.add(resumes[j].id);
            }
          } catch (err) {
            console.warn('Error comparing resumes:', err);
          }
        }
        // Yield to prevent blocking UI
        await new Promise((r) => setTimeout(r, 50));
      }
      
      setDuplicateResumeIds(Array.from(duplicates));
    } catch (err) {
      console.error('Auto-scan error:', err);
    } finally {
      setAutoScanInProgress(false);
    }
  };

  // Ensure all ATS scores are unique by adding micro-adjustments to duplicates
  const ensureUniqueScores = () => {
    setResumes((prev) => {
      const scoreCounts = new Map<number, number>();
      const updated = prev.map((resume) => {
        if (!resume.analysis) return resume;
        
        const currentScore = resume.analysis.atsScore;
        const count = scoreCounts.get(currentScore) || 0;
        scoreCounts.set(currentScore, count + 1);
        
        // If duplicate found, add a tiny increment
        if (count > 0) {
          const adjustment = count * 0.001;
          return {
            ...resume,
            analysis: {
              ...resume.analysis,
              atsScore: Math.round((currentScore + adjustment) * 1000) / 1000,
            },
          };
        }
        return resume;
      });
      
      // Verify uniqueness
      const scores = updated
        .filter(r => r.analysis)
        .map(r => r.analysis!.atsScore);
      const uniqueScores = new Set(scores);
      
      if (scores.length !== uniqueScores.size) {
        console.warn('Some duplicate scores remain after adjustment');
      }
      
      storage.saveResumes(updated);
      return updated;
    });
  };

  const updateResumeQuestions = (
    id: string,
    questions: { technical: string[]; behavioral: string[] },
  ) => {
    setResumes((prev) => {
      const newList = prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            analysis: r.analysis
              ? { ...r.analysis, interviewQuestions: questions }
              : undefined,
          };
        }
        return r;
      });
      storage.saveResumes(newList);
      return newList;
    });
  };

  // Optimized file upload: chunked + yielding to prevent UI freeze on large batches
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Warning for very large uploads
    if (files.length > 100) {
      const proceed = window.confirm(
        `You're uploading ${files.length} files. This may take a while and could exceed storage limits. Continue?`
      );
      if (!proceed) {
        (e.target as HTMLInputElement).value = "";
        return;
      }
    }

    const readText = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string) || "");
        r.onerror = reject;
        r.readAsText(file);
      });

    const readDataURL = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string) || "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });

    try {
      const fileArray = Array.from(files) as File[];
      const MAX_INLINE_PREVIEWS = 10;
      const MAX_PREVIEW_SIZE = 2 * 1024 * 1024; // 2MB
      const BATCH_SIZE = 1; // Ultra-conservative batch size for stability

      setIsUploading(true);
      setUploadProgress({ total: fileArray.length, processed: 0 });

      for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        const batch = fileArray.slice(i, i + BATCH_SIZE);
        const batchReads: Resume[] = [];

        for (let j = 0; j < batch.length; j += 1) {
          const file = batch[j];
          try {
            const content = await readText(file);
            const absoluteIndex = i + j;
            const shouldIncludePreview =
              absoluteIndex < MAX_INLINE_PREVIEWS &&
              file.size <= MAX_PREVIEW_SIZE;
            const fileData = shouldIncludePreview
              ? await readDataURL(file)
              : "";

            batchReads.push({
              id: Math.random().toString(36).substr(2, 9),
              candidateId: "guest",
              candidateName: file.name.replace(/\.[^/.]+$/, ""),
              content,
              fileData: shouldIncludePreview ? fileData : undefined,
              fileName: file.name,
              uploadDate: new Date().toISOString(),
              status: "Pending",
            } as Resume);

            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: Math.min(prev.total, prev.processed + 1),
                    current: file.name,
                  }
                : prev,
            );
          } catch (err) {
            console.error("Failed reading file", file.name, err);
          }
        }

        if (batchReads.length > 0) {
          setResumes((prev) => {
            const updated = [...batchReads, ...prev];
            try {
              storage.saveResumes(updated);
            } catch (err: any) {
              setError(err.message || 'Failed to save resumes to storage');
              return prev; // Don't update state if storage fails
            }
            return updated;
          });
        }

        // Longer delay between batches for stability with large uploads
        await new Promise((r) => setTimeout(r, 100));
      }
      
      // Wait longer after all batches complete to ensure state is fully settled
      await new Promise((r) => setTimeout(r, 200));
      
      // Reset pagination after upload
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed reading uploaded files", err);
      setError("Failed to read uploaded files. Check console for details.");
    } finally {
      // Add delay before clearing upload state to ensure final render happens
      await new Promise((r) => setTimeout(r, 100));
      setIsUploading(false);
      setUploadProgress(null);
      // clear input value so same file can be re-uploaded if needed
      (e.target as HTMLInputElement).value = "";
    }
  };

  const processedResumes = useMemo(() => {
    let list = [...resumes];
    if (filterQuery) {
      if (filterQuery.skill) {
        list = list.filter((r) =>
          r.content.toLowerCase().includes(filterQuery.skill!.toLowerCase()),
        );
      }
      if (filterQuery.minExp) {
        list = list.filter(
          (r) => (r.analysis?.experienceScore || 0) >= filterQuery.minExp!,
        );
      }
    }
    return list.sort(
      (a, b) => (b.analysis?.atsScore || 0) - (a.analysis?.atsScore || 0),
    );
  }, [resumes, filterQuery]);

  const totalPages = Math.ceil(processedResumes.length / ITEMS_PER_PAGE);

  const paginatedResumes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return processedResumes.slice(startIndex, endIndex);
  }, [processedResumes, currentPage, ITEMS_PER_PAGE]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterQuery, resumes.length]);

  // Log state for debugging blank screen issues
  useEffect(() => {
    if (resumes.length > 0) {
      console.log(`[Resume State] Loaded ${resumes.length} resumes, showing page ${currentPage}/${totalPages}, ${paginatedResumes.length} items on current page`);
    }
  }, [resumes.length, currentPage, totalPages, paginatedResumes.length]);

  // Auto-scan when resumes are added or updated
  useEffect(() => {
    if (resumes.length >= 2 && !autoScanInProgress) {
      // Debounce auto-scan to avoid excessive scanning
      const timer = setTimeout(() => {
        autoScanForDuplicates();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resumes.length, autoScanInProgress]);

  const chartData = useMemo(() => {
    return processedResumes
      .filter((r) => r.analysis)
      .slice(0, 8)
      .map((r) => ({
        name: r.candidateName,
        score: r.analysis?.atsScore || 0,
      }));
  }, [processedResumes]);

  return (
    <div className="min-h-screen bg-[#FDFDFE] pb-32 p-12 font-sans overflow-x-hidden selection:bg-indigo-100 text-[11px]">
      <ProcessingOverlay
        isOpen={batchRanking || isAuditing}
        label={
          isAuditing
            ? "Auditing Similarity Cluster Clusters..."
            : "Syncing Multi-Stage Neural Pipeline..."
        }
      />

      <ResumePreviewModal
        resume={currentPreviewResume}
        onClose={() => setPreviewResumeId(null)}
        onUpdateAnalysis={updateResumeQuestions}
        jd={jd}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <NeuralAssistant onAction={executeAssistantAction} />

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-24">
        <div className="flex items-center gap-10">
          <div
            onClick={() => navigate("/")}
            role="button"
            aria-label="Go home"
            className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl hover:rotate-12 transition-transform duration-500 cursor-pointer"
          >
            <Zap className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              TopRes AI
            </h1>
            <p className="text-[11px] text-indigo-600 font-black uppercase tracking-[0.5em] mt-2 ml-1">
              Advanced Neural Matrix
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {filterQuery && (
            <button
              onClick={() => setFilterQuery(null)}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-indigo-100 hover:bg-white transition-all"
            >
              Clear Filters
            </button>
          )}
          <Button
            variant="outline"
            className="h-16 border-gray-100 px-10 text-gray-400 font-black rounded-3xl hover:border-rose-200 hover:text-rose-600 shadow-sm"
            onClick={() => {
              storage.setCurrentUser(null);
              navigate("/");
            }}
          >
            <LogOut className="w-5 h-5" /> Terminate Session
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-16">
        <div className="col-span-12 lg:col-span-4 space-y-12">
          <Card className="rounded-[56px] p-12 bg-white border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border-t border-indigo-50/50">
            <h3 className="text-2xl font-black text-gray-900 mb-12 flex items-center gap-5">
              <LayoutGrid className="w-8 h-8 text-indigo-600" /> Active Schema
            </h3>
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Target Designation
                </label>
                <input
                  className="w-full bg-gray-50 rounded-[28px] px-8 py-5 font-bold text-sm outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                  placeholder="E.g. Senior Neural Engineer"
                  value={jd.title}
                  onChange={(e) => setJD({ ...jd, title: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Semantic Context (JD)
                </label>
                <textarea
                  className="w-full bg-gray-50 rounded-[32px] px-8 py-6 text-sm font-medium h-72 resize-none outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition-all shadow-inner leading-relaxed"
                  placeholder="Detailed Job Matrix Requirements..."
                  value={jd.content}
                  onChange={(e) => setJD({ ...jd, content: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-indigo-600 rounded-[56px] p-14 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
              <Upload className="w-48 h-48" />
            </div>
            <h4 className="text-3xl font-black mb-6 relative z-10">
              Ingest Nodes
            </h4>
            <p className="text-base text-indigo-100 font-medium mb-12 relative z-10 leading-relaxed max-w-[280px]">
              Inject PDF/TXT resumes into the neural cluster for re-ranking.
            </p>
            <div>
              <input
                type="file"
                multiple
                className="hidden"
                id="hr-up"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="hr-up"
                className="w-full py-6 bg-white text-indigo-600 rounded-[28px] flex items-center justify-center font-black uppercase tracking-[0.3em] text-[11px] cursor-pointer hover:brightness-110 active:scale-95 transition-all relative z-10 shadow-md border border-indigo-100"
              >
                Upload Resume
              </label>
            </div>
          </Card>

          {uploadProgress && (
            <Card className="rounded-[40px] p-8 bg-white border-none shadow-md">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Uploading resumes
              </p>
              <p className="text-sm font-bold text-gray-800 mt-2">
                {uploadProgress.processed}/{uploadProgress.total}
              </p>
              {uploadProgress.current && (
                <p className="text-[11px] text-gray-500 mt-1 truncate">
                  {uploadProgress.current}
                </p>
              )}
              <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.round(
                      (uploadProgress.processed / uploadProgress.total) * 100,
                    )}%`,
                  }}
                />
              </div>
              {isUploading && (
                <p className="text-[10px] text-gray-400 mt-2">
                  Processing batch uploads…
                </p>
              )}
            </Card>
          )}

          {chartData.length > 0 && (
            <Card className="rounded-[56px] p-12 bg-white border-none shadow-xl border-t border-indigo-50 space-y-10">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" /> Statistical
                Ranking
              </h4>
              <RankingChart data={chartData} />
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-16">
          {error && (
            <ErrorBanner message={error} onRetry={() => setError(null)} />
          )}

          {viewMode === "ranking" && similarityReports.length > 0 && (
            <div className="space-y-10 animate-fade-in border-l-4 border-amber-500 pl-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-4">
                    <ShieldAlert className="w-6 h-6" /> Latest Audit Report
                  </h3>
                  <Badge
                    variant={
                      similarityReports[0]?.similarity_percentage >=
                      similarityThreshold
                        ? "danger"
                        : "warning"
                    }
                  >
                    {(similarityReports[0]?.similarity_percentage || 0).toFixed(
                      2,
                    )}
                    % Match
                  </Badge>
                </div>
                <button
                  onClick={() => setSimilarityReports([])}
                  className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-amber-500 transition-colors"
                >
                  Dismiss Report
                </button>
              </div>
              {similarityReports.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-10 rounded-[48px] border-2 border-amber-200 space-y-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-black text-amber-900 tracking-tight">
                        Candidates:{" "}
                        {similarityReports[0]?.candidatesInvolved?.join(", ")}
                      </p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2">
                        Risk Level:{" "}
                        <span
                          className={`${
                            similarityReports[0]?.risk_level === "high"
                              ? "text-rose-600"
                              : similarityReports[0]?.risk_level === "medium"
                                ? "text-orange-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {similarityReports[0]?.risk_level?.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-amber-600">
                        {(
                          similarityReports[0]?.similarity_percentage || 0
                        ).toFixed(2)}
                        %
                      </div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2">
                        Similarity Score
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t-2 border-amber-200">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4">
                      Matching Tokens:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {similarityReports[0]?.reasons?.length ? (
                        similarityReports[0]?.reasons[0]
                          ?.split("Common tokens: ")?.[1]
                          ?.split(", ")
                          .map((token, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-white border-2 border-amber-400 text-amber-900 rounded-[20px] text-[11px] font-black shadow-md"
                            >
                              {token}
                            </span>
                          ))
                      ) : (
                        <p className="text-[10px] text-amber-600 italic">
                          No significant token overlap
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {sequesteredReports.length > 0 && viewMode === "ranking" && (
            <div className="space-y-10 animate-fade-in border-l-4 border-rose-500 pl-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-4">
                    <ShieldAlert className="w-6 h-6" /> Flagged Conflicts (Above{" "}
                    {similarityThreshold}%)
                  </h3>
                  <Badge variant="danger">
                    {sequesteredReports.length} Active Conflicts
                  </Badge>
                </div>
              </div>
              <div className="grid gap-10">
                {sequesteredReports.map((report, idx) => (
                  <PlagiarismConflictZone
                    key={idx}
                    score={report.similarity_percentage}
                    reasons={report.reasons}
                    candidates={report.candidatesInvolved || []}
                    threshold={similarityThreshold}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-6">
              {viewMode === "list" ? (
                <Sparkles className="w-12 h-12 text-indigo-600" />
              ) : (
                <TableIcon className="w-12 h-12 text-indigo-600" />
              )}
              AI Ranker
              {filterQuery && (
                <span className="text-lg font-bold text-indigo-400 uppercase tracking-widest ml-4">
                  (Filtered)
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
              {viewMode === "ranking" && (
                <SimilarityThresholdSlider
                  value={similarityThreshold}
                  onChange={setSimilarityThreshold}
                />
              )}
              <div className="flex bg-gray-100 p-2 rounded-[28px] shadow-inner">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-10 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Gallery
                </button>
                <button
                  onClick={() => setViewMode("ranking")}
                  className={`px-10 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "ranking" ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Rankings
                </button>
              </div>
              <Button
                onClick={rankAllResumes}
                disabled={resumes.length === 0 || batchRanking}
                className="h-16 px-12 rounded-[28px]"
              >
                Analyse All
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (resumes.length === 0) return;
                  const confirmed = window.confirm(
                    `Are you sure you want to delete all ${resumes.length} resume${resumes.length !== 1 ? 's' : ''}? This action cannot be undone.`
                  );
                  if (confirmed) {
                    setResumes([]);
                    storage.saveResumes([]);
                    setSelectedResumeIds([]);
                    setSimilarityReports([]);
                    setPreviewResumeId(null);
                    setEmailDraft(null);
                  }
                }}
                disabled={resumes.length === 0}
                className="h-16 px-12 rounded-[28px] border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" /> Clear All
              </Button>
            </div>
          </div>

          {viewMode === "ranking" ? (
            <div className="space-y-12 animate-fade-in">
              {selectedResumeIds.length >= 2 && (
                <div className="bg-indigo-50 p-10 rounded-[48px] border-2 border-dashed border-indigo-200 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in shadow-2xl shadow-indigo-100/30">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-xl rotate-6">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-indigo-950 tracking-tight">
                        {selectedResumeIds.length} Nodes for Sync
                      </p>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Plagiarism Sensitivity: {similarityThreshold}%
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="gold"
                    onClick={runSimilarityAudit}
                    className="px-14 h-16 rounded-[28px] shadow-2xl shadow-amber-200"
                  >
                    Run Similarity Audit
                  </Button>
                </div>
              )}
              <Card className="rounded-[56px] bg-white border-none shadow-2xl p-6">
                <RankingTable
                  resumes={processedResumes}
                  onShortlist={handleShortlist}
                  onPreview={(r) => setPreviewResumeId(r.id)}
                  selectedIds={selectedResumeIds}
                  onToggleSelect={toggleResumeSelection}
                  similarityThreshold={similarityThreshold}
                  duplicateIds={duplicateResumeIds}
                />
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {processedResumes.length > 0 && (
                <div className="flex items-center justify-between px-4">
                  <p className="text-sm font-bold text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, processedResumes.length)} of {processedResumes.length} candidate{processedResumes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div className="grid gap-12">
              {paginatedResumes.map((r) => (
                <Card
                  key={r.id}
                  onClick={() => setPreviewResumeId(r.id)}
                  className={`p-14 rounded-[72px] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 border-none bg-white shadow-2xl cursor-pointer relative group ${selectedResumeIds.includes(r.id) ? "ring-4 ring-indigo-500/20" : ""}`}
                >
                  <div className="absolute top-6 left-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                    <button
                      title="Toggle Audit Selection"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleResumeSelection(r.id);
                      }}
                      className={`w-14 h-14 rounded-[22px] transition-all shadow-lg flex items-center justify-center ${selectedResumeIds.includes(r.id) ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                    >
                      <Fingerprint className="w-6 h-6" />
                    </button>
                    <button
                      title="Neural Preview"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewResumeId(r.id);
                      }}
                      className="w-14 h-14 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[22px] shadow-lg flex items-center justify-center transition-all"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    <button
                      title="Terminate Node"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = resumes.filter(
                          (res) => res.id !== r.id,
                        );
                        setResumes(updated);
                        storage.saveResumes(updated);
                      }}
                      className="w-14 h-14 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-[22px] shadow-lg flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex flex-col xl:flex-row gap-16 xl:items-center xl:justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-300 font-black text-3xl border border-gray-100/50 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-200 transition-all duration-500">
                        {r.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                          {r.candidateName}
                        </h4>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {r.id.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">
                            {new Date(r.uploadDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          {duplicateResumeIds.includes(r.id) && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-orange-600" />
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">
                                Potential Duplicate
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6 min-w-[260px] justify-center pt-8 xl:pt-0 relative z-0 flex-shrink-0 xl:ml-auto items-end">
                      <Button
                        variant={r.analysis ? "secondary" : "primary"}
                        isLoading={isAnalyzing === r.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          startAnalysis(r);
                        }}
                        className="h-16 rounded-[28px] shadow-xl relative z-0"
                      >
                        {r.analysis ? "Re-Analyse" : "Audit Node"}
                      </Button>

                      <div className="grid grid-cols-2 gap-6 justify-center xl:justify-end items-center self-center xl:self-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShortlist(r.id, r.status === "Eligible");
                          }}
                          className={`h-16 w-16 rounded-[28px] flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${r.status === "Eligible" ? "bg-amber-500 text-white border-amber-400 shadow-amber-200" : "bg-white text-amber-200 border-gray-100 hover:text-amber-500"}`}
                        >
                          <Star
                            className={`w-7 h-7 ${r.status === "Eligible" ? "fill-current" : ""}`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = resumes.map((res) =>
                              res.id === r.id
                                ? { ...res, status: "Ineligible" as const }
                                : res,
                            );
                            setResumes(updated);
                            storage.saveResumes(updated);
                          }}
                          className={`h-16 w-16 rounded-[28px] flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${r.status === "Ineligible" ? "bg-rose-500 text-white border-rose-400 shadow-rose-200" : "bg-white text-rose-200 border-gray-100 hover:text-rose-500"}`}
                        >
                          <X className="w-7 h-7" />
                        </button>
                      </div>
                      {r.analysis && (
                        <Button
                          variant="outline"
                          className="h-16 rounded-[28px] border-indigo-100 text-indigo-600 hover:bg-indigo-50 self-end"
                          onClick={(e) => {
                            e.stopPropagation();
                            gemini
                              .draftGmail(r, jd, r.status)
                              .then((d) =>
                                setEmailDraft({ id: r.id, content: d }),
                              );
                          }}
                        >
                          Draft Mail
                        </Button>
                      )}
                    </div>
                  </div>

                  {emailDraft?.id === r.id && (
                    <div
                      className="mt-14 p-12 bg-indigo-50/50 rounded-[64px] border border-indigo-100 animate-fade-in shadow-inner"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-4">
                          <Mail className="w-5 h-5" /> Outreach Matrix Result
                        </h5>
                        <button
                          onClick={() => setEmailDraft(null)}
                          className="text-xs font-black text-indigo-300 hover:text-indigo-600 uppercase tracking-widest border-b border-transparent hover:border-indigo-600 pb-1 transition-all"
                        >
                          Close Draft
                        </button>
                      </div>
                      <textarea
                        className="w-full h-80 bg-white/80 backdrop-blur-sm p-10 rounded-[48px] text-base font-bold text-gray-800 leading-relaxed outline-none border border-white shadow-xl focus:shadow-indigo-100 focus:bg-white transition-all duration-500"
                        defaultValue={emailDraft.content}
                      />
                    </div>
                  )}
                </Card>
              ))}
              {paginatedResumes.length === 0 && processedResumes.length > 0 && (
                <div className="py-40 text-center space-y-8 animate-fade-in">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-40">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-xl font-black text-gray-400 tracking-tight">
                    No candidates match your current neural filter.
                  </p>
                </div>
              )}
              {processedResumes.length === 0 && (
                <div className="py-40 text-center space-y-8 animate-fade-in">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-40">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-xl font-black text-gray-400 tracking-tight">
                    No candidates in the system.
                  </p>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-12 px-8 rounded-[20px]"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="text-gray-400 px-2">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-12 h-12 rounded-[16px] font-bold transition-all ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-12 px-8 rounded-[20px]"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * CANDIDATE LAB COMPONENT
 */
const CandidateLab: React.FC = () => {
  const [currentUser] = useState<User | null>(storage.getCurrentUser());
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load resumes on mount
  useEffect(() => {
    const loadResumes = async () => {
      const allResumes = await storage.getResumes(); // Already filtered by current user
      setResumes(allResumes);
    };
    loadResumes();
  }, [currentUser?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !currentUser) return;

    // Warning for large uploads
    if (files.length > 100) {
      const proceed = window.confirm(
        `You're uploading ${files.length} files. This may take a while. Continue?`
      );
      if (!proceed) {
        (e.target as HTMLInputElement).value = "";
        return;
      }
    }

    const readText = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string) || "");
        r.onerror = reject;
        r.readAsText(file);
      });

    const readDataURL = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string) || "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });

    const fileArray = Array.from(files) as File[];
    const MAX_INLINE_PREVIEWS = 5;
    const MAX_PREVIEW_SIZE = 2 * 1024 * 1024; // 2MB
    const BATCH_SIZE = 1; // Ultra-conservative batch size for stability

    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
      const batch = fileArray.slice(i, i + BATCH_SIZE);
      const batchReads: Resume[] = [];

      for (let j = 0; j < batch.length; j += 1) {
        const file = batch[j];
        try {
          const content = await readText(file);
          const absoluteIndex = i + j;
          const shouldIncludePreview =
            absoluteIndex < MAX_INLINE_PREVIEWS &&
            file.size <= MAX_PREVIEW_SIZE;
          const fileData = shouldIncludePreview ? await readDataURL(file) : "";

          batchReads.push({
            id: Math.random().toString(36).substr(2, 9),
            candidateId: currentUser.id,
            candidateName: currentUser.username,
            content,
            fileData: shouldIncludePreview ? fileData : undefined,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            status: "Pending",
          } as Resume);
          setLastUploaded(file.name);
        } catch (err) {
          console.error("Failed reading file", file.name, err);
        }
      }

      if (batchReads.length > 0) {
        setResumes((prev) => {
          const updated = [...batchReads, ...prev];
          // Save to Supabase asynchronously (fire and forget)
          storage.saveResumes(updated).catch(err => {
            console.error('Failed to save resumes:', err);
          });
          return updated;
        });
      }

      // Longer delay between batches for stability with large uploads
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] pb-32 p-12 font-sans overflow-x-hidden flex flex-col items-center">
      <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-24 max-w-7xl">
        <div className="flex items-center gap-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl hover:rotate-12 transition-transform duration-500 cursor-pointer">
            <Rocket className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              Candidate Lab
            </h1>
            <p className="text-[11px] text-indigo-600 font-black uppercase tracking-[0.5em] mt-2 ml-1">
              Secure Upload Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            className="h-16 px-10 text-gray-400 font-black rounded-3xl"
            onClick={() => {
              storage.setCurrentUser(null);
              navigate("/");
            }}
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="w-full max-w-4xl space-y-16 animate-fade-in">
        <Card className="bg-indigo-600 rounded-[64px] p-24 text-white shadow-2xl relative overflow-hidden group text-center flex flex-col items-center border-none">
          <div className="absolute inset-0 bg-indigo-700/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10 w-32 h-32 bg-white/10 backdrop-blur-md rounded-[48px] flex items-center justify-center mb-12 shadow-2xl border border-white/20">
            <Upload className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-black mb-6 relative z-10 tracking-tight">
            Sync Your Resume
          </h2>
          <p className="text-lg text-indigo-100 font-medium mb-12 relative z-10 leading-relaxed max-w-lg">
            Upload your professional profile to the recruitment matrix.
          </p>

          <input
            type="file"
            className="hidden"
            id="cand-up-final"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="cand-up-final"
            className="px-20 py-8 bg-indigo-800 text-white rounded-[36px] flex items-center justify-center font-black uppercase tracking-[0.4em] text-xs cursor-pointer hover:brightness-110 hover:scale-[1.03] transition-all relative z-10 shadow-2xl border border-indigo-900"
          >
            Initialize Upload
          </label>
        </Card>

        {lastUploaded && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-[40px] p-10 flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                  Upload Successful
                </p>
                <p className="text-xl font-black text-emerald-900 tracking-tight">
                  {lastUploaded}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Node Integrated
            </span>
          </div>
        )}

        <div className="pt-10 border-t border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">
            Secure End-to-End Neural Link Active
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * ADMIN PANEL
 */
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDFDFE] flex flex-col items-center justify-center p-20 text-center space-y-12">
      <div className="w-32 h-32 bg-amber-600 rounded-[48px] flex items-center justify-center text-white shadow-2xl">
        <ShieldAlert className="w-16 h-16" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
          Admin Matrix
        </h2>
        <p className="text-base text-gray-400 font-medium">
          Node infrastructure management portal.
        </p>
      </div>
      <Button
        onClick={() => navigate("/")}
        className="px-12 h-16 rounded-[28px]"
      >
        Return to Matrix
      </Button>
    </div>
  );
};

/**
 * LOGIN COMPONENT
 */
const Login: React.FC = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<UserRole>(UserRole.RECRUITER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // read ?mode=signup to default to signup
    try {
      const params = new URLSearchParams(location.search);
      const m = params.get("mode");
      if (m === "signup") {
        // small UX: switch the login UI to register state by simulating the register flow
        // We'll just prefill blank credentials and allow register
        setUsername("");
        setPassword("");
        setRole(UserRole.RECRUITER);
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  const handleLogin = async () => {
    if (!username || !password) return setError("Incomplete credential nodes.");
    setLoading(true);
    setError(null);
    
    try {
      await new Promise((r) => setTimeout(r, 800));
      const user = await storage.getUserByUsername(username);

      if (user && user.password === password &&
          (user.role === role ||
           (user.role === UserRole.MASTER_RECRUITER &&
            role === UserRole.RECRUITER))) {
        storage.setCurrentUser(user);
        navigate(user.role === UserRole.CANDIDATE ? "/lab" : "/gateway");
      } else {
        setError("Access Denied: Neural identifier mismatch.");
      }
    } catch (e) {
      console.error('Login error:', e);
      setError("Connection error. Please try again.");
    }
    
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username || !password) return setError("Incomplete credential nodes.");
    setLoading(true);
    setError(null);
    
    try {
      await new Promise((r) => setTimeout(r, 800));
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        setLoading(false);
        return setError("Identity conflict: Node identifier already exists.");
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password,
        role,
      };
      
      await storage.saveUser(newUser);
      storage.setCurrentUser(newUser);
      navigate(role === UserRole.CANDIDATE ? "/lab" : "/gateway");
    } catch (e) {
      console.error('Registration error:', e);
      setError("Failed to create account. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#FDFDFE] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-50/50 rounded-full blur-[150px] -mr-[500px] -mt-[500px]" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-50/30 rounded-full blur-[120px] -ml-[400px] -mb-[400px]" />

      <Card className="w-full max-w-lg animate-fade-in border-none shadow-[0_60px_120px_-20px_rgba(0,0,0,0.12)] p-16 rounded-[72px] bg-white relative z-10">
        <div className="text-center space-y-8 mb-16">
          <div className="w-24 h-24 bg-indigo-600 rounded-[40px] mx-auto flex items-center justify-center text-white shadow-2xl rotate-6 hover:rotate-12 transition-all duration-500">
            <Zap className="w-14 h-14" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
              TopRes AI
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.6em] mt-3">
              Neural Recruitment Matrix
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-10">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="space-y-10">
          <div className="flex bg-gray-50 p-2 rounded-[32px] border border-gray-100 shadow-inner">
            <button
              onClick={() => setRole(UserRole.CANDIDATE)}
              className={`flex-1 py-5 rounded-[26px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${role === UserRole.CANDIDATE ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
            >
              Candidate
            </button>
            <button
              onClick={() => setRole(UserRole.RECRUITER)}
              className={`flex-1 py-5 rounded-[26px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${role === UserRole.RECRUITER ? "bg-white text-indigo-600 shadow-xl scale-105" : "text-gray-400 hover:text-gray-600"}`}
            >
              Recruiter
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-8 py-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                placeholder="E.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-8 py-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-8">
            <Button
              onClick={handleLogin}
              isLoading={loading}
              className="w-full py-7 text-sm rounded-[32px] shadow-2xl shadow-indigo-100"
            >
              Log In
            </Button>
            <p
              onClick={handleRegister}
              className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em] text-center mt-8 cursor-pointer hover:text-indigo-400 transition-colors"
            >
              Sign Up
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/gateway" element={<HRGateway />} />
        <Route path="/lab" element={<CandidateLab />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}