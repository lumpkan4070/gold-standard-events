import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const VICTORY_BOT_QA = [
  {
    keywords: ['hours', 'open', 'close', 'time'],
    answer: "We're open daily 11AM - 1AM. We're closed on major holidays."
  },
  {
    keywords: ['location', 'address', 'where'],
    answer: "Victory Bistro is located in Cleveland, Ohio. For directions and exact address, please call us at (440) 730-1233."
  },
  {
    keywords: ['reservation', 'book', 'table'],
    answer: "You can make reservations by calling (440) 730-1233 or emailing events@victorybistro.com. We recommend booking in advance, especially for weekends."
  },
  {
    keywords: ['menu', 'food', 'dishes', 'eat'],
    answer: "We offer contemporary American cuisine with seasonal ingredients. Our menu features steaks, seafood, pasta, and vegetarian options. Check our Order page for current menu items."
  },
  {
    keywords: ['parking', 'park'],
    answer: "We offer valet parking and there's street parking available. Valet service is complimentary for dinner guests."
  },
  {
    keywords: ['dress code', 'attire', 'wear'],
    answer: "We have a smart casual dress code. Business casual or dressy attire is recommended, especially for dinner service."
  },
  {
    keywords: ['private', 'event', 'party', 'group'],
    answer: "Yes! We host private events and parties. Contact us at events@victorybistro.com or (440) 730-1233 to discuss your event needs."
  },
  {
    keywords: ['wine', 'drinks', 'cocktails', 'bar'],
    answer: "We have an extensive wine list and craft cocktail menu. Our bartenders can create classic and signature cocktails to complement your meal."
  },
  {
    keywords: ['vegetarian', 'vegan', 'dietary'],
    answer: "We offer vegetarian options and can accommodate most dietary restrictions. Please inform us of any allergies or dietary needs when making your reservation."
  },
  {
    keywords: ['specials', 'deals', 'offers'],
    answer: "We feature daily specials and seasonal menu items. Follow us on social media or check our Events page for current promotions and special dinner events."
  },
  {
    keywords: ['credit card', 'payment', 'cash'],
    answer: "We accept all major credit cards, cash, and contactless payments. We do not currently accept checks."
  },
  {
    keywords: ['takeout', 'delivery', 'order'],
    answer: "Yes, we offer takeout orders. You can place orders by calling (440) 730-1233. Currently, we don't offer delivery service."
  },
  {
    keywords: ['chef', 'kitchen', 'cook'],
    answer: "Our culinary team is led by experienced chefs who focus on fresh, locally-sourced ingredients and innovative cooking techniques."
  },
  {
    keywords: ['birthday', 'celebration', 'anniversary'],
    answer: "We love celebrating special occasions! Let us know about birthdays, anniversaries, or special celebrations when making your reservation."
  },
  {
    keywords: ['gluten', 'allergy', 'free'],
    answer: "We can accommodate gluten-free and allergy-friendly requests. Please inform us of any allergies when making your reservation so we can prepare accordingly."
  },
  {
    keywords: ['live music', 'entertainment'],
    answer: "We occasionally host live music and entertainment events. Check our Events page or social media for upcoming entertainment schedules."
  },
  {
    keywords: ['happy hour', 'discount'],
    answer: "We offer special pricing on select appetizers and drinks during certain hours. Call us at (440) 730-1233 for current happy hour details."
  },
  {
    keywords: ['outdoor', 'patio', 'seating'],
    answer: "Weather permitting, we offer outdoor seating options. Availability depends on the season and weather conditions."
  },
  {
    keywords: ['gift card', 'gift'],
    answer: "Yes, we offer gift cards! They make perfect gifts for food lovers. Contact us at (440) 730-1233 to purchase gift cards."
  },
  {
    keywords: ['contact', 'phone', 'email'],
    answer: "You can reach us at (440) 730-1233 or email events@victorybistro.com. We're happy to answer any questions you have!"
  }
];

const Chat = () => {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm VictoryBot, your personal dining assistant. I can help you with questions about our menu, hours, reservations, and more. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check for user session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const findBestAnswer = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Find the Q&A with the most keyword matches
    let bestMatch = null;
    let maxMatches = 0;
    
    for (const qa of VICTORY_BOT_QA) {
      const matches = qa.keywords.filter(keyword => input.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = qa;
      }
    }
    
    if (bestMatch && maxMatches > 0) {
      return bestMatch.answer;
    }
    
    // Default response if no matches found
    return "I'm here to help with questions about Victory Bistro! You can ask me about our hours, menu, reservations, location, parking, events, and more. For specific questions I can't answer, please call us at (440) 730-1233.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findBestAnswer(inputText),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <MessageCircle className="h-10 w-10" />
              VictoryBot
            </div>
            <p className="text-muted-foreground text-lg">
              Your personal dining assistant
            </p>
          </div>

          <Card className="luxury-card h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat with VictoryBot
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'bot' 
                          ? 'victory-gradient' 
                          : 'bg-primary'
                      }`}>
                        {message.sender === 'bot' ? (
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <User className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <p className="text-sm">{message.text}</p>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full victory-gradient flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about our menu, hours, reservations..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;