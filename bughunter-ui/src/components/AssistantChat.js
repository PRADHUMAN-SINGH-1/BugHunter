import { Bot, ShieldCheck, UserRound } from "lucide-react";
import { ChatInput } from "./ChatInput";

export function AssistantChat({ messages, onSend, isWorking }) {
  return <section className="assistant-panel panel">
    <div className="panel-heading assistant-heading">
      <div className="heading-icon"><ShieldCheck size={20} /></div>
      <div><p className="eyebrow">AI SECURITY WORKSPACE</p><h2>Security conversation</h2></div>
      <span className={`live-pill ${isWorking ? "working" : ""}`}><span /> {isWorking ? "Analyzing" : "Ready"}</span>
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
