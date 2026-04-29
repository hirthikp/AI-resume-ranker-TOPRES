const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env file');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8').split('\n');
const supabaseUrl = (envContent.find((l) => l.startsWith('VITE_SUPABASE_URL=')) || '').split('=')[1]?.trim();
const supabaseKey = (envContent.find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY=')) || '').split('=')[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const ts = Date.now();
  const username = `diag_user_${ts}`;
  const id = `diag-${ts}`;

  const { error: insertError } = await supabase.from('users').insert({
    id,
    username,
    password: 'diag-pass',
    role: 'RECRUITER',
  });

  if (insertError) {
    console.error('INSERT_ERROR:', JSON.stringify({
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    }, null, 2));
    process.exit(1);
  }

  const { data, error: selectError } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('id', id)
    .maybeSingle();

  if (selectError) {
    console.error('SELECT_ERROR:', JSON.stringify({
      message: selectError.message,
      code: selectError.code,
      details: selectError.details,
      hint: selectError.hint,
    }, null, 2));
    process.exit(1);
  }

  console.log('WRITE_OK:', data);

  const { error: deleteError } = await supabase.from('users').delete().eq('id', id);
  if (deleteError) {
    console.error('CLEANUP_ERROR:', JSON.stringify({
      message: deleteError.message,
      code: deleteError.code,
      details: deleteError.details,
      hint: deleteError.hint,
    }, null, 2));
    process.exit(1);
  }

  console.log('CLEANUP_OK');
})();
