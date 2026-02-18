// Test Supabase Connection
// Run with: node scripts/test_supabase_connection.cjs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
}

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
console.log('Key:', supabaseKey ? '✓ Found' : '✗ Missing');
console.log();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.log('\nPlease ensure your .env file contains:');
  console.log('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check users table
    console.log('📋 Test 1: Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, role')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      console.log('   Make sure you ran the SQL schema in Supabase!');
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${users.length} user(s):`);
      users.forEach(u => console.log(`   - ${u.username} (${u.role})`));
    }
    console.log();

    // Test 2: Check resumes table
    console.log('📋 Test 2: Checking resumes table...');
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);

    if (resumesError) {
      console.error('❌ Resumes table error:', resumesError.message);
      console.log('   Make sure you ran the SQL schema in Supabase!');
    } else {
      console.log('✅ Resumes table accessible');
    }
    console.log();

    // Test 3: Check job_descriptions table
    console.log('📋 Test 3: Checking job_descriptions table...');
    const { data: jds, error: jdError } = await supabase
      .from('job_descriptions')
      .select('id')
      .limit(1);

    if (jdError) {
      console.error('❌ Job Descriptions table error:', jdError.message);
      console.log('   Make sure you ran the SQL schema in Supabase!');
    } else {
      console.log('✅ Job Descriptions table accessible');
    }
    console.log();

    // Summary
    if (!usersError && !resumesError && !jdError) {
      console.log('🎉 All tests passed! Your Supabase database is ready.');
      console.log('\nYou can now run: npm run dev');
      
      if (users && users.length > 0) {
        console.log('\n🔐 Default admin account:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
      } else {
        console.log('\n⚠️  No users found. You may need to run the INSERT query:');
        console.log('   INSERT INTO users (id, username, password, role)');
        console.log('   VALUES (\'admin-0\', \'admin\', \'admin123\', \'RECRUITER\');');
      }
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      console.log('\nTo fix: Go to your Supabase SQL Editor and run:');
      console.log('   supabase-schema.sql');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\nPlease verify:');
    console.log('  1. Your Supabase project is active');
    console.log('  2. The credentials in .env are correct');
    console.log('  3. You have internet connection');
  }
}

testConnection();
