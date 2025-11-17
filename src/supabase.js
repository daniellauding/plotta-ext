import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvdhbhgarkhkywrncorj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZGhiaGdhcmtoa3l3cm5jb3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjIxOTgsImV4cCI6MjA3ODc5ODE5OH0.AayYVl7nZ0zi6HxaKvj2nqxy-BLDBasvcnSaIasAJUQ';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: {
      getItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] || null);
          });
        });
      },
      setItem: (key, value) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            resolve();
          });
        });
      },
      removeItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => {
            resolve();
          });
        });
      },
    },
    persistSession: true,
    autoRefreshToken: true,
  },
});
