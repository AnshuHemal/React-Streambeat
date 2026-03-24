// Simple shared store to pass country selection back from choose-country to phone-auth
type CountrySelection = {
  name: string;
  code: string;
} | null;

let pendingSelection: CountrySelection = null;

export const setCountrySelection = (name: string, code: string) => {
  pendingSelection = { name, code };
};

export const getCountrySelection = (): CountrySelection => {
  const val = pendingSelection;
  pendingSelection = null; // consume once
  return val;
};
