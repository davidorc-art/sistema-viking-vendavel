import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function toSnakeCase(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = obj[key];
    return acc;
  }, {});
}

async function run() {
  const newReward = {
    id: "g7h8i9j0k",
    title: "Test Reward",
    points: 100,
    description: "test",
    icon: "Gift"
  };
  const payload = toSnakeCase(newReward);
  const { data, error } = await supabase.from('rewards').insert([payload]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
