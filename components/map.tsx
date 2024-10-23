import { useState, useRef, useEffect, CSSProperties } from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { HintLevel } from "./app_context";
import { useDebounce } from "./hooks/use_debounce";
import useIsWebKit from "./hooks/use_is_web_kit";
import clsx from "clsx";

interface Position {
  x: number;
  y: number;
}

const roadStyle: CSSProperties = {
  fill: "none",
  stroke: "rgb(226,226,226)",
};

const waterStyle: CSSProperties = {
  fill: "rgb(0,193,255)",
  fillOpacity: 0.65,
};

const SVG_PADDING_Y = 3000;
const SVG_PADDING_X = 3000;
const SVG_WIDTH = 2707;
const SVG_HEIGHT = 642;

export interface RegionInfo {
  name: string;
  code: string;
  color: string;
  center: Position;
  hints: Record<HintLevel, string>;
  image: string;
  image_description: string;
}

export const REGIONS: RegionInfo[] = [
  {
    name: "Red",
    code: "PACIFIC",
    color: "rgb(244,28,41)",
    center: { x: 390, y: -25 },
    hints: {
      none: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at augue iaculis molestie sed vel odio.\nAliquam erat volutpat. Suspendisse lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula magna pretium vitae.",
      small:
        "Suspendisse sollicitudin libero libero, a condimentum ex congue vitae.",
      big: "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
    },
    image: "/images/placeholder.png",
    image_description:
      "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
  },
  {
    name: "Orange",
    code: "TOWEL",
    color: "rgb(234,173,0)",
    center: { x: 210, y: -10 },
    hints: {
      none: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at augue iaculis molestie sed vel odio.\nAliquam erat volutpat. Suspendisse lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula magna pretium vitae.",
      small:
        "Suspendisse sollicitudin libero libero, a condimentum ex congue vitae.",
      big: "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
    },
    image: "/images/placeholder.png",
    image_description:
      "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
  },
  {
    name: "Yellow",
    code: "MANSION",
    color: "rgb(225,220,0)",
    center: { x: 25, y: -5 },
    hints: {
      none: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at augue iaculis molestie sed vel odio.\nAliquam erat volutpat. Suspendisse lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula magna pretium vitae.",
      small:
        "Suspendisse sollicitudin libero libero, a condimentum ex congue vitae.",
      big: "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
    },
    image: "/images/placeholder.png",
    image_description:
      "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
  },
  {
    name: "Green",
    code: "CITED",
    color: "rgb(55,228,0)",
    center: { x: -150, y: 5 },
    hints: {
      none: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at augue iaculis molestie sed vel odio.\nAliquam erat volutpat. Suspendisse lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula magna pretium vitae.",
      small:
        "Suspendisse sollicitudin libero libero, a condimentum ex congue vitae.",
      big: "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
    },
    image: "/images/placeholder.png",
    image_description:
      "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
  },
  {
    name: "Blue",
    code: "PLATFORM",
    color: "rgb(0,228,207)",
    center: { x: -355, y: 15 },
    hints: {
      none: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In at leo at augue iaculis molestie sed vel odio.\nAliquam erat volutpat. Suspendisse lacinia pretium interdum. Integer pulvinar lectus lorem, id vehicula magna pretium vitae.",
      small:
        "Suspendisse sollicitudin libero libero, a condimentum ex congue vitae.",
      big: "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
    },
    image: "/images/placeholder.png",
    image_description:
      "Morbi at lectus convallis, fringilla ex eu, accumsan tortor.",
  },
] as const;

const INIT_ZOOM = 3;
const INIT_PAN: Position = { x: 0, y: 0 } as const;

const MIN_ZOOM = 3;
const MAX_ZOOM = 10;

const getDistance = (touches: TouchList) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;

  return Math.hypot(dx, dy);
};

const limitPan = (newPan: Position): Position => {
  return {
    x: newPan.x,
    y: newPan.y,
  };
};

interface MapProps {
  found: number[];
  selected: number | null;
  setSelected: (index: number | null) => void;
}

