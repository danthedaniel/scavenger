import { useEffect, useRef, useState } from "react";

import { QrCodeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LightBulbIcon as LightBulbOffIcon } from "@heroicons/react/24/outline";
import { LightBulbIcon as LightBulbOnIcon } from "@heroicons/react/24/solid";
import * as Sentry from "@sentry/nextjs";
import clsx from "clsx";
import jsQR from "jsqr";

/**
 * Load the media stream into the video element and wait for it to start playing.
 * @param video - The video element to load the media stream into
 * @returns The {@link MediaStream}
 */
async function loadMediaStream(video: HTMLVideoElement) {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });

  video.srcObject = mediaStream;
  await new Promise((resolve) => video.addEventListener("playing", resolve));

  return mediaStream;
}

/**
 * Scan for a QR code in the video stream
 * @param video - The video element to scan
 * @returns The QR code data or `null` if no QR code was found
 */
async function scan(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  // Match canvas size to video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  while (video.isConnected && video.srcObject) {
    const videoFrame = await frame(context, video);
    if (!videoFrame) continue;

    // Scan for QR code
    const qrCode = jsQR(videoFrame.data, videoFrame.width, videoFrame.height, {
      inversionAttempts: "dontInvert",
    });
    if (!qrCode) continue;

    const zoneCode = extractZoneCode(qrCode.data);
    if (!zoneCode) continue;

    return zoneCode;
  }

  return null;
}

function extractZoneCode(qrData: string) {
  let url: URL | null = null;
  try {
    url = new URL(qrData);
  } catch (err) {
    return null;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.host !== window.location.host ||
    !url.pathname.match(/\/[A-Z]+/)
  ) {
    return null;
  }

  const zoneCode = url.pathname.slice(1).toLocaleUpperCase();

  return zoneCode;
}

/**
 * Get the next video frame.
 * @param context - The canvas to draw the video frame to
 * @param video - The video element to wait for
 * @returns The {@link ImageData} of the video frame
 */
async function frame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement
) {
  await new Promise((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(resolve);
    } else {
      requestAnimationFrame(resolve);
    }
  });

  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    return null;
  }

  // Draw video frame to canvas
  const boundingBox = [0, 0, video.videoWidth, video.videoHeight] as const;
  context.drawImage(video, ...boundingBox);
  return context.getImageData(...boundingBox);
}

function supportsFlashlight(mediaStream: MediaStream) {
  const videoTrack = mediaStream.getVideoTracks()[0];
  const capabilities = videoTrack.getCapabilities();
  return "torch" in capabilities && !!capabilities.torch;
}

async function setFlashlight(mediaStream: MediaStream, flashlightOn: boolean) {
  const videoTrack = mediaStream.getVideoTracks()[0];
  if (!videoTrack) return;

  try {
    await videoTrack.applyConstraints({
      advanced: [{ torch: flashlightOn } as unknown as MediaTrackConstraintSet],
    });
  } catch (err) {
    console.error("Error toggling flashlight:", err);
    Sentry.captureException(err);
  }
}

interface CameraProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

function Camera({ onClose, onScan }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [flashlightSupported, setFlashlightSupported] = useState(false);

  // Start up the camera feed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    loadMediaStream(video)
      .then((stream) => {
        setMediaStream(stream);
        setFlashlightSupported(supportsFlashlight(stream));
      })
      .catch((err) => {
        console.error(err);
        Sentry.captureException(err);
        setError("Could not access camera");
      });

    return () => {
      setMediaStream((mediaStream) => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }

        return null;
      });

      video.srcObject = null;
    };
  }, []);

  // Scan for QR codes
  useEffect(() => {
    if (!mediaStream) return;
    if (!videoRef.current) return;

    const video = videoRef.current;

    scan(video)
      .then((zoneCode) => zoneCode && onScan(zoneCode))
      .catch((err) => {
        console.error(err);
        Sentry.captureException(err);
        setError("Could not scan QR code");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaStream]);

  // Activate flashlight when React state changes
  useEffect(() => {
    if (!mediaStream) return;

    setFlashlight(mediaStream, flashlightOn);
  }, [mediaStream, flashlightOn]);

  // Deactivate flashlight when the component unmounts
  useEffect(() => {
    if (!mediaStream) return;

    return () => {
      setFlashlight(mediaStream, false);
    };
  }, [mediaStream]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="absolute top-8 left-8">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-gray-700 border-2 border-white active:bg-gray-500"
        >
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>
      </div>

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

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <QrCodeIcon className="h-48 w-48 text-white opacity-50 border-8 border-white rounded-xl" />
          </div>

          {flashlightSupported && (
            <div className="absolute top-8 right-8">
              <button
                onClick={() => setFlashlightOn(!flashlightOn)}
                className={clsx(
                  "p-3 rounded-full",
                  flashlightOn
                    ? "border-2 border-yellow-400 bg-yellow-400"
                    : "border-2 border-white bg-gray-700 active:bg-gray-500"
                )}
              >
                {flashlightOn ? (
                  <LightBulbOnIcon className="h-6 w-6 text-white" />
                ) : (
                  <LightBulbOffIcon className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Camera;
