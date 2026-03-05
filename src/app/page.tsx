"use client";

import React, { useState, useMemo } from "react";
import VideoUploader from "@/components/VideoUploader";
import TranscriptViewer from "@/components/TranscriptViewer";
import type { Utterance } from "@/types";

type Tab = "upload" | "transcript";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});

  // Build the full transcript text for export
  const transcriptText = useMemo(() => {
    if (utterances.length === 0) return "";
    return utterances
      .map(
        (u) =>
          `${speakerMap[u.speaker] || `Hablante ${u.speaker}`}: ${u.text}`
      )
      .join("\n\n");
  }, [utterances, speakerMap]);

  const handleTranscriptionComplete = (data: {
    utterances: Utterance[];
    speakerMap: Record<string, string>;
  }) => {
    setUtterances(data.utterances);
    setSpeakerMap(data.speakerMap);
    setActiveTab("transcript");
  };

  const handleExportTxt = () => {
    const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcripcion.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = transcriptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const tabs: { id: Tab; label: string; icon: string; disabled: boolean }[] = [
    { id: "upload", label: "Subir Video", icon: "📤", disabled: false },
    {
      id: "transcript",
      label: "Transcripción",
      icon: "📝",
      disabled: utterances.length === 0,
    },
  ];

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Background decorative blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="text-center mb-10 animate-slideUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 text-sm text-purple-300">
            <span className="animate-pulse">●</span>
            Impulsado por IA
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-3">
            Asistente Transcriptor
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Sube un video, obtén la transcripción precisa separada por hablantes
            y exporta el resultado
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="flex justify-center mb-8 animate-slideUp" style={{ animationDelay: "100ms" }}>
          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  relative px-6 sm:px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                  ${activeTab === tab.id
                    ? "bg-white/10 text-white shadow-lg shadow-purple-500/10"
                    : tab.disabled
                      ? "text-white/20 cursor-not-allowed"
                      : "text-white/50 hover:text-white/70 hover:bg-white/5"
                  }
                `}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <main
          className="glass-card-strong p-6 sm:p-8 animate-slideUp"
          style={{ animationDelay: "200ms" }}
        >
          {activeTab === "upload" && (
            <div className="animate-fadeIn">
              <VideoUploader
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="animate-fadeIn">
              {/* Export buttons */}
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white/80 transition-all duration-300 flex items-center gap-2"
                >
                  📋 Copiar texto
                </button>
                <button
                  onClick={handleExportTxt}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 border border-purple-500/20 rounded-lg text-white/80 hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                  💾 Exportar .txt
                </button>
              </div>

              <TranscriptViewer
                utterances={utterances}
                speakerMap={speakerMap}
                onSpeakerMapChange={setSpeakerMap}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 text-white/20 text-xs">
          <p>
            Asistente Transcriptor • Powered by AssemblyAI
          </p>
        </footer>
      </div>
    </div>
  );
}
