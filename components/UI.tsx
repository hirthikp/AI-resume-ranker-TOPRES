import React from "react";
import {
  Loader2,
  AlertCircle,
  Star,
  HelpCircle,
  MessageCircle,
  ShieldAlert,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Fingerprint,
  Files,
  Gauge,
  Zap,
  Sliders,
  Info,
  ArrowUpRight,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Copy,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/**
 * ESPRESSO CARD COMPONENT
 * Implements the core design language of TopRes AI with soft shadows and high-end rounding.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`${className} border border-gray-100 rounded-[40px] p-6 shadow-xl shadow-gray-200/50 transition-all duration-500 ease-in-out ${onClick ? "cursor-pointer hover:shadow-2xl hover:scale-[1.01] hover:border-indigo-100" : ""}`}
  >
    {children}
  </div>
);

/**
 * NEURAL BUTTON COMPONENT
 * Standardized button system with sophisticated hover states and loading animations.
 */
export const Button: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}> = ({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled,
  isLoading,
}) => {
  const base =
    "px-8 py-4 rounded-[22px] font-black transition-all duration-300 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  const styles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200/40",
    secondary:
      "bg-white text-gray-800 border border-gray-100 hover:bg-gray-50 shadow-sm",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100",
    ghost: "bg-transparent text-gray-400 hover:text-gray-900",
    gold: "bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:shadow-amber-200 shadow-lg",
  };

  return (
    <button
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

/**
 * THRESHOLD SLIDER COMPONENT
 * Specialized UI for adjusting the Neural Similarity sensitivity.
 */
export const SimilarityThresholdSlider: React.FC<{
  value: number;
  onChange: (val: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex flex-col space-y-4 min-w-[240px] bg-gray-50/50 p-4 rounded-[28px] border border-gray-100 shadow-inner">
    <div className="flex justify-between items-center px-2">
      <div className="flex items-center gap-2">
        <Sliders className="w-3 h-3 text-indigo-500" />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          Similarity Cap
        </span>
      </div>
      <span
        className={`text-xs font-black ${value > 80 ? "text-rose-600" : "text-indigo-600"}`}
      >
        {value}%
      </span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
    <p className="text-[8px] font-bold text-gray-400 px-1 text-center">
      Current sensitivity:{" "}
      {value < 50 ? "Hypersensitive" : value < 80 ? "Balanced" : "Strict"}
    </p>
  </div>
);

/**
 * PROGRESS BAR COMPONENT
 */
export const ProgressBar: React.FC<{
  value: number;
  label: string;
  max?: number;
}> = ({ value, label, max = 100 }) => (
  <div className="space-y-3 w-full">
    <div className="flex justify-between items-end px-1">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-xs font-black text-gray-900">
        {((value / max) * 100).toFixed(2)}%
      </span>
    </div>
    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50/50">
      <div
        className={`h-full transition-all duration-1000 ease-out rounded-full shadow-sm ${value > 80 ? "bg-indigo-600" : value > 50 ? "bg-indigo-400" : "bg-rose-500"}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

/**
 * RISK BADGE COMPONENT
 */
export const Badge: React.FC<{
  variant: "success" | "danger" | "warning" | "info";
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    danger: "bg-rose-50 text-red-700 border-rose-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    info: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };
  return (
    <span
      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[variant]} shadow-sm`}
    >
      {children}
    </span>
  );
};

/**
 * PLAGIARISM CONFLICT ZONE COMPONENT
 * Specifically designed to display flagged resumes separately.
 */
export const PlagiarismConflictZone: React.FC<{
  score: number;
  reasons: string[];
  candidates: string[];
  threshold: number;
}> = ({ score, reasons, candidates, threshold }) => (
  <Card className="bg-rose-50/30 border-rose-100 border-2 border-dashed shadow-rose-100/10 p-10 space-y-8 animate-fade-in">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-rose-500 rounded-[28px] text-white flex items-center justify-center shadow-2xl animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-rose-900 tracking-tighter">
            Cluster Conflict Detected
          </h3>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">
            Breached Threshold: {threshold}%
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-rose-100 text-center shadow-xl shadow-rose-100/40 min-w-[160px]">
        <span className="text-4xl font-black text-rose-600">
          {score.toFixed(2)}%
        </span>
        <p className="text-[9px] font-black text-gray-400 uppercase mt-1">
          Similarity Index
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
      <div className="space-y-5">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <Files className="w-4 h-4 text-rose-400" /> Correlated Nodes
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {candidates.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-4 bg-white rounded-3xl border border-rose-100 shadow-sm group hover:border-rose-400 transition-colors"
            >
              <span className="text-sm font-black text-rose-900">{name}</span>
              <ArrowUpRight className="w-4 h-4 text-rose-300 group-hover:text-rose-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <Fingerprint className="w-4 h-4 text-rose-400" /> Neural Plagiarism
          Markers
        </h4>
        <ul className="space-y-3">
          {reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-4 p-5 bg-white/60 border border-rose-100/50 rounded-3xl text-xs font-bold text-rose-800 leading-relaxed shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Card>
);

/**
 * LOADING & ERROR COMPONENTS
 */
export const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Synchronizing Neural Matrices...",
}) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-fade-in">
    <div className="relative">
      <div className="absolute inset-0 bg-indigo-400 rounded-full blur-2xl animate-pulse opacity-20"></div>
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative" />
    </div>
    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">
      {label}
    </p>
  </div>
);

