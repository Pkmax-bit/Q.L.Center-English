// scripts/seed-passwords.ts
// Chạy: npx tsx scripts/seed-passwords.ts
// Hoặc: node -e "import('./scripts/seed-passwords.mjs')"

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  { email: 'admin@center.com', password: 'Admin@123456' },
  { email: 'gv.nguyen@center.com', password: 'Teacher@123' },
  { email: 'gv.tran@center.com', password: 'Teacher@123' },
  { email: 'gv.le@center.com', password: 'Teacher@123' },
  { email: 'hs.pham@center.com', password: 'Student@123' },
  { email: 'hs.hoang@center.com', password: 'Student@123' },
  { email: 'hs.vo@center.com', password: 'Student@123' },
  { email: 'hs.dang@center.com', password: 'Student@123' },
  { email: 'hs.bui@center.com', password: 'Student@123' },
];

async function seedPasswords() {
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);

    const { error } = await supabase
      .from('profiles')
      .update({ password_hash: hash })
      .eq('email', acc.email);

    if (error) {
      console.error(`❌ ${acc.email}: ${error.message}`);
    } else {
      console.log(`✅ ${acc.email}: password set`);
    }
  }
  console.log('\n🎉 Done!');
}

seedPasswords();
