import { useEffect, useRef, useState } from "react";

import { QrCodeIcon } from "@heroicons/react/24/outline";
import jsQR from "jsqr";

import Button from "~/components/button";

/**
 * Load the media stream into the video element and wait for it to start playing.
 * @param video - The video element to load the media stream into
 * @returns The {@link MediaStream}
 */
async function loadMediaStream(video: HTMLVideoElement) {
  const mediaStream = await startCamera();
  if (!mediaStream) {
    throw new Error("Could not access camera");
  }

  video.srcObject = mediaStream;
  await new Promise((resolve) => video.addEventListener("playing", resolve));

  return mediaStream;
}

/**
 * Start the camera
 * @returns The {@link MediaStream} or `null` if an error occurred
 */
async function startCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Scan for a QR code in the video stream
 * @param video - The video element to scan
 * @param context - The canvas context to draw the video frame to
 * @returns The QR code data or `null` if no QR code was found
 */
async function scan(
  video: HTMLVideoElement,
  context: CanvasRenderingContext2D
) {
  const canvas = context.canvas;
  // Match canvas size to video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  while (video.isConnected && video.srcObject) {
    await frame(video);

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      continue;
    }

    // Draw video frame to canvas
    const boundingBox = [0, 0, video.videoWidth, video.videoHeight] as const;
    context.drawImage(video, ...boundingBox);
    const videoFrame = context.getImageData(...boundingBox);

    // Scan for QR code
    const code = jsQR(videoFrame.data, videoFrame.width, videoFrame.height, {
      inversionAttempts: "dontInvert",
    });
    if (!code) continue;

    return code.data;
  }

  return null;
}

/**
 * Wait for the next video frame to be available
 * @param video - The video element to wait for
 */
async function frame(video: HTMLVideoElement) {
  await new Promise((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(resolve);
    } else {
      requestAnimationFrame(resolve);
    }
  });
}

interface CameraProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

function Camera({ onClose, onScan }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start up the camera feed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    loadMediaStream(video)
      .then(setMediaStream)
      .catch((err) => {
        console.error(err);
        setError("Could not access camera");
      });

    return () => {
      setMediaStream((mediaStream) => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }

        return null;
      });

      if (video) {
        video.srcObject = null;
      }
    };
  }, []);

  // Scan for QR codes
  useEffect(() => {
    if (!mediaStream) return;

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (!videoRef.current) return;
    const video = videoRef.current;

    scan(video, context)
      .then((qrData) => qrData && onScan(qrData))
      .catch((err) => {
        console.error(err);
        setError("Could not scan QR code");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaStream]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {error ? (
        <div className="text-2xl font-bold text-white">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <QrCodeIcon className="h-48 w-48 text-white opacity-50 border-8 border-white rounded-xl" />
          </div>
        </>
      )}
      <div className="absolute bottom-8">
        <Button text="Close Camera" onClick={onClose} />
      </div>
    </div>
  );
}

export default Camera;