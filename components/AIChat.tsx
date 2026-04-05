"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Download,
  Loader2,
  User,
  Bot,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { generatePDF } from "@/utils/pdfGenerator";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  file?: File;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Hello! I am your AI Medical Assistant. How can I help you today? You can describe your symptoms or upload a prescription for analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = (content: string) => {
    generatePDF(content, "MediAI-Report.pdf");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content: input,
      file: file || undefined,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setFile(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (newUserMsg.content) formData.append("text", newUserMsg.content);
      if (newUserMsg.file) formData.append("file", newUserMsg.file);

      const res = await fetch("/api/ai-report", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "ai", content: data.report },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            content: `Error: ${data.message}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "Sorry, an error occurred while processing your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Medical Assistant</h3>
          <p className="text-xs text-blue-600 font-medium">
            Powered by Gemini 3.1 Pro
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-gray-200" : "bg-blue-100"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-5 w-5 text-gray-600" />
              ) : (
                <Bot className="h-5 w-5 text-blue-600" />
              )}
            </div>

            <div
              className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}
            >
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.file && (
                  <div className="flex items-center gap-2 mb-2 text-sm bg-black/10 p-2 rounded-lg">
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">
                      {msg.file.name}
                    </span>
                  </div>
                )}
                {msg.role === "ai" ? (
                  <div className="prose prose-sm max-w-none prose-blue">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {msg.role === "ai" && msg.id !== "1" && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedId === msg.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(msg.content)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-500">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {file && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm inline-flex">
            <Paperclip className="h-4 w-4" />
            <span className="truncate max-w-[200px]">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="ml-2 hover:text-blue-900"
            >
              &times;
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            accept="image/*,.pdf"
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            className="flex-1 max-h-32 min-h-[44px] p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && !file)}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
