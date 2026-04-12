import { init } from '@instantdb/react';

// Use a placeholder App ID for InstantDB. Users can replace this with their own.
// For the sake of this demo, we'll try to use a dummy ID and handle errors gracefully,
// or just use a public demo app ID if available.
// Since we don't have a specific App ID, we'll use a placeholder and prompt the user if it fails.

const rawAppId = import.meta.env.VITE_INSTANTDB_APP_ID || '';
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const APP_ID = isValidUUID(rawAppId) ? rawAppId : '00000000-0000-0000-0000-000000000000';

export const db = init({ appId: APP_ID });

