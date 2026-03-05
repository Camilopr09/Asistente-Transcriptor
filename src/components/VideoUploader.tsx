"use client";

import React, { useState, useRef, useCallback } from "react";

interface VideoUploaderProps {
    onTranscriptionComplete: (data: {
        utterances: { speaker: string; text: string; start: number; end: number }[];
        speakerMap: Record<string, string>;
    }) => void;
}

export default function VideoUploader({
    onTranscriptionComplete,
}: VideoUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<
        "idle" | "uploading" | "processing" | "done" | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setErrorMessage("");
        setStatus("idle");
        setProgress(0);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFile(droppedFile);
            }
        },
        [handleFile]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                handleFile(selectedFile);
            }
        },
        [handleFile]
    );

    const startUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        setProgress(0);
        setErrorMessage("");

        // Simulate upload progress
        let currentProgress = 0;
        progressIntervalRef.current = setInterval(() => {
            currentProgress += Math.random() * 8;
            if (currentProgress > 30) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                setProgress(30);
                setStatus("processing");
                // Start processing simulation
                progressIntervalRef.current = setInterval(() => {
                    currentProgress += Math.random() * 3;
                    if (currentProgress > 90) {
                        currentProgress = 90;
                    }
                    setProgress(Math.min(currentProgress, 90));
                }, 2000);
            }
            setProgress(Math.min(currentProgress, 30));
        }, 300);

        try {
            const formData = new FormData();
            formData.append("video", file);

            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al procesar el video.");
            }

            setProgress(100);
            setStatus("done");

            const data = await response.json();
            onTranscriptionComplete(data);
        } catch (err) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setStatus("error");
            setErrorMessage(
                err instanceof Error ? err.message : "Error desconocido."
            );
        }
    };

    const resetUploader = () => {
        setFile(null);
        setStatus("idle");
        setProgress(0);
        setErrorMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Drop Zone */}
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => status === "idle" && fileInputRef.current?.click()}
                className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed 
          transition-all duration-500 cursor-pointer group
          ${isDragging
                        ? "border-purple-400 bg-purple-500/10 scale-[1.02] shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                        : status === "idle"
                            ? "border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-purple-500/5"
                            : status === "done"
                                ? "border-emerald-400/50 bg-emerald-500/5"
                                : status === "error"
                                    ? "border-red-400/50 bg-red-500/5"
                                    : "border-purple-500/30 bg-purple-500/5"
                    }
        `}
            >
                {/* Animated background gradient */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 transition-opacity duration-500 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                />

                <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6">
                    {/* Icon */}
                    <div
                        className={`mb-4 p-4 rounded-2xl transition-all duration-500 ${status === "done"
                                ? "bg-emerald-500/20"
                                : status === "error"
                                    ? "bg-red-500/20"
                                    : "bg-white/10 group-hover:bg-purple-500/20"
                            }`}
                    >
                        {status === "done" ? (
                            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : status === "error" ? (
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg
                                className={`w-10 h-10 transition-all duration-500 ${isDragging
                                        ? "text-purple-400 scale-110"
                                        : "text-white/50 group-hover:text-purple-400"
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Text */}
                    {!file && status === "idle" && (
                        <>
                            <p className="text-lg font-medium text-white/90 mb-1">
                                {isDragging
                                    ? "Suelta tu archivo aquí"
                                    : "Arrastra y suelta tu video"}
                            </p>
                            <p className="text-sm text-white/40">
                                o haz clic para seleccionar • MP4, MOV, WEBM, AVI, MP3, WAV
                            </p>
                        </>
                    )}

                    {file && status === "idle" && (
                        <div className="text-center">
                            <p className="text-lg font-medium text-white/90 mb-1 truncate max-w-md">
                                📁 {file.name}
                            </p>
                            <p className="text-sm text-white/40 mb-4">
                                {formatFileSize(file.size)}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startUpload();
                                    }}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-95"
                                >
                                    🚀 Transcribir
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetUploader();
                                    }}
                                    className="px-6 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium text-white/70 transition-all duration-300"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    )}

                    {(status === "uploading" || status === "processing") && (
                        <div className="w-full max-w-sm text-center">
                            <p className="text-lg font-medium text-white/90 mb-1">
                                {status === "uploading"
                                    ? "📤 Subiendo video..."
                                    : "🧠 Transcribiendo con IA..."}
                            </p>
                            <p className="text-sm text-white/40 mb-4">
                                {status === "uploading"
                                    ? "Preparando el archivo para su procesamiento"
                                    : "Esto puede tardar unos minutos, dependiendo de la duración del video"}
                            </p>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 to-blue-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-white/30 mt-2">
                                {Math.round(progress)}%
                            </p>
                        </div>
                    )}

                    {status === "done" && (
                        <div className="text-center">
                            <p className="text-lg font-medium text-emerald-400 mb-1">
                                ✅ ¡Transcripción completada!
                            </p>
                            <p className="text-sm text-white/40">
                                Revisa la transcripción en la pestaña correspondiente
                            </p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="text-center">
                            <p className="text-lg font-medium text-red-400 mb-1">
                                ❌ Error al procesar
                            </p>
                            <p className="text-sm text-red-300/60 mb-4">{errorMessage}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    resetUploader();
                                }}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium text-white/70 transition-all duration-300"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    );
}
