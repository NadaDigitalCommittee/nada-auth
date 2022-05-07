import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { config } from "dotenv";
config();

const commands = [
  new SlashCommandBuilder().setName("post").setDescription("..."),
].map((x) => x.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);

rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID as string), {
    body: commands,
  })
  .then(() => console.log("成功しました"))
  .catch(console.error);
