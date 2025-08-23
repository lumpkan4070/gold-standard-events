import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useOneSignal } from "@/hooks/useOneSignal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminEnhanced from "./pages/AdminEnhanced";
import Events from "./pages/Events";
import Order from "./pages/Order";
import Contact from "./pages/Contact";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Games from "./pages/Games";
import TriviaBlast from "./pages/TriviaBlast";
import WordChain from "./pages/WordChain";
import MemoryMatch from "./pages/MemoryMatch";
import DJs from "./pages/DJs";
import SongRequests from "./pages/SongRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useOneSignal(); // Initialize OneSignal for mobile app

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
          <Route path="/games" element={<Games />} />
        <Route path="/games/trivia-blast" element={<TriviaBlast />} />
        <Route path="/games/word-chain" element={<WordChain />} />
        <Route path="/games/memory-match" element={<MemoryMatch />} />
          <Route path="/djs" element={<DJs />} />
          <Route path="/song-requests" element={<SongRequests />} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/scanner" element={<Order />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
