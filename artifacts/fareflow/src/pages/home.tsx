import { useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MapView } from "@/components/map-view";
import { FareHistoryChart } from "@/components/fare-history-chart";
import { AIChatPanel } from "@/components/ai-chat-panel";
import {
  geocode,
  calculateDistance,
  runSimulation,
  generateFareHistory,
  SimulationResult,
  FareHistoryPoint,
  Location,
} from "@/lib/simulation";
import {
  MapPin,
  Navigation,
  Search,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  Car,
  Train,
  Bus,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang } = useI18n();

  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupLoc, setPickupLoc] = useState<Location | null>(null);
  const [destLoc, setDestLoc] = useState<Location | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [fareHistory, setFareHistory] = useState<FareHistoryPoint[]>([]);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupInput.trim() || !destInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const pLoc = await geocode(pickupInput);
      const dLoc = await geocode(destInput);

      if (!pLoc || !dLoc) {
        setError(t("error.locationNotFound"));
        setIsLoading(false);
        return;
      }

      setPickupLoc(pLoc);
      setDestLoc(dLoc);

      const dist = calculateDistance(pLoc.lat, pLoc.lng, dLoc.lat, dLoc.lng);
      if (dist < 0.1) {
        setError(t("error.tooClose"));
        setIsLoading(false);
        return;
      }

      const result = runSimulation(dist);
      setSimResult(result);
      setFareHistory(generateFareHistory(dist, result.surgeMultiplier));
    } catch {
      setError(t("error.general"));
    } finally {
      setIsLoading(false);
    }
  };

  const getSurgeColor = (level: string) => {
    switch (level) {
      case "Low": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "High": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Very High": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTrendLabel = (trend: string) => {
    if (trend === "Increasing") return t("verdict.increasing");
    if (trend === "Decreasing") return t("verdict.decreasing");
    return t("verdict.stable");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {t("brand.name")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "te" : "en")}
              className="text-xs font-medium px-3 h-8"
              data-testid="button-lang-toggle"
            >
              {lang === "en" ? "తె" : "EN"}
            </Button>

            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                data-testid="link-settings"
                title={t("nav.settings")}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">{t("nav.settings")}</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t("nav.toggleTheme")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        {/* Hero & Search */}
        <section className="space-y-6 text-center pt-8 pb-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("hero.title")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("hero.subtitle")}
            </p>
          </div>

          <Card className="glass-panel border-border/50 max-w-3xl mx-auto overflow-hidden shadow-2xl shadow-primary/5">
            <CardContent className="p-6">
              <form onSubmit={handleCompare} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-4">
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder={t("form.pickup")}
                      className="pl-10 h-12 bg-background/50"
                      value={pickupInput}
                      onChange={(e) => setPickupInput(e.target.value)}
                      data-testid="input-pickup"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder={t("form.destination")}
                      className="pl-10 h-12 bg-background/50"
                      value={destInput}
                      onChange={(e) => setDestInput(e.target.value)}
                      data-testid="input-destination"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto h-12 px-8 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                  disabled={isLoading || !pickupInput || !destInput}
                  data-testid="button-compare"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5 animate-pulse" /> {t("form.analyzing")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-5 w-5" /> {t("form.compare")}
                    </span>
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {!isLoading && simResult && pickupLoc && destLoc && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Map & High Level Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[350px] relative rounded-xl overflow-hidden border border-border shadow-sm group">
                  <MapView pickup={pickupLoc} destination={destLoc} />
                  <div className="absolute top-4 left-4 z-[400] bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border shadow-lg flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {t("map.distance")}
                      </span>
                      <span className="font-bold text-lg">{simResult.distance.toFixed(1)} km</span>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {t("map.traffic")}
                      </span>
                      <span className="font-bold text-sm">{simResult.traffic}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col justify-between">
                  {/* AI Recommendation */}
                  <Card
                    className={`glass-panel border overflow-hidden ${
                      simResult.recommendation === "Book Now"
                        ? "border-primary/30"
                        : "border-success/30"
                    }`}
                  >
                    <div
                      className={`h-1 w-full ${
                        simResult.recommendation === "Book Now" ? "bg-primary" : "bg-success"
                      }`}
                    />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4" /> {t("verdict.title")}
                          </h3>
                          <p className="text-2xl font-bold">
                            {simResult.recommendation === "Book Now"
                              ? t("verdict.bookNow")
                              : t("verdict.wait")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            simResult.recommendation === "Wait 15 Minutes"
                              ? "bg-success/10 text-success"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {t("verdict.confidence", { value: simResult.futureConfidence })}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {simResult.recommendation === "Wait 15 Minutes"
                          ? t("verdict.drop", { savings: simResult.expectedSavings ?? 0 })
                          : t("verdict.increase")}
                      </p>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-medium">{t("verdict.trend")}</span>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          {simResult.futureTrend === "Increasing" && (
                            <TrendingUp className="h-4 w-4 text-destructive" />
                          )}
                          {simResult.futureTrend === "Decreasing" && (
                            <TrendingDown className="h-4 w-4 text-success" />
                          )}
                          {simResult.futureTrend === "Stable" && (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                          {getTrendLabel(simResult.futureTrend)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Savings Bar */}
                  <Card className="glass-panel border-border/50">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">
                        {t("savings.title")}
                      </h3>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("savings.highest")}</p>
                          <p className="font-mono font-medium">₹{simResult.highestFare}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-success font-medium">{t("savings.potential")}</p>
                          <p className="font-mono font-bold text-success text-xl">
                            ₹{simResult.savings}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-success h-full rounded-full"
                          style={{
                            width: `${(simResult.savings / simResult.highestFare) * 100}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Fares Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">{t("rides.title")}</h2>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 text-sm ${getSurgeColor(simResult.surgeLevel)}`}
                  >
                    {t("rides.surge")}: {simResult.surgeLevel} ({simResult.surgeMultiplier.toFixed(1)}x)
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {simResult.providers
                    .sort((a, b) => a.fare - b.fare)
                    .map((provider, i) => (
                      <motion.div
                        key={provider.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        data-testid={`card-provider-${provider.name.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Card
                          className={`relative overflow-hidden glass-panel transition-all hover:-translate-y-1 hover:shadow-md ${
                            provider.name === simResult.cheapestProvider
                              ? "border-primary shadow-primary/10"
                              : "border-border/50"
                          }`}
                        >
                          {provider.name === simResult.cheapestProvider && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {t("rides.bestDeal")}
                            </div>
                          )}
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                <Car className="h-5 w-5 text-secondary-foreground" />
                              </div>
                              <h3 className="font-bold text-lg">{provider.name}</h3>
                            </div>
                            <div className="space-y-1">
                              <p className="text-3xl font-mono font-bold tracking-tighter">
                                ₹{provider.fare}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {t("rides.eta", { eta: provider.eta })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Fare History Chart */}
              {fareHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                  data-testid="section-fare-history"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{t("history.title")}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{t("history.subtitle")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs px-3 py-1 border-border/60">
                      <Activity className="h-3 w-3 mr-1.5" /> {t("history.badge")}
                    </Badge>
                  </div>
                  <Card className="glass-panel border-border/50">
                    <CardContent className="pt-6 pb-2 pr-4">
                      <FareHistoryChart data={fareHistory} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* AI Insights Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <AIChatPanel simResult={simResult} />
              </motion.div>

              {/* Alternative Transport */}
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-bold tracking-tight text-muted-foreground">
                  {t("transport.title")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {simResult.distance <= 5 && (
                    <Card className="glass-panel border-border/50 opacity-80 hover:opacity-100 transition-opacity">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Footprints className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{t("transport.walking")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("transport.free")} • {t("transport.minutes", { min: Math.round(simResult.distance * 12) })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="glass-panel border-border/50 opacity-80 hover:opacity-100 transition-opacity">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Train className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("transport.metro")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("transport.fare", { fare: 40 })} • {t("transport.minutes", { min: Math.round(simResult.distance * 1.4) })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-panel border-border/50 opacity-80 hover:opacity-100 transition-opacity">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("transport.bus")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("transport.fare", { fare: 20 })} • {t("transport.minutes", { min: Math.round(simResult.distance * 2.1) })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-16 bg-muted/20">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm">{t("footer.privacy")}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
