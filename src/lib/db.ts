import { init } from '@instantdb/react';

// Use a placeholder App ID for InstantDB. Users can replace this with their own.
// For the sake of this demo, we'll try to use a dummy ID and handle errors gracefully,
// or just use a public demo app ID if available.
// Since we don't have a specific App ID, we'll use a placeholder and prompt the user if it fails.
const APP_ID = import.meta.env.VITE_INSTANTDB_APP_ID || '00000000-0000-0000-0000-000000000000';

type Schema = {
  snippets: {
    id: string;
    code: string;
    createdAt: number;
  };
};

export const db = init<Schema>({ appId: APP_ID });
