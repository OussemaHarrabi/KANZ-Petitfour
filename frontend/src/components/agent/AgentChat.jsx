import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'

export function AgentChat({ stockCode = null, className = '' }) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Show greeting on mount
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: t('agent.greeting')
    }])
  }, [t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      // Call the agent API
      const response = await api.agent.chat(userMessage, history)
      
      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''

        // Add empty assistant message that will be updated
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              assistantMessage += data
              
              // Update the last message
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage
                }
                return updated
              })
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = await response.json?.() || response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response || data.content || 'Je suis desole, une erreur est survenue.'
        }])
      }
    } catch (error) {
      console.error('Agent chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Je suis desole, une erreur est survenue. Veuillez reessayer.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-surface-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-surface-900">{t('agent.title')}</h3>
          {stockCode && (
            <p className="text-xs text-surface-500">Analysant {stockCode}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-primary-100' 
                : 'bg-gradient-to-br from-primary-500 to-primary-600'
            }`}>
              {message.role === 'user' 
                ? <User className="w-4 h-4 text-primary-600" />
                : <Bot className="w-4 h-4 text-white" />
              }
            </div>
            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-2 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tr-sm'
                  : 'bg-surface-100 text-surface-900 rounded-tl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-100 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span className="text-sm text-surface-500">{t('agent.thinking')}</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-surface-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('agent.placeholder')}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-surface-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
