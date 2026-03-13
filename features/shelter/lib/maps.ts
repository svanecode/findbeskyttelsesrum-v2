export function createMapsUrl(latitude: number | null, longitude: number | null, label: string) {
  if (latitude === null || longitude === null) {
    return null;
  }

  const encodedLabel = encodeURIComponent(label);

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}%20(${encodedLabel})`;
}
