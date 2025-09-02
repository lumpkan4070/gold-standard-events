import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminEnhanced = lazy(() => import("./pages/AdminEnhanced"));
const Events = lazy(() => import("./pages/Events"));
const Order = lazy(() => import("./pages/Order"));
const Contact = lazy(() => import("./pages/Contact"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Games = lazy(() => import("./pages/Games"));
const TriviaBlast = lazy(() => import("./pages/TriviaBlast"));
const WordChain = lazy(() => import("./pages/WordChain"));
const MemoryMatch = lazy(() => import("./pages/MemoryMatch"));
const GuessTheThrowback = lazy(() => import("./pages/GuessTheThrowback"));
const BeatTheClock = lazy(() => import("./pages/BeatTheClock"));
const RapItOrScrapIt = lazy(() => import("./pages/RapItOrScrapIt"));
const DJs = lazy(() => import("./pages/DJs"));
const SongRequests = lazy(() => import("./pages/SongRequests"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen victory-hero-bg flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminEnhanced />} />
              <Route path="/admin-enhanced" element={<AdminEnhanced />} />
              <Route path="/events" element={<Events />} />
              <Route path="/order" element={<Order />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/trivia-blast" element={<TriviaBlast />} />
              <Route path="/games/word-chain" element={<WordChain />} />
              <Route path="/games/memory-match" element={<MemoryMatch />} />
              <Route path="/games/guess-the-throwback" element={<GuessTheThrowback />} />
              <Route path="/games/beat-the-clock" element={<BeatTheClock />} />
              <Route path="/games/rap-it-or-scrap-it" element={<RapItOrScrapIt />} />
              <Route path="/djs" element={<DJs />} />
              <Route path="/song-requests" element={<SongRequests />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/scanner" element={<Order />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
