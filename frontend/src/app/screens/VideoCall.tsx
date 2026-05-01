import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api";
import { Mic, MicOff, Video, VideoOff, MessageSquare, Phone, Maximize2, MoreVertical } from "lucide-react";
import { DemoNav } from "../components/DemoNav";

export function VideoCall() {
  const { appointmentId } = useParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Determine the socket url from API_BASE_URL
    const socketUrl = API_BASE_URL.replace("/api", "");

    const socket = io(socketUrl);
    socketRef.current = socket;

    // We use a mock UUID for user
    const userId = Math.random().toString(36).substring(7);
    const roomId = appointmentId || "demo-room";

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit("join-room", roomId, userId);

        socket.on("user-connected", async (newUserId) => {
          console.log("User connected: ", newUserId);
          setRemoteConnected(true);
          initiateCall(newUserId, stream, roomId);
        });

        socket.on("signal", async ({ data }) => {
          if (!peerRef.current) {
            handleReceiveCall(data, stream, roomId);
          } else {
            if (data.sdp) {
              await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } else if (data.candidate) {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          }
        });

        socket.on("user-disconnected", () => {
          console.log("User disconnected");
          setRemoteConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
          }
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });

    return () => {
      socket.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [appointmentId]);

  const initiateCall = async (newUserId: string, stream: MediaStream, roomId: string) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("signal", { roomId, data: { candidate: event.candidate } });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.emit("signal", { roomId, data: { sdp: peer.localDescription } });
  };

  const handleReceiveCall = async (data: any, stream: MediaStream, roomId: string) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("signal", { roomId, data: { candidate: event.candidate } });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    if (data.sdp) {
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current?.emit("signal", { roomId, data: { sdp: peer.localDescription } });
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStreamRef.current.getAudioTracks()[0]?.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!localStreamRef.current.getVideoTracks()[0]?.enabled);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <DemoNav />
      <div className="flex-1 md:ml-64 flex flex-col relative overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 text-white z-20">
          <Link to="/" className="p-2 bg-gray-700 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Call</span>
          </div>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
      
      {/* Doctor Video (Main / Remote) */}
      <div className="absolute inset-0">
        {!remoteConnected ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 z-0">
            <div className="w-16 h-16 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg font-medium">Waiting for doctor to join...</p>
          </div>
        ) : (
          <video 
            ref={remoteVideoRef}
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50 pointer-events-none" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 p-6 flex items-start justify-between">
        <div className="bg-gray-900/60 backdrop-blur-md px-4 py-3 rounded-2xl">
          <p className="text-white text-sm" style={{ fontWeight: 600 }}>Dr. Rajesh Kumar</p>
          <p className="text-white/70 text-xs">Cardiologist</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs">12:34</span>
          </div>
        </div>
        <button className="bg-gray-900/60 backdrop-blur-md p-3 rounded-full">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* AI Symptom Summary Overlay */}
      {showAISummary && (
        <div className="relative z-10 mx-6 mt-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center">
                  <span className="text-white text-xs" style={{ fontWeight: 600 }}>AI</span>
                </div>
                <h4 className="text-sm text-gray-900" style={{ fontWeight: 600 }}>AI Symptom Summary</h4>
              </div>
              <button onClick={() => setShowAISummary(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full" style={{ fontWeight: 500 }}>
                  High Urgency
                </span>
                <span className="text-xs text-gray-600">Chest pain</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Patient reports chest pain for 1 hour, mild discomfort, no prior cardiac history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Video (Local / PiP) */}
      <div className="absolute top-24 right-6 z-20">
        <div className="w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-gray-800">
          {!isVideoOff ? (
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover [transform:scaleX(-1)]"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white/50" />
            </div>
          )}
        </div>
        <button className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
          <Maximize2 className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-center justify-around">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Chat Button */}
            <button className="w-14 h-14 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all relative">
              <MessageSquare className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0A66C2] rounded-full text-white text-xs flex items-center justify-center">
                2
              </span>
            </button>

            {/* End Call Button */}
            <Link to="/medical-records">
              <button className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg">
                <Phone className="w-6 h-6 text-white [transform:rotate(135deg)]" />
              </button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-white/70 text-xs">
              Secure end-to-end encrypted connection
            </p>
          </div>
        </div>
      </div>

      {/* Connection Quality Indicator */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-gray-900/60 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-green-500 rounded-full" />
            <div className="w-1 h-4 bg-green-500 rounded-full" />
            <div className="w-1 h-5 bg-green-500 rounded-full" />
            <div className="w-1 h-3 bg-gray-500 rounded-full" />
          </div>
          <span className="text-white text-xs" style={{ fontWeight: 500 }}>Good</span>
        </div>
      </div>
      </div>
    </div>
  );
}
