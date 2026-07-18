import { useCallback, useEffect, useRef, useState } from "react";
import { runDemoAssessment, sendAssistantMessage } from "../api/client";

const timelineTemplate = [
  "Validating target",
  "Planning scan",
  "Inspecting headers",
  "Discovering endpoints",
  "Crawling application",
  "Correlating evidence",
  "Generating report"
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content: "Tell me what you want to analyze. I’ll build an evidence-first security plan before any scan begins."
};

export function useAssistant() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [gate, setGate] = useState(null);
  const [scanPlan, setScanPlan] = useState(null);
  const [timeline, setTimeline] = useState(timelineTemplate.map((label) => ({ label, state: "pending" })));
  const [isWorking, setIsWorking] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState(null);
  const requestRef = useRef({});
  const timelineTimer = useRef(null);

  const addMessage = useCallback((role, content) => {
    setMessages((current) => [...current, { id: `${Date.now()}-${Math.random()}`, role, content }]);
  }, []);

  const stopTimeline = useCallback((completed = false) => {
    window.clearInterval(timelineTimer.current);
    timelineTimer.current = null;
    if (completed) setTimeline(timelineTemplate.map((label) => ({ label, state: "complete" })));
  }, []);

  const startTimeline = useCallback(() => {
    stopTimeline();
    let active = 0;
    setTimeline(timelineTemplate.map((label, index) => ({ label, state: index === 0 ? "active" : "pending" })));
    timelineTimer.current = window.setInterval(() => {
      active = Math.min(active + 1, timelineTemplate.length - 1);
      setTimeline(timelineTemplate.map((label, index) => ({
        label,
        state: index < active ? "complete" : index === active ? "active" : "pending"
      })));
    }, 900);
  }, [stopTimeline]);

  useEffect(() => () => stopTimeline(), [stopTimeline]);

  const interpretResponse = useCallback((response) => {
    if (response.assistantMessage) addMessage("assistant", response.assistantMessage);
    if (response.scanPlan) setScanPlan(response.scanPlan);

    if (response.status === "needs_input") {
      if (/authorization/i.test(response.assistantMessage || "")) setGate({ kind: "authorization", targetUrl: response.targetUrl });
      else if (response.requiredInput === "activeTestingAllowed") setGate({ kind: "scope", targetUrl: response.targetUrl });
      return;
    }

    if (response.status === "awaiting_approval") setGate({ kind: "plan", targetUrl: response.targetUrl });
    if (response.status === "complete") {
      setGate(null);
      setAssessment({ executiveSummary: response.executiveSummary, findings: response.findings || [], report: response.report, executedTools: response.executedTools || [] });
      stopTimeline(true);
    }
  }, [addMessage, stopTimeline]);

  const callAssistant = useCallback(async (payload, { scanning = false } = {}) => {
    setIsWorking(true);
    setError(null);
    if (scanning) startTimeline();
    try {
      const response = await sendAssistantMessage(payload);
      interpretResponse(response);
      return response;
    } catch (error) {
      const message = error.message || "I could not complete that request.";
      setError(message);
      addMessage("assistant", `I couldn’t complete that request. ${message}`);
      stopTimeline();
      return null;
    } finally {
      setIsWorking(false);
    }
  }, [addMessage, interpretResponse, startTimeline, stopTimeline]);

  const sendMessage = useCallback(async (message) => {
    const cleaned = message.trim();
    if (!cleaned) return;
    requestRef.current = { message: cleaned };
    setAssessment(null);
    setError(null);
    setScanPlan(null);
    setGate(null);
    setTimeline(timelineTemplate.map((label) => ({ label, state: "pending" })));
    addMessage("user", cleaned);
    await callAssistant(requestRef.current);
  }, [addMessage, callAssistant]);

  const confirmAuthorization = useCallback(() => {
    requestRef.current = { ...requestRef.current, authorizationConfirmed: true };
    return callAssistant(requestRef.current);
  }, [callAssistant]);

  const chooseScope = useCallback((activeTestingAllowed) => {
    requestRef.current = { ...requestRef.current, authorizationConfirmed: true, activeTestingAllowed };
    return callAssistant(requestRef.current);
  }, [callAssistant]);

  const approvePlan = useCallback(() => {
    requestRef.current = { ...requestRef.current, authorizationConfirmed: true, approvalConfirmed: true };
    return callAssistant(requestRef.current, { scanning: true });
  }, [callAssistant]);

  const runDemo = useCallback(async () => {
    const startedAt = Date.now();
    setAssessment(null);
    setError(null);
    setScanPlan(null);
    setGate(null);
    addMessage("user", "Analyze the BugHunter AI demo application.");
    addMessage("assistant", "Demo mode started. I’m replaying deterministic scanner evidence from the safe BugHunter sample target.");
    setIsWorking(true);
    startTimeline();

    try {
      const response = await runDemoAssessment();
      // Give the timeline enough room to communicate the workflow without
      // making the judge demo depend on an external service or model latency.
      const remaining = Math.max(0, 3600 - (Date.now() - startedAt));
      if (remaining) await new Promise((resolve) => window.setTimeout(resolve, remaining));
      interpretResponse(response);
    } catch (demoError) {
      const message = demoError.message || "The demo assessment could not be loaded.";
      setError(message);
      addMessage("assistant", `Demo mode could not start. ${message}`);
      stopTimeline();
    } finally {
      setIsWorking(false);
    }
  }, [addMessage, interpretResponse, startTimeline, stopTimeline]);

  return {
    messages,
    gate,
    scanPlan,
    timeline,
    isWorking,
    assessment,
    error,
    sendMessage,
    confirmAuthorization,
    chooseScope,
    approvePlan,
    runDemo
  };
}