export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] flex items-center justify-between shadow-xl shadow-rose-100/20 animate-fade-in">
    <div className="flex items-center gap-6">
      <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">
          System Error
        </p>
        <p className="text-sm font-bold text-rose-900">{message}</p>
      </div>
    </div>
    {onRetry && (
      <Button
        variant="danger"
        onClick={onRetry}
        className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none shadow-none"
      >
        Reload Node
      </Button>
    )}
  </div>
);

/**
 * INTERVIEW KIT COMPONENT
 */
export const InterviewKit: React.FC<{
  questions: { technical: string[]; behavioral: string[] };
}> = ({ questions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full animate-fade-in">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
            Technical Deep-Dive
          </h4>
        </div>
        <div className="space-y-5">
          {questions.technical.map((q, i) => (
            <div
              key={i}
              className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-xl transition-all group"
            >
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 block group-hover:text-indigo-600 transition-colors">
                Technical Scenario {i + 1}
              </span>
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                {q}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
            Behavioral & Cultural
          </h4>
        </div>
        <div className="space-y-5">
          {questions.behavioral.map((q, i) => (
            <div
              key={i}
              className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-xl transition-all group"
            >
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-4 block group-hover:text-amber-600 transition-colors">
                Behavioral Probe {i + 1}
              </span>
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                {q}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * CANDIDATE CHARTING ENGINE
 */
export const CandidateCharts: React.FC<{
  matched: number;
  missing: number;
  breakdownScores: {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    clarity: number;
  };
}> = ({ matched, missing, breakdownScores }) => {
  const pieData = [
    { name: "Matched", value: matched },
    { name: "Gaps", value: missing },
  ];
  // If both values are zero, provide a tiny dummy slice so Recharts renders correctly
  const total = pieData.reduce((s, p) => s + (Number(p.value) || 0), 0);
  const safePieData = total === 0 ? [{ name: "None", value: 1 }] : pieData;
  const barData = [
    { name: "Skills", score: breakdownScores.skills },
    { name: "Exp", score: breakdownScores.experience },
    { name: "Projects", score: breakdownScores.projects },
    { name: "Edu", score: breakdownScores.education },
    { name: "Clarity", score: breakdownScores.clarity },
  ];
  const COLORS = ["#6366F1", "#F43F5E"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full">
      <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm flex flex-col items-center">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10">
          Competency Alignment
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safePieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
              >
                {safePieData.map((e, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i] || "#E5E7EB"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => {
                  const v = Number(value) || 0;
                  const pct = total === 0 ? 0 : ((v / total) * 100).toFixed(1);
                  return [`${v}`, `${pct}%`];
                }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm flex flex-col items-center">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10">
          Neural Benchmarking
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 9, fontWeight: 900 }}
              />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} hide />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                contentStyle={{
                  borderRadius: "24px",
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  fontSize: "10px",
                  fontWeight: 800,
                }}
              />
              <Bar
                dataKey="score"
                fill="#6366F1"
                radius={[10, 10, 0, 0]}
                barSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/**
 * RANKING CHART COMPONENT
 */
export const RankingChart: React.FC<{
  data: { name: string; score: number }[];
}> = ({ data }) => {
  const maxScore = 100;
  return (
    <div className="space-y-6">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-gray-700">
              {item.name}
            </span>
            <span className="text-xs font-black text-indigo-600">
              {item.score.toFixed(2)}%
            </span>
          </div>
          <div className="h-7 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-xl transition-all duration-1000 ease-out shadow-sm ${idx === 0 ? "bg-indigo-600" : "bg-indigo-400 opacity-60"}`}
              style={{ width: `${(item.score / maxScore) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * RANKING TABLE COMPONENT
 * Enhanced to show "Flagged" status based on similarity threshold.
 */
export const RankingTable: React.FC<{
  resumes: any[];
  onShortlist: (id: string, current: boolean) => void;
  onPreview: (resume: any) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  similarityThreshold: number;
  duplicateIds?: string[];
}> = ({
  resumes,
  onShortlist,
  onPreview,
  selectedIds,
  onToggleSelect,
  similarityThreshold,
  duplicateIds = [],
  onShortlist,
  onPreview,
  selectedIds,
  onToggleSelect,
  similarityThreshold,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-4 px-2">
        <thead>
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            <th className="pb-6 pl-8 w-16 text-center">Audit</th>
            <th className="pb-6">Candidate Identity</th>
            <th className="pb-6">ATS Match</th>
            <th className="pb-6">Risk Index</th>
            <th className="pb-6 text-center">Eligibility</th>
            <th className="pb-6 pr-8 text-right">Portal</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map((r) => {
            // Better heuristic: Only flag as suspicious if ATS score is extremely low (below 40)
            // OR if clarity/structure is very poor, indicating low-quality/generic content
            const isFlagged =
              r.analysis &&
              (r.analysis.atsScore < 40 || 
               (r.analysis.breakdown && r.analysis.breakdown.clarity < 20));
            return (
              <tr
                key={r.id}
                className={`bg-white group hover:shadow-2xl transition-all duration-500 rounded-[32px] ${selectedIds.includes(r.id) ? "ring-2 ring-indigo-500" : "border border-gray-50"}`}
              >
                <td className="py-8 pl-8 rounded-l-[40px] border-y border-l border-gray-100 text-center">
                  <button
                    onClick={() => onToggleSelect(r.id)}
                    className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${selectedIds.includes(r.id) ? "bg-indigo-600 text-white shadow-lg rotate-12" : "bg-gray-50 text-gray-300 hover:text-indigo-400"}`}
                  >
                    <Fingerprint className="w-6 h-6" />
                  </button>
                </td>
                <td className="py-8 border-y border-gray-100">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-300 font-black text-lg border border-indigo-100/50">
                      {r.candidateName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-base font-black text-gray-900 block tracking-tight">
                        {r.candidateName}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {r.id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-8 border-y border-gray-100">
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xl font-black ${r.analysis?.atsScore > 80 ? "text-indigo-600" : "text-gray-900"}`}
                    >
                      {(r.analysis?.atsScore || 0).toFixed(2)}%
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <TrendingUp
                        className={`w-4 h-4 ${r.analysis?.atsScore > 75 ? "text-emerald-500" : "text-gray-200"}`}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-8 border-y border-gray-100">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {isFlagged ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100">
                          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span className="text-[10px] font-black text-rose-600 uppercase">
                            Suspicious Node
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase">
                            Verified Unique
                          </span>
                        </div>
                      )}
                    </div>
                    {duplicateIds.includes(r.id) && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full w-fit">
                        <Copy className="w-3 h-3 text-orange-600" />
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">
                          Duplicate Match
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-8 border-y border-gray-100 text-center">
                  <button
                    onClick={() => onShortlist(r.id, r.status === "Eligible")}
                    className={`w-12 h-12 rounded-2xl transition-all shadow-sm flex items-center justify-center ${r.status === "Eligible" ? "bg-amber-500 text-white shadow-amber-200" : "bg-gray-50 text-gray-200 hover:text-amber-500 hover:scale-110"}`}
                  >
                    <Star
                      className={`w-5 h-5 ${r.status === "Eligible" ? "fill-current" : ""}`}
                    />
                  </button>
                </td>
                <td className="py-8 pr-8 rounded-r-[40px] border-y border-r border-gray-100 text-right">
                  <button
                    onClick={() => onPreview(r)}
                    className="group flex items-center gap-2 ml-auto text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-900"
                  >
                    Open Portal{" "}
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
