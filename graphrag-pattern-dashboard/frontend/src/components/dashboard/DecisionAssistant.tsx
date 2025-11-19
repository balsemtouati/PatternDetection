import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { BusinessType, ChatMessage } from '../../types';
import { getAIResponse } from '../../utils/aiResponse';

interface DecisionAssistantProps {
  businessType: BusinessType;
}

const DecisionAssistant: React.FC<DecisionAssistantProps> = ({ businessType }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: getAIResponse(currentMessage, businessType),
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
    
    setCurrentMessage('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Decision Assistant</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI Decision Support</h3>
          <p className="text-sm text-gray-600">Ask for strategic recommendations and decision guidance</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Start a conversation to get decision support</p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-orange-200' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask for decision guidance..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Questions</h3>
          <div className="space-y-2">
            {businessType === 'sales' && (
              <>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "What's the best time to launch our Q1 sales campaign?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "Should we focus on enterprise or SMB clients?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "How can we improve our lead conversion rate?"
                </button>
              </>
            )}
            {businessType === 'marketing' && (
              <>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "How should we respond to competitor pricing changes?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "What marketing channels should we prioritize?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "Should we launch a competitive campaign?"
                </button>
              </>
            )}
            {businessType === 'both' && (
              <>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "How can we align sales and marketing better?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "What's our optimal customer acquisition strategy?"
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                  "Should we adjust our budget allocation?"
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Recommendations</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Optimize Q4 Strategy</p>
              <p className="text-xs text-green-600">Based on historical patterns</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Adjust Pricing Model</p>
              <p className="text-xs text-blue-600">Competitive analysis insight</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-800">Expand Market Segment</p>
              <p className="text-xs text-orange-600">Growth opportunity identified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionAssistant; 