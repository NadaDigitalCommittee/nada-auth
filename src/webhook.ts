import { config } from "dotenv";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

config();
const { TOKEN, RULE_CHANNEL_ID, ANSWER_CHANNEL_ID } = process.env as Record<
  string,
  string
>;
const rest = new REST({ version: "10" }).setToken(TOKEN);
rest
  .post(Routes.channelWebhooks(RULE_CHANNEL_ID), {
    body: { name: "ルール" },
  })
  .then((x) => {
    console.log("Rule Webhook");
    console.log(x);
  });

rest
  .post(Routes.channelWebhooks(ANSWER_CHANNEL_ID), {
    body: { name: "回答" },
  })
  .then((x) => {
    console.log("Answer Webhook");
    console.log(x);
  });
