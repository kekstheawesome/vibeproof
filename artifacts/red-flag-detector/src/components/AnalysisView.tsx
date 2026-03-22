import { motion } from "framer-motion";
import { Copy, CheckCircle2, MessageCircle, AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { AnalysisResult, RedFlag } from "@workspace/api-client-react";
import { SeverityBadge } from "./SeverityBadge";

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisView({ result, onReset }: AnalysisViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header / Severity */}
      <motion.div variants={item} className="text-center space-y-4">
        <SeverityBadge score={result.severityScore} label={result.severityLabel} className="scale-110" />
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
          {result.overallExplanation}
        </p>
      </motion.div>

      {/* Red Flags List */}
      {result.redFlags.length > 0 && (
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-display font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Detected Concerns
          </h3>
          <div className="grid gap-4">
            {result.redFlags.map((flag: RedFlag, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100/50 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400" />
                <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-md mb-3">
                  {flag.category}
                </span>
                <blockquote className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-3 text-[15px]">
                  "{flag.quote}"
                </blockquote>
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {flag.explanation}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Needs More Context */}
      {result.needsMoreContext && result.contextQuestions.length > 0 && (
        <motion.div variants={item} className="bg-amber-50 rounded-2xl p-6 border border-amber-200/50">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2 text-amber-900 mb-3">
            <HelpCircle className="w-5 h-5" />
            More Context Needed
          </h3>
          <p className="text-amber-800 text-sm mb-4">
            To give you a more accurate analysis, it would help to know:
          </p>
          <ul className="space-y-2">
            {result.contextQuestions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-900/90">
                <span className="font-bold opacity-50">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Suggested Responses */}
      {result.suggestedResponses.length > 0 && (
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-display font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Suggested Ways to Respond
          </h3>
          <div className="grid gap-3">
            {result.suggestedResponses.map((response, idx) => (
              <div 
                key={idx} 
                className="group bg-white rounded-xl p-4 border border-border shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors"
              >
                <p className="text-foreground/90 text-[15px] flex-1 pt-0.5">
                  {response}
                </p>
                <button
                  onClick={() => handleCopy(response, idx)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors flex-shrink-0"
                  aria-label="Copy response"
                >
                  {copiedIndex === idx ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={item} className="pt-6 flex justify-center border-t border-border">
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Analyze Another Conversation
        </button>
      </motion.div>
    </motion.div>
  );
}
