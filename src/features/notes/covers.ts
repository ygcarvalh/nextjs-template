const COVER_PHOTO_IDS = [
  "photo-1506744038136-46273834b3fb",
  "photo-1519681393784-d120267933ba",
  "photo-1441974231531-c6227db76b6e",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1447752875215-b2761acb3c5d",
  "photo-1472214103451-9374bd1c798e",
  "photo-1500534314209-a25ddb2bd429",
  "photo-1426604966848-d7adac402bff",
] as const;

export function coverForNote(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  const photo = COVER_PHOTO_IDS[hash % COVER_PHOTO_IDS.length];
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=480&q=70`;
}
