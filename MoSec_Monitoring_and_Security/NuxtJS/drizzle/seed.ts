// drizzle/seed.ts

import { db } from "../server/utils/db";
import { rooms } from "../server/utils/schema";

async function seed() {
  await db.insert(rooms).values([
    {
      id: "355224e6-84aa-df11-bca3-d8d385fce79c",
      name: "329",
    },
    {
      id: "95ad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "601",
    },
    {
      id: "96ad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "602",
    },
    {
      id: "535224e6-84aa-df11-bca3-d8d385fce79c",
      name: "603",
    },
    {
      id: "545224e6-84aa-df11-bca3-d8d385fce79c",
      name: "604",
    },
    {
      id: "555224e6-84aa-df11-bca3-d8d385fce79c",
      name: "605",
    },
    {
      id: "565224e6-84aa-df11-bca3-d8d385fce79c",
      name: "606",
    },
    {
      id: "585224e6-84aa-df11-bca3-d8d385fce79c",
      name: "608",
    },
    {
      id: "595224e6-84aa-df11-bca3-d8d385fce79c",
      name: "609",
    },
    {
      id: "5a5224e6-84aa-df11-bca3-d8d385fce79c",
      name: "610",
    },
    {
      id: "5d5224e6-84aa-df11-bca3-d8d385fce79c",
      name: "621",
    },
    {
      id: "5e5224e6-84aa-df11-bca3-d8d385fce79c",
      name: "622",
    },
    {
      id: "5f5224e6-84aa-df11-bca3-d8d385fce79c",
      name: "623",
    },
    {
      id: "605224e6-84aa-df11-bca3-d8d385fce79c",
      name: "624",
    },
    {
      id: "615224e6-84aa-df11-bca3-d8d385fce79c",
      name: "625",
    },
    {
      id: "625224e6-84aa-df11-bca3-d8d385fce79c",
      name: "626",
    },
    {
      id: "635224e6-84aa-df11-bca3-d8d385fce79c",
      name: "627",
    },
    {
      id: "645224e6-84aa-df11-bca3-d8d385fce79c",
      name: "628",
    },
    {
      id: "655224e6-84aa-df11-bca3-d8d385fce79c",
      name: "629",
    },
    {
      id: "665224e6-84aa-df11-bca3-d8d385fce79c",
      name: "630",
    },
    {
      id: "675224e6-84aa-df11-bca3-d8d385fce79c",
      name: "631",
    },
    {
      id: "b1ad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "706",
    },
    {
      id: "b3ad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "708",
    },
    {
      id: "b5ad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "710",
    },
    {
      id: "edea45ec-d570-e211-9fa0-d8d385fce79c",
      name: "711A",
    },
    {
      id: "6f5224e6-84aa-df11-bca3-d8d385fce79c",
      name: "721",
    },
    {
      id: "705224e6-84aa-df11-bca3-d8d385fce79c",
      name: "722",
    },
    {
      id: "715224e6-84aa-df11-bca3-d8d385fce79c",
      name: "723",
    },
    {
      id: "50948819-2f05-e711-9a56-d8d385fce79e",
      name: "724",
    },
    {
      id: "d0fe749e-d5df-e311-8bb4-d8d385fce79c",
      name: "724 Meeting Room",
    },
    {
      id: "725224e6-84aa-df11-bca3-d8d385fce79c",
      name: "725",
    },
    {
      id: "735224e6-84aa-df11-bca3-d8d385fce79c",
      name: "727",
    },
    {
      id: "c0e84f91-e13f-e411-9aa5-d8d385fce79c",
      name: "728",
    },
    {
      id: "745224e6-84aa-df11-bca3-d8d385fce79c",
      name: "729",
    },
    {
      id: "bcad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "730",
    },
    {
      id: "bdad125d-b6b4-df11-bca3-d8d385fce79c",
      name: "731",
    },
  ]);

  console.log("Seed complete");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });