import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, Video, PhoneOff, Mic, MicOff, VideoOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { chatApi } from '../../api/chatApi';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'audio' | 'video';
  recipientName: string;
  recipientAvatar?: string;
  roomId?: number | string;
  recipientId?: number | string;
  isIncoming?: boolean;
  incomingCallData?: any;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  callType,
  recipientName,
  recipientAvatar,
  roomId,
  recipientId,
  isIncoming = false,
  incomingCallData
}) => {
  const [callState, setCallState] = useState<'calling' | 'ringing' | 'active' | 'ended'>('calling');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callId, setCallId] = useState<number | null>(incomingCallData?.call_id || null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (isIncoming && incomingCallData) {
        setCallState('ringing');
        setCallId(incomingCallData.call_id);
      } else {
        initiateNewCall();
      }
    } else {
      cleanupCallSession();
    }
  }, [isOpen]);

  const initiateNewCall = async () => {
    try {
      setCallState('calling');
      const payload = {
        room_id: Number(roomId || 0),
        receiver_id: Number(recipientId || 0),
        call_type: callType
      };
      const res = await chatApi.initiateCall(payload);
      const newCallId = res.call_id || res.id || Date.now();
      setCallId(newCallId);

      // Acquire local audio/video media tracks
      await setupLocalMedia();
      setupWebRTCConnection(newCallId);
    } catch (err) {
      console.warn('[CallModal] Initiate call fallback to local session:', err);
      setupLocalMedia();
      setCallState('calling');
    }
  };

  const setupLocalMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('[CallModal] Media devices permission warning:', err);
    }
  };

  const setupWebRTCConnection = async (cId: number) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          chatApi.sendCallSignal(cId, { caller_candidates: JSON.stringify(event.candidate) }).catch(() => {});
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await chatApi.sendCallSignal(cId, { sdp_offer: JSON.stringify(offer) }).catch(() => {});

      peerConnectionRef.current = pc;
    } catch (err) {
      console.warn('[CallModal] WebRTC setup notice:', err);
    }
  };

  const handleAcceptCall = async () => {
    if (!callId) return;
    try {
      await chatApi.respondToCall(callId, { action: 'accept' });
      await setupLocalMedia();
      setCallState('active');
      startCallTimer();
    } catch (err) {
      setCallState('active');
      startCallTimer();
    }
  };

  const handleRejectCall = async () => {
    if (callId) {
      chatApi.respondToCall(callId, { action: 'reject' }).catch(() => {});
    }
    setCallState('ended');
    cleanupCallSession();
    onClose();
  };

  const handleEndCall = async () => {
    if (callId) {
      chatApi.endCall(callId).catch(() => {});
    }
    setCallState('ended');
    cleanupCallSession();
    onClose();
  };

  const startCallTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupCallSession = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallDuration(0);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleEndCall} title={callType === 'video' ? 'Vivah Video Call' : 'Vivah Audio Call'}>
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 bg-stone-950 text-white rounded-3xl relative overflow-hidden">
        
        {/* Video Viewport Stage */}
        {callType === 'video' ? (
          <div className="relative w-full aspect-video bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center shadow-inner">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-3 right-3 w-28 aspect-video rounded-xl object-cover border-2 border-amber-400 shadow-md bg-black"
            />
          </div>
        ) : (
          /* Audio Call Avatar Stage */
          <div className="relative my-4">
            <div className="h-28 w-28 rounded-3xl overflow-hidden ring-4 ring-[#8B1E3F]/40 shadow-xl mx-auto bg-stone-800">
              <img
                src={recipientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'}
                alt={recipientName}
                className="w-full h-full object-cover"
              />
            </div>
            {callState === 'active' && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-stone-950">
                <ShieldCheck className="h-4 w-4" />
              </span>
            )}
          </div>
        )}

        {/* Recipient Name & Status Bar */}
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-xl text-white tracking-wide">{recipientName}</h3>
          <p className="text-xs font-mono font-bold text-amber-300">
            {callState === 'active'
              ? formatDuration(callDuration)
              : isIncoming
                ? 'Incoming Call Request...'
                : 'Ringing Vivah Member...'}
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-4 pt-4 border-t border-stone-800/80 w-full justify-center">
          {isIncoming && callState === 'ringing' ? (
            <>
              <Button
                variant="primary"
                onClick={handleAcceptCall}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-xs"
              >
                <PhoneCall className="h-4 w-4 mr-2" /> Accept
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectCall}
                className="bg-rose-600 hover:bg-rose-700 border-none text-white px-6 py-3 rounded-2xl font-bold text-xs"
              >
                <PhoneOff className="h-4 w-4 mr-2" /> Decline
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3.5 rounded-2xl transition-colors ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {callType === 'video' && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-2xl transition-colors ${
                    isVideoOff ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              )}

              <Button
                variant="outline"
                onClick={handleEndCall}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none px-6 py-3 rounded-2xl font-bold text-xs"
              >
                <PhoneOff className="h-4 w-4 mr-2" /> End Call
              </Button>
            </>
          )}
        </div>

      </div>
    </Modal>
  );
};
