
import { createClient } from '@supabase/supabase-js';

/**
 * Madrassah Al-Huda 2026.1 - Supabase Configuration
 * Project ID: owexvvdgclmwytxxrsoi
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Erstellung des echten Supabase-Clients mit Ihren Projektdaten
// Falls die Daten fehlen, wird ein Dummy-Client erstellt, der beim ersten Aufruf eine Warnung ausgibt
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnonKey || 'missing-key'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Konfiguration fehlt! Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in AI Studio setzen.");
}

/**
 * Hinweis zur Sicherheit: 
 * In einer lokalen Entwicklungsumgebung würden diese Werte aus .env kommen.
 * Für dieses Portal wurden sie direkt integriert, um die sofortige 
 * Konnektivität mit Ihrem Backend zu gewährleisten.
 */
