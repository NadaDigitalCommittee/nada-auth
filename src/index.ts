import express from "express";
import { verifyKeyMiddleware } from "discord-interactions";
import { config } from "dotenv";
import axios from "axios";
import {
  APIApplicationCommandInteraction,
  APIGuildMember,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  MessageFlags,
  Routes,
  InteractionType,
  InteractionResponseType,
} from "discord-api-types/v10";
import { REST } from "@discordjs/rest";
import {
  formatString,
  ValidationError,
  ServerRulePostCommand,
  VerificationProcess,
} from "./constants";

config();
const { TOKEN, KEY, MOD_ROLE, RULE_WEBHOOK, VERIFY_ROLE, WEBHOOK } = process.env as Record<
  string,
  string
>;

const { approveOrReject } = VerificationProcess;
const assert = <T>(v: unknown) => v as T;

const rest = new REST({ version: "10" }).setToken(TOKEN);
const app = express();
app.post("/interactions", verifyKeyMiddleware(KEY), async (req, res) => {
  const ephemeralReply = (content: string) =>
    res.send({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content, flags: MessageFlags.Ephemeral },
    });
  const completeVerificationWith = (content: string) =>
    res.send({
      type: InteractionResponseType.UpdateMessage,
      data: { content, components: [] },
    });
  const interaction = req.body as
    | APIApplicationCommandInteraction
    | APIMessageComponentInteraction
    | APIModalSubmitInteraction;
  const { member, guild_id: guildId } = interaction;
  if (!member)
    return ephemeralReply(
      ValidationError.FAILED_TO_INTERPRET_INTERACTION +
        formatString(ValidationError.ERROR_DUE_TO_MISSING, "interaction.member")
    );
  if (!guildId)
    return ephemeralReply(
      ValidationError.FAILED_TO_INTERPRET_INTERACTION +
        formatString(ValidationError.ERROR_DUE_TO_MISSING, "interaction.guild_id")
    );
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      if (!member.roles.includes(MOD_ROLE))
        return ephemeralReply(ServerRulePostCommand.NO_PERMISSION);
      await axios.post(RULE_WEBHOOK, {
        content: ServerRulePostCommand.SERVER_RULE,
        components: ServerRulePostCommand.components,
      });
      return ephemeralReply(ServerRulePostCommand.POSTED);
    case InteractionType.MessageComponent:
      const { custom_id: customId } = interaction.data;
      if (Object.values(approveOrReject).includes(customId)) {
        const approved = customId === approveOrReject.approve;
        const userId = interaction.message.embeds[0]?.footer?.text;
        if (!userId)
          return ephemeralReply(
            ValidationError.FAILED_TO_INTERPRET_INTERACTION +
              formatString(
                ValidationError.ERROR_DUE_TO_MISSING,
                "interaction.message.embeds[0].footer.text"
              )
          );
        return rest
          .get(Routes.guildMember(guildId, userId))
          .then(assert<APIGuildMember>)
          .then(({ roles }) => {
            if (roles.includes(VERIFY_ROLE))
              return ephemeralReply(VerificationProcess.USER_IS_ALREADY_VERIFIED);
            if (approved) {
              return rest
                .put(Routes.guildMemberRole(guildId, userId, VERIFY_ROLE))
                .then(() => completeVerificationWith(VerificationProcess.ROLE_ASSIGNED))
                .catch(() => ephemeralReply(VerificationProcess.ERROR_WHILE_ASSIGNING_ROLE));
            } else {
              return completeVerificationWith(VerificationProcess.ROLE_NOT_ASSIGNED);
            }
          })
          .catch(() => ephemeralReply(VerificationProcess.ERROR_WHILE_RETRIEVING_ROLE));
      }
      if (member.roles.includes(VERIFY_ROLE)) {
        return ephemeralReply(VerificationProcess.YOU_ARE_ALREADY_VERIFIED);
      } else {
        return res.send(VerificationProcess.modal);
      }
    case InteractionType.ModalSubmit:
      const values = interaction.data.components?.map((component) => component.components[0].value);
      if (!values)
        return ephemeralReply(
          ValidationError.FAILED_TO_INTERPRET_INTERACTION +
            formatString(ValidationError.ERROR_DUE_TO_MISSING, "interaction.data.components")
        );
      return axios
        .post(WEBHOOK, {
          username: "回答通知",
          embeds: VerificationProcess.modalSubmissionInfo(values, member.user),
          components: VerificationProcess.approvalButtons,
        })
        .then(() => ephemeralReply(VerificationProcess.FORM_SUBMITTED))
        .catch(() => ephemeralReply(VerificationProcess.FAILED_TO_SUBMIT_FORM));
  }
});

app.listen(9999);
