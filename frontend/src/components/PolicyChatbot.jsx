import React, { useState, useEffect, useRef } from 'react';
import { SUGGESTED_CHAT_QUESTIONS } from '../utils/constants';
import { askPolicyQuestion, getAiStatus } from '../services/api';

/**
 * PolicyChatbot Component (Phase 6)
 * Conversational policy assistant answering questions grounded exclusively
 * in the currently analyzed privacy policy document.
 *
 * @param {{
 *   policyText?: string,
 *   analysisReport?: object | null,
 *   isStale?: boolean
 * }} props
 */
export function PolicyChatbot({ policyText, analysisReport, isStale }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [aiStatus, setAiStatus] = useState({ checked: false, configured: false, model: '' });

  const messagesEndRef = useRef(null);
  const currentPolicyRef = useRef(policyText);

  const hasAnalyzedPolicy = Boolean(
    analysisReport &&
    typeof policyText === 'string' &&
    policyText.trim().length > 0 &&
    !isStale
  );

  // Check AI provider status on mount
  useEffect(() => {
    let isMounted = true;
    getAiStatus().then((res) => {
      if (isMounted && res.success && res.data) {
        setAiStatus({
          checked: true,
          configured: Boolean(res.data.configured),
          model: res.data.model || 'gpt-4o-mini',
        });
      } else if (isMounted) {
        setAiStatus({ checked: true, configured: false, model: '' });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Context invalidation: when analyzed policy text changes or is cleared, reset chat history
  useEffect(() => {
    if (policyText !== currentPolicyRef.current || isStale || !analysisReport) {
      currentPolicyRef.current = policyText;
      setMessages([]);
      setChatError(null);
    }
  }, [policyText, isStale, analysisReport]);

  // Scroll conversation area to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || question).trim();
    if (!q || isLoading) return;

    if (!hasAnalyzedPolicy) {
      setChatError('Please analyze a privacy policy in the workspace above first before asking questions.');
      return;
    }

    setChatError(null);
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setQuestion('');
    setIsLoading(true);

    // Format conversation history for API (bounded to last 4 turns)
    const conversationHistory = messages.slice(-4).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    const findingsSummary = analysisReport
      ? {
          totalFindings: analysisReport.summary?.totalFindings,
          categories: analysisReport.categories?.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            findingsCount: c.findings?.length || 0,
          })),
        }
      : null;

    const response = await askPolicyQuestion({
      policyText,
      question: q,
      conversationHistory,
      findingsSummary,
    });

    setIsLoading(false);

    if (response.success && response.data) {
      const assistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.data.answer,
        insufficientEvidence: response.data.insufficientEvidence,
        evidenceReferences: response.data.evidenceReferences || [],
        limitations: response.data.limitations || '',
        model: response.data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, assistantMessage]);
    } else {
      setChatError(response.error || 'Failed to receive an answer from the policy assistant.');
    }
  };

  const handleChipClick = (suggestedQ) => {
    setQuestion(suggestedQ);
    if (hasAnalyzedPolicy && !isLoading) {
      handleSend(suggestedQ);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatError(null);
    setQuestion('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section id="chatbot" className="content-section" aria-labelledby="chat-heading">
      <div className="app-container">
        <div className="section-header">
          <span className="section-tag">GROUNDED CONVERSATIONAL ASSISTANT</span>
          <h2 id="chat-heading" className="section-title">
            Policy Assistant — Ask About This Privacy Policy
          </h2>
          <p className="section-subtitle">
            Ask targeted, plain-language questions grounded strictly in the currently analyzed document.
            All answers cite verbatim clauses and honestly identify missing details.
          </p>
        </div>

        <div className="chat-workspace">
          {/* Policy context banner */}
          {!hasAnalyzedPolicy ? (
            <div className="chat-banner warning" role="status">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Document Required:</strong> Please paste and analyze a privacy policy in the workspace above first.
                The assistant answers questions grounded strictly in the active document.
              </span>
            </div>
          ) : !aiStatus.configured && aiStatus.checked ? (
            <div className="chat-banner info" role="status">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                <strong>AI Key Not Configured:</strong> Set <code>OPENAI_API_KEY</code> in the server <code>.env</code> file
                to enable live external AI responses. Deterministic policy analysis continues to operate normally.
              </span>
            </div>
          ) : (
            <div className="chat-banner success" role="status">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                <strong>Policy-Grounded Mode Active:</strong> Responses are generated strictly from the active policy text.
                The AI cannot invent clauses, numbers, or independent compliance verifications.
              </span>
            </div>
          )}

          {/* Conversation history display area */}
          <div
            className="chat-conversation-area"
            role="log"
            aria-live="polite"
            aria-label="Conversation with Policy Assistant"
          >
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <svg
                  className="chat-empty-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h3 className="chat-empty-title">Ready for Questions</h3>
                <p className="chat-empty-desc">
                  Select a suggested question below or type your own question about what this policy collects, shares,
                  retains, or promises.
                </p>
              </div>
            ) : (
              <div className="chat-messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <div className="message-header">
                      <span className="message-sender">
                        {msg.role === 'user' ? 'You' : 'PrivacyLens Assistant'}
                      </span>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>

                    <div className="message-body">
                      <p className="message-text">{msg.content}</p>

                      {/* Insufficient Evidence Warning Banner */}
                      {msg.insufficientEvidence && (
                        <div className="insufficient-evidence-badge" role="alert">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>Missing Policy Information: The document does not provide enough details to answer this.</span>
                        </div>
                      )}

                      {/* Verifiable Source Evidence Citations */}
                      {msg.evidenceReferences && msg.evidenceReferences.length > 0 && (
                        <div className="chat-evidence-block">
                          <div className="chat-evidence-label">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Verified Verbatim Excerpts from Policy:</span>
                          </div>
                          {msg.evidenceReferences.map((ref, rIdx) => (
                            <blockquote key={rIdx} className="chat-evidence-quote">
                              &ldquo;{ref.quote}&rdquo;
                              <span className="chat-evidence-offsets">
                                (Offsets: {ref.startOffset}–{ref.endOffset})
                              </span>
                            </blockquote>
                          ))}
                        </div>
                      )}

                      {/* Uncertainty or Boundary Limitations Note */}
                      {msg.limitations && (
                        <div className="chat-limitation-note">
                          <strong>Note:</strong> {msg.limitations}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-message-bubble assistant loading" aria-busy="true">
                    <div className="message-header">
                      <span className="message-sender">PrivacyLens Assistant</span>
                    </div>
                    <div className="chat-typing-indicator" aria-label="Analyzing policy and generating answer...">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Banner */}
          {chatError && (
            <div className="status-alert error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="status-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="error-text-container">
                <div className="status-title">Assistant Notice</div>
                <div>{chatError}</div>
              </div>
              <button
                type="button"
                className="btn-close-alert"
                onClick={() => setChatError(null)}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Suggested Question Chips */}
          <div className="suggested-prompts-label">
            Suggested Policy Questions {hasAnalyzedPolicy ? '(Click to Ask)' : '(Analyze Policy First)'}
          </div>
          <div className="prompt-chips-grid">
            {SUGGESTED_CHAT_QUESTIONS.map((qText, idx) => (
              <button
                key={idx}
                type="button"
                className="prompt-chip"
                onClick={() => handleChipClick(qText)}
                disabled={isLoading}
                title={hasAnalyzedPolicy ? `Ask: "${qText}"` : 'Please analyze a policy document first'}
              >
                {qText}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="chat-input-container">
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                placeholder={
                  !hasAnalyzedPolicy
                    ? 'Analyze a policy in the workspace above first to enable chat...'
                    : 'Ask a question about this policy (e.g., Does it sell personal data?)...'
                }
                disabled={!hasAnalyzedPolicy || isLoading}
                aria-label="Ask a question about this privacy policy"
                maxLength={500}
                id="chat-input-field"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSend()}
                disabled={!hasAnalyzedPolicy || !question.trim() || isLoading}
                aria-label="Send question to policy assistant"
                id="btn-send-chat"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-sm" aria-hidden="true" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Ask</span>
                  </>
                )}
              </button>
            </div>

            <div className="chat-controls-footer">
              <span className="chat-char-counter">
                {question.length} / 500 characters
              </span>

              {messages.length > 0 && (
                <button
                  type="button"
                  className="btn-text-link chat-clear-btn"
                  onClick={handleClearChat}
                  disabled={isLoading}
                  id="btn-clear-chat"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Clear Conversation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PolicyChatbot;
