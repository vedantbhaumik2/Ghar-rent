import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { chatWithData } from '../services/geminiService';
import { useApp } from '../context/AppContext';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { renters, transactions } = useApp();

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    const answer = await chatWithData(query, renters, transactions);
    setResponse(answer || 'No response generated.');
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center gap-2 ${
          isOpen ? 'hidden' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Sparkles size={24} />
        <span className="font-medium hidden md:inline">Ask AI Helper</span>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="font-semibold">GharRent AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 p-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50">
            {response ? (
              <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-100 shadow-sm text-sm text-gray-800">
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4">
                <MessageSquare size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Ask about pending payments, renter details, or financial summaries.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <button onClick={() => setQuery("Who hasn't paid rent yet?")} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full hover:bg-gray-100">Who hasn't paid?</button>
                    <button onClick={() => setQuery("What is my total pending balance?")} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full hover:bg-gray-100">Total pending?</button>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAsk}
              disabled={isLoading || !query.trim()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
