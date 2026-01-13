// Quick script to check Supabase configuration
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local nicht gefunden');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

console.log('\n📋 Supabase Konfiguration Check:\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET');

if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n✅ Beide Variablen sind gesetzt!');
  console.log('\n⚠️  Wenn die Warnung weiterhin angezeigt wird:');
  console.log('   1. Starte den Server neu: npm run dev');
  console.log('   2. Prüfe, ob die Supabase-Buckets existieren:');
  console.log('      - cvs');
  console.log('      - profile-images');
  console.log('   3. Stelle sicher, dass beide Buckets öffentlich lesbar sind');
} else {
  console.log('\n❌ Bitte setze die fehlenden Variablen in .env.local');
}

