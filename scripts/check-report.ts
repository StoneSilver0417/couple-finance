
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: '/root/projects/couple-finance/.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키로 읽기 권한 확보
);

async function checkReport() {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Latest Report Data:', JSON.stringify(data, null, 2));
  }
}

checkReport();
