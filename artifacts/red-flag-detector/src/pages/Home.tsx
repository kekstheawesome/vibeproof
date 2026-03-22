import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, Shield, Loader2, Info, History, ChevronRight, LogOut, User, X } from "lucide-react";
import { useAnalyzeText, useGetAnalysisHistory, type AnalysisResult } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisView } from "@/components/AnalysisView";

type InputMode = "image" | "text";

function SeverityDot({ score }: { score: number }) {
  const color =
    score === 0 ? "bg-green-400" :
    score <= 1 ? "bg-lime-400" :
    score <= 2 ? "bg-yellow-400" :
    score <= 3 ? "bg-orange-400" :
    "bg-red-500";
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0 mt-1.5", color)} />;
}

function HistoryPanel({ onSelect }: { onSelect: (result: AnalysisResult) => void }) {
  const { data, isLoading } = useGetAnalysisHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history…
      </div>
    );
  }

  const analyses = data?.analyses ?? [];

  if (analyses.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No previous analyses yet.<br />Run your first one below.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {analyses.map((item) => {
        const result = item.result as AnalysisResult;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(result)}
            className="w-full text-left p-3 rounded-xl bg-white hover:bg-primary/5 border border-border hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start gap-2">
              <SeverityDot score={result.severityScore} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {result.severityLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.inputMode === "image" ? "Screenshot" : "Text"} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SignupPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glass-panel rounded-3xl p-8 text-center space-y-5"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-1">
        <Shield className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          You've used your free analysis
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Create a free account to run unlimited analyses and keep a history of your past checks.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
        <button
          onClick={onLogin}
          className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          Sign up — it's free
        </button>
        <button
          onClick={onLogin}
          className="px-8 py-3 rounded-xl font-semibold text-foreground bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          Log in
        </button>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("image");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [context, setContext] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [viewingResult, setViewingResult] = useState<AnalysisResult | null>(null);

  const { user, isLoading: authLoading, isAuthenticated, login, logout } = useAuth();
  const analyzeMutation = useAnalyzeText();

  const handleAnalyze = () => {
    if (mode === "image" && !imageBase64) {
      alert("Please upload an image first.");
      return;
    }
    if (mode === "text" && !textInput.trim()) {
      alert("Please enter some text to analyze.");
      return;
    }

    setLimitReached(false);
    setViewingResult(null);

    analyzeMutation.mutate(
      {
        data: {
          imageBase64: mode === "image" ? imageBase64 : null,
          text: mode === "text" ? textInput : null,
          context: context.trim() || null,
        },
      },
      {
        onError: (err) => {
          const status = (err as { status?: number }).status;
          if (status === 429) {
            setLimitReached(true);
          }
        },
      }
    );
  };

  const handleReset = () => {
    setImageBase64(null);
    setTextInput("");
    setContext("");
    setLimitReached(false);
    setViewingResult(null);
    analyzeMutation.reset();
  };

  const isPending = analyzeMutation.isPending;
  const result = viewingResult ?? analyzeMutation.data ?? null;
  const isGenericError = analyzeMutation.isError && !limitReached;

  const displayName = user?.firstName
    ? user.firstName
    : user?.email?.split("@")[0] ?? "Account";

  return (
    <div className="min-h-screen pb-20 selection:bg-primary/20">
      {/* Top nav bar */}
      <nav className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground text-base">VibeProof</span>
        </div>
        <div className="flex items-center gap-2">
          {!authLoading && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    showHistory
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white border border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <div className="flex items-center gap-1.5">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} className="w-7 h-7 rounded-full" alt={displayName} />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground hidden sm:inline">
                      {displayName}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Log out"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={login}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-foreground bg-white border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  Log in
                </button>
                <button
                  onClick={login}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Sign up
                </button>
              </div>
            )
          )}
        </div>
      </nav>

      {/* Header */}
      <header className="pt-8 pb-8 px-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-border mb-2">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          VibeProof
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Upload a screenshot or paste a text message to check for signs of manipulation, crossed boundaries, or controlling behavior.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && isAuthenticated && (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4" /> Previous Analyses
                  </h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <HistoryPanel
                  onSelect={(r) => {
                    setViewingResult(r);
                    analyzeMutation.reset();
                    setShowHistory(false);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {limitReached ? (
            <SignupPrompt key="signup-prompt" onLogin={login} />
          ) : !result ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              {isPending && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <p className="text-lg font-medium text-foreground">Analyzing conversation...</p>
                  <p className="text-sm text-muted-foreground mt-1">This takes just a moment.</p>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="flex p-1 bg-muted rounded-xl mb-8">
                <button
                  onClick={() => setMode("image")}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                    mode === "image" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Upload Screenshot
                </button>
                <button
                  onClick={() => setMode("text")}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                    mode === "text" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Paste Text
                </button>
              </div>

              {/* Input Area */}
              <div className="mb-8">
                {mode === "image" ? (
                  <ImageUploader onImageSelected={setImageBase64} disabled={isPending} />
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4" /> Message Text
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste the conversation or message here..."
                      className="w-full min-h-[240px] p-4 rounded-2xl border-2 border-border bg-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-y"
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>

              {/* Context Area */}
              <div className="mb-8 space-y-2">
                <label className="text-sm font-semibold text-foreground/80">
                  Additional Context <span className="font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. We've been dating for 3 months. This happened after I said I was busy tonight."
                  className="w-full h-24 p-4 rounded-xl border border-border bg-white/50 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                  disabled={isPending}
                />
              </div>

              {/* Error Message */}
              {isGenericError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Sorry, there was an error analyzing the text. Please try again.</p>
                </div>
              )}

              {/* Free-use hint for guests */}
              {!isAuthenticated && !authLoading && (
                <p className="text-center text-xs text-muted-foreground mb-4">
                  1 free analysis ·{" "}
                  <button onClick={login} className="underline hover:text-foreground transition-colors">
                    Sign up
                  </button>{" "}
                  for unlimited
                </p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleAnalyze}
                disabled={isPending || (mode === "image" && !imageBase64) || (mode === "text" && !textInput.trim())}
                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Analyze Now
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-panel rounded-3xl p-6 sm:p-10"
            >
              <AnalysisView result={result} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-12 max-w-lg mx-auto">
          <strong>Disclaimer:</strong> This tool uses AI to analyze text patterns based on common behavioral indicators. It is not a substitute for professional mental health advice, counseling, or crisis intervention. If you feel unsafe, please contact local emergency services or domestic abuse hotlines.
        </p>
      </main>
    </div>
  );
}
