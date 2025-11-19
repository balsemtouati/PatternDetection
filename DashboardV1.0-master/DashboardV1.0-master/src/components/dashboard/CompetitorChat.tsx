import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, Lightbulb, AlertTriangle, Clock } from 'lucide-react';
import CompetitorChatService from '../../services/competitorChatService';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const CompetitorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceHealthy, setIsServiceHealthy] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatService = new CompetitorChatService();

  useEffect(() => {
    checkServiceHealth();
    // Add welcome message
    setMessages([{
      id: '1',
      text: "👋 Hello! I'm your Competitive Intelligence Assistant powered by MURAG.\n\n🔍 I can help you analyze competitor strategies, market positioning, technology choices, and more.\n\n💡 Upload competitor PDF documents to the 'pdfs' folder to enhance my knowledge base, then ask me anything about your competitive landscape!",
      isUser: false,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServiceHealth = async () => {
    try {
      const healthy = await chatService.healthCheck();
      setIsServiceHealthy(healthy);
    } catch (error) {
      setIsServiceHealthy(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "Analyzing competitor information...",
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatService.askCompetitor(inputMessage.trim());
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const botResponse: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: response.success ? response.answer || 'No response received' : `Error: ${response.error}`,
          isUser: false,
          timestamp: new Date()
        };
        return [...withoutLoading, botResponse];
      });
    } catch (error) {
      // Remove loading message and add error
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isUser: false,
          timestamp: new Date()
        };
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuery = (query: string) => {
    setInputMessage(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text: string) => {
    // Simple formatting for better readability
    return text
      .split('\n')
      .map((line, index) => (
        <div key={index} className={line.trim() === '' ? 'mb-2' : ''}>
          {line.startsWith('**') && line.endsWith('**') ? (
            <strong className="text-gray-900">{line.slice(2, -2)}</strong>
          ) : line.startsWith('🎯') ? (
            <div className="font-semibold text-blue-700 mt-3 mb-2">{line}</div>
          ) : line.startsWith('💬') ? (
            <div className="font-semibold text-green-700 mt-3 mb-2">{line}</div>
          ) : line.startsWith('---') ? (
            <hr className="my-4 border-gray-200" />
          ) : (
            <span>{line}</span>
          )}
        </div>
      ));
  };

  const exampleQueries = chatService.getExampleQueries();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Competitor Intelligence Chat</h1>
              <p className="text-sm text-gray-600">Powered by MURAG - Recursive Pattern Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isServiceHealthy === null ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Checking...</span>
              </div>
            ) : isServiceHealthy ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-xs font-medium">Service Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Service Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Status Warning */}
      {isServiceHealthy === false && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Competitor Intelligence service is currently unavailable. Please ensure TOGETHER_API_KEY is configured.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Example Queries */}
      {messages.length <= 1 && (
        <div className="p-4 bg-white border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Example Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleQueries.slice(0, 4).map((example: any, index: number) => (
              <button
                key={index}
                onClick={() => handleExampleQuery(example.query)}
                disabled={isLoading || !isServiceHealthy}
                className="text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-blue-900 text-sm">{example.label}</div>
                <div className="text-blue-700 text-xs mt-1">{example.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-3xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-lg ${message.isUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {message.isUser ? (
                  <User className="h-5 w-5 text-blue-600" />
                ) : (
                  <Bot className="h-5 w-5 text-gray-600" />
                )}
              </div>
              
              <div className={`rounded-lg p-4 ${
                message.isUser 
                  ? 'bg-blue-600 text-white' 
                  : message.isLoading 
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm">{message.text}</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.isUser ? message.text : formatMessage(message.text)}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isServiceHealthy ? "Ask me about competitors, market strategies, technology choices..." : "Service unavailable - please configure TOGETHER_API_KEY"}
            disabled={isLoading || !isServiceHealthy}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || !isServiceHealthy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          📁 To enhance analysis, add competitor PDF files to the 'pdfs' folder in your backend directory
        </div>
      </div>
    </div>
  );
};

export default CompetitorChat;
