"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { formatDistance } from "@/lib/openstreetmap";
import type { Coordinates } from "@/lib/types";

interface AnimatedRouteMapProps {
  coordinates: Coordinates[];
  distance: number;
  departureLocation: string;
  arrivalLocation: string;
}

export function AnimatedRouteMap({
  coordinates,
  distance,
  departureLocation,
  arrivalLocation,
}: AnimatedRouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const drawRoute = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 20;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Find min/max lat/lng to scale coordinates to canvas size
    let minLat = Number.POSITIVE_INFINITY,
      maxLat = Number.NEGATIVE_INFINITY,
      minLng = Number.POSITIVE_INFINITY,
      maxLng = Number.NEGATIVE_INFINITY;
    coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLng = Math.min(minLng, coord.lng);
      maxLng = Math.max(maxLng, coord.lng);
    });

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    // Calculate scaling factors
    const scaleX = width / (lngRange === 0 ? 1 : lngRange);
    const scaleY = height / (latRange === 0 ? 1 : latRange);

    // Use the smaller scale to fit both dimensions, or a fixed scale if range is zero
    const scale = Math.min(scaleX, scaleY) || 10000; // Fallback scale if range is zero

    // Calculate offset to center the route
    const offsetX =
      padding -
      minLng * scale +
      (canvas.width - (lngRange * scale + 2 * padding)) / 2;
    const offsetY =
      padding +
      maxLat * scale -
      (canvas.height - (latRange * scale + 2 * padding)) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw route line
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6"; // Blue color for the route
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const totalLength = coordinates.length;
    const animatedLength = Math.floor(totalLength * animationProgress);

    if (animatedLength > 0) {
      const startCoord = coordinates[0];
      ctx.moveTo(
        startCoord.lng * scale + offsetX,
        canvas.height - (startCoord.lat * scale + offsetY)
      );

      for (let i = 1; i < animatedLength; i++) {
        const coord = coordinates[i];
        ctx.lineTo(
          coord.lng * scale + offsetX,
          canvas.height - (coord.lat * scale + offsetY)
        );
      }
      ctx.stroke();
    }

    // Draw start and end markers
    if (coordinates.length > 0) {
      const start = coordinates[0];
      const end = coordinates[coordinates.length - 1];

      // Start marker (Green)
      ctx.fillStyle = "#22c55e"; // Green
      ctx.beginPath();
      ctx.arc(
        start.lng * scale + offsetX,
        canvas.height - (start.lat * scale + offsetY),
        8,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.font = "12px Arial";
      ctx.fillText(
        departureLocation,
        start.lng * scale + offsetX + 10,
        canvas.height - (start.lat * scale + offsetY) - 10
      );

      // End marker (Red)
      ctx.fillStyle = "#ef4444"; // Red
      ctx.beginPath();
      ctx.arc(
        end.lng * scale + offsetX,
        canvas.height - (end.lat * scale + offsetY),
        8,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillText(
        arrivalLocation,
        end.lng * scale + offsetX + 10,
        canvas.height - (end.lat * scale + offsetY) - 10
      );
    }
  }, [coordinates, departureLocation, arrivalLocation, animationProgress]);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setAnimationProgress((prev) => {
        if (prev < 1) {
          animationFrameId = requestAnimationFrame(animate);
          return Math.min(prev + 0.01, 1); // Adjust speed here
        } else {
          return 1; // Animation complete
        }
      });
    };

    if (coordinates && coordinates.length > 1) {
      setAnimationProgress(0); // Reset animation on coordinates change
      animationFrameId = requestAnimationFrame(animate);
    } else {
      setAnimationProgress(1); // No animation if less than 2 points
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [coordinates]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <MapPin className="inline-block mr-2 h-4 w-4" />
          Itinéraire du Voyage
        </CardTitle>
        <span className="text-lg font-bold text-primary">
          {formatDistance(distance)}
        </span>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={600} // Fixed width for the canvas
          height={400} // Fixed height for the canvas
          className="w-full h-auto border rounded-md bg-gray-50"
        />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Visualisation de l'itinéraire entre {departureLocation} et{" "}
          {arrivalLocation}.
        </p>
      </CardContent>
    </Card>
  );
}
