import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Zap,
  Server,
  Key,
  Info,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { loadAISettings, saveAISettings, type AIProvider, type AISettings } from "@/lib/ai-provider";
import { useI18n, LANG_OPTIONS, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

const PROVIDERS: { id: AIProvider; labelKey: string; color: string }[] = [
  { id: "none", labelKey: "settings.provider.none", color: "text-muted-foreground" },
  { id: "ollama", labelKey: "settings.provider.ollama", color: "text-green-500" },
  { id: "openai", labelKey: "settings.provider.openai", color: "text-blue-400" },
  { id: "gemini", labelKey: "settings.provider.gemini", color: "text-purple-400" },
];

const OLLAMA_MODELS = ["llama3", "mistral", "phi3", "llama3.1", "codellama", "gemma2"];

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<AISettings>(() => loadAISettings());
  const [saved, setSaved] = useState(false);

  function update(partial: Partial<AISettings>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  }

  function handleSave() {
    saveAISettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t("brand.name")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-medium px-3 h-8 gap-1.5"
                  data-testid="button-lang-toggle"
                >
                  {LANG_OPTIONS.find((l) => l.code === lang)?.flag}{" "}
                  {LANG_OPTIONS.find((l) => l.code === lang)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[130px]">
                {LANG_OPTIONS.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code as Lang)}
                    className={`gap-2 text-sm ${lang === l.code ? "font-semibold" : ""}`}
                    data-testid={`lang-option-${l.code}`}
                  >
                    {l.flag} {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle-settings"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.provider.label")}</p>
        </div>

        <Card className="glass-panel border-border/50">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              {t("settings.provider.label")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update({ provider: p.id })}
                  data-testid={`button-provider-${p.id}`}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    form.provider === p.id
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border/50 hover:border-border bg-secondary/10 hover:bg-secondary/20"
                  }`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      form.provider === p.id ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                  <span className={`text-sm font-medium ${form.provider === p.id ? p.color : ""}`}>
                    {t(p.labelKey)}
                  </span>
                  {form.provider === p.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary absolute right-3 top-3" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {form.provider === "ollama" && (
          <Card className="glass-panel border-border/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold">{t("settings.provider.ollama")}</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="ollama-endpoint" className="text-sm">
                  {t("settings.ollama.endpoint")}
                </Label>
                <Input
                  id="ollama-endpoint"
                  value={form.ollamaEndpoint}
                  onChange={(e) => update({ ollamaEndpoint: e.target.value })}
                  placeholder={t("settings.endpointDefault")}
                  className="bg-background/50 font-mono text-sm"
                  data-testid="input-ollama-endpoint"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollama-model" className="text-sm">
                  {t("settings.ollama.model")}
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {OLLAMA_MODELS.map((m) => (
                    <button
                      key={m}
                      onClick={() => update({ ollamaModel: m })}
                      data-testid={`button-model-${m}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        form.ollamaModel === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 hover:border-border bg-secondary/10"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Input
                  id="ollama-model"
                  value={form.ollamaModel}
                  onChange={(e) => update({ ollamaModel: e.target.value })}
                  placeholder={t("settings.ollama.modelHint")}
                  className="bg-background/50 font-mono text-sm"
                  data-testid="input-ollama-model"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <p>{t("settings.note.ollama")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {form.provider === "openai" && (
          <Card className="glass-panel border-border/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold">{t("settings.provider.openai")}</h3>
                <Badge variant="outline" className="ml-auto text-xs">GPT-4o mini</Badge>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm">
                  {t("settings.openai.key")}
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={form.openaiKey}
                  onChange={(e) => update({ openaiKey: e.target.value })}
                  placeholder={t("settings.keyPlaceholder")}
                  className="bg-background/50 font-mono text-sm"
                  data-testid="input-openai-key"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p>{t("settings.note.local")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {form.provider === "gemini" && (
          <Card className="glass-panel border-border/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold">{t("settings.provider.gemini")}</h3>
                <Badge variant="outline" className="ml-auto text-xs">Gemini 1.5 Flash</Badge>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-sm">
                  {t("settings.gemini.key")}
                </Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={form.geminiKey}
                  onChange={(e) => update({ geminiKey: e.target.value })}
                  placeholder={t("settings.keyPlaceholder")}
                  className="bg-background/50 font-mono text-sm"
                  data-testid="input-gemini-key"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <p>{t("settings.note.local")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            size="lg"
            className="flex-1 font-semibold shadow-lg shadow-primary/20"
            data-testid="button-save-settings"
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> {t("settings.saved")}
              </span>
            ) : (
              t("settings.save")
            )}
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("settings.back")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
