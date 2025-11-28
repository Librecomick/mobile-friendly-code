import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- IMPORTANT ---
// Replace these with your actual Supabase project URL and anon key.
// It's recommended to use environment variables for this in a real-world application.
const SUPABASE_URL = "add your project url here";
const SUPABASE_ANON_KEY = "add your anon key here";

// Your storage bucket name - change this if your bucket has a different name
export const BUCKET_NAME = "manwha";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
    SUPABASE_URL === "add your project url here" || 
    SUPABASE_ANON_KEY === "add your anon key here") {
    console.error("⚠️ Supabase is not configured! Please update SUPABASE_URL and SUPABASE_ANON_KEY in supabase-client.js");
}

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get the base URL for storage
export const getStorageBaseUrl = () => {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;
};

// Check if Supabase is properly configured
export const isConfigured = () => {
  // Check if the values are set and not the default placeholders
  const hasValidUrl = SUPABASE_URL && 
                      SUPABASE_URL !== "https://your-project.supabase.co" && 
                      SUPABASE_URL.includes('supabase.co');
  
  const hasValidKey = SUPABASE_ANON_KEY && 
                      SUPABASE_ANON_KEY !== "your-anon-key-here" &&
                      SUPABASE_ANON_KEY.length > 20; // Anon keys are typically long
  
  return hasValidUrl && hasValidKey;
};
