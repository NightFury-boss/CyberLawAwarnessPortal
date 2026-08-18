import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your Cyber Law Assistant. I can help you understand the Information Technology Act, 2000, explain cybercrime categories, locate resources, and find safety guidelines.\n\nAsk me something like:\n- *What is Section 66D?*\n- *How do UPI scams work?*\n- *How do I report a cyber fraud?*"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await api.askAssistant(userText);
      setMessages(prev => [...prev, { sender: 'bot', text: response.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Error connecting to Assistant: ${err.message || 'Server offline'}. Please check if the backend is running.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="btn btn-primary"
          style={{
            borderRadius: '50px',
            width: '60px',
            height: '60px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
            fontSize: '1.5rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Cyber Law Assistant"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="assistant-widget" style={{
          width: '380px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          bottom: '0',
          right: '0',
          position: 'relative'
        }}>
          {/* Header */}
          <div className="assistant-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3>⚖️ Cyber Law Assistant</h3>
            <button
              onClick={toggleOpen}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="assistant-messages">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`assistant-message ${m.sender === 'user' ? 'msg-user' : 'msg-bot'}`}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="assistant-message msg-bot text-muted">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="assistant-input-area">
            <input
              type="text"
              className="form-control"
              placeholder="Ask about sections or crimes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              style={{ flex: 1, borderRadius: '4px 0 0 4px', borderRight: 'none' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !input.trim()}
              style={{ borderRadius: '0 4px 4px 0' }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AssistantWidget;
