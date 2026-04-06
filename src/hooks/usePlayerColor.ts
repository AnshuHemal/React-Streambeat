import { useEffect, useState } from "react";

const PALETTE = [
  "#2d8a8a",
  "#8a2d8a",
  "#8a8a2d",
  "#2d5a8a",
  "#8a4a2d",
  "#2d8a5a",
  "#5a2d8a",
  "#8a2d5a",
  "#4a8a2d",
  "#2d4a8a",
  "#8a6a2d",
  "#6a2d8a",
  "#2d8a6a",
  "#8a2d6a",
  "#6a8a2d",
  "#3d6a8a",
  "#8a3d6a",
  "#6a8a3d",
  "#3d8a6a",
  "#6a3d8a",
];

function hashColor(uri: string): string {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = (hash << 5) - hash + uri.charCodeAt(i);
    hash = hash & hash;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function usePlayerColor(imageUrl: string | null | undefined): string {
  const [color, setColor] = useState("#2d8a8a");
  useEffect(() => {
    if (imageUrl) setColor(hashColor(imageUrl));
  }, [imageUrl]);
  return color;
}
