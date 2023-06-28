import express from "express";
import {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
const app = express();
import { config } from "dotenv";
config();
import axios from "axios";
import {
  APIGuildMember,
  ButtonStyle,
  MessageFlags,
  Routes,
} from "discord-api-types/v10";
import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);

interface ModalData {
  custom_id: string;
  type: 4;
  value: string;
}

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.KEY as string),
  async (req, res) => {
    const interaction = req.body;
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      if (!interaction.member.roles.includes(process.env.MOD_ROLE)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "あなたにはこのコマンドの実行権限がありません",
            flags: MessageFlags.Ephemeral,
          },
        });
      }
      await axios.post(process.env.RULE_WEBHOOK as string, {
        content:
          "サーバーでの禁止行為\n・過度な連投行為（10秒の間に5回以上送信する）をしたとき、10分間メッセージを送れません。（一時ミュート）\n・三回の警告を受けるとメッセージを送れません。（ミュート）\n\n・ミュートは管理者による注意のあと解除されます。\n\nこのサーバーは以下の人が利用します。\n・デジタル委員\n・Adobeライセンス利用希望者\n・Adobeライセンス利用者\n・デジタル委員会を利用する生徒会員\n・放送委員\n・顧問及びその他教職員\n\nこのサーバーの使い方\n1、灘生であることを確認するため下のボタンからフォームに回答して下さい(確認が取れ次第、管理者がロール付与します。)\n2、ロール選択 の説明を読んで必要なものを選択してください。\n3、その他のロールが必要なときは role-request に、書いてある説明通りに送ってください。",
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("answer")
                .setLabel("回答する")
                .setStyle(ButtonStyle.Primary)
            )
            .toJSON(),
        ],
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "送信しました",
          flags: MessageFlags.Ephemeral,
        },
      });
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      if (
        interaction.data.custom_id === "yes" ||
        interaction.data.custom_id === "no"
      ) {
        const isOk = interaction.data.custom_id === "yes";
        const id = interaction.message.embeds[0]?.footer?.text;
        if (!id)
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "メッセージを正しく解釈できませんでした。",
              flags: MessageFlags.Ephemeral,
            },
          });
        return rest
          .get(Routes.guildMember(interaction.guild_id, id))
          .then((rmember) => {
            const member = rmember as APIGuildMember;
            if (member.roles.includes(process.env.VERIFY_ROLE ?? "")) {
              return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content:
                    "このユーザーは既に確認が取れているため回答する必要はありません。",
                  flags: MessageFlags.Ephemeral,
                },
              });
            }
            if (isOk) {
              return rest
                .put(
                  Routes.guildMemberRole(
                    interaction.guild_id,
                    id,
                    process.env.VERIFY_ROLE ?? ""
                  )
                )
                .then(() => {
                  return res.send({
                    type: InteractionResponseType.UPDATE_MESSAGE,
                    data: {
                      content: "ロールを付与しました。",
                      components: [],
                    },
                  });
                })
                .catch((_e) => {
                  return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                      content: "ロールの付与中にエラーが発生しました。",
                      flags: MessageFlags.Ephemeral,
                    },
                  });
                });
            } else {
              return res.send({
                type: InteractionResponseType.UPDATE_MESSAGE,
                data: {
                  content: "ロールを付与しませんでした。",
                  components: [],
                },
              });
            }
          })
          .catch((_e) => {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "ロールの取得中にエラーが発生しました。",
                flags: MessageFlags.Ephemeral,
              },
            });
          });
      }
      if (interaction.member.roles.includes(process.env.VERIFY_ROLE)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              "あなたは既に確認が取れているため回答する必要はありません。",
            flags: MessageFlags.Ephemeral,
          },
        });
      }
      return res.send({
        type: InteractionResponseType.MODAL,
        data: {
          components: [
            {
              label: "回生",
              custom_id: "g",
              max_length: 2,
              min_length: 2,
              required: true,
              style: 1,
              type: 4,
            },
            {
              label: "組",
              custom_id: "c",
              max_length: 1,
              min_length: 1,
              required: true,
              style: 1,
              type: 4,
            },
            {
              label: "番号",
              custom_id: "n",
              max_length: 2,
              min_length: 1,
              required: true,
              style: 1,
              type: 4,
            },
            {
              label: "名前",
              custom_id: "na",
              max_length: 10,
              min_length: 2,
              required: true,
              style: 1,
              type: 4,
            },
          ].map((x) => ({ type: 1, components: [x] })),
          title: "回答して下さい",
          custom_id: "modal",
        },
      });
    } else if (interaction.type === InteractionType.MODAL_SUBMIT) {
      const values = interaction.data.components.map(
        (x: { components: Array<ModalData> }) => x.components[0].value
      );
      return axios
        .post(process.env.WEBHOOK as string, {
          username: "回答通知",
          embeds: [
            {
              fields: [
                { name: "学年", value: `${values[0]}回生`, inline: true },
                { name: "組", value: `${values[1]}組`, inline: true },
                { name: "番号", value: `${values[2]}番`, inline: true },
                { name: "名前", value: `${values[3]}`, inline: true },
                {
                  name: "メンション",
                  value: `<@${interaction.member.user.id}>`,
                  inline: true,
                },
              ],
              author: {
                name: `${interaction.member.user.username}(${interaction.member.user.id})`,
                icon_url: interaction.member.user.avatar
                  ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png`
                  : undefined,
              },
              color: 3447003,
              footer: {
                text: `${interaction.member.user.id}`,
              },
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("yes")
                  .setLabel("承認")
                  .setStyle(ButtonStyle.Success)
              )
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("no")
                  .setLabel("否認")
                  .setStyle(ButtonStyle.Danger)
              )
              .toJSON(),
          ],
        })
        .then(() => {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "回答を送信しました。\nロール付与までしばらくお待ちください。",
              flags: MessageFlags.Ephemeral,
            },
          });
        })
        .catch(() => {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "回答を送信できませんでした。\nしばらく時間をおいてもう一度お試しください。",
              flags: MessageFlags.Ephemeral,
            },
          });
        });
    }
  }
);

app.listen(9999);