function Map({ found, selected, setSelected }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isWebKit = useIsWebKit();

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState<boolean>(false);
  const [latLong, setLatLong] = useState<Position | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(INIT_ZOOM);
  const [pan, setPan] = useState<Position>(INIT_PAN);
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  // Drag panning state
  const [start, setStart] = useState<Position>({ x: 0, y: 0 });
  const [hasPanned, setHasPanned] = useState(false);

  // Pinch-to-zoom state
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(scale);

  const resetZooming = useDebounce(() => setIsZooming(false), 250);

  // Subscribe to location updates.
  useEffect(() => {
    if (!locationEnabled) {
      setLatLong(null);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocationError(false);
      setLatLong({
        y: position.coords.latitude,
        x: position.coords.longitude,
      });
    };
    const onError = (error: GeolocationPositionError) => {
      const codeName = {
        1: "Permission Denied",
        2: "Position Unavailable",
        3: "Timeout",
      };

      alert(
        `Error getting location: ${codeName[error.code as 1 | 2 | 3]} ${error.message}`
      );
      setLocationEnabled(false);
      setLocationError(true);
    };
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError);

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationEnabled]);

  // Center on region when selected.
  useEffect(() => {
    if (selected === null) {
      // Restore original pan/scale on deselect.
      setPan(INIT_PAN);
      setScale(INIT_ZOOM);
      return;
    }
    if (selected >= REGIONS.length) return;

    centerOnRegion(selected);
  }, [selected]);

  // Restore original pan/scale when exiting fullscreen.
  useEffect(() => {
    if (isFullscreen) return;
    if (selected === null) {
      setPan(INIT_PAN);
      setScale(INIT_ZOOM);
      return;
    }
    if (selected >= REGIONS.length) return;

    setHasPanned(false);
    setIsPanning(false);
    centerOnRegion(selected);
  }, [isFullscreen]);

  // Event handler for scroll zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!isFullscreen) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Handle zooming
      setIsZooming(true);
      const scaleChange = event.deltaY * -0.04;
      setScale((prevScale) =>
        Math.min(Math.max(MIN_ZOOM, prevScale + scaleChange), MAX_ZOOM)
      );

      resetZooming();
    };

    svg.addEventListener("wheel", handleWheel);
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [isFullscreen, scale]);

  // Event handler for mouse click.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!isFullscreen) return;

    const handleMouseDown = (event: MouseEvent) => {
      setIsPanning(true);
      setStart({ x: event.clientX, y: event.clientY });
      setHasPanned(false);
    };

    svg.addEventListener("mousedown", handleMouseDown);
    return () => svg.removeEventListener("mousedown", handleMouseDown);
  }, [isFullscreen]);

  // Event handler for mouse dragging (panning).
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning) return;

      const dx = (event.clientX - start.x) / scale;
      const dy = (event.clientY - start.y) / scale;

      setPan(limitPan({ x: pan.x + dx, y: pan.y + dy }));
      setStart({ x: event.clientX, y: event.clientY });
      setHasPanned(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFullscreen, isPanning, pan, scale]);

  // Event handler for mouse release.
  useEffect(() => {
    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Event handler for touch pan/zoom start.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!isFullscreen) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        // Single touch, start panning
        setIsPanning(true);
        setStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        setHasPanned(false);
      } else if (event.touches.length === 2) {
        // Two touches, start zooming
        setIsPanning(false);
        setIsZooming(true);
        const distance = getDistance(event.touches);
        setInitialDistance(distance);
        setInitialScale(scale);
      }
    };

    svg.addEventListener("touchstart", handleTouchStart);
    return () => svg.removeEventListener("touchstart", handleTouchStart);
  }, [isFullscreen, scale]);

  // Event handler for touch pan/zoom.
  useEffect(() => {
    if (!isFullscreen) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1 && isPanning) {
        // Single touch, continue panning
        const dx = (event.touches[0].clientX - start.x) / scale;
        const dy = (event.touches[0].clientY - start.y) / scale;

        setPan(limitPan({ x: pan.x + dx, y: pan.y + dy }));
        setStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        setHasPanned(true);
      } else if (event.touches.length === 2 && isZooming) {
        // Two touches, continue zooming
        setIsZooming(true);
        const distance = getDistance(event.touches);
        const scaleChange = distance / initialDistance;
        setScale(
          Math.min(Math.max(MIN_ZOOM, initialScale * scaleChange), MAX_ZOOM)
        );
      }
    };

    window.addEventListener("touchmove", handleTouchMove);
    return () => window.removeEventListener("touchmove", handleTouchMove);
  }, [
    isFullscreen,
    isPanning,
    isZooming,
    scale,
    pan,
    initialDistance,
    initialScale,
  ]);

  // Event handler for touch pan/zoom end.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleTouchEnd = () => {
      setIsPanning(false);
      setIsZooming(false);
    };

    window.addEventListener("touchend", handleTouchEnd);
    return () => window.removeEventListener("touchend", handleTouchEnd);
  }, []);

  function centerOnRegion(index: number) {
    const regionCenter = REGIONS[index].center;
    const newScale = 8;

    setScale(newScale);
    setPan({ x: regionCenter.x / newScale, y: regionCenter.y / newScale });
  }

  const handleRegionClick = (index: number) => {
    if (isPanning || hasPanned) return;

    if (selected === index) {
      setSelected(null);
    } else {
      setSelected(index);
      setIsFullscreen(false);
    }
  };

  const regionHasBorder = (index: number) => {
    if (selected === index) return true;
    if (found.includes(index)) return false;
    if (selected === null) return true;

    return false;
  };

  const regionStyle = (index: number): CSSProperties => {
    return {
      fill: "rgba(0,0,0,0)",
      stroke: REGIONS[index].color,
      strokeOpacity: regionHasBorder(index) ? 0.9 : 0,
      strokeWidth: "18px",
      strokeLinejoin: "miter",
      strokeDasharray: selected === index ? "0" : "30, 15",
      cursor: isPanning ? "grabbing" : "pointer",
    };
  };

  const latLongToSVG = (latLong: Position | null): Position | null => {
    if (!latLong) return null;

    const upperRightLatLong: Position = { y: 37.774673, x: -122.4557844 };
    const upperRightSVG: Position = { x: 2989.5151, y: 627.4388 };
    const lowerLeftLatLong: Position = { y: 37.764193, x: -122.5117196 };
    const lowerLeftSVG: Position = { x: 426.07, y: 1219.975 };

    if (latLong.y > upperRightLatLong.y) return null;
    if (latLong.y < lowerLeftLatLong.y) return null;
    if (latLong.x > upperRightLatLong.x) return null;
    if (latLong.x < lowerLeftLatLong.x) return null;

    const xMultiplier =
      (upperRightSVG.x - lowerLeftSVG.x) /
      (upperRightLatLong.x - lowerLeftLatLong.x);
    const x = xMultiplier * (latLong.x - lowerLeftLatLong.x) + lowerLeftSVG.x;

    const yMultiplier =
      (upperRightSVG.y - lowerLeftSVG.y) /
      (upperRightLatLong.y - lowerLeftLatLong.y);
    const y = yMultiplier * (latLong.y - lowerLeftLatLong.y) + lowerLeftSVG.y;

    return { x, y };
  };

  const markerPosition = latLongToSVG(latLong);
  const containerWidth = containerRef.current?.clientWidth ?? 0;
  const svgAspectRatio =
    (SVG_WIDTH + 2 * SVG_PADDING_X) / (SVG_HEIGHT + 2 * SVG_PADDING_Y);
  const panPercent = 100 - (pan.x * scale + 400) / 8;

  return (
    <div
      ref={containerRef}
      className={clsx([
        "bg-blue-200 overflow-hidden",
        isFullscreen
          ? "fixed z-10 inset-0 min-h-screen min-w-screen"
          : "animate-map-container relative w-full flex-grow",
        selected === null ? "h-80" : "h-60",
      ])}
    >
      {isFullscreen ? (
        <ArrowsPointingInIcon
          className="absolute z-10 top-4 left-4 w-8 h-8 cursor-pointer"
          onClick={() => setIsFullscreen(false)}
          aria-label="Exit Fullscreen Map"
        />
      ) : (
        <ArrowsPointingOutIcon
          className="absolute z-10 top-4 left-4 w-8 h-8 cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          aria-label="Enter Fullscreen Map"
        />
      )}
      {locationEnabled ? (
        <MapPinIcon
          className="absolute z-10 top-4 right-4 w-8 h-8 cursor-pointer text-black"
          onClick={() => setLocationEnabled(false)}
          aria-label="Disable Location Services"
        />
      ) : (
        <MapPinIcon
          className={clsx([
            "absolute z-10 top-4 right-4 w-8 h-8 cursor-pointer",
            locationError ? "text-red-500" : "text-slate-400",
          ])}
          onClick={() => setLocationEnabled(true)}
          aria-label="Enable Location Services"
        />
      )}
      <svg
        ref={svgRef}
        className={isPanning || isZooming ? "" : "animate-park-map"}
        height={`${(containerWidth / svgAspectRatio) * scale}px`}
        width={`${containerWidth * scale}px`}
        viewBox={`${-SVG_PADDING_X} ${-SVG_PADDING_Y} ${SVG_WIDTH + 2 * SVG_PADDING_X} ${SVG_HEIGHT + 2 * SVG_PADDING_Y}`}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: `calc(50% + ${pan.y * scale}px)`,
          left: `calc(50% + ${pan.x * scale}px)`,
          transform: `translate(-50%, -50%)`,
          fillRule: "evenodd",
          clipRule: "evenodd",
          strokeLinejoin: "round",
          strokeMiterlimit: 1.5,
          border: "1px solid red",
          cursor: isPanning ? "grabbing" : "grab",
          touchAction: isFullscreen ? "none" : "auto",
          transformOrigin: "center center",
        }}
      >
        <defs>
          <style>
            {`
              #Marker circle {
                animation: pulse 3s infinite;
              }

              @keyframes pulse {
                0%, 100% {
                  stroke-width: 6px;
                }
                50% {
                  stroke-width: 14px;
                }
              }
            `}
          </style>
          <filter id="fillShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx={(-pan.x * scale) / 16}
              dy={((-pan.y + 32) * scale) / 8}
              stdDeviation={scale * 2}
              floodColor="rgba(0,0,0,0.4)"
            />
          </filter>
          <filter
            id="regionShadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="3"
              dy="5"
              stdDeviation="5"
              floodColor="rgba(0,0,0,0.4)"
            />
          </filter>
          <linearGradient
            id="borderGradient"
            x1="-75%"
            y1="0%"
            x2="190%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: "#000" }} />
            <stop
              offset={`${Math.max(panPercent - 1, 0)}%`}
              style={{ stopColor: "#333" }}
            />
            <stop offset={`${panPercent}%`} style={{ stopColor: "#888" }} />
            <stop
              offset={`${Math.min(panPercent + 1, 100)}%`}
              style={{ stopColor: "#333" }}
            />
            <stop offset="100%" style={{ stopColor: "#000" }} />
          </linearGradient>
        </defs>
        <g transform="matrix(1,0,0,1,-380.586,-603.087)">
          <g
            id="Fill"
            transform="matrix(1,0,0,1,2.10788,-3.93284)"
            filter={isWebKit ? undefined : "url(#fillShadow)"}
          >
            <path
              d="M387.478,817.436L2512.49,692.84L3000.14,616.02L3076.47,1086.91L3036.35,1091.17L3036.91,1105.18L2902.54,1126.64L2822.2,1104.36L417.241,1238.17C417.241,1238.17 407.718,1141.55 405.719,1099.76C403.72,1057.98 401.496,1017.93 398.744,957.307C396.053,898.044 387.478,817.436 387.478,817.436Z"
              style={{ fill: "rgb(154,199,107)" }}
            />
          </g>
          <g id="Water">
            <path
              d="M2661.16,831.725C2662.61,832.531 2664.09,833.29 2665.58,834.036C2667.46,834.98 2670.81,836.047 2672.44,837.391C2673.87,838.566 2673.59,841.662 2675.39,842.097C2677.2,842.535 2680.6,839.675 2683.31,840.02C2687.19,840.515 2693.61,844.671 2698.64,845.063C2703.66,845.454 2710.53,842.3 2713.51,842.375C2714.96,842.411 2716.55,844.109 2716.53,845.509C2716.5,846.91 2714.97,849.612 2713.35,850.778C2711.72,851.944 2709.01,852.806 2706.77,852.504C2703.77,852.102 2698.27,848.635 2695.38,848.364C2693.23,848.163 2691.57,850.933 2689.42,850.88C2686.22,850.801 2680.43,849.282 2676.18,847.888C2671.93,846.496 2667.75,843.575 2663.88,842.518C2660.35,841.554 2654.37,843.901 2652.95,841.545C2651.54,839.189 2654.02,830.021 2655.39,828.384C2656.75,826.747 2659.46,830.783 2661.16,831.725ZM3008.23,936.498C3009.63,936.267 3010.59,939.671 3012.2,939.391C3013.92,939.093 3016.63,935.476 3018.52,934.71C3020.06,934.084 3022.8,933.294 3023.51,934.798C3024.38,936.639 3023.87,943.082 3023.76,945.756C3023.69,947.476 3023.94,950.264 3022.84,950.837C3021.74,951.411 3018.25,950.258 3017.15,949.197C3016.04,948.136 3016.79,945.202 3016.2,944.473C3015.66,943.801 3014.35,944.331 3013.64,944.82C3012.9,945.33 3012.84,947.294 3011.77,947.534C3010.39,947.842 3006.67,947.797 3005.34,946.672C3004.01,945.546 3003.32,942.474 3003.8,940.778C3004.28,939.083 3006.83,936.73 3008.23,936.498ZM2292.64,901.968C2291.66,902.402 2290.73,899.444 2289.31,899.057C2287.39,898.536 2282.22,899.212 2281.13,898.84C2280.31,898.561 2281.93,897.093 2282.75,896.824C2284.1,896.383 2288.2,896.789 2289.21,896.193C2290.06,895.689 2289,894.219 2288.8,893.246C2288.45,891.476 2287.16,887.218 2287.11,885.569C2287.09,884.697 2287.87,882.761 2288.51,883.357C2290.13,884.869 2295.7,892.46 2296.81,894.643C2297.18,895.372 2295.57,895.748 2295.16,896.458C2294.47,897.679 2293.62,901.535 2292.64,901.968ZM2250.36,1074.64L2257.46,1073.39L2260.23,1091.76L2252.89,1092.88L2250.36,1074.64ZM2211.67,1025.36C2210.63,1024.96 2210.22,1022.07 2209.75,1020.57C2209.32,1019.2 2208.24,1017.34 2208.85,1016.34C2209.45,1015.35 2212.14,1014.22 2213.38,1014.62C2214.61,1015.01 2215.83,1017.33 2216.27,1018.72C2216.69,1020.07 2216.75,1021.84 2215.98,1022.95C2215.22,1024.06 2212.71,1025.76 2211.67,1025.36ZM2278.65,1001.68C2277.76,1000.37 2276.92,995.226 2277.36,993.671C2277.73,992.347 2280.35,992.978 2281.26,992.343C2282.06,991.784 2282.4,990.745 2282.81,989.86C2283.29,988.833 2283.27,987.157 2284.13,986.181C2285.7,984.4 2289.93,981.147 2292.26,979.171C2294.2,977.531 2296.29,975.004 2298.14,974.326C2299.8,973.719 2302.39,975.294 2303.39,975.103C2304.07,974.974 2303.49,973.312 2304.17,973.182C2305.2,972.984 2308.62,972.879 2309.55,973.919C2310.5,974.96 2310.36,977.972 2309.81,979.424C2309.27,980.875 2306.89,981.36 2306.3,982.627C2305.71,983.894 2307.11,985.804 2306.3,987.024C2305.49,988.245 2303.02,988.937 2301.42,989.951C2299.55,991.133 2296.85,993.504 2295.1,994.112C2293.77,994.573 2292,993.706 2290.91,993.596C2290.13,993.517 2289.18,993.069 2288.58,993.451C2287.97,993.834 2287.96,995.254 2287.3,995.891C2286.5,996.665 2284.54,997.159 2283.77,998.094C2283.01,999.014 2283.54,1000.9 2282.69,1001.5C2281.83,1002.1 2279.41,1002.79 2278.65,1001.68ZM2361.2,1091.67C2363.92,1091.52 2371.8,1090.85 2374.16,1089.86C2375.47,1089.32 2374.28,1086.5 2375.36,1085.77C2376.43,1085.04 2379.17,1085 2380.63,1085.48C2382.09,1085.95 2385.25,1087.57 2384.1,1088.63C2382.75,1089.87 2376.04,1092.16 2372.55,1092.95C2369.49,1093.64 2365.55,1092.7 2363.15,1093.36C2361.16,1093.91 2359.85,1096.23 2358.11,1096.92C2356.41,1097.58 2353.88,1098.33 2352.67,1097.47C2351.47,1096.61 2350.03,1092.87 2350.88,1091.75C2351.74,1090.63 2356.1,1090.78 2357.82,1090.76C2358.98,1090.75 2360.03,1091.73 2361.2,1091.67ZM2351.01,1117.82C2349.85,1117.68 2349.77,1115.21 2350.55,1114.34C2351.9,1112.84 2357.29,1109.4 2359.08,1108.8C2360,1108.48 2361,1109.76 2361.29,1110.69C2361.65,1111.83 2362.61,1114.7 2361.25,1115.64C2359.54,1116.83 2352.79,1118.04 2351.01,1117.82ZM1942.55,987.277C1943.16,982.192 1946.42,977.676 1947.09,972.598C1947.86,966.73 1948.34,958.811 1947.16,952.071C1945.92,944.99 1940.27,936.59 1939.65,930.111C1939.11,924.357 1943.71,918.974 1943.48,913.199C1943.2,906.349 1939,896.254 1937.99,889.012C1937.09,882.649 1934.78,874.874 1937.39,869.747C1940,864.619 1949.05,859.908 1953.63,858.246C1957.2,856.954 1961.19,860.541 1964.91,859.775C1969.57,858.813 1977.72,853.002 1981.6,852.478C1984.16,852.131 1987.28,854.196 1988.16,856.631C1989.48,860.287 1987.69,870.015 1989.53,874.418C1991.18,878.399 1995.19,881.373 1999.16,883.048C2004.05,885.107 2012.31,885.349 2018.83,886.769C2026.41,888.421 2037.23,889.482 2044.68,892.961C2051.9,896.331 2056.82,903.377 2063.55,907.64C2070.5,912.04 2078.52,916.486 2086.38,919.36C2094.2,922.218 2102.43,925.396 2110.74,924.886C2121.92,924.201 2143.68,917.059 2153.45,915.247C2158.66,914.278 2164.1,914.933 2169.32,914.014C2178.46,912.408 2201.11,907.099 2208.27,905.609C2214.86,904.238 2218.81,907.394 2213.2,914.282C2209.25,919.123 2194.4,927.773 2186.35,936.006C2177.64,944.915 2166.89,956.306 2160.96,967.737C2155.08,979.052 2154.21,992.332 2150.74,1004.6C2147.28,1016.85 2145.64,1034.54 2140.17,1041.31C2135.44,1047.18 2123.85,1046.4 2117.91,1045.25C2112.27,1044.15 2109.9,1035.36 2104.53,1034.38C2099.17,1033.4 2092.2,1039.13 2085.72,1039.37C2074.54,1039.79 2053.14,1040.6 2037.47,1036.87C2020.86,1032.92 1998.91,1019.17 1986.04,1015.65C1977.74,1013.38 1965.01,1013.45 1960.23,1015.74C1956.03,1017.75 1958.01,1026.37 1957.32,1029.4C1955.62,1036.85 1950.51,1037.09 1947.5,1029.38C1944.69,1022.16 1941.02,1000.1 1942.55,987.277ZM1947.19,997.854C1948.67,1004.19 1949.65,1008.03 1953.3,1006.93C1955.92,1006.14 1953.55,1001.39 1953.36,998.936C1952.94,993.291 1948.38,993.11 1947.36,992.93C1946.33,992.75 1946.82,996.255 1947.19,997.854ZM2130.34,936.263C2130.16,939.096 2133.06,946.606 2135.4,947.865C2137.73,949.124 2141.5,944.569 2144.34,943.816C2146.96,943.123 2150.74,944.216 2152.44,943.346C2153.98,942.559 2155.66,939.908 2154.53,938.6C2153.01,936.842 2147.37,933.187 2143.34,932.797C2139.3,932.408 2130.64,931.291 2130.34,936.263ZM1967.16,895.481C1974.38,893.106 1972.11,884.013 1971.37,880.22C1969.63,871.4 1961.57,873.049 1958.89,873.81C1954.37,875.099 1954.68,883.226 1956.06,886.838C1957.43,890.45 1960.24,897.761 1967.16,895.481ZM2008.67,907.88C2003.44,906.817 1998.12,905.687 1992.79,905.864C1977.67,906.363 1974.86,913.289 1970.13,918.016C1966.07,922.067 1965.41,928.588 1964.36,934.226C1962.91,941.954 1960.63,955.361 1961.47,964.39C1962.26,972.781 1965.16,981.385 1969.41,988.397C1973.66,995.409 1979.8,1002.08 1986.97,1006.46C1995.95,1011.95 2013.2,1018.28 2023.29,1021.33C2031.08,1023.69 2040.25,1024.15 2047.48,1024.76C2053.85,1025.3 2060.26,1025.02 2066.66,1024.99C2074.13,1024.96 2084.19,1027.24 2092.32,1024.58C2101.22,1021.67 2114.35,1013.3 2120.05,1007.52C2124.44,1003.06 2126.25,996.144 2126.49,989.894C2126.75,983.278 2123.31,974.005 2121.6,967.826C2120.19,962.707 2117.16,956.73 2116.27,952.818C2115.64,950.068 2117.66,946.79 2116.24,944.355C2114.56,941.496 2110.19,937.62 2106.23,935.665C2099.22,932.211 2084.51,926.844 2074.22,923.627C2064.48,920.583 2054.41,918.747 2044.49,916.364C2033.56,913.739 2017.29,909.63 2008.67,907.88ZM2407.39,845.116C2410.76,845.116 2413.5,847.891 2413.5,851.307C2413.5,854.724 2410.76,857.498 2407.39,857.498C2404.01,857.498 2401.28,854.724 2401.28,851.307C2401.28,847.891 2404.01,845.116 2407.39,845.116ZM2426.63,831.656C2428.12,831.656 2429.33,832.866 2429.33,834.357C2429.33,835.847 2428.12,837.057 2426.63,837.057C2425.14,837.057 2423.93,835.847 2423.93,834.357C2423.93,832.866 2425.14,831.656 2426.63,831.656ZM2387.87,866.44C2389.36,866.44 2390.57,867.65 2390.57,869.14C2390.57,870.631 2389.36,871.841 2387.87,871.841C2386.38,871.841 2385.17,870.631 2385.17,869.14C2385.17,867.65 2386.38,866.44 2387.87,866.44ZM2044.03,952.801C2043.58,954.234 2044.92,957.503 2046.8,958.433C2051.2,960.616 2065.57,965.565 2070.45,965.901C2073.06,966.08 2075.8,962.378 2076.1,960.449C2076.39,958.52 2074.47,955.218 2072.23,954.324C2067.79,952.556 2054.16,950.092 2049.46,949.838C2047.4,949.727 2044.47,951.369 2044.03,952.801ZM1698.63,858.549C1699.35,856.644 1702.31,856.184 1703.8,854.622C1705.84,852.496 1708.55,847.5 1710.86,845.792C1712.72,844.417 1715.67,844.075 1717.65,844.377C1719.64,844.678 1721.41,846.103 1722.76,847.603C1724.42,849.47 1725.5,855.587 1727.67,855.58C1729.84,855.572 1733.15,849.485 1735.77,847.556C1738.02,845.898 1741.58,846.156 1743.37,844.009C1745.63,841.29 1746.85,834.092 1749.35,831.244C1751.56,828.734 1756.75,826.173 1758.41,826.924C1760.07,827.675 1757.43,834.284 1759.33,835.752C1761.23,837.22 1767.99,834.448 1769.8,835.732C1771.61,837.016 1771.35,841.155 1770.19,843.458C1768.56,846.711 1763.54,852.546 1759.98,855.247C1756.81,857.658 1751.59,856.745 1748.87,859.661C1745.97,862.764 1744.41,870.587 1742.62,873.87C1741.49,875.947 1740.34,878.522 1738.13,879.362C1735.83,880.236 1731.15,879.872 1728.83,879.114C1726.82,878.459 1725.99,875.618 1724.18,874.812C1722.38,874.007 1719.76,875.366 1718,874.281C1715.44,872.713 1711.97,866.773 1708.88,865.401C1706.02,864.126 1701.2,867.192 1699.5,866.05C1697.79,864.908 1697.91,860.453 1698.63,858.549ZM1696.71,1058.39C1697.82,1060.42 1700.74,1060.81 1702.99,1061.37C1705.64,1062.02 1709.71,1062.89 1712.62,1062.32C1715.54,1061.75 1717.67,1058.99 1720.48,1057.94C1723.66,1056.77 1728.13,1056.57 1731.69,1055.26C1735.24,1053.95 1738.86,1052.22 1741.83,1050.07C1744.75,1047.95 1746.64,1044.62 1749.46,1042.37C1752.81,1039.7 1759.58,1036.25 1761.88,1034.08C1763.07,1032.95 1762.53,1030.83 1763.24,1029.35C1764.16,1027.46 1766.85,1024.69 1767.38,1022.73C1767.84,1021.05 1767.4,1019 1766.42,1017.59C1765.45,1016.18 1763.35,1014.67 1761.52,1014.26C1759.68,1013.85 1757.37,1014.63 1755.42,1015.13C1753.48,1015.62 1751.79,1017.01 1749.81,1017.25C1747.47,1017.53 1744.1,1016.98 1741.41,1016.82C1738.81,1016.65 1735.09,1015.27 1733.63,1016.25C1732.17,1017.24 1734.09,1021.09 1732.65,1022.74C1731.04,1024.56 1727.16,1026.46 1724.01,1027.2C1720.66,1027.98 1715.79,1025.39 1712.56,1027.41C1708.92,1029.69 1705,1037.42 1702.18,1040.84C1700.14,1043.33 1696.58,1045.04 1695.67,1047.96C1694.76,1050.89 1695.49,1056.15 1696.71,1058.39ZM1476.39,1123.6C1477,1118.95 1498.59,1106.11 1509.55,1098.58C1520.09,1091.34 1532.47,1081.9 1542.18,1078.4C1550.22,1075.5 1562.39,1074.96 1567.8,1077.56C1573.15,1080.14 1573.42,1089.17 1574.63,1094.03C1575.65,1098.14 1578.41,1104.11 1575.08,1106.72C1571.28,1109.7 1558.85,1110.69 1551.86,1111.89C1545.67,1112.95 1539.34,1112.96 1533.13,1113.93C1520.55,1115.88 1475.52,1130.21 1476.39,1123.6ZM1546.23,1098.32C1548.24,1098.35 1553.8,1096.5 1555.51,1095.35C1556.63,1094.6 1557.67,1092.09 1556.5,1091.43C1555.21,1090.7 1549.95,1090.35 1547.78,1090.98C1545.84,1091.54 1543.7,1093.96 1543.44,1095.19C1543.18,1096.41 1544.83,1098.31 1546.23,1098.32ZM1360.76,1075.55C1365.13,1082.63 1369.21,1080.6 1373.36,1079.21C1379.14,1077.28 1390.07,1068.59 1395.41,1063.95C1399.46,1060.44 1403.23,1055.39 1405.41,1051.36C1407.31,1047.85 1409.18,1042.14 1408.52,1039.77C1407.85,1037.41 1403.64,1035.98 1401.42,1037.17C1394.06,1041.12 1371.15,1057.07 1364.38,1063.47C1361.32,1066.35 1359.17,1072.98 1360.76,1075.55ZM1008.38,1018.21L1075.37,1018.7L1075.53,1048.87L1008.19,1048.38L1008.38,1018.21ZM1100.63,806.07C1102.11,793.702 1108.74,797.399 1114.18,795.937C1119.67,794.465 1127.22,797.442 1133.55,797.237C1139.8,797.035 1145.9,794.305 1152.15,794.709C1160.01,795.217 1171.01,800.197 1180.71,800.285C1194.27,800.408 1223.15,795.438 1233.52,795.447C1237.05,795.449 1241.45,798.481 1242.9,800.334C1244.18,801.984 1243.62,805.045 1242.19,806.566C1240.57,808.281 1235.47,808.247 1233.2,810.62C1229.94,814.016 1227.3,823.18 1222.65,826.944C1217.99,830.707 1209.31,830.336 1205.28,833.203C1201.78,835.694 1201.4,841.016 1198.45,844.146C1194.04,848.834 1185.3,857.661 1178.8,861.327C1173.02,864.591 1164.66,865.594 1159.46,866.145C1155.5,866.565 1150.99,866.261 1147.6,864.631C1144.21,863.001 1142.14,858.928 1139.14,856.365C1135.91,853.604 1132.67,849.178 1128.24,848.063C1123.54,846.881 1115.19,850.134 1110.96,849.274C1107.59,848.589 1103.27,845.089 1102.85,842.903C1102.42,840.718 1106.4,838.285 1108.39,836.16C1110.37,834.035 1115.83,832.588 1114.75,830.151C1113.67,827.713 1104.27,825.549 1101.91,821.535C1099.56,817.522 1100.07,810.768 1100.63,806.07ZM720.81,851.967C719.101,848.928 719.501,843.524 722.43,841.633C725.565,839.609 733.938,838.867 739.619,839.824C746.091,840.914 756.785,848.424 761.26,848.173C764.97,847.965 764.828,839.096 766.468,838.318C768.108,837.54 770.263,841.345 771.102,843.507C772.333,846.676 772.965,852.721 773.856,857.336C774.877,862.624 776.348,868.036 777.228,875.232C777.683,878.957 782.245,880.815 784.656,883.691C789.018,888.897 797.694,898.869 803.402,906.467C808.923,913.817 814.814,922.939 818.9,929.279C822.095,934.237 826.493,940.26 827.914,944.507C829,947.753 826.371,951.817 827.424,954.763C828.477,957.709 833.3,958.96 834.234,962.185C835.214,965.57 832.389,971.66 833.308,975.076C834.171,978.284 838.759,980.194 839.748,982.682C840.652,984.955 841.177,989.384 839.241,990.004C837.305,990.624 830.956,989.081 828.131,986.403C825.279,983.7 824.587,976.732 822.132,973.788C819.979,971.206 816.291,969.013 813.401,968.739C810.511,968.466 807.381,972.482 804.792,972.147C802.203,971.812 798.005,968.545 797.866,966.731C797.726,964.917 801.338,962.037 803.954,961.263C806.855,960.406 813.656,964.649 815.268,961.585C816.88,958.521 815.314,947.306 813.627,942.878C812.255,939.275 807.76,937.85 805.147,935.015C801.96,931.559 797.609,926.069 794.508,922.14C791.753,918.65 789.623,913.231 786.54,911.442C783.505,909.679 779.504,911.066 776.01,911.402C772.428,911.746 768.655,914.42 765.049,913.504C760.91,912.454 753.286,907.864 751.177,905.099C749.504,902.908 753.637,899.378 752.392,896.918C750.91,893.992 743.873,891.74 742.286,887.542C740.698,883.344 743.918,875.365 742.867,871.73C742.022,868.807 738.25,867.765 735.984,865.734C732.307,862.44 723.069,855.984 720.81,851.967ZM761.439,890.495C765.206,889.814 770.885,885.932 770.83,883.886C770.775,881.84 764.128,879.833 761.107,878.216C758.369,876.75 755.179,874.187 752.707,874.185C750.235,874.182 747.071,875.895 746.275,878.202C745.479,880.509 745.404,885.976 747.931,888.024C750.459,890.073 757.623,891.184 761.439,890.495ZM769.876,908.194C771.798,908.492 773.664,906.141 774.195,904.269C774.735,902.363 774.672,897.93 773.118,896.756C771.564,895.582 767.508,896.437 764.87,897.226C762.173,898.032 756.103,899.764 756.938,901.592C757.772,903.42 766.999,907.747 769.876,908.194ZM899.723,1054.79C896.379,1052.73 891.529,1048.37 889.858,1045.16C888.375,1042.32 890.301,1038.06 889.696,1035.53C889.191,1033.42 885.26,1031.49 886.229,1030.02C887.198,1028.55 892.291,1027.37 895.509,1026.71C899.19,1025.97 904.76,1025.06 908.316,1025.54C911.434,1025.96 914.22,1029.09 916.84,1029.6C919.213,1030.07 922.143,1028.28 924.031,1028.63C925.726,1028.95 928.012,1030.01 928.171,1031.73C928.344,1033.58 925.441,1036.9 925.065,1039.73C924.633,1042.99 924.533,1047.57 925.579,1051.28C926.635,1055.02 928.513,1059.26 931.402,1062.2C934.417,1065.27 940.116,1066.49 943.665,1069.71C947.667,1073.35 952.754,1080.04 955.416,1084C957.345,1086.87 958.922,1090.67 959.64,1093.47C960.247,1095.83 960.96,1099.44 959.727,1100.78C958.494,1102.12 954.409,1102.78 952.242,1101.52C949.726,1100.05 946.974,1094.62 944.63,1092C942.641,1089.78 940.586,1086.08 938.178,1085.8C935.77,1085.52 932.381,1090.85 930.182,1090.31C927.984,1089.78 924.703,1084.21 924.988,1082.61C925.274,1081 929.507,1080.78 931.895,1080.68C934.943,1080.56 941.808,1082.91 943.28,1081.86C944.752,1080.81 942.635,1076.18 940.726,1074.36C938.602,1072.33 932.825,1071.44 930.541,1069.67C928.722,1068.26 928.356,1064.17 927.018,1063.73C925.681,1063.3 924.209,1067.45 922.516,1067.05C920.823,1066.66 918.135,1060.9 916.861,1061.35C915.587,1061.8 915.808,1067.03 914.873,1069.75C913.736,1073.06 911.473,1080.85 910.04,1081.2C908.606,1081.55 906.808,1074.63 906.274,1071.84C905.81,1069.43 906.226,1066.87 906.834,1064.48C907.442,1062.1 911.109,1059.13 909.924,1057.52C908.739,1055.9 902.72,1056.64 899.723,1054.79ZM875.351,1170.56C875.391,1167.83 874.835,1161.54 876.351,1158.68C877.86,1155.84 881.252,1153.81 884.446,1153.42C887.715,1153.02 893.929,1154.67 895.967,1156.28C897.75,1157.68 895.777,1161.02 896.672,1163.05C897.567,1165.08 899.791,1167.55 901.338,1168.46C902.663,1169.24 904.612,1167.78 905.955,1168.53C907.974,1169.66 910.312,1174.12 913.457,1175.25C916.602,1176.38 923.21,1174.03 924.826,1175.31C926.442,1176.59 924.034,1180.84 923.153,1182.91C922.365,1184.77 921.459,1187.15 919.54,1187.77C917.275,1188.52 912.89,1187.41 909.562,1187.36C905.402,1187.31 898.962,1187.12 894.578,1187.44C890.765,1187.72 886.876,1189.83 883.258,1189.3C879.641,1188.76 874.066,1186.63 872.874,1184.26C871.683,1181.88 875.697,1177.32 876.11,1175.04C876.379,1173.55 875.329,1172.07 875.351,1170.56ZM899.092,1047.63C900.201,1047.28 902.324,1044.34 902.953,1043C903.438,1041.96 903.467,1040.36 902.864,1039.56C902.261,1038.77 900.499,1038.14 899.334,1038.24C898.17,1038.33 896.383,1038.97 895.878,1040.12C895.372,1041.27 895.766,1043.88 896.302,1045.14C896.793,1046.28 897.984,1047.99 899.092,1047.63ZM886.376,1175.38C887.787,1176.73 893.417,1177.09 894.834,1176.72C895.987,1176.42 895.489,1174.17 894.878,1173.14C894.201,1172.01 892.194,1170.67 890.775,1169.92C889.421,1169.21 887.097,1167.74 886.363,1168.65C885.63,1169.56 884.964,1174.04 886.376,1175.38Z"
              style={waterStyle}
            />
            <path
              d="M2677.14,837.522C2677.57,837.346 2678.01,837.166 2678.37,837.023C2680.2,836.279 2682.11,835.835 2683.82,836.053C2685.65,836.287 2687.99,837.154 2690.49,838.212C2693.26,839.385 2696.31,840.869 2698.95,841.075C2701.55,841.277 2704.7,840.282 2707.37,839.545C2709.91,838.847 2712.14,838.339 2713.61,838.376L2714.87,838.543L2715.97,838.909L2717.34,839.69C2717.74,839.976 2718.12,840.306 2718.46,840.666C2718.81,841.027 2719.12,841.419 2719.39,841.827L2720.1,843.217L2720.42,844.317L2720.53,845.585C2720.51,846.592 2720.16,848.005 2719.44,849.435C2718.55,851.192 2717.12,852.999 2715.68,854.029C2713.35,855.701 2709.46,856.901 2706.24,856.468C2704.45,856.229 2701.9,855.162 2699.39,854.032C2697.92,853.369 2696.49,852.634 2695.39,852.406C2694.98,852.689 2693.88,853.426 2693.24,853.79C2692.58,854.172 2691.89,854.47 2691.19,854.655L2689.32,854.879C2685.84,854.793 2679.55,853.203 2674.93,851.69C2670.74,850.318 2666.64,847.418 2662.83,846.376C2661.99,846.148 2660.95,846.277 2659.91,846.365C2658.15,846.514 2656.39,846.704 2654.98,846.601C2654.3,846.552 2653.67,846.443 2653.11,846.28L2651.7,845.698L2650.52,844.836L2649.53,843.606C2648.81,842.412 2648.37,840.22 2648.61,837.609C2649.02,833.146 2651.13,827.237 2652.32,825.819L2653.47,824.795L2654.99,824.138L2656.79,824.036L2658.7,824.627C2659.53,825.044 2660.48,825.779 2661.39,826.629C2662.02,827.22 2662.6,827.948 2663.1,828.227C2664.5,829.006 2665.94,829.74 2667.37,830.461C2669.47,831.515 2673.16,832.802 2674.98,834.301L2676.13,835.543C2676.48,836.044 2676.78,836.613 2677.03,837.225C2677.06,837.313 2677.1,837.414 2677.14,837.522ZM2661.16,831.725C2659.46,830.783 2656.75,826.747 2655.39,828.384C2654.02,830.021 2651.54,839.189 2652.95,841.545C2654.37,843.901 2660.35,841.554 2663.88,842.518C2667.75,843.575 2671.93,846.496 2676.18,847.888C2680.43,849.282 2686.22,850.801 2689.42,850.88C2691.57,850.933 2693.23,848.163 2695.38,848.364C2698.27,848.635 2703.77,852.102 2706.77,852.504C2709.01,852.806 2711.72,851.944 2713.35,850.778C2714.97,849.612 2716.5,846.91 2716.53,845.509C2716.55,844.109 2714.96,842.411 2713.51,842.375C2710.53,842.3 2703.66,845.454 2698.64,845.063C2693.61,844.671 2687.19,840.515 2683.31,840.02C2680.6,839.675 2677.2,842.535 2675.39,842.097C2673.59,841.662 2673.87,838.566 2672.44,837.391C2670.81,836.047 2667.46,834.98 2665.58,834.036C2664.09,833.29 2662.61,832.531 2661.16,831.725ZM3012.37,934.439C3012.79,934.075 3013.23,933.688 3013.57,933.383C3014.78,932.3 3016,931.415 3017.01,931.004C3018.73,930.306 3021.42,929.696 3023.24,930.085L3024.27,930.399L3025.35,930.987L3026.36,931.904L3027.12,933.083C3027.54,933.95 3027.87,935.447 3027.97,937.261C3028.11,940.078 3027.84,943.967 3027.76,945.923C3027.69,947.393 3027.74,949.496 3027.37,950.869L3026.92,952.057L3026.37,952.955L3025.66,953.721L3024.68,954.385L3022.81,954.946L3020.77,954.897C3018.5,954.575 3015.57,953.228 3014.38,952.084L3013.58,951.046L3012.64,951.438C3011.31,951.735 3008.4,951.832 3006.15,951.309C3005.43,951.14 3004.76,950.912 3004.19,950.64L3002.76,949.723C3001.76,948.878 3000.86,947.508 3000.3,945.893C2999.59,943.799 2999.48,941.337 2999.95,939.686C3000.41,938.059 3001.93,935.952 3003.66,934.527C3005.03,933.402 3006.52,932.727 3007.58,932.552L3009.53,932.628L3010.48,932.967L3011.51,933.597C3011.74,933.778 3012.05,934.095 3012.37,934.439ZM3008.23,936.498C3006.83,936.73 3004.28,939.083 3003.8,940.778C3003.32,942.474 3004.01,945.546 3005.34,946.672C3006.67,947.797 3010.39,947.842 3011.77,947.534C3012.84,947.294 3012.9,945.33 3013.64,944.82C3014.35,944.331 3015.66,943.801 3016.2,944.473C3016.79,945.202 3016.04,948.136 3017.15,949.197C3018.25,950.258 3021.74,951.411 3022.84,950.837C3023.94,950.264 3023.69,947.476 3023.76,945.756C3023.87,943.082 3024.38,936.639 3023.51,934.798C3022.8,933.294 3020.06,934.084 3018.52,934.71C3016.63,935.476 3013.92,939.093 3012.2,939.391C3010.59,939.671 3009.63,936.267 3008.23,936.498ZM2284.56,892.604C2284.02,890.379 2283.16,887.12 2283.12,885.688L2283.43,883.523L2284.27,881.623L2285.23,880.453L2286.58,879.58L2287.72,879.278L2289.07,879.321L2290.32,879.768L2291.24,880.436C2293.02,882.098 2299.16,890.432 2300.38,892.832L2300.73,893.749L2300.87,894.821L2300.74,895.884L2300.43,896.777L2299.55,898.025C2299.32,898.265 2298.78,898.66 2298.4,898.929C2297.89,900.135 2297.3,902.294 2296.65,903.386L2295.68,904.651L2294.26,905.625L2293.22,905.944L2292.12,906L2290.96,905.761L2289.77,905.149C2289.24,904.783 2288.16,903.46 2287.64,902.817C2286.41,902.707 2284.48,902.925 2283.09,902.952C2281.6,902.98 2280.41,902.819 2279.84,902.626L2278.3,901.726L2277.39,900.554L2277.01,899.522L2276.9,898.566L2277,897.643L2277.32,896.674L2278.09,895.463L2279.18,894.366C2279.58,894.04 2280,893.747 2280.39,893.524L2281.51,893.023C2282.18,892.803 2283.3,892.656 2284.56,892.604ZM2292.64,901.968C2293.62,901.535 2294.47,897.679 2295.16,896.458C2295.57,895.748 2297.18,895.372 2296.81,894.643C2295.7,892.46 2290.13,884.869 2288.51,883.357C2287.87,882.761 2287.09,884.697 2287.11,885.569C2287.16,887.218 2288.45,891.476 2288.8,893.246C2289,894.219 2290.06,895.689 2289.21,896.193C2288.2,896.789 2284.1,896.383 2282.75,896.824C2281.93,897.093 2280.31,898.561 2281.13,898.84C2282.22,899.212 2287.39,898.536 2289.31,899.057C2290.73,899.444 2291.66,902.402 2292.64,901.968ZM2278.92,988.751C2279.01,988.543 2279.11,988.326 2279.18,988.173C2279.39,987.722 2279.42,987.087 2279.58,986.507C2279.75,985.919 2279.97,985.352 2280.24,984.832L2281.13,983.532C2282.79,981.655 2287.22,978.2 2289.68,976.117C2291.97,974.179 2294.58,971.37 2296.77,970.569L2298.58,970.199C2299.25,970.158 2299.97,970.217 2300.7,970.357C2300.85,970.385 2301.01,970.422 2301.18,970.464L2302.09,969.738L2303.41,969.253C2304.43,969.059 2307.09,968.92 2309.05,969.362L2311,970.062L2312.52,971.237L2313.47,972.664L2314.06,974.564C2314.44,976.586 2314.14,979.284 2313.56,980.825L2312.93,982.05L2311.82,983.308C2311.47,983.621 2310.87,984.04 2310.37,984.376C2310.45,984.812 2310.53,985.289 2310.55,985.61L2310.35,987.642L2309.63,989.242L2308.68,990.352C2308.29,990.721 2307.83,991.074 2307.3,991.401C2306.2,992.081 2304.67,992.627 2303.56,993.331C2301.47,994.655 2298.37,997.21 2296.41,997.891L2294.68,998.232C2294.03,998.272 2293.34,998.22 2292.66,998.099C2292.03,997.986 2291.4,997.756 2290.88,997.639C2290.62,998.092 2290.34,998.514 2290.08,998.768C2289.53,999.296 2288,1000.15 2287.17,1000.59C2287.02,1001.4 2286.76,1002.61 2286.45,1003.15L2285.85,1003.99L2284.98,1004.78C2283.82,1005.59 2281.15,1006.48 2279.15,1006.21L2277.82,1005.87L2276.84,1005.38L2276.04,1004.75L2275.34,1003.93C2274.71,1003 2273.94,1000.75 2273.56,998.408C2273.18,996.076 2273.2,993.695 2273.51,992.592L2274.19,991.13L2275.22,990.031L2276.23,989.404L2277.49,988.966C2277.85,988.882 2278.43,988.806 2278.92,988.751ZM2299.86,973.611C2299.82,973.754 2299.79,973.906 2299.78,974.066L2299.86,973.611ZM2278.65,1001.68C2279.41,1002.79 2281.83,1002.1 2282.69,1001.5C2283.54,1000.9 2283.01,999.014 2283.77,998.094C2284.54,997.159 2286.5,996.665 2287.3,995.891C2287.96,995.254 2287.97,993.834 2288.58,993.451C2289.18,993.069 2290.13,993.517 2290.91,993.596C2292,993.706 2293.77,994.573 2295.1,994.112C2296.85,993.504 2299.55,991.133 2301.42,989.951C2303.02,988.937 2305.49,988.245 2306.3,987.024C2307.11,985.804 2305.71,983.894 2306.3,982.627C2306.89,981.36 2309.27,980.875 2309.81,979.424C2310.36,977.972 2310.5,974.96 2309.55,973.919C2308.62,972.879 2305.2,972.984 2304.17,973.182C2303.49,973.312 2304.07,974.974 2303.39,975.103C2302.39,975.294 2299.8,973.719 2298.14,974.326C2296.29,975.004 2294.2,977.531 2292.26,979.171C2289.93,981.147 2285.7,984.4 2284.13,986.181C2283.27,987.157 2283.29,988.833 2282.81,989.86C2282.4,990.745 2282.06,991.784 2281.26,992.343C2280.35,992.978 2277.73,992.347 2277.36,993.671C2276.92,995.226 2277.76,1000.37 2278.65,1001.68ZM2361.32,1087.66C2363.47,1087.53 2368.09,1087.2 2370.9,1086.64C2370.93,1086.22 2370.98,1085.82 2371.04,1085.55L2371.85,1083.71L2373.11,1082.46C2373.97,1081.88 2375.31,1081.4 2376.84,1081.24C2378.58,1081.05 2380.57,1081.25 2381.87,1081.68C2383.51,1082.21 2386.37,1083.83 2387.37,1085.22L2388.22,1087.05L2388.28,1088.9L2387.72,1090.44L2386.82,1091.56C2386.22,1092.12 2384.95,1092.9 2383.26,1093.63C2380.4,1094.87 2376.06,1096.26 2373.43,1096.85C2371.58,1097.27 2369.46,1097.25 2367.45,1097.17C2366.24,1097.12 2365.08,1096.98 2364.21,1097.22C2363.61,1097.39 2363.25,1098.03 2362.77,1098.47C2361.75,1099.41 2360.69,1100.2 2359.56,1100.64C2357.93,1101.28 2355.7,1101.9 2353.95,1101.85L2351.89,1101.51L2350.35,1100.72C2348.93,1099.71 2347.05,1096.44 2346.7,1093.85L2346.63,1092.51L2346.75,1091.46L2347.16,1090.22L2347.71,1089.32L2348.44,1088.55L2349.49,1087.85C2350.06,1087.56 2350.79,1087.3 2351.64,1087.13C2353.56,1086.74 2356.41,1086.77 2357.79,1086.76C2358.86,1086.75 2360.77,1087.45 2361.32,1087.66ZM2361.2,1091.67C2360.03,1091.73 2358.98,1090.75 2357.82,1090.76C2356.1,1090.78 2351.74,1090.63 2350.88,1091.75C2350.03,1092.87 2351.47,1096.61 2352.67,1097.47C2353.88,1098.33 2356.41,1097.58 2358.11,1096.92C2359.85,1096.23 2361.16,1093.91 2363.15,1093.36C2365.55,1092.7 2369.49,1093.64 2372.55,1092.95C2376.04,1092.16 2382.75,1089.87 2384.1,1088.63C2385.25,1087.57 2382.09,1085.95 2380.63,1085.48C2379.17,1085 2376.43,1085.04 2375.36,1085.77C2374.28,1086.5 2375.47,1089.32 2374.16,1089.86C2371.8,1090.85 2363.92,1091.52 2361.2,1091.67ZM1962.03,1019.31C1961.98,1019.42 1961.81,1019.79 1961.75,1020.03C1961.56,1020.74 1961.49,1021.54 1961.45,1022.35C1961.33,1025.42 1961.6,1028.62 1961.22,1030.29C1959.8,1036.54 1956.09,1039.03 1952.96,1039.08C1950.03,1039.12 1946.14,1036.89 1943.77,1030.83C1940.83,1023.29 1936.98,1000.21 1938.58,986.802C1938.93,983.907 1939.98,981.161 1941.09,978.429C1941.94,976.348 1942.84,974.281 1943.12,972.079C1943.85,966.557 1944.33,959.103 1943.22,952.76C1942.65,949.5 1941.02,945.951 1939.5,942.456C1937.67,938.242 1936.01,934.086 1935.67,930.489C1935.34,927.011 1936.43,923.617 1937.71,920.248C1938.57,917.971 1939.58,915.72 1939.48,913.361C1939.21,906.619 1935.02,896.695 1934.02,889.567C1933.47,885.635 1932.41,881.177 1932.22,877.101C1932.06,873.719 1932.49,870.563 1933.82,867.934C1935.11,865.404 1937.59,862.884 1940.56,860.727C1944.5,857.861 1949.26,855.575 1952.27,854.486C1954.5,853.677 1956.84,853.905 1959.22,854.614C1960.13,854.889 1961.06,855.232 1961.99,855.516C1962.71,855.735 1963.4,856 1964.1,855.857C1966.63,855.335 1970.26,853.145 1973.55,851.443C1976.47,849.936 1979.2,848.766 1981.06,848.514C1985.29,847.943 1990.47,851.261 1991.92,855.271C1992.69,857.403 1992.71,861.295 1992.65,865.306C1992.61,868.141 1992.46,871.066 1993.22,872.88C1994.49,875.93 1997.67,878.079 2000.72,879.362C2005.42,881.345 2013.4,881.493 2019.68,882.86C2027.52,884.567 2038.67,885.742 2046.37,889.336C2050.35,891.192 2053.72,894.02 2057,897.012C2059.8,899.569 2062.52,902.253 2065.69,904.26C2072.41,908.513 2080.15,912.824 2087.76,915.603C2095.07,918.275 2102.73,921.371 2110.5,920.894C2121.55,920.216 2143.06,913.106 2152.72,911.314C2157.95,910.343 2163.39,910.996 2168.63,910.075C2177.74,908.473 2200.32,903.179 2207.46,901.693C2212.7,900.601 2216.74,902.09 2218.51,904.447C2220.31,906.85 2220.86,911.213 2216.3,916.81C2212.31,921.701 2197.34,930.484 2189.21,938.801C2180.76,947.453 2170.27,958.479 2164.51,969.58C2158.76,980.656 2157.98,993.678 2154.59,1005.68C2152.52,1013.01 2151.11,1022.28 2149.13,1029.99C2147.64,1035.8 2145.75,1040.77 2143.28,1043.83C2140.82,1046.87 2137.02,1048.69 2132.75,1049.49C2127.29,1050.53 2121.09,1049.94 2117.15,1049.17C2114.02,1048.57 2111.49,1046.45 2109.26,1043.81C2108.11,1042.45 2107.03,1040.95 2105.85,1039.74C2105.22,1039.09 2104.63,1038.46 2103.82,1038.32C2101.79,1037.95 2099.52,1039.1 2097.08,1040.11C2093.41,1041.64 2089.55,1043.23 2085.86,1043.37C2074.44,1043.8 2052.56,1044.58 2036.55,1040.77C2019.89,1036.8 1997.89,1023.04 1984.98,1019.51C1977.62,1017.5 1966.36,1017.31 1962.03,1019.31ZM1942.55,987.277C1941.02,1000.1 1944.69,1022.16 1947.5,1029.38C1950.51,1037.09 1955.62,1036.85 1957.32,1029.4C1958.01,1026.37 1956.03,1017.75 1960.23,1015.74C1965.01,1013.45 1977.74,1013.38 1986.04,1015.65C1998.91,1019.17 2020.86,1032.92 2037.47,1036.87C2053.14,1040.6 2074.54,1039.79 2085.72,1039.37C2092.2,1039.13 2099.17,1033.4 2104.53,1034.38C2109.9,1035.36 2112.27,1044.15 2117.91,1045.25C2123.85,1046.4 2135.44,1047.18 2140.17,1041.31C2145.64,1034.54 2147.28,1016.85 2150.74,1004.6C2154.21,992.332 2155.08,979.052 2160.96,967.737C2166.89,956.306 2177.64,944.915 2186.35,936.006C2194.4,927.773 2209.25,919.123 2213.2,914.282C2218.81,907.394 2214.86,904.238 2208.27,905.609C2201.11,907.099 2178.46,912.408 2169.32,914.014C2164.1,914.933 2158.66,914.278 2153.45,915.247C2143.68,917.059 2121.92,924.201 2110.74,924.886C2102.43,925.396 2094.2,922.218 2086.38,919.36C2078.52,916.486 2070.5,912.04 2063.55,907.64C2056.82,903.377 2051.9,896.331 2044.68,892.961C2037.23,889.482 2026.41,888.421 2018.83,886.769C2012.31,885.349 2004.05,885.107 1999.16,883.048C1995.19,881.373 1991.18,878.399 1989.53,874.418C1987.69,870.015 1989.48,860.287 1988.16,856.631C1987.28,854.196 1984.16,852.131 1981.6,852.478C1977.72,853.002 1969.57,858.813 1964.91,859.775C1961.19,860.541 1957.2,856.954 1953.63,858.246C1949.05,859.908 1940,864.619 1937.39,869.747C1934.78,874.874 1937.09,882.649 1937.99,889.012C1939,896.254 1943.2,906.349 1943.48,913.199C1943.71,918.974 1939.11,924.357 1939.65,930.111C1940.27,936.59 1945.92,944.99 1947.16,952.071C1948.34,958.811 1947.86,966.73 1947.09,972.598C1946.42,977.676 1943.16,982.192 1942.55,987.277ZM1967.16,895.481C1960.24,897.761 1957.43,890.45 1956.06,886.838C1954.68,883.226 1954.37,875.099 1958.89,873.81C1961.57,873.049 1969.63,871.4 1971.37,880.22C1972.11,884.013 1974.38,893.106 1967.16,895.481ZM1965.91,891.682C1967.69,891.095 1968.14,889.569 1968.26,888.065C1968.47,885.425 1967.76,882.638 1967.44,880.993C1967.15,879.528 1966.66,878.524 1965.92,877.933C1965.11,877.284 1964.09,877.173 1963.17,877.172C1961.87,877.169 1960.69,877.459 1959.99,877.657C1959.79,877.715 1959.76,877.955 1959.67,878.149C1959.44,878.676 1959.31,879.29 1959.23,879.927C1959,881.89 1959.28,884.071 1959.8,885.412C1960.26,886.638 1960.9,888.377 1961.9,889.886C1962.74,891.155 1963.93,892.333 1965.91,891.682ZM2130.34,936.263C2130.64,931.291 2139.3,932.408 2143.34,932.797C2147.37,933.187 2153.01,936.842 2154.53,938.6C2155.66,939.908 2153.98,942.559 2152.44,943.346C2150.74,944.216 2146.96,943.123 2144.34,943.816C2141.5,944.569 2137.73,949.124 2135.4,947.865C2133.06,946.606 2130.16,939.096 2130.34,936.263ZM2134.33,936.861C2134.41,938.203 2135.24,940.442 2136.15,942.297C2136.35,942.701 2136.64,943.175 2136.9,943.58C2137.37,943.292 2137.94,942.938 2138.34,942.658C2140.04,941.458 2141.81,940.35 2143.32,939.95C2144.99,939.506 2147.04,939.553 2148.94,939.653C2149.16,939.664 2149.41,939.67 2149.66,939.673C2147.8,938.385 2145.08,936.984 2142.95,936.779C2141.14,936.604 2138.3,936.233 2135.87,936.496C2135.39,936.548 2134.69,936.749 2134.33,936.861ZM1947.01,996.916C1947.15,996.93 1947.3,996.935 1947.45,996.932C1947.28,996.91 1947.13,996.901 1947,996.894C1946.7,995.164 1946.5,992.781 1947.36,992.93C1948.38,993.11 1952.94,993.291 1953.36,998.936C1953.55,1001.39 1955.92,1006.14 1953.3,1006.93C1949.65,1008.03 1948.67,1004.19 1947.19,997.854C1947.13,997.586 1947.07,997.265 1947.01,996.916ZM2008.67,907.88C2017.29,909.63 2033.56,913.739 2044.49,916.364C2054.41,918.747 2064.48,920.583 2074.22,923.627C2084.51,926.844 2099.22,932.211 2106.23,935.665C2110.19,937.62 2114.56,941.496 2116.24,944.355C2117.66,946.79 2115.64,950.068 2116.27,952.818C2117.16,956.73 2120.19,962.707 2121.6,967.826C2123.31,974.005 2126.75,983.278 2126.49,989.894C2126.25,996.144 2124.44,1003.06 2120.05,1007.52C2114.35,1013.3 2101.22,1021.67 2092.32,1024.58C2084.19,1027.24 2074.13,1024.96 2066.66,1024.99C2060.26,1025.02 2053.85,1025.3 2047.48,1024.76C2040.25,1024.15 2031.08,1023.69 2023.29,1021.33C2013.2,1018.28 1995.95,1011.95 1986.97,1006.46C1979.8,1002.08 1973.66,995.409 1969.41,988.397C1965.16,981.385 1962.26,972.781 1961.47,964.39C1960.63,955.361 1962.91,941.954 1964.36,934.226C1965.41,928.588 1966.07,922.067 1970.13,918.016C1974.86,913.289 1977.67,906.363 1992.79,905.864C1998.12,905.687 2003.44,906.817 2008.67,907.88ZM2112.74,946.305C2111.33,943.951 2107.7,940.852 2104.46,939.253C2097.58,935.861 2083.12,930.603 2073.02,927.445C2063.37,924.428 2053.38,922.615 2043.55,920.253C2032.67,917.639 2016.46,913.543 2007.88,911.8C2002.95,910.799 1997.94,909.695 1992.92,909.861C1979.52,910.304 1977.15,916.658 1972.95,920.848C1971.4,922.393 1970.58,924.446 1969.96,926.614C1969.19,929.338 1968.79,932.256 1968.29,934.959C1966.9,942.406 1964.65,955.319 1965.46,964.018C1966.18,971.815 1968.88,979.809 1972.83,986.324C1976.76,992.81 1982.43,998.997 1989.05,1003.05C1997.8,1008.39 2014.62,1014.53 2024.44,1017.5C2031.97,1019.78 2040.83,1020.18 2047.82,1020.77C2054.07,1021.3 2060.37,1021.02 2066.64,1020.99C2073.76,1020.97 2083.33,1023.31 2091.07,1020.78C2099.46,1018.03 2111.84,1010.16 2117.2,1004.71C2120.92,1000.94 2122.29,995.027 2122.49,989.737C2122.74,983.479 2119.36,974.734 2117.75,968.889C2116.32,963.714 2113.27,957.665 2112.37,953.71C2112,952.109 2112.15,950.383 2112.45,948.664C2112.56,948.062 2112.68,947.462 2112.74,946.878C2112.75,946.703 2112.74,946.395 2112.74,946.305ZM2040.2,951.617L2040.69,950.488L2041.29,949.614C2041.79,948.987 2042.47,948.353 2043.29,947.797C2045.13,946.547 2047.68,945.736 2049.68,945.844C2054.64,946.112 2069.02,948.741 2073.71,950.608C2075.88,951.473 2077.97,953.628 2079.11,955.971C2079.98,957.764 2080.27,959.628 2080.05,961.056C2079.77,962.857 2078.27,965.735 2076.12,967.621C2074.34,969.184 2072.19,970.03 2070.18,969.891C2064.99,969.534 2049.7,964.337 2045.02,962.016C2043.08,961.055 2041.31,958.772 2040.5,956.461C2040.17,955.529 2039.99,954.611 2039.95,953.813L2040.2,951.617ZM2044.03,952.801C2043.58,954.234 2044.92,957.503 2046.8,958.433C2051.2,960.616 2065.57,965.565 2070.45,965.901C2073.06,966.08 2075.8,962.378 2076.1,960.449C2076.39,958.52 2074.47,955.218 2072.23,954.324C2067.79,952.556 2054.16,950.092 2049.46,949.838C2047.4,949.727 2044.47,951.369 2044.03,952.801ZM1728.34,849.795C1728.92,849.12 1729.54,848.395 1730,847.829C1731.16,846.398 1732.34,845.115 1733.39,844.336C1734.66,843.401 1736.2,842.83 1737.78,842.369C1738.37,842.198 1738.96,842.042 1739.51,841.838C1739.8,841.734 1740.1,841.678 1740.29,841.449C1741.2,840.358 1741.78,838.319 1742.51,836.317C1743.59,833.301 1744.84,830.322 1746.35,828.601C1748.33,826.353 1752.16,824.049 1755.01,823.213C1756.01,822.921 1756.92,822.789 1757.68,822.791L1759.01,822.934L1760.06,823.279L1761.39,824.19L1762.25,825.308L1762.87,827.095C1762.97,827.644 1763.01,828.303 1762.98,829.034C1762.95,829.754 1762.86,830.963 1762.78,831.979C1763.62,831.879 1764.58,831.758 1765.29,831.652C1766.92,831.406 1768.44,831.308 1769.55,831.475L1771.01,831.865L1772.12,832.469L1773.22,833.469L1774,834.576C1774.52,835.492 1774.88,836.619 1775.03,837.862C1775.32,840.306 1774.77,843.258 1773.77,845.256C1771.94,848.885 1766.37,855.419 1762.4,858.432C1760.68,859.74 1758.55,860.424 1756.34,860.91C1755.43,861.109 1754.51,861.28 1753.63,861.522C1752.95,861.711 1752.27,861.881 1751.79,862.388C1750.64,863.621 1749.88,865.848 1749.1,868.035C1748.04,871.016 1747.1,874.008 1746.13,875.785C1744.56,878.665 1742.62,881.936 1739.55,883.101C1736.59,884.225 1730.57,883.891 1727.59,882.916C1726.07,882.421 1724.81,881.385 1723.75,880.077C1723.39,879.648 1722.81,878.924 1722.53,878.566C1722.08,878.6 1721.19,878.665 1720.66,878.698C1718.93,878.803 1717.3,878.548 1715.9,877.689C1714.37,876.748 1712.48,874.579 1710.59,872.358C1709.48,871.047 1708.43,869.631 1707.35,869.097C1707.18,869.112 1706.13,869.21 1705.55,869.349C1704.48,869.604 1703.43,869.916 1702.51,870.097C1701.5,870.296 1700.58,870.354 1699.81,870.271L1698.34,869.926L1697.27,869.375L1696.35,868.614L1695.67,867.786L1694.98,866.545C1694.82,866.175 1694.68,865.775 1694.56,865.351C1693.84,862.743 1694.17,859.046 1694.89,857.137L1695.45,856.003L1696.14,855.078C1696.72,854.431 1697.44,853.865 1698.27,853.369C1699.12,852.851 1700.25,852.553 1700.92,851.854C1702.05,850.674 1703.38,848.521 1704.74,846.661C1706,844.949 1707.3,843.448 1708.48,842.577C1711.16,840.592 1715.39,839.987 1718.26,840.422C1721.12,840.859 1723.8,842.765 1725.74,844.937C1726.5,845.79 1727.26,847.219 1727.92,848.829C1728.04,849.115 1728.19,849.449 1728.34,849.795ZM1698.63,858.549C1697.91,860.453 1697.79,864.908 1699.5,866.05C1701.2,867.192 1706.02,864.126 1708.88,865.401C1711.97,866.773 1715.44,872.713 1718,874.281C1719.76,875.366 1722.38,874.007 1724.18,874.812C1725.99,875.618 1726.82,878.459 1728.83,879.114C1731.15,879.872 1735.83,880.236 1738.13,879.362C1740.34,878.522 1741.49,875.947 1742.62,873.87C1744.41,870.587 1745.97,862.764 1748.87,859.661C1751.59,856.745 1756.81,857.658 1759.98,855.247C1763.54,852.546 1768.56,846.711 1770.19,843.458C1771.35,841.155 1771.61,837.016 1769.8,835.732C1767.99,834.448 1761.23,837.22 1759.33,835.752C1757.43,834.284 1760.07,827.675 1758.41,826.924C1756.75,826.173 1751.56,828.734 1749.35,831.244C1746.85,834.092 1745.63,841.29 1743.37,844.009C1741.58,846.156 1738.02,845.898 1735.77,847.556C1733.15,849.485 1729.84,855.572 1727.67,855.58C1725.5,855.587 1724.42,849.47 1722.76,847.603C1721.41,846.103 1719.64,844.678 1717.65,844.377C1715.67,844.075 1712.72,844.417 1710.86,845.792C1708.55,847.5 1705.84,852.496 1703.8,854.622C1702.31,856.184 1699.35,856.644 1698.63,858.549ZM1729.18,1020.54C1729.13,1019.87 1729.04,1018.43 1729.05,1017.71L1729.21,1016.26L1729.61,1015.03L1730.31,1013.92L1731.39,1012.94L1733.32,1012.11C1733.99,1011.94 1734.78,1011.87 1735.64,1011.91C1737.42,1011.99 1739.82,1012.71 1741.65,1012.82C1744.12,1012.98 1747.19,1013.54 1749.33,1013.28C1750.08,1013.19 1750.74,1012.76 1751.43,1012.42C1752.4,1011.95 1753.39,1011.52 1754.42,1011.25C1756.96,1010.6 1760.01,1009.82 1762.39,1010.36C1765.13,1010.97 1768.26,1013.21 1769.71,1015.32C1771.32,1017.64 1771.99,1021.01 1771.24,1023.78C1770.93,1024.92 1770.19,1026.29 1769.24,1027.65C1768.41,1028.84 1767.38,1030.05 1766.88,1031.02C1766.86,1031.13 1766.79,1031.6 1766.76,1031.86C1766.69,1032.55 1766.6,1033.24 1766.43,1033.87L1765.65,1035.72L1764.63,1036.99C1762.28,1039.2 1755.37,1042.77 1751.96,1045.5C1749.08,1047.79 1747.15,1051.15 1744.17,1053.31C1740.93,1055.66 1736.97,1057.57 1733.07,1059.01C1729.52,1060.32 1725.05,1060.52 1721.87,1061.69C1720.48,1062.21 1719.33,1063.31 1718.08,1064.15C1716.61,1065.14 1715.08,1065.92 1713.39,1066.25C1709.96,1066.92 1705.15,1066.02 1702.03,1065.25C1700.44,1064.86 1698.59,1064.49 1697.06,1063.78C1695.4,1063.01 1694.06,1061.87 1693.2,1060.31C1691.62,1057.41 1690.67,1050.57 1691.85,1046.77C1692.41,1044.97 1693.54,1043.42 1694.99,1042.03C1696.3,1040.77 1697.96,1039.68 1699.09,1038.3C1700.74,1036.3 1702.76,1032.78 1704.89,1029.81C1706.7,1027.29 1708.63,1025.15 1710.44,1024.02C1712.47,1022.75 1714.87,1022.46 1717.4,1022.71C1718.66,1022.83 1719.95,1023.08 1721.19,1023.24C1721.87,1023.33 1722.52,1023.44 1723.1,1023.3C1725.2,1022.81 1727.79,1021.74 1729.18,1020.54ZM1696.71,1058.39C1697.82,1060.42 1700.74,1060.81 1702.99,1061.37C1705.64,1062.02 1709.71,1062.89 1712.62,1062.32C1715.54,1061.75 1717.67,1058.99 1720.48,1057.94C1723.66,1056.77 1728.13,1056.57 1731.69,1055.26C1735.24,1053.95 1738.86,1052.22 1741.83,1050.07C1744.75,1047.95 1746.64,1044.62 1749.46,1042.37C1752.81,1039.7 1759.58,1036.25 1761.88,1034.08C1763.07,1032.95 1762.53,1030.83 1763.24,1029.35C1764.16,1027.46 1766.85,1024.69 1767.38,1022.73C1767.84,1021.05 1767.4,1019 1766.42,1017.59C1765.45,1016.18 1763.35,1014.67 1761.52,1014.26C1759.68,1013.85 1757.37,1014.63 1755.42,1015.13C1753.48,1015.62 1751.79,1017.01 1749.81,1017.25C1747.47,1017.53 1744.1,1016.98 1741.41,1016.82C1738.81,1016.65 1735.09,1015.27 1733.63,1016.25C1732.17,1017.24 1734.09,1021.09 1732.65,1022.74C1731.04,1024.56 1727.16,1026.46 1724.01,1027.2C1720.66,1027.98 1715.79,1025.39 1712.56,1027.41C1708.92,1029.69 1705,1037.42 1702.18,1040.84C1700.14,1043.33 1696.58,1045.04 1695.67,1047.96C1694.76,1050.89 1695.49,1056.15 1696.71,1058.39ZM1108.83,830.928C1108.23,830.615 1107.61,830.298 1107.07,830.034C1103.53,828.319 1099.96,826.113 1098.46,823.559C1095.73,818.889 1096.01,811.06 1096.66,805.595C1097.24,800.776 1098.6,797.9 1100.15,796.092C1101.95,794.004 1104.12,793.067 1106.52,792.674C1108.63,792.329 1110.99,792.654 1113.15,792.074C1115.81,791.36 1118.86,791.432 1122.07,791.852C1125.82,792.344 1129.82,793.356 1133.41,793.239C1139.8,793.033 1146.03,790.305 1152.4,790.717C1160.2,791.221 1171.12,796.198 1180.74,796.285C1194.3,796.408 1223.16,791.438 1233.52,791.447C1238.22,791.45 1244.13,795.408 1246.05,797.876L1246.83,799.119L1247.31,800.394C1247.53,801.172 1247.63,802.01 1247.62,802.866C1247.58,805.245 1246.58,807.743 1245.1,809.311C1244.07,810.404 1242.25,811.268 1240.09,811.893C1239.18,812.157 1238.18,812.407 1237.27,812.757C1236.82,812.927 1236.38,813.079 1236.08,813.389C1234.65,814.88 1233.44,817.686 1232,820.483C1230.08,824.184 1227.86,827.867 1225.16,830.053C1222.39,832.292 1218.49,833.436 1214.61,834.311C1211.93,834.918 1209.26,835.281 1207.6,836.463C1206.07,837.548 1205.57,839.498 1204.78,841.276C1203.87,843.33 1202.85,845.312 1201.37,846.888C1196.75,851.791 1187.56,860.976 1180.77,864.811C1174.51,868.34 1165.51,869.527 1159.88,870.123C1155.2,870.619 1149.87,870.164 1145.87,868.236C1144.07,867.368 1142.51,866.024 1141.07,864.453C1139.56,862.801 1138.22,860.839 1136.54,859.405C1134.9,858.004 1133.26,856.185 1131.46,854.571C1130.19,853.424 1128.86,852.344 1127.26,851.942C1125.35,851.462 1122.71,852.035 1120.11,852.488C1116.35,853.143 1112.64,853.698 1110.16,853.194C1107.5,852.654 1104.37,850.849 1102.19,848.819C1100.33,847.09 1099.21,845.137 1098.92,843.672L1098.82,842.365L1098.98,841.169L1099.4,839.961C1099.62,839.494 1099.89,839.02 1100.23,838.548C1101.47,836.831 1103.97,835.028 1105.47,833.43C1106.24,832.597 1107.37,831.798 1108.6,831.063C1108.67,831.02 1108.75,830.975 1108.83,830.928ZM1100.63,806.07C1100.07,810.768 1099.56,817.522 1101.91,821.535C1104.27,825.549 1113.67,827.713 1114.75,830.151C1115.83,832.588 1110.37,834.035 1108.39,836.16C1106.4,838.285 1102.42,840.718 1102.85,842.903C1103.27,845.089 1107.59,848.589 1110.96,849.274C1115.19,850.134 1123.54,846.881 1128.24,848.063C1132.67,849.178 1135.91,853.604 1139.14,856.365C1142.14,858.928 1144.21,863.001 1147.6,864.631C1150.99,866.261 1155.5,866.565 1159.46,866.145C1164.66,865.594 1173.02,864.591 1178.8,861.327C1185.3,857.661 1194.04,848.834 1198.45,844.146C1201.4,841.016 1201.78,835.694 1205.28,833.203C1209.31,830.336 1217.99,830.707 1222.65,826.944C1227.3,823.18 1229.94,814.016 1233.2,810.62C1235.47,808.247 1240.57,808.281 1242.19,806.566C1243.62,805.045 1244.18,801.984 1242.9,800.334C1241.45,798.481 1237.05,795.449 1233.52,795.447C1223.15,795.438 1194.27,800.408 1180.71,800.285C1171.01,800.197 1160.01,795.217 1152.15,794.709C1145.9,794.305 1139.8,797.035 1133.55,797.237C1127.22,797.442 1119.67,794.465 1114.18,795.937C1108.74,797.399 1102.11,793.702 1100.63,806.07ZM760.149,844.095C760.42,843.345 760.895,841.989 761.109,841.115C761.513,839.46 761.93,837.965 762.399,837.068L763.383,835.688L764.754,834.704L766.184,834.269L767.608,834.261L769.021,834.652L770.515,835.55C772.222,836.901 774.027,839.99 774.831,842.058C776.125,845.389 776.847,851.729 777.783,856.578C778.82,861.946 780.305,867.441 781.198,874.746C781.257,875.225 781.599,875.563 781.933,875.917C782.437,876.451 783.034,876.94 783.641,877.429C785.1,878.605 786.599,879.782 787.721,881.122C792.115,886.365 800.851,896.412 806.6,904.065C812.178,911.491 818.134,920.706 822.262,927.112C825.636,932.349 830.207,938.753 831.708,943.238C832.354,945.172 832.252,947.3 831.833,949.439C831.668,950.284 831.459,951.132 831.308,951.956C831.212,952.479 831.033,952.976 831.191,953.416C831.334,953.817 831.779,954.024 832.156,954.323C832.821,954.851 833.544,955.357 834.22,955.892C836.029,957.325 837.476,959.003 838.076,961.072C838.611,962.92 838.469,965.361 838.002,967.92C837.754,969.276 837.435,970.679 837.247,971.991C837.138,972.754 837.016,973.462 837.17,974.037C837.301,974.524 837.736,974.869 838.131,975.251C838.698,975.801 839.325,976.316 839.915,976.825C841.541,978.227 842.869,979.704 843.465,981.204C844.368,983.476 844.88,987.266 844.234,989.632L843.569,991.257L842.736,992.381L841.721,993.221L840.461,993.813C839.275,994.193 836.999,994.257 834.428,993.678C831.237,992.958 827.528,991.342 825.379,989.306C823.856,987.862 822.674,985.575 821.738,983.017C820.854,980.601 820.299,977.835 819.06,976.35C817.59,974.587 815.153,972.986 813.159,972.737C813.016,972.796 812.498,973.015 812.21,973.18C811.53,973.569 810.853,974.025 810.188,974.43C808.157,975.667 806.095,976.349 804.279,976.114C801.731,975.784 797.994,973.57 795.962,971.315C795.312,970.593 794.817,969.865 794.492,969.203L794.047,968.028L793.877,967.038L793.925,965.792L794.185,964.742L794.767,963.474C794.963,963.135 795.197,962.789 795.466,962.442C797.093,960.348 800.293,958.175 802.82,957.427C804.502,956.93 807.123,957.31 809.772,958.028C810.373,958.191 811.218,958.367 811.897,958.499C811.97,957.533 811.954,956.401 811.88,955.197C811.642,951.304 810.802,946.698 809.889,944.302C809.35,942.887 807.902,942.162 806.599,941.266C805.023,940.182 803.447,939.073 802.206,937.727C798.961,934.207 794.526,928.619 791.368,924.618C789.907,922.767 788.596,920.414 787.257,918.277C786.381,916.878 785.602,915.522 784.532,914.901C783.728,914.434 782.778,914.529 781.816,914.618C780.004,914.786 778.135,915.216 776.392,915.383C774.458,915.569 772.479,916.571 770.491,917.116C768.334,917.707 766.178,917.918 764.065,917.381C759.255,916.161 750.448,910.739 747.997,907.526L747.266,906.282L746.868,904.956L746.782,903.485L747.095,901.718C747.362,900.796 748.079,899.12 748.433,898.314C748.291,898.207 748.129,898.1 747.969,897.977C747.135,897.334 746.134,896.696 745.133,896.017C742.28,894.082 739.601,891.751 738.544,888.956C737.551,886.328 737.83,882.517 738.425,878.794C738.794,876.486 739.432,874.251 739.024,872.841C738.949,872.581 738.706,872.442 738.494,872.27C738.056,871.912 737.555,871.6 737.046,871.287C735.735,870.48 734.391,869.678 733.314,868.713C731.119,866.746 726.929,863.648 723.444,860.619C720.697,858.231 718.387,855.819 717.324,853.928C715.848,851.302 715.389,847.46 716.23,844.211C716.884,841.682 718.291,839.544 720.261,838.273C723.918,835.911 733.655,834.763 740.283,835.88C744.448,836.581 750.281,839.669 755.287,842.043C757.177,842.939 758.858,843.82 760.149,844.095ZM720.81,851.967C723.069,855.984 732.307,862.44 735.984,865.734C738.25,867.765 742.022,868.807 742.867,871.73C743.918,875.365 740.698,883.344 742.286,887.542C743.873,891.74 750.91,893.992 752.392,896.918C753.637,899.378 749.504,902.908 751.177,905.099C753.286,907.864 760.91,912.454 765.049,913.504C768.655,914.42 772.428,911.746 776.01,911.402C779.504,911.066 783.505,909.679 786.54,911.442C789.623,913.231 791.753,918.65 794.508,922.14C797.609,926.069 801.96,931.559 805.147,935.015C807.76,937.85 812.255,939.275 813.627,942.878C815.314,947.306 816.88,958.521 815.268,961.585C813.656,964.649 806.855,960.406 803.954,961.263C801.338,962.037 797.726,964.917 797.866,966.731C798.005,968.545 802.203,971.812 804.792,972.147C807.381,972.482 810.511,968.466 813.401,968.739C816.291,969.013 819.979,971.206 822.132,973.788C824.587,976.732 825.279,983.7 828.131,986.403C830.956,989.081 837.305,990.624 839.241,990.004C841.177,989.384 840.652,984.955 839.748,982.682C838.759,980.194 834.171,978.284 833.308,975.076C832.389,971.66 835.214,965.57 834.234,962.185C833.3,958.96 828.477,957.709 827.424,954.763C826.371,951.817 829,947.753 827.914,944.507C826.493,940.26 822.095,934.237 818.9,929.279C814.814,922.939 808.923,913.817 803.402,906.467C797.694,898.869 789.018,888.897 784.656,883.691C782.245,880.815 777.683,878.957 777.228,875.232C776.348,868.036 774.877,862.624 773.856,857.336C772.965,852.721 772.333,846.676 771.102,843.507C770.263,841.345 768.108,837.54 766.468,838.318C764.828,839.096 764.97,847.965 761.26,848.173C756.785,848.424 746.091,840.914 739.619,839.824C733.938,838.867 725.565,839.609 722.43,841.633C719.501,843.524 719.101,848.928 720.81,851.967ZM761.439,890.495C757.623,891.184 750.459,890.073 747.931,888.024C745.404,885.976 745.479,880.509 746.275,878.202C747.071,875.895 750.235,874.182 752.707,874.185C755.179,874.187 758.369,876.75 761.107,878.216C764.128,879.833 770.775,881.84 770.83,883.886C770.885,885.932 765.206,889.814 761.439,890.495ZM764.853,884.471C762.942,883.581 760.465,882.41 759.22,881.743C757.822,880.995 756.308,879.97 754.829,879.128C754.055,878.688 753.363,878.185 752.703,878.185C752.123,878.184 751.475,878.426 750.913,878.762C750.561,878.972 750.173,879.168 750.056,879.507C749.741,880.42 749.654,882.085 749.949,883.561C750.054,884.082 750.098,884.631 750.45,884.917C751.11,885.452 752.296,885.78 753.59,886.083C756.016,886.651 758.861,886.896 760.728,886.558C761.849,886.356 763.515,885.369 764.853,884.471ZM769.876,908.194C766.999,907.747 757.772,903.42 756.938,901.592C756.103,899.764 762.173,898.032 764.87,897.226C767.508,896.437 771.564,895.582 773.118,896.756C774.672,897.93 774.735,902.363 774.195,904.269C773.664,906.141 771.798,908.492 769.876,908.194ZM764.428,901.599C766.366,902.601 768.514,903.644 769.81,904.066C770.009,903.806 770.275,903.429 770.347,903.178C770.507,902.611 770.41,901.231 770.32,900.311C769.151,900.455 767.091,900.737 766.015,901.058C765.624,901.175 765.057,901.371 764.428,901.599ZM937.935,1090.17C937.735,1090.32 937.527,1090.48 937.368,1090.62C936.488,1091.36 935.597,1092.17 934.758,1092.77C933.851,1093.42 932.952,1093.88 932.133,1094.12L930.813,1094.34L929.241,1094.2C927.482,1093.78 924.978,1091.67 923.282,1089.01C922.289,1087.46 921.535,1085.8 921.216,1084.58L920.982,1083.18L921.05,1081.9L921.52,1080.51L922.264,1079.42L923.242,1078.56L924.617,1077.81C926.471,1077.04 929.655,1076.77 931.732,1076.68C933.322,1076.62 935.812,1077.07 938.222,1077.55C938.133,1077.43 938.046,1077.33 937.96,1077.25C937.219,1076.54 935.77,1076.18 934.376,1075.69C931.924,1074.84 929.494,1073.92 928.09,1072.83C927.218,1072.16 926.468,1071.18 925.864,1070.05C925.854,1070.06 925.844,1070.07 925.833,1070.07L924.687,1070.7L923.659,1071L922.655,1071.08L921.603,1070.95L920.681,1070.63L919.69,1070.07C919.486,1069.92 919.274,1069.75 919.057,1069.56C918.942,1070.1 918.81,1070.6 918.656,1071.05C917.68,1073.88 915.874,1079.78 914.426,1082.23C914.16,1082.68 913.892,1083.06 913.64,1083.36L912.779,1084.2L911.863,1084.77L910.988,1085.09L909.287,1085.17L907.901,1084.73L906.827,1084L905.904,1082.97C904.467,1080.97 902.852,1075.24 902.345,1072.6C901.772,1069.61 902.207,1066.44 902.958,1063.5C903.224,1062.45 903.807,1061.31 904.55,1060.18C903.862,1060.08 903.167,1059.97 902.603,1059.88C900.742,1059.56 898.978,1059.03 897.626,1058.2C893.766,1055.82 888.239,1050.72 886.31,1047.01C885.381,1045.23 885.164,1043.11 885.349,1040.93C885.44,1039.85 885.626,1038.75 885.744,1037.73C885.787,1037.36 885.855,1037.01 885.839,1036.7C885.621,1036.46 885.037,1035.82 884.695,1035.48C883.65,1034.43 882.822,1033.36 882.456,1032.44L882.17,1031.48L882.081,1030.29L882.321,1028.99L882.889,1027.82L884.353,1026.3C884.894,1025.89 885.603,1025.49 886.443,1025.12C888.7,1024.13 892.213,1023.3 894.714,1022.8C898.776,1021.97 904.929,1021.05 908.852,1021.58C910.62,1021.82 912.341,1022.6 913.972,1023.58C915.274,1024.36 916.426,1025.44 917.61,1025.68C918.478,1025.85 919.433,1025.33 920.335,1025.09C921.971,1024.65 923.516,1024.46 924.769,1024.7C926.387,1025 928.323,1025.78 929.684,1026.91L930.651,1027.86L931.504,1029.13L931.926,1030.18L932.154,1031.36C932.257,1032.46 931.983,1033.88 931.285,1035.4C930.614,1036.87 929.246,1038.63 929.03,1040.26C928.658,1043.06 928.529,1047 929.428,1050.19C930.316,1053.34 931.83,1056.93 934.257,1059.4C935.471,1060.64 937.273,1061.42 939.081,1062.3C941.671,1063.56 944.307,1064.89 946.354,1066.75C950.565,1070.57 955.935,1077.6 958.736,1081.77C960.916,1085.01 962.702,1089.31 963.514,1092.48C964.045,1094.54 964.564,1097.38 964.345,1099.47L963.761,1101.8L962.672,1103.49C961.755,1104.49 960.075,1105.45 958.03,1105.89C955.418,1106.46 952.288,1106.17 950.231,1104.97C948.857,1104.17 947.344,1102.59 945.923,1100.65C944.441,1098.63 942.985,1096.16 941.649,1094.67C940.638,1093.54 939.608,1092.04 938.527,1090.78C938.368,1090.59 938.142,1090.37 937.935,1090.17ZM899.723,1054.79C902.72,1056.64 908.739,1055.9 909.924,1057.52C911.109,1059.13 907.442,1062.1 906.834,1064.48C906.226,1066.87 905.81,1069.43 906.274,1071.84C906.808,1074.63 908.606,1081.55 910.04,1081.2C911.473,1080.85 913.736,1073.06 914.873,1069.75C915.808,1067.03 915.587,1061.8 916.861,1061.35C918.135,1060.9 920.823,1066.66 922.516,1067.05C924.209,1067.45 925.681,1063.3 927.018,1063.73C928.356,1064.17 928.722,1068.26 930.541,1069.67C932.825,1071.44 938.602,1072.33 940.726,1074.36C942.635,1076.18 944.752,1080.81 943.28,1081.86C941.808,1082.91 934.943,1080.56 931.895,1080.68C929.507,1080.78 925.274,1081 924.988,1082.61C924.703,1084.21 927.984,1089.78 930.182,1090.31C932.381,1090.85 935.77,1085.52 938.178,1085.8C940.586,1086.08 942.641,1089.78 944.63,1092C946.974,1094.62 949.726,1100.05 952.242,1101.52C954.409,1102.78 958.494,1102.12 959.727,1100.78C960.96,1099.44 960.247,1095.83 959.64,1093.47C958.922,1090.67 957.345,1086.87 955.416,1084C952.754,1080.04 947.667,1073.35 943.665,1069.71C940.116,1066.49 934.417,1065.27 931.402,1062.2C928.513,1059.26 926.635,1055.02 925.579,1051.28C924.533,1047.57 924.633,1042.99 925.065,1039.73C925.441,1036.9 928.344,1033.58 928.171,1031.73C928.012,1030.01 925.726,1028.95 924.031,1028.63C922.143,1028.28 919.213,1030.07 916.84,1029.6C914.22,1029.09 911.434,1025.96 908.316,1025.54C904.76,1025.06 899.19,1025.97 895.509,1026.71C892.291,1027.37 887.198,1028.55 886.229,1030.02C885.26,1031.49 889.191,1033.42 889.696,1035.53C890.301,1038.06 888.375,1042.32 889.858,1045.16C891.529,1048.37 896.379,1052.73 899.723,1054.79ZM899.092,1047.63C897.984,1047.99 896.793,1046.28 896.302,1045.14C895.766,1043.88 895.372,1041.27 895.878,1040.12C896.383,1038.97 898.17,1038.33 899.334,1038.24C900.499,1038.14 902.261,1038.77 902.864,1039.56C903.467,1040.36 903.438,1041.96 902.953,1043C902.324,1044.34 900.201,1047.28 899.092,1047.63ZM872.131,1174.49C872.054,1174.23 871.818,1173.41 871.696,1172.96C871.475,1172.14 871.339,1171.32 871.351,1170.5C871.376,1168.82 871.188,1165.82 871.364,1163.06C871.518,1160.62 871.996,1158.35 872.818,1156.8C874.904,1152.87 879.543,1149.99 883.96,1149.45C888.076,1148.95 895.877,1151.12 898.442,1153.14L899.32,1153.99L899.983,1154.97L900.469,1156.17L900.73,1157.76C900.791,1158.86 900.501,1161.19 900.44,1161.67C900.957,1162.71 901.924,1163.88 902.782,1164.59C903.258,1164.5 903.946,1164.37 904.363,1164.34L906.317,1164.44L907.909,1165.04C909.025,1165.66 910.292,1166.94 911.591,1168.44C912.56,1169.57 913.513,1171.02 914.81,1171.48C915.457,1171.71 916.357,1171.57 917.289,1171.48C918.915,1171.32 920.605,1171.05 921.986,1170.95C923.071,1170.88 924.03,1170.92 924.788,1171.06L926.219,1171.51L927.307,1172.17L928.33,1173.25L928.981,1174.46L929.321,1175.85L929.318,1177.58C929.07,1179.73 927.566,1182.75 926.836,1184.47C926.243,1185.87 925.552,1187.48 924.61,1188.73C924.048,1189.48 923.402,1190.12 922.676,1190.63L920.784,1191.58C919.477,1192 917.686,1192.11 915.693,1191.95C913.705,1191.79 911.425,1191.39 909.508,1191.36C905.444,1191.31 899.154,1191.12 894.872,1191.43C892.78,1191.58 890.672,1192.38 888.599,1192.85C886.589,1193.31 884.602,1193.54 882.678,1193.25C879.657,1192.81 875.498,1191.41 872.783,1189.65C871.106,1188.56 869.913,1187.28 869.298,1186.05L868.814,1184.7L868.656,1183.41C868.633,1182.47 868.813,1181.43 869.19,1180.34C869.659,1178.99 870.473,1177.5 871.236,1176.13C871.587,1175.5 871.985,1174.95 872.131,1174.49ZM875.351,1170.56C875.329,1172.07 876.379,1173.55 876.11,1175.04C875.697,1177.32 871.683,1181.88 872.874,1184.26C874.066,1186.63 879.641,1188.76 883.258,1189.3C886.876,1189.83 890.765,1187.72 894.578,1187.44C898.962,1187.12 905.402,1187.31 909.562,1187.36C912.89,1187.41 917.275,1188.52 919.54,1187.77C921.459,1187.15 922.365,1184.77 923.153,1182.91C924.034,1180.84 926.442,1176.59 924.826,1175.31C923.21,1174.03 916.602,1176.38 913.457,1175.25C910.312,1174.12 907.974,1169.66 905.955,1168.53C904.612,1167.78 902.663,1169.24 901.338,1168.46C899.791,1167.55 897.567,1165.08 896.672,1163.05C895.777,1161.02 897.75,1157.68 895.967,1156.28C893.929,1154.67 887.715,1153.02 884.446,1153.42C881.252,1153.81 877.86,1155.84 876.351,1158.68C874.835,1161.54 875.391,1167.83 875.351,1170.56ZM886.376,1175.38C884.964,1174.04 885.63,1169.56 886.363,1168.65C887.097,1167.74 889.421,1169.21 890.775,1169.92C892.194,1170.67 894.201,1172.01 894.878,1173.14C895.489,1174.17 895.987,1176.42 894.834,1176.72C893.417,1177.09 887.787,1176.73 886.376,1175.38ZM2249.66,1070.7L2256.77,1069.45C2257.83,1069.26 2258.92,1069.51 2259.8,1070.14C2260.67,1070.77 2261.26,1071.72 2261.42,1072.79L2264.18,1091.16C2264.51,1093.35 2263.01,1095.38 2260.83,1095.71L2253.5,1096.84C2252.44,1097 2251.36,1096.73 2250.5,1096.09C2249.64,1095.45 2249.08,1094.5 2248.93,1093.43L2246.39,1075.19C2246.1,1073.06 2247.54,1071.08 2249.66,1070.7ZM2250.36,1074.64L2252.89,1092.88L2260.23,1091.76L2257.46,1073.39L2250.36,1074.64ZM2210.25,1029.1L2208.91,1028.32L2207.78,1027.06C2206.97,1025.82 2206.4,1023.26 2205.93,1021.77C2205.57,1020.61 2204.89,1019.15 2204.73,1017.98L2204.78,1015.95L2205.43,1014.26L2206.08,1013.41L2207.02,1012.55C2207.66,1012.07 2208.51,1011.6 2209.41,1011.24C2210.32,1010.88 2211.29,1010.64 2212.14,1010.57L2213.5,1010.58L2214.6,1010.81L2216.04,1011.51L2217.44,1012.75C2218.62,1014.06 2219.64,1016.11 2220.09,1017.52C2220.86,1019.99 2220.67,1023.2 2219.27,1025.22C2218.4,1026.48 2216.19,1028.26 2214.34,1028.96L2212.31,1029.41L2211.16,1029.35L2210.25,1029.1ZM2211.67,1025.36C2212.71,1025.76 2215.22,1024.06 2215.98,1022.95C2216.75,1021.84 2216.69,1020.07 2216.27,1018.72C2215.83,1017.33 2214.61,1015.01 2213.38,1014.62C2212.14,1014.22 2209.45,1015.35 2208.85,1016.34C2208.24,1017.34 2209.32,1019.2 2209.75,1020.57C2210.22,1022.07 2210.63,1024.96 2211.67,1025.36ZM2350.52,1121.79L2348.98,1121.33L2347.77,1120.48L2346.86,1119.32L2346.23,1117.72L2346.04,1115.94L2346.26,1114.21L2346.83,1112.74L2347.57,1111.67C2349.18,1109.87 2355.64,1105.74 2357.79,1105.01L2359.59,1104.75L2360.79,1104.95L2361.76,1105.35L2362.67,1105.94L2363.65,1106.89L2364.51,1108.12L2365.11,1109.48C2365.48,1110.65 2366.13,1113.08 2365.89,1114.89L2365.55,1116.31L2365.04,1117.35L2364.38,1118.2L2363.53,1118.93C2362.59,1119.58 2360.6,1120.35 2358.33,1120.88C2355.31,1121.59 2351.83,1121.95 2350.52,1121.79ZM2351.01,1117.82C2352.79,1118.04 2359.54,1116.83 2361.25,1115.64C2362.61,1114.7 2361.65,1111.83 2361.29,1110.69C2361,1109.76 2360,1108.48 2359.08,1108.8C2357.29,1109.4 2351.9,1112.84 2350.55,1114.34C2349.77,1115.21 2349.85,1117.68 2351.01,1117.82ZM2407.39,841.116C2412.96,841.116 2417.5,845.669 2417.5,851.307C2417.5,856.946 2412.96,861.498 2407.39,861.498C2401.82,861.498 2397.28,856.946 2397.28,851.307C2397.28,845.669 2401.82,841.116 2407.39,841.116ZM2407.39,845.116C2404.01,845.116 2401.28,847.891 2401.28,851.307C2401.28,854.724 2404.01,857.498 2407.39,857.498C2410.76,857.498 2413.5,854.724 2413.5,851.307C2413.5,847.891 2410.76,845.116 2407.39,845.116ZM2426.63,827.656L2427.98,827.793L2429.24,828.185L2430.38,828.804L2431.37,829.619L2432.18,830.608L2432.8,831.747L2433.19,833.01L2433.33,834.357L2433.19,835.703L2432.8,836.966L2432.18,838.105L2431.37,839.094L2430.38,839.909L2429.24,840.528L2427.98,840.921L2426.63,841.057L2425.28,840.921L2424.02,840.528L2422.88,839.909L2421.89,839.094L2421.08,838.105L2420.46,836.966L2420.07,835.703L2419.93,834.357L2420.07,833.01L2420.46,831.747L2421.08,830.608L2421.89,829.619L2422.88,828.804L2424.02,828.185L2425.28,827.793L2426.63,827.656ZM2426.63,831.656C2425.14,831.656 2423.93,832.866 2423.93,834.357C2423.93,835.847 2425.14,837.057 2426.63,837.057C2428.12,837.057 2429.33,835.847 2429.33,834.357C2429.33,832.866 2428.12,831.656 2426.63,831.656ZM2387.87,862.44L2389.22,862.576L2390.48,862.969L2391.62,863.588L2392.61,864.403L2393.42,865.392L2394.04,866.531L2394.43,867.794L2394.57,869.14L2394.43,870.487L2394.04,871.75L2393.42,872.889L2392.61,873.877L2391.62,874.693L2390.48,875.312L2389.22,875.704L2387.87,875.841L2386.53,875.704L2385.26,875.312L2384.12,874.693L2383.13,873.877L2382.32,872.889L2381.7,871.75L2381.31,870.487L2381.17,869.14L2381.31,867.794L2381.7,866.531L2382.32,865.392L2383.13,864.403L2384.12,863.588L2385.26,862.969L2386.53,862.576L2387.87,862.44ZM2387.87,866.44C2386.38,866.44 2385.17,867.65 2385.17,869.14C2385.17,870.631 2386.38,871.841 2387.87,871.841C2389.36,871.841 2390.57,870.631 2390.57,869.14C2390.57,867.65 2389.36,866.44 2387.87,866.44ZM1472.42,1123.08L1472.82,1121.58C1473.03,1121.06 1473.33,1120.49 1473.74,1119.89C1474.76,1118.4 1476.68,1116.51 1479.24,1114.45C1486.55,1108.56 1499.54,1100.6 1507.29,1095.28C1518.1,1087.85 1530.85,1078.23 1540.82,1074.63C1549.83,1071.38 1563.47,1071.04 1569.54,1073.96C1572.58,1075.43 1574.63,1078.24 1575.91,1081.68C1577.32,1085.45 1577.75,1090.03 1578.51,1093.06C1579.18,1095.73 1580.46,1099.15 1580.64,1102.05C1580.85,1105.26 1579.93,1107.99 1577.55,1109.87C1576.09,1111.01 1573.67,1112.03 1570.7,1112.8C1565.21,1114.21 1557.52,1114.97 1552.54,1115.83C1546.33,1116.9 1539.97,1116.91 1533.75,1117.88C1523.59,1119.46 1492.46,1128.97 1480.87,1129.32C1478.14,1129.4 1476.14,1128.92 1475.01,1128.26L1473.92,1127.44L1472.97,1126.18L1472.44,1124.61L1472.42,1123.08ZM1476.39,1123.6C1475.52,1130.21 1520.55,1115.88 1533.13,1113.93C1539.34,1112.96 1545.67,1112.95 1551.86,1111.89C1558.85,1110.69 1571.28,1109.7 1575.08,1106.72C1578.41,1104.11 1575.65,1098.14 1574.63,1094.03C1573.42,1089.17 1573.15,1080.14 1567.8,1077.56C1562.39,1074.96 1550.22,1075.5 1542.18,1078.4C1532.47,1081.9 1520.09,1091.34 1509.55,1098.58C1498.59,1106.11 1477,1118.95 1476.39,1123.6ZM1546.23,1098.32C1544.83,1098.31 1543.18,1096.41 1543.44,1095.19C1543.7,1093.96 1545.84,1091.54 1547.78,1090.98C1549.95,1090.35 1555.21,1090.7 1556.5,1091.43C1557.67,1092.09 1556.63,1094.6 1555.51,1095.35C1553.8,1096.5 1548.24,1098.35 1546.23,1098.32ZM1357.35,1077.65C1356.5,1076.27 1356.07,1074.28 1356.28,1071.98C1356.64,1068.1 1358.87,1063.16 1361.63,1060.56C1368.57,1054.02 1392,1037.69 1399.53,1033.65C1401.51,1032.59 1404.37,1032.47 1406.89,1033.37C1409.61,1034.34 1411.73,1036.41 1412.37,1038.69C1412.69,1039.82 1412.75,1041.44 1412.45,1043.3C1411.94,1046.4 1410.45,1050.45 1408.93,1053.27C1406.55,1057.66 1402.44,1063.14 1398.04,1066.97C1392.39,1071.88 1380.74,1080.96 1374.63,1083.01C1371.32,1084.11 1368,1085.18 1364.66,1084.1C1362.32,1083.35 1359.79,1081.6 1357.35,1077.65ZM1360.76,1075.55C1365.13,1082.63 1369.21,1080.6 1373.36,1079.21C1379.14,1077.28 1390.07,1068.59 1395.41,1063.95C1399.46,1060.44 1403.23,1055.39 1405.41,1051.36C1407.31,1047.85 1409.18,1042.14 1408.52,1039.77C1407.85,1037.41 1403.64,1035.98 1401.42,1037.17C1394.06,1041.12 1371.15,1057.07 1364.38,1063.47C1361.32,1066.35 1359.17,1072.98 1360.76,1075.55ZM1008.41,1014.21L1075.39,1014.7C1077.58,1014.72 1079.35,1016.49 1079.37,1018.68L1079.53,1048.85C1079.54,1049.92 1079.12,1050.95 1078.36,1051.7C1077.6,1052.46 1076.57,1052.88 1075.5,1052.87L1008.16,1052.38C1005.96,1052.36 1004.18,1050.56 1004.19,1048.35L1004.38,1018.18C1004.39,1017.12 1004.82,1016.11 1005.58,1015.36C1006.33,1014.62 1007.35,1014.2 1008.41,1014.21ZM1008.38,1018.21L1008.19,1048.38L1075.53,1048.87L1075.37,1018.7L1008.38,1018.21Z"
              style={waterStyle}
            />
          </g>
          <g id="Roads">
            <path
              d="M395.586,863.584C421.92,876.959 474.586,903.709 504.854,934.957C556.322,988.093 548.909,1030.79 579.398,1066.76C608.955,1101.62 643.215,1140.63 687.788,1150.75C798.859,1175.98 880.09,1209.75 904.854,1201.36C947.338,1186.97 1030.16,1160.65 1095.22,1154.29C1167.33,1147.23 1277.97,1162.04 1337.49,1159.02C1376.45,1157.04 1417.88,1154.56 1452.29,1136.17C1485.85,1118.23 1530.72,1074.01 1564.87,1068.67C1591.54,1064.5 1614.86,1092.34 1641.81,1093.98C1673.93,1095.92 1719.12,1074.89 1757.59,1080.35C1800.54,1086.43 1867.51,1123.49 1899.46,1130.51C1915.91,1134.12 1933.24,1127.42 1949.33,1122.46C1992.3,1109.21 2116.91,1077.28 2157.3,1050.99C2183.24,1034.11 2170.85,987.637 2191.69,964.753C2209.86,944.79 2226.27,916.608 2333.49,944.059C2354.16,949.351 2406.27,980.989 2431.9,1004.07C2451.81,1021.99 2455.62,1085.32 2457.52,1116.99"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M530.283,806.675C530.456,865.782 514.078,910.343 505.889,932.623"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M453.002,1230.56C452.398,1227.03 451.191,1219.96 454.973,1218.2C479.883,1206.62 562.019,1171.83 602.462,1161.06C633.21,1152.87 676.156,1153.35 697.629,1153.58"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2431.03,1003.4C2451.55,982.302 2492.58,940.095 2531.16,920.247C2574.64,897.879 2651.5,879.883 2691.9,869.197C2718.55,862.147 2756.51,865.515 2773.56,856.131C2787.56,848.429 2792,824.735 2794.22,812.888"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M2456.7,1101.63C2466.86,1106.92 2487.19,1117.49 2502.76,1114.2C2529.79,1108.5 2593.06,1068.71 2618.87,1067.38C2642.39,1066.17 2662.28,1075.77 2683.15,1070.79C2706.1,1065.32 2733.91,1037.8 2756.58,1034.54C2777.95,1031.46 2805.43,1044.62 2819.16,1051.21"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2756.25,1103.88C2769.58,1091 2796.23,1065.22 2820.65,1052.77C2859.55,1032.95 2964.23,1019.45 2989.64,984.95C3015.05,950.448 2965.98,875.13 2973.14,845.757C2978.67,823.064 3014.63,813.494 3032.61,808.708"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M2728.92,1046.33C2749.77,1023.31 2791.47,977.262 2781.1,950.545C2769.75,921.302 2741.8,939.674 2732.41,913.19C2723.42,887.819 2735.52,872.547 2741.58,864.91"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M595.573,1084.35C694.408,1052.26 892.079,988.086 1004.38,946.272C1041.06,932.615 1090.25,934.887 1119.46,922.93C1143.28,913.178 1156.17,885.106 1179.64,874.532C1213.18,859.415 1279.52,837.175 1320.74,832.234C1356.14,827.99 1396.43,844.346 1426.95,844.883C1452.78,845.337 1478.84,829.029 1503.86,835.454C1532.73,842.869 1574.2,882.716 1600.16,889.371C1619.89,894.428 1639.27,875.542 1659.63,875.387C1683.69,875.204 1716.59,894.48 1744.54,888.274C1809.36,873.881 1974.34,771.415 2048.54,789.031C2086.94,798.146 2140.11,854.265 2200.23,846.536C2248.07,840.385 2284.04,770.138 2335.56,751.687C2387.07,733.236 2455.07,714.869 2509.33,735.83C2589.11,766.657 2827.14,825.779 2976.33,837.054"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M728.805,793.989C740.613,800.066 764.229,812.218 775.533,825.985C786.837,839.752 786.092,861.66 796.63,876.592C807.572,892.096 830.456,901.535 841.181,919.011C852.949,938.185 859.706,967.045 867.237,991.638C875.948,1020.08 895.096,1063.11 893.446,1089.68C891.974,1113.38 864.439,1133.71 857.334,1151.08C851.868,1164.44 851.164,1184.07 850.812,1193.88"
              style={{
                ...roadStyle,
                strokeWidth: "14px",
              }}
            />
            <path
              d="M1081.27,774.755C1084.96,778.545 1092.35,786.125 1093.64,793.501C1095.69,805.21 1094.8,827.884 1093.55,845.007C1091.87,867.813 1110.65,890.604 1083.59,930.337"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1172.68,876.892C1153.42,877.77 1114.91,879.526 1093.64,845.127"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1082.96,930.874C1115.26,885.711 1152.8,880.538 1171.57,877.952"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1628.97,740.426C1631.69,751.641 1637.13,774.069 1650.24,773.55C1654.92,773.366 1659.52,773.544 1664.01,773.161C1876.57,755.056 1897.73,899.877 1897.93,929.058C1899.07,1087.01 1945.79,1069.98 1947.63,1149.44"
              style={{
                ...roadStyle,
                strokeWidth: "18px",
              }}
            />
            <path
              d="M1847.61,818.451C1849.49,800.723 1853.25,765.266 1874,757.77C1911.53,744.206 2017.14,745.254 2072.82,737.067C2118.41,730.364 2204.85,783.876 2208.11,708.646"
              style={{
                ...roadStyle,
                strokeWidth: "18px",
              }}
            />
            <path
              d="M1743.7,774.859C1758.34,783.819 1787.62,801.74 1802.47,821.99C1822.95,849.913 1860.28,909.898 1866.58,942.402C1871.59,968.291 1830.09,992.687 1840.27,1017.01C1852.89,1047.16 1898.71,1150.22 1942.29,1123.29"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1845.41,890.706C1756.54,921.415 1667.67,952.123 1578.79,982.832"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1788.72,912.767C1823.58,968.258 1787.34,955.965 1769.21,949.819"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1839.71,1014.46C1829.39,997.123 1808.75,962.452 1570.48,983.499C1412.77,997.429 1281.33,1103.54 1218.78,1120.66"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M977.448,1178.35C1006.06,1153.48 1063.28,1103.74 1116.18,1100.71C1171.56,1097.55 1263.68,1138.76 1309.74,1159.36"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M1368.54,834.54C1372.47,808.537 1376.4,782.533 1380.33,756.529"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2486.26,729.408C2485.23,716.522 2484.19,703.636 2483.15,690.751"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2982.39,993.408C3009.4,992.057 3036.4,990.706 3063.4,989.354"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2471.15,810.463C2463.89,793.804 2449.37,760.484 2454.27,726.99"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2453.78,731.737C2450.85,743.361 2445.01,766.609 2431.32,778.977"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2003.78,830.834C2012.2,826.975 2029.03,819.257 2042.41,819.784C2064.05,820.638 2098.64,823.057 2115.93,824.267"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2407.93,790.48L2344.71,843.908L2355.49,857.786L2419.58,803.434"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2325.45,877.072L2382.21,936.341"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2381.15,739.76L2381.15,755.87L2474.27,861.012L2380.96,935.833L2371.78,955.636"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M2827.39,815.877C2827.27,796.113 2827.03,756.585 2817.1,744.603C2791.81,714.089 2781.69,744.22 2781.69,744.22C2781.69,744.22 2764.6,785.595 2817.1,744.603"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <path
              d="M761.111,814.716C749.624,819.015 726.651,827.612 721.272,824.267C715.892,820.922 724.521,803.404 728.835,794.645"
              style={{
                ...roadStyle,
                strokeWidth: "6px",
              }}
            />
            <g transform="matrix(1,0,0,1,0,-4)">
              <path
                d="M1251.96,792.379C1260.49,798.133 1277.54,809.64 1292.04,809.317C1312.72,808.857 1355.87,776.138 1376.03,789.617"
                style={{
                  ...roadStyle,
                  strokeWidth: "6px",
                }}
              />
            </g>
            <g transform="matrix(1,0,0,1,0,4)">
              <path
                d="M2832.8,638.779C2833.06,648.568 2833.58,668.146 2817.79,683.499"
                style={{
                  ...roadStyle,
                  strokeWidth: "6px",
                }}
              />
            </g>
            <g transform="matrix(1,0,0,1,0,3)">
              <path
                d="M2905.87,824.982C2903.41,820.454 2898.5,811.397 2906.08,797.213C2914.17,782.101 2953.72,756.085 2961.36,737.13C2969.26,717.513 2966.78,677.337 2902.95,674.635C2864.49,673.007 2758.95,693.177 2731.28,716.994C2721.15,725.714 2713.57,747.366 2702.11,757.405C2691,767.131 2672,773.862 2662.51,777.227"
                style={{
                  ...roadStyle,
                  strokeWidth: "6px",
                }}
              />
            </g>
          </g>
          <g id="Perimeter" transform="matrix(1,0,0,1,2.10788,-3.93284)">
            <path
              d="M387.478,817.436L2512.49,692.84L3000.14,616.02L3076.47,1086.91L3036.35,1091.17L3036.91,1105.18L2902.54,1126.64L2822.2,1104.36L413.949,1239.26L387.478,817.436Z"
              style={{
                fill: "rgb(154,199,107)",
                fillOpacity: 0,
                strokeWidth: "18px",
                strokeLinecap: "round",
              }}
              stroke="url(#borderGradient)"
            />
          </g>
          <g id="Regions">
            {found.includes(0) && (
              <g transform="matrix(1,0,0,1,102.035,891.599)">
                <g transform="matrix(0.951698,0,0,1.00369,-30.0826,-450.145)">
                  <ellipse
                    cx="628.105"
                    cy="578.655"
                    rx="103.134"
                    ry="97.866"
                    style={{
                      fill: "rgb(245,27,41)",
                      fillOpacity: 0.75,
                    }}
                    filter={isWebKit ? undefined : "url(#regionShadow)"}
                  />
                </g>
                <g transform="matrix(1,0,0,1,-60.4697,-447.886)">
                  <path
                    d="M590.121,581.116L620.59,611.443L666.332,547.519"
                    style={{
                      fill: "none",
                      stroke: "white",
                      strokeWidth: "16px",
                      strokeLinejoin: "miter",
                      strokeMiterlimit: 2,
                    }}
                  />
                </g>
              </g>
            )}
            <path
              onClick={() => handleRegionClick(0)}
              d="M425.581,844.811L448.075,1200.79L931.507,1174.14L911.877,815.325L425.581,844.811Z"
              style={regionStyle(0)}
              filter={isWebKit ? undefined : "url(#regionShadow)"}
            />
            {found.includes(1) && (
              <g transform="matrix(1,0,0,1,608,861.233)">
                <g transform="matrix(0.951698,0,0,1.00369,-30.0826,-450.145)">
                  <ellipse
                    cx="628.105"
                    cy="578.655"
                    rx="103.134"
                    ry="97.866"
                    style={{
                      fill: "rgb(234,172,0)",
                      fillOpacity: 0.75,
                    }}
                    filter={isWebKit ? undefined : "url(#regionShadow)"}
                  />
                </g>
                <g transform="matrix(1,0,0,1,-60.4697,-447.886)">
                  <path
                    d="M590.121,581.116L620.59,611.443L666.332,547.519"
                    style={{
                      fill: "none",
                      stroke: "white",
                      strokeWidth: "16px",
                      strokeLinejoin: "miter",
                      strokeMiterlimit: 2,
                    }}
                  />
                </g>
              </g>
            )}
            <path
              onClick={() => handleRegionClick(1)}
              d="M947.761,813.617L967.279,1171.4L1385.03,1148.07L1365.81,788.263L947.761,813.617Z"
              style={regionStyle(1)}
              filter={isWebKit ? undefined : "url(#regionShadow)"}
            />
            {found.includes(2) && (
              <g transform="matrix(1,0,0,1,1103.55,834.01)">
                <g transform="matrix(0.951698,0,0,1.00369,-30.0826,-450.145)">
                  <ellipse
                    cx="628.105"
                    cy="578.655"
                    rx="103.134"
                    ry="97.866"
                    style={{
                      fill: "rgb(226,220,0)",
                      fillOpacity: 0.75,
                    }}
                    filter={isWebKit ? undefined : "url(#regionShadow)"}
                  />
                </g>
                <g transform="matrix(1,0,0,1,-60.4697,-447.886)">
                  <path
                    d="M590.121,581.116L620.59,611.443L666.332,547.519"
                    style={{
                      fill: "none",
                      stroke: "white",
                      strokeWidth: "16px",
                      strokeLinejoin: "miter",
                      strokeMiterlimit: 2,
                    }}
                  />
                </g>
              </g>
            )}
            <path
              onClick={() => handleRegionClick(2)}
              d="M1401.44,785.695L1422.79,1146.28L1912.92,1119.02L1890.95,757.414L1401.44,785.695Z"
              style={regionStyle(2)}
              filter={isWebKit ? undefined : "url(#regionShadow)"}
            />
            {found.includes(3) && (
              <g transform="matrix(1,0,0,1,1617.22,803.661)">
                <g transform="matrix(0.951698,0,0,1.00369,-30.0826,-450.145)">
                  <ellipse
                    cx="628.105"
                    cy="578.655"
                    rx="103.134"
                    ry="97.866"
                    style={{
                      fill: "rgb(54,228,0)",
                      fillOpacity: 0.75,
                    }}
                    filter={isWebKit ? undefined : "url(#regionShadow)"}
                  />
                </g>
                <g transform="matrix(1,0,0,1,-60.4697,-447.886)">
                  <path
                    d="M590.121,581.116L620.59,611.443L666.332,547.519"
                    style={{
                      fill: "none",
                      stroke: "white",
                      strokeWidth: "16px",
                      strokeLinejoin: "miter",
                      strokeMiterlimit: 2,
                    }}
                  />
                </g>
              </g>
            )}
            <path
              onClick={() => handleRegionClick(3)}
              d="M1928.05,754.541L1950.28,1116.41L2413.34,1091.05L2392.24,727.594L1928.05,754.541Z"
              style={regionStyle(3)}
              filter={isWebKit ? undefined : "url(#regionShadow)"}
            />
            {found.includes(4) && (
              <g transform="matrix(1,0,0,1,2146.2,771.816)">
                <g transform="matrix(0.951698,0,0,1.00369,-30.0826,-450.145)">
                  <ellipse
                    cx="628.105"
                    cy="578.655"
                    rx="103.134"
                    ry="97.866"
                    style={{
                      fill: "rgb(0,229,207)",
                      fillOpacity: 0.75,
                    }}
                    filter={isWebKit ? undefined : "url(#regionShadow)"}
                  />
                </g>
                <g transform="matrix(1,0,0,1,-60.4697,-447.886)">
                  <path
                    d="M590.121,581.116L620.59,611.443L666.332,547.519"
                    style={{
                      fill: "none",
                      stroke: "white",
                      strokeWidth: "16px",
                      strokeLinejoin: "miter",
                      strokeMiterlimit: 2,
                    }}
                  />
                </g>
              </g>
            )}
            <path
              onClick={() => handleRegionClick(4)}
              d="M2429.85,725.475L2451.83,1088.71L2828.6,1068.06L2907.41,1091.13L3010.8,1074.84L3008.88,1056.49L3042.51,1052.88L2976.51,647.499L2522.63,720.498L2429.85,725.475Z"
              style={regionStyle(4)}
              filter={isWebKit ? undefined : "url(#regionShadow)"}
            />
            {markerPosition && (
              <g id="Marker">
                <circle
                  cx={markerPosition.x}
                  cy={markerPosition.y}
                  r="27.737"
                  style={{
                    fill: "rgb(0,175,230)",
                    stroke: "white",
                  }}
                />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}

export default Map;
