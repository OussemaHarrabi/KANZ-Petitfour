import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hello! I\'m your AI trading assistant. I can help you with market analysis, investment strategies, or answer any questions about your portfolio. How can I help you today?'
  }
]

const quickReplies = [
  'How is my portfolio doing?',
  'What stocks should I watch?',
  'Explain market trends',
  'Help me reduce risk',
]

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const responses = [
        'Based on your portfolio analysis, your holdings are well-diversified across sectors. BIAT and SFBT are your strongest performers.',
        'I recommend keeping an eye on UIB - our AI model predicts a potential 5% upside in the next week based on technical indicators.',
        'Your portfolio has a moderate risk profile. Consider adding some defensive stocks like STAR to balance your exposure.',
        'The TUNINDEX is showing bullish momentum. Banking sector stocks tend to perform well in this environment.',
        'Looking at your watchlist, SAH is approaching your target price of 18.00 TND. You might want to set up a buy order.',
      ]
      const response = responses[Math.floor(Math.random() * responses.length)]
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickReply = (reply) => {
    setInput(reply)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30',
          'flex items-center justify-center hover:scale-105 transition-transform z-50',
          isOpen && 'hidden'
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-elevated border border-surface-200 flex flex-col z-50 animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900">AI Assistant</h3>
                <p className="text-xs text-success-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                  Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500' 
                    : 'bg-surface-200'
                )}>
                  {msg.role === 'assistant' 
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-surface-600" />
                  }
                </div>
                <div className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                  msg.role === 'assistant'
                    ? 'bg-surface-100 text-surface-900 rounded-tl-sm'
                    : 'bg-primary-500 text-white rounded-tr-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-surface-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-pulse" />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-full text-xs text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-surface-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:hover:shadow-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
