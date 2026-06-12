import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SendHorizonal, Bot, User, Settings, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { askAI, buildFareContext, loadAISettings } from "@/lib/ai-provider";
import { useI18n } from "@/lib/i18n";
import type { SimulationResult } from "@/lib/simulation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  simResult: SimulationResult;
}

export function AIChatPanel({ simResult }: AIChatPanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const settings = loadAISettings();
  const hasProvider = settings.provider !== "none";

  const presets = [
    t("ai.preset.shouldBook"),
    t("ai.preset.cheapest"),
    t("ai.preset.whySurge"),
  ];

  const context = buildFareContext(simResult);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const answer = await askAI(question, context);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      const errMsg = err instanceof Error && err.message === "NO_PROVIDER"
        ? t("ai.noProvider")
        : t("ai.error");
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <Card className="glass-panel border-border/50 overflow-hidden" data-testid="section-ai-insights">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500" />
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("ai.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("ai.subtitle")}</p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" data-testid="link-ai-settings">
              <Settings className="h-4 w-4" />
              {t("ai.settingsLink")}
            </Button>
          </Link>
        </div>

        <Separator />

        {!hasProvider ? (
          <div className="text-center py-6 space-y-3">
            <Bot className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">{t("ai.noProvider")}</p>
            <Link href="/settings">
              <Button size="sm" variant="outline" data-testid="button-go-to-settings">
                <Settings className="h-4 w-4 mr-2" />
                {t("ai.settingsLink")}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2" data-testid="ai-preset-questions">
                {presets.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    data-testid={`button-preset-${q.slice(0, 20)}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-secondary/20 hover:bg-secondary/50 text-foreground transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1" data-testid="ai-message-list">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/30 text-foreground border border-border/40"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="h-7 w-7 rounded-full bg-secondary/40 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2.5 justify-start"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-secondary/30 border border-border/40 rounded-xl px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {presets.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="text-xs px-2.5 py-1 rounded-full border border-border/40 bg-secondary/10 hover:bg-secondary/30 text-muted-foreground transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.placeholder")}
                disabled={loading}
                className="flex-1 bg-background/50 text-sm"
                data-testid="input-ai-question"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="shrink-0"
                data-testid="button-ai-send"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
