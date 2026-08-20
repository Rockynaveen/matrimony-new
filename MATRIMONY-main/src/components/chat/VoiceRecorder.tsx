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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
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
    <div className="p-3 bg-stone-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg w-full animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="h-3.5 w-3.5 rounded-full bg-rose-500 animate-ping absolute" />
          <Mic className="h-4 w-4 text-rose-400 relative z-10" />
        </div>
        <span className="font-mono text-xs font-bold text-amber-300">
          {formatTime(recordingTime)}
        </span>
        <span className="text-[11px] text-stone-300 font-medium">Recording voice message...</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            stopRecordingCleanup();
            onCancel();
          }}
          className="p-1.5 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-rose-400 transition-colors"
          title="Cancel Voice Note"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {isRecording && (
          <button
            type="button"
            onClick={handleStopAndPreview}
            className="p-1.5 hover:bg-stone-800 rounded-xl text-amber-400 transition-colors text-xs font-bold flex items-center gap-1"
            title="Stop Recording"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        )}

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={handleSend}
          disabled={isSubmitting}
          className="bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-8 px-3 rounded-xl font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1" /> Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
