import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { config } from "dotenv";
import { ServerRulePostCommand } from "./constants";
config();

const { CLIENT_ID, TOKEN } = process.env as Record<string, string>;
const commands = [
  new SlashCommandBuilder()
    .setName(ServerRulePostCommand.COMMAND_NAME)
    .setDescription(ServerRulePostCommand.DESCRIPTION),
].map((x) => x.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

rest
  .put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  .then(() => console.log(ServerRulePostCommand.POSTED))
  .catch(console.error);
