import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '42524b84-7239-45b7-bcd6-a9275272d086';

const ageDataRaw = [
  ["eee90b71-9694-42f8-8509-829d6f883fca", "e70855c7-328f-4cec-b1c2-3a642da301e8", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-03-27", "14:30", "Finalizado", 0],
  ["9ba78dad-7824-48bb-8eb5-c321bff6bc57", "2f02b29b-0407-4e2d-a119-fc4124ef08b8", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 900],
  ["7c63a8d7-4b3e-4458-99e4-862f530719b9", "aa79407b-decd-4b68-a0ad-68fd87401a99", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 120],
  ["f9861e46-be02-4503-bd9c-fe528653a02b", "aa79407b-decd-4b68-a0ad-68fd87401a99", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "16:00", "Confirmado", 120],
  ["adfd6645-4e17-4fc2-b0c8-01be7441a004", "da3d27df-97bf-48c8-9d6b-7c1c586ebfbb", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 0],
  ["4a72ec1c-49aa-4fba-809e-5e27b77876e7", "ed557104-cc0a-4ec2-aa46-13756f7c2793", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 450],
  ["b1a7c85b-f73f-4bb0-91a1-3c2e0c5ad9ef", "e70855c7-328f-4cec-b1c2-3a642da301e8", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 150],
  ["edcb22df-5265-4a45-a313-bd26185d806c", "23373fb4-fa23-4234-bbd9-b8ea76cf83f5", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 100],
  ["b3567573-e4a3-4ae6-b806-ca93c6132fdc", "fc75d875-1ec8-4b1f-97fb-124118801118", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 150],
  ["68a8ae97-0f99-4262-b12b-4a1139d03abf", "a8ea055d-e068-4b40-b95d-9d74f1d6a240", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 650],
  ["990f8c87-3735-46d1-8cc4-421a0d8ff272", "e70855c7-328f-4cec-b1c2-3a642da301e8", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "13:00", "Finalizado", 150],
  ["a29fa236-1453-4ac5-977f-8cfe0fe26e9a", "87b8e5b9-1041-4334-b547-b84eee98c238", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 550],
  ["878e4197-502f-4b21-b446-e529dd95b1f4", "ab2f44aa-4e7f-4848-896c-d7afe9250082", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 0],
  ["c9eccbd1-f579-4d5a-9b7e-c87ff7569561", "339d5fe4-960a-46ae-a272-289c6b5f0bd8", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 390],
  ["eab80010-5f33-4a6e-9b45-9a7bd495a5df", "f1a969de-a17f-4d17-beee-b4908a264b07", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 0],
  ["077dd730-d52c-4bb7-90d7-fdfce3a53613", "3ec07bd4-c5f6-4943-a448-67d242aa5ec9", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 150],
  ["673253f5-3b62-44d6-b821-e900c6a76a72", "3fdd8376-d79f-4603-9b06-020ced79bc39", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "00:00", "Cancelado", 100],
  ["9683b944-a326-41d0-95d4-4c777edf2d18", "fc75d875-1ec8-4b1f-97fb-124118801118", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "14:30", "Finalizado", 150],
  ["a5852015-5f2c-4c43-b2dc-e69586376d5d", "964a635a-6b4b-43ae-8c6d-a63d30331c51", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-27", "10:00", "Finalizado", 0],
  ["63deb28d-66e0-4b17-bf34-f672aeb0b36d", "91b3282e-276e-4ee8-88f2-664a94ae2ed9", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-28", "10:00", "Finalizado", 125],
  ["010e5419-ecbb-4db7-8379-a7aa6f9ab377", "c672d9e5-7e76-4ab8-b4ae-687891a5f31e", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-28", "16:00", "Finalizado", 76],
  ["d79bee9b-d1ce-4a3b-b9fe-581831475d5b", "0d0ed7d4-67c3-47eb-a2af-1cdf553420ec", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-03-30", "14:30", "Finalizado", 25],
  ["8d983554-4941-4da3-be2c-0d8d28ef2c5c", "d9e28e44-e49f-4286-aebc-31دا81ee6aa2", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-31", "14:00", "Finalizado", 75],
  ["0ee449ec-ffa3-4606-9cb2-d377f1b9a3a2", "aa79407b-decd-4b68-a0ad-68fd87401a99", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-03-31", "16:00", "Inadimplente", 0],
  ["e37eb3ab-15c7-4c97-9eb0-6a8ebc2da314", "ab2f44aa-4e7f-4848-896c-d7afe9250082", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-01", "15:00", "Confirmado", 0],
  ["6ad4b531-a5a0-4361-9142-b6c7fdc283ff", "74d1d8df-f95a-456a-8032-1e3d63a1f5f4", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-01", "18:00", "Finalizado", 150],
  ["c695a852-f198-48ec-a4da-dd27889edefa", "117b5bed-7c06-4eb5-8f0a-17bc0088b67d", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-01", "13:00", "Cancelado", 0],
  ["5213b883-5f03-4654-aa6b-e0185d839b74", "da3d27df-97bf-48c8-9d6b-7c1c586ebfbb", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-01", "11:30", "Confirmado", 0],
  ["e82c5586-ad59-4969-8681-57be58f132fc", "117b5bed-7c06-4eb5-8f0a-17bc0088b67d", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-01", "13:00", "Finalizado", 0],
  ["1444aa17-94ae-4b93-9043-0cd5bd6bf6b9", "96ed5199-20ed-4c87-9947-8e7dad8329e7", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-01", "14:30", "Finalizado", 60],
  ["268f47fa-9879-4309-974a-f3bdbb5a4fdd", "acb897a7-ddb8-48ad-8d59-e10ef7c12017", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-02", "13:00", "Finalizado", 700],
  ["339ef158-139b-4f07-94dc-303cfcbf1f6f", "23373fb4-fa23-4234-bbd9-b8ea76cf83f5", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-03", "17:30", "Finalizado", 150],
  ["bd0e525f-7358-496f-bbf5-3c2ca9a36222", "5cc4a85f-5729-4b86-b049-eafbd1b3ef37", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-03", "15:30", "Finalizado", 100],
  ["bf6a1777-9296-4af9-9d26-e9e404031637", "01a645e9-b6a6-4ef0-b662-03684f218115", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-04", "10:30", "Finalizado", 100],
  ["fc88ae1c-12f9-4c84-8a03-8b1d3213b9df", "c0146e50-9025-40f7-9ea0-7d4de3390144", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-04", "15:00", "Finalizado", 325],
  ["9ba393ab-a6d5-4ffe-885f-dd749a0684be", "1d5f77f8-4d8d-4710-a4b4-dc04c68d0cb9", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-04", "14:00", "Finalizado", 100],
  ["1fb9d8f8-d862-4457-92e6-9b7fa01435aa", "5dff58c8-bc3f-48bf-8369-bec023dd3d87", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-04", "11:00", "Finalizado", 40],
  ["f6f7d03c-0f58-47e8-802b-1bd1363ff3d7", "9b2d8963-ca97-4354-9371-eff72ebe13dc", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-04", "13:00", "Finalizado", 75],
  ["a62cb981-8a37-45a5-9f12-d052af862e9e", "ab88a7d6-9802-4adb-bc78-dc34b7f65db0", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-04", "17:00", "Finalizado", 50],
  ["02b2b71e-efdb-4d76-ae29-cbff12aaa98d", "8e5639e4-a577-44e5-8bf9-f2cf8781dc59", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-04", "12:00", "Finalizado", 25],
  ["ca06a8ea-9093-4085-a17c-b29ddad19c5b", "f24a69a3-5d31-4f67-8b2d-b2386b32d743", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-04", "13:00", "Finalizado", 40],
  ["96cc3db7-ef77-47dd-a2bf-f4e0032b55b7", "3ec07bd4-c5f6-4943-a448-67d242aa5ec9", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-06", "10:00", "Finalizado", 150],
  ["4da3f6b4-509f-4b4b-92e0-441a90942587", "8e479c7d-d362-431c-bd9a-131df412f34b", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-07", "13:30", "Finalizado", 200],
  ["885e5556-697c-4f1a-8427-8094eaf0232c", "649bc6ec-7f4f-4bc8-bea2-6f5e6b0273b0", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-07", "12:00", "Finalizado", 60],
  ["85e1d0ba-0044-4a62-bcfa-8f81007d4127", "edb4ea39-cda9-4f74-b5bd-460ab186dfef", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-07", "11:00", "Finalizado", 25],
  ["48df9add-d41d-4e71-834a-596860d456d5", "f5ee3384-d2f9-48db-857d-3582c4e49921", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-07", "15:30", "Finalizado", 80],
  ["a3b4f070-b940-4d99-87fe-b4e039269c51", "649bc6ec-7f4f-4bc8-bea2-6f5e6b0273b0", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-07", "10:00", "Finalizado", 40],
  ["a891750e-fd88-4748-b7ac-fe88f8f2f8e0", "33b8d25a-8db8-4c9f-8dc0-253bc8ed6d44", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-07", "15:30", "Finalizado", 60],
  ["9e0589cf-f8ff-4751-9d9e-b956d8e1e68f", "01a7cb1d-95ef-470e-8ef4-5c08c5d38936", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-09", "14:30", "Finalizado", 25],
  ["09590847-9934-4d85-985b-4aa12f8d1f39", "1cc185ee-f346-4779-ad04-3282fbd5adab", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-09", "12:00", "Finalizado", 100],
  ["0d0ecf23-9539-43cb-a44e-11804a1828c9", "98d36d7d-52cc-444e-9354-477db4411f26", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-09", "16:30", "Finalizado", 25],
  ["9f7e2b31-c00a-443c-916d-ddf49a699b3a", "5166f82e-6a3c-456b-9b2b-7a123a6e48cd", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-09", "15:30", "Finalizado", 40],
  ["99debfeb-8d3c-4ce9-85af-97799fa3fb63", "ab93c44f-deb0-45ac-9649-db147169cef6", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-09", "14:00", "Finalizado", 100],
  ["5221f1c9-a5eb-45ba-9316-625437ab47b5", "d3928cbd-bb8f-412e-a6b4-d37655fb2bfc", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-09", "19:00", "Finalizado", 150],
  ["e00d415e-21d7-487d-a3de-4ced991c6420", "c2ecabf0-afbd-455b-aad7-ca734cf09a5a", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-10", "14:00", "Finalizado", 250],
  ["4bb9cf53-802f-4052-b384-6bb1b3aaf9ad", "43071f73-1ded-4489-b99f-96b246dc0950", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-10", "13:00", "Finalizado", 210],
  ["c01a7792-ef3a-4bf4-874b-5fdbe7e5de13", "f0854e3b-c11a-46f8-9465-06e23310f5c7", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-11", "13:00", "Finalizado", 100],
  ["40bf88ca-5ae4-45aa-8966-2cc4a5601123", "c6d02308-c6f8-435f-aba2-241e55c90f66", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-13", "19:30", "Finalizado", 250],
  ["e7cd8386-72bd-43e0-a0b5-17543c366804", "a7f3a28f-0daf-4f83-8ffe-06450316353a", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-13", "11:00", "Confirmado", 200],
  ["a418f23c-84e3-4c47-be46-f75a944ba19f", "ee3b1a6e-6be3-4c7f-8f1a-4638d48813c0", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-14", "11:00", "Finalizado", 100],
  ["79acc265-bcee-4630-8310-430017a229bb", "ee3b1a6e-6be3-4c7f-8f1a-4638d48813c0", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-14", "12:00", "Finalizado", 25],
  ["b6741bad-1ba4-46ec-827a-9d3edd2f009e", "d4957954-fabb-45e6-8ef5-b8690eaf779a", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-14", "10:00", "Finalizado", 25],
  ["b61a7008-070a-4723-9a09-f812f20ef3d0", "a63e5576-28d6-4cc7-a24e-dedb33a86792", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-15", "10:00", "Finalizado", 250],
  ["797fa7f2-c9e4-4108-938f-cc0a4bee09e3", "a66738b9-69b6-4643-ad08-cb929ee61c94", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-15", "14:30", "Finalizado", 100],
  ["5ae5dbba-8e0a-4243-8a04-bb16c68006a2", "67b14cd9-ac86-4ee4-8fb0-9daf810342ba", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-15", "16:30", "Confirmado", 0],
  ["f4954401-43e2-4769-a2df-c94f215ebd27", "76c03930-f348-4278-bd18-32cde51a3dd4", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-18", "10:00", "Finalizado", 150],
  ["b4e66d7f-454e-47ae-b1b8-bcd61cbe2c69", "136baecf-b8c7-403e-82ee-1825e26bf07f", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-18", "14:30", "Confirmado", 180],
  ["9fb401ed-54e3-4d8d-acb4-e1e4b90c50c2", "8e5639e4-a577-44e5-8bf9-f2cf8781dc59", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-18", "15:30", "Finalizado", 20],
  ["8c42406e-1669-4efa-88cb-fd25d80263c5", "8f47b060-5b74-4908-9f02-0c887e82a037", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-18", "13:30", "Finalizado", 60],
  ["ce33ee14-4eaa-466f-abc6-2a0cebb949c0", "f614e42d-c5b9-4f39-9bbf-9382dff783a7", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-19", "16:00", "Finalizado", 0],
  ["7223d30f-bffc-4518-95a6-770cf4990ecc", "cc28f3c7-2572-4095-a382-b885221c2f00", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-19", "13:00", "Confirmado", 750],
  ["2e0ed1c8-88a3-4413-8e1a-8ce5ff75b5d4", "f0aa5726-544c-490f-af02-eba74d8a99a6", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-20", "14:00", "Confirmado", 100],
  ["3380ccc1-3452-4e9a-825f-43ea3676ba5b", "61760ab2-d410-45c2-a72c-501c7fcdde2e", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-21", "16:00", "Finalizado", 185],
  ["04061ad3-51f3-49e8-811f-97825f4a96e8", "ce175ecd-9063-49ef-80ca-256ad83498e2", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-21", "12:00", "Finalizado", 350],
  ["d03c7c5d-31d9-4c42-9b61-fab0ed93acfa", "3669ffa4-a37b-4385-a593-cb384f81eca3", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-21", "13:00", "Finalizado", 25],
  ["83f30622-533f-45ed-881a-1cb9a9d3a9ae", "0df006b2-383f-4852-aac7-eae927093d25", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-21", "10:00", "Confirmado", 80],
  ["30621de8-103a-441b-b107-8a2818f255ad", "b6e10f6d-63f9-4752-a86f-4fa42f34acef", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-22", "10:00", "Finalizado", 60],
  ["3bfbc6d1-005b-44f4-a067-1ba9eabaaa53", "2759f2fd-b267-4b9d-90b1-9a403d50d736", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-22", "11:00", "Finalizado", 90],
  ["295eaf36-d441-43c1-bfb7-307c9037370b", "b5ba8280-b445-4cd8-8ba6-481555f52708", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-25", "14:00", "Finalizado", 15],
  ["3b4e16a0-9ccd-4ab1-8aea-4880004c8472", "1f0ae837-f724-4db3-b41f-5c0caf2c0dae", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-25", "12:00", "Finalizado", 100],
  ["79f424fc-fea1-40ce-adaf-7382ad3c0609", "2efe7b8b-b68d-43c7-bb82-72a3115c5bae", "c965b6ac-3f02-4cbb-9635-20cc3885a3b4", "2026-04-25", "15:00", "Finalizado", 25],
  ["92946bd0-c182-43c2-9232-115f3ece7b89", "acd093f8-3e38-4f14-96ef-22729d41f3b9", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-04-26", "13:00", "Finalizado", 50],
  ["60ee1265-38d0-4b64-9826-a4f2ea76cb97", "f32ef60c-d6e2-4ff6-ab05-c70002622e57", "1235e171-02ac-4425-b348-ee10330e42f5", "2026-05-03", "13:00", "Finalizado", 135]
];

async function restore() {
  console.log('Restoring appointments...');
  const appData = ageDataRaw.map(a => {
    const profId = String(a[2]);
    const service = (profId === 'c965b6ac-3f02-4cbb-9635-20cc3885a3b4') ? 'Piercing' : 'Tatuagem';
    const profName = (profId === 'c965b6ac-3f02-4cbb-9635-20cc3885a3b4') ? 'Jeynne' : 'David';

    const rawStatus = String(a[5]);
    const validStatuses = ['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'];
    const status = validStatuses.includes(rawStatus) ? rawStatus : 'Confirmado';

    return {
      id: a[0],
      client_id: a[1],
      professional_id: profId,
      professional_name: profName,
      date: String(a[3]),
      time: String(a[4]),
      status: status,
      total_value: Number(a[6]),
      value: Number(a[6]),
      service: service,
      duration: 60,
      user_id: USER_ID
    };
  });

  for (let i = 0; i < appData.length; i += 50) {
    const chunk = appData.slice(i, i + 50);
    const { error } = await supabase.from('appointments').upsert(chunk);
    if (error) console.error('Error restoring appointments chunk:', error.message);
  }

  console.log('Done restoring appointments.');
}

restore();
