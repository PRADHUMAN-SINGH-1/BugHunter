import { ArrowUp, Sparkles } from "lucide-react";
import { useState } from "react";

const suggestions = [
  "Analyze https://staging.example.com",
  "Review https://demo.example.com",
  "Check authentication at https://staging.example.com/login"
];

export function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return <div className="chat-input-wrap">
    <form className="chat-input" onSubmit={submit}>
      <Sparkles size={19} className="chat-input-icon" />
      <textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Describe an authorized target, for example: Analyze https://staging.example.com" rows="2" aria-label="Security request" />
      <button className="send-button" type="submit" disabled={disabled || !value.trim()} aria-label="Send request"><ArrowUp size={20} /></button>
    </form>
    <div className="suggestion-row">
      {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setValue(suggestion)}>{suggestion}</button>)}
    </div>
  </div>;
}
