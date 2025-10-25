import { useState, useEffect, useRef } from 'react';
import { Theme } from '../PrivacyDashboard';

interface AIChatBotProps {
  onClose: () => void;
  theme: Theme;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIChatBot = ({ onClose, theme }: AIChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your PrivacyGuard AI assistant. I can help you with Tor, DNSCrypt, I2P, VPN settings, and general privacy questions. How can I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Tor related responses
    if (message.includes('tor') || message.includes('onion')) {
      return "Tor is a powerful anonymity network that routes your traffic through multiple encrypted relays. It's great for protecting your identity and accessing .onion sites. Would you like me to help you configure Tor settings or explain how it works?";
    }
    
    // DNSCrypt related responses
    if (message.includes('dns') || message.includes('dnscrypt')) {
      return "DNSCrypt encrypts your DNS queries and verifies server authenticity. It protects against DNS-based attacks and can block ads, malware, and adult content. I can help you choose the best DNS server or configure security features.";
    }
    
    // I2P related responses
    if (message.includes('i2p') || message.includes('invisible internet')) {
      return "I2P (Invisible Internet Project) is a distributed anonymous network. It's different from Tor as it's designed for anonymous communication rather than web browsing. I can help you set up I2P tunnels or access I2P sites.";
    }
    
    // VPN related responses
    if (message.includes('vpn') || message.includes('spn') || message.includes('tunnel')) {
      return "VPN/SPN (Secure Private Network) creates an encrypted tunnel for your internet traffic. It's excellent for protecting your data on public Wi-Fi and bypassing geo-restrictions. Would you like help configuring VPN settings?";
    }
    
    // Security related responses
    if (message.includes('security') || message.includes('privacy') || message.includes('safe')) {
      return "PrivacyGuard Pro combines multiple privacy technologies for maximum protection. For best security, I recommend using Tor + DNSCrypt + VPN together. Each tool protects different aspects of your online privacy.";
    }
    
    // General help
    if (message.includes('help') || message.includes('how')) {
      return "I can help you with:\n• Tor configuration and onion sites\n• DNSCrypt setup and DNS servers\n• I2P network and tunnels\n• VPN/SPN configuration\n• Security best practices\n• Troubleshooting privacy issues\n\nWhat would you like to know more about?";
    }
    
    // Default responses
    const responses = [
      "That's an interesting question! Could you provide more details about what you'd like to know?",
      "I'd be happy to help you with that. Could you be more specific about your privacy needs?",
      "PrivacyGuard Pro offers multiple layers of protection. Which specific feature would you like to learn about?",
      "I can help you configure any of the privacy tools in this application. What would you like to set up?",
      "For maximum privacy, I recommend using multiple tools together. Would you like me to explain how to combine them effectively?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: getAIResponse(inputText),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-end p-4 ${theme.cyberpunk ? 'bg-black/50 backdrop-blur-sm' : 'bg-gray-900/50'}`}>
      <div className={`w-full max-w-md h-96 rounded-xl shadow-2xl flex flex-col ${
        theme.cyberpunk 
          ? 'bg-gradient-to-b from-gray-900 to-black border border-purple-500/50' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme.cyberpunk ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}>
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h3 className={`font-semibold ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
                PrivacyGuard AI
              </h3>
              <p className={`text-xs ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              theme.cyberpunk 
                ? 'hover:bg-purple-900/50 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.isUser
                    ? theme.cyberpunk
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-blue-500 text-white'
                    : theme.cyberpunk
                    ? 'bg-gray-800 text-gray-200 border border-gray-700'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isUser 
                    ? 'text-purple-100' 
                    : theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`px-4 py-2 rounded-lg ${
                theme.cyberpunk 
                  ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${theme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'}`}>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about privacy tools..."
              className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                theme.cyberpunk
                  ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-purple-500'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-500 border border-gray-300 focus:ring-blue-500'
              }`}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !inputText.trim() || isTyping
                  ? theme.cyberpunk
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};