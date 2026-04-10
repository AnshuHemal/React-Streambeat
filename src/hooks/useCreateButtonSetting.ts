import { useCreateButton } from "@/context/CreateButtonContext";

export function useCreateButtonSetting() {
  const { isEnabled, isLoaded, toggle, setEnabled } = useCreateButton();

  return {
    isEnabled,
    isLoaded,
    toggleCreateButton: toggle,
    setCreateButton: setEnabled,
  };
}
