import { Bot, ShieldCheck, UserRound } from "lucide-react";
import { ChatInput } from "./ChatInput";

export function AssistantChat({ messages, onSend, isWorking, onClear }) {
  return <section className="assistant-panel panel">
    <div className="assistant-header">
      <div className="assistant-tabs">
        <button type="button" className="assistant-tab active" onClick={() => document.querySelector(".reference-assistant-card")?.scrollIntoView({ behavior: "smooth", block: "start" })}><ShieldCheck size={14} /> AI Security Assistant</button>
        <button type="button" className="assistant-tab" onClick={() => document.querySelector(".tool-reference")?.scrollIntoView({ behavior: "smooth", block: "center" })}><Bot size={14} /> Assessment Console</button>
      </div>
      <div className="assistant-header-right">
        <span className={`live-pill ${isWorking ? "working" : ""}`}><span /> {isWorking ? "Analyzing" : "Ready"}</span>
        <button type="button" className="assistant-clear" onClick={onClear}>Clear</button>
      </div>
    </div>
    <div className="message-list" aria-live="polite">
      {messages.map((message) => <article key={message.id} className={`message ${message.role}`}>
        <div className="message-avatar">{message.role === "assistant" ? <Bot size={17} /> : <UserRound size={16} />}</div>
        <p>{message.content}</p>
      </article>)}
      {isWorking && <article className="message assistant typing"><div className="message-avatar"><Bot size={17} /></div><p><span /><span /><span /></p></article>}
    </div>
    <ChatInput onSend={onSend} disabled={isWorking} />
  </section>;
}
