import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test script to verify database connectivity

async function testDatabase() {
  // Read env file to get credentials
  
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const lines = envContent.split('\n');
    let supabaseUrl = '';
    let supabaseKey = '';
    
    lines.forEach(line => {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1];
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1];
      }
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Could not find Supabase credentials in .env.local');
      return;
    }
    
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic table access
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');
    
    console.log('📊 Patients table query result:', {
      count: patients?.length || 0,
      error: patientsError,
      sampleData: patients?.[0] || null
    });
    
    // Test function access
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_all_patients_with_medical');
    
    console.log('🔧 Function call result:', {
      count: functionData?.length || 0,
      error: functionError,
      sampleData: functionData?.[0] || null
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase();