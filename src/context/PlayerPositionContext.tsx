import { createContext, useContext } from "react";

type PlayerPositionContextType = {
  position: number;
  duration: number;
};

export const PlayerPositionContext = createContext<PlayerPositionContextType>({
  position: 0,
  duration: 0,
});

export function usePlayerPosition() {
  return useContext(PlayerPositionContext);
}
