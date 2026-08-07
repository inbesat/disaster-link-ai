// Global default map view. The app is location-agnostic: it starts at a
// broad world view and everything (flood zones, shelters, resources,
// impact numbers) regenerates around whatever center the user is focused
// on. Shared by DisasterMap and the CommandCenter sidebar.
export const DEFAULT_INITIAL_VIEW = {
  latitude: 22,
  longitude: 20,
  zoom: 2.1,
};

export const DEFAULT_CENTER = {
  lat: DEFAULT_INITIAL_VIEW.latitude,
  lng: DEFAULT_INITIAL_VIEW.longitude,
};
