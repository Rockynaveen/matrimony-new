import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob) => Promise<void>;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Microphone access permission was denied or is not supported.');
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleStopAndPreview = () => {
    stopRecordingCleanup();
  };

  const handleSend = async () => {
    try {
      setIsSubmitting(true);
      if (isRecording) {
        stopRecordingCleanup();
      }
      const blobToSend = audioBlob || new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (blobToSend && blobToSend.size > 0) {
        await onSendVoice(blobToSend);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3 bg-stone-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg w-full animate-fade-in">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="h-3.5 w-3.5 rounded-full bg-rose-500 animate-ping absolute" />
              <Mic className="h-4 w-4 text-rose-400 relative z-10" />
            </div>
            <span className="font-mono text-xs font-bold text-amber-300">
              {formatTime(recordingTime)}
            </span>
            <span className="text-[11px] text-stone-300 font-medium truncate">Recording voice note...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold text-amber-300">Voice Note Preview:</span>
            {previewUrl && (
              <audio src={previewUrl} controls className="h-8 max-w-[220px] rounded-lg border border-stone-700" />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => {
            stopRecordingCleanup();
            onCancel();
          }}
          className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-rose-400 transition-colors"
          title="Cancel Voice Note"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {isRecording && (
          <button
            type="button"
            onClick={handleStopAndPreview}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 border border-amber-400/30"
            title="Stop & Preview"
          >
            <Square className="h-3.5 w-3.5 fill-current" /> Stop
          </button>
        )}

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={handleSend}
          disabled={isSubmitting}
          className="bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-9 px-4 rounded-xl font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1" /> Send Voice
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
