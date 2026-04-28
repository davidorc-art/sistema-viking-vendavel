import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '42524b84-7239-45b7-bcd6-a9275272d086';

async function restore() {
  console.log('Restoring professionals...');
  const proData = [
    ["1235e171-02ac-4425-b348-ee10330e42f5", "David", "Tatuador"],
    ["c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "Jeynne", "Piercer"]
  ].map(p => ({ 
    id: p[0], 
    name: p[1], 
    role: p[2], 
    user_id: USER_ID 
  }));
  await supabase.from('professionals').upsert(proData);

  console.log('Restoring blocked times...');
  const bloDataRaw = [{"id": "6ca95c10-98bf-4f58-af94-946fc6fe7637", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-03-29", "time": "00:00", "duration": 1440, "reason": "Folga", "recurrence": "none", "exceptions": []}, {"id": "f48281fb-73c3-451f-88b2-2e3dd8ebb91d", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-17", "time": "00:00", "duration": 1440, "reason": "Niver Jeyjey", "recurrence": "none", "exceptions": []}, {"id": "09741dce-bd49-4668-bdfb-5f836a60c013", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-04", "time": "10:00", "duration": 120, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "08f969d8-2a6a-4a09-a6b1-10b00b116153", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-09", "time": "10:00", "duration": 240, "reason": "Consulta", "recurrence": "none", "exceptions": []}, {"id": "ee67e44b-3fcb-440c-8f8f-5a06b111bdf4", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-16", "time": "00:00", "duration": 1440, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "bed5f9b6-8cef-4789-801f-74d98bb8e43b", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-16", "time": "10:00", "duration": 240, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "b0d0dde6-c5f1-4746-aaa5-1ffcfbb2599c", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-18", "time": "18:00", "duration": 180, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "c91e32ae-d075-4d42-b1b0-3380ed40219a", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-18", "time": "00:00", "duration": 1440, "reason": "Pintura", "recurrence": "none", "exceptions": []}, {"id": "643f504b-9ab6-4941-acc9-e83e3d0b7c24", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-21", "time": "10:00", "duration": 180, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "326fd87b-7070-4fa6-bd75-1011249517bc", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-29", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "d19a5e0a-ca1c-4408-a19a-864fa3b64001", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-30", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "ab8dd385-f384-4a22-ad8c-3670eee8270c", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-04-30", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "ab8dd385-f384-4a22-ad8c-3670eee8270c", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-01", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "82b86b68-aeee-43ab-b8a6-85c5e1cb8603", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-02", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "acce09fa-1f9c-4bd9-87ad-56b7583acb47", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-03", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "3141a0ab-402c-4d80-9ba8-d63b3fd1dabb", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-04", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "6e6df5ed-bbc7-438e-9f61-f5b21e0f43a9", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-05", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "ab0259f6-d9dc-4b88-81d5-5e60ee0649a2", "professionalId": "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "professionalName": "Jeynne", "date": "2026-05-06", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "e7abc37c-9a46-47f9-9a48-cec98ef06358", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-05-07", "time": "00:00", "duration": 1440, "reason": "Viagem Jey Jey", "recurrence": "none", "exceptions": []}, {"id": "43193e20-b008-48f6-b10e-b575a0c00c93", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-24", "time": "00:00", "duration": 1440, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "20cda4f8-07c6-416e-acf3-c9ac774beb55", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-23", "time": "14:30", "duration": 420, "reason": "", "recurrence": "none", "exceptions": []}, {"id": "0f93799d-53f8-478b-ad18-77e117d9b07b", "professionalId": "all", "professionalName": "Todos os Profissionais", "date": "2026-04-19", "time": "10:00", "duration": 120, "reason": "", "recurrence": "daily", "exceptions": ["2026-04-21", "2026-04-23", "2026-04-22", "2026-04-26", "2026-05-01", "2026-04-27"]}];
  const bloData = bloDataRaw.map(b => ({
    id: b.id,
    professional_id: b.professionalId,
    professional_name: b.professionalName,
    date: b.date,
    time: b.time,
    duration: b.duration,
    reason: b.reason,
    user_id: USER_ID
  }));
  await supabase.from('blocked_times').upsert(bloData);

  console.log('Done with pros and blocked times.');
}

restore();
