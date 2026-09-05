import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// .env 파일 위치를 정확히 지정하여 로드
dotenv.config({ path: path.join(currentDirectory, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Environment variables missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clear() {
  console.log("Clearing monthly_reports...");
  const { error } = await supabase
    .from("monthly_reports")
    .delete()
    .neq("household_id", "00000000-0000-0000-0000-000000000000");
  if (error) console.error(error);
  else console.log("Cleared successfully.");
}

clear();
