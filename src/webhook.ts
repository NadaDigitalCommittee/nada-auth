import { config } from "dotenv";
config();

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);
rest
  .post(Routes.channelWebhooks(process.env.CHANNEL_ID as string), {
    body: { name: "ニトリ" },
  })
  .then(console.log);
