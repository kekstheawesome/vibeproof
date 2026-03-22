import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, Shield, Loader2, Info } from "lucide-react";
import { useAnalyzeText } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisView } from "@/components/AnalysisView";

type InputMode = "image" | "text";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("image");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [context, setContext] = useState("");

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

    analyzeMutation.mutate({
      data: {
        imageBase64: mode === "image" ? imageBase64 : null,
        text: mode === "text" ? textInput : null,
        context: context.trim() || null,
      }
    });
  };

  const handleReset = () => {
    setImageBase64(null);
    setTextInput("");
    setContext("");
    analyzeMutation.reset();
  };

  const isPending = analyzeMutation.isPending;
  const result = analyzeMutation.data;

  return (
    <div className="min-h-screen pb-20 selection:bg-primary/20">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-border mb-2">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          Clarity Check
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Upload a screenshot or paste a text message to check for signs of manipulation, crossed boundaries, or controlling behavior.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {!result ? (
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
              {analyzeMutation.isError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Sorry, there was an error analyzing the text. Please try again or try uploading a different screenshot.</p>
                </div>
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
