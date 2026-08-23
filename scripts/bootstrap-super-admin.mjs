import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(projectRoot, '.env');

const readEnvFile = () => {
  if (!fs.existsSync(envFilePath)) return {};

  const envEntries = {};
  const content = fs.readFileSync(envFilePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envEntries[key] = value;
  }

  return envEntries;
};

const envValues = readEnvFile();
const supabaseUrl = process.env.VITE_SUPABASE_URL || envValues.VITE_SUPABASE_URL || process.env.SUPABASE_URL || envValues.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envValues.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || envValues.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the project .env file or shell environment.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const adminEmail = 'sagliksk@gmail.com';
const adminPassword = 'Efraim+08';

const { data, error } = await supabase.auth.signUp({
  email: adminEmail,
  password: adminPassword,
  options: {
    emailRedirectTo: `${process.env.APP_URL || envValues.APP_URL || 'http://localhost:5173'}/auth/callback`,
  },
});

if (error) {
  throw error;
}

console.log('Supabase admin user ready.');
console.log('Email:', adminEmail);
console.log('User ID:', data?.user?.id ?? 'created');
console.log('If the user already existed, the sign-up request will return the existing auth user.');
