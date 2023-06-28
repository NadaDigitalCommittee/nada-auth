import { config } from "dotenv";
config();

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);
rest
  .post(Routes.channelWebhooks(process.env.RULE_CHANNEL_ID as string), {
    body: { name: "ルール" },
  })
  .then((x) => {
    console.log("Rule Webhook");
    console.log(x);
  });

rest
  .post(Routes.channelWebhooks(process.env.ANSWER_CHANNEL_ID as string), {
    body: { name: "回答" },
  })
  .then((x) => {
    console.log("Answer Webhook");
    console.log(x);
  });
