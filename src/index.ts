import express from "express";
import {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
const app = express();
import { config } from "dotenv";
config();
import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes, ButtonStyle, TextInputStyle } from "discord-api-types/v10";
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN as string);
import axios from "axios";

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
            flags: 1 << 6,
          },
        });
      }
      await axios.post(process.env.RULE_WEBHOOK as string, {
        content:
          "サーバーでの禁止行為\n・過度な連投行為（10秒の間に5回以上送信する）をしたとき、10分間メッセージを送れません。（一時ミュート）\n・三回の警告を受けるとメッセージを送れません。（ミュート）\n\n・ミュートは管理者による注意のあと解除されます。\n\nこのサーバーは以下の人が利用します。\n・デジタル委員\n・Adobeライセンス利用希望者\n・Adobeライセンス利用者\n・デジタル委員会を利用する生徒会員\n・放送委員\n・顧問及びその他教職員\n\nこのサーバーの使い方\n1、灘生であることを確認するため下のボタンからフォームに回答して下さい(確認が取れ次第、管理者がロール付与します。)\n2、ロール選択 の説明を読んで必要なものを選択してください。\n3、その他のロールが必要なときは role-request に、書いてある説明通りに送ってください",
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setCustomId("answer")
                .setLabel("回答する")
                .setStyle(ButtonStyle.Primary)
                .toJSON(),
            ],
          },
        ],
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "送信しました",
          flags: 1 << 6,
        },
      });
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      if (interaction.member.roles.includes(process.env.VERIFY_ROLE)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              "あなたは既に確認が取れているため回答する必要はありません。",
            flags: 1 << 6,
          },
        });
      }
      return res.send({
        type: InteractionResponseType.APPLICATION_MODAL,
        data: new ModalBuilder()
          .setCustomId("modal")
          .setTitle("回答してください")
          .setComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setLabel("回生")
                .setCustomId("grade")
                .setMaxLength(2)
                .setMinLength(2)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setLabel("組")
                .setCustomId("class")
                .setMaxLength(1)
                .setMinLength(1)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setLabel("番号")
                .setCustomId("number")
                .setMaxLength(2)
                .setMinLength(1)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setLabel("名前")
                .setCustomId("name")
                .setMaxLength(10)
                .setMinLength(2)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            )
          )
          .toJSON(),
      });
    } else if (interaction.type === InteractionType.APPLICATION_MODAL_SUBMIT) {
      const values = interaction.data.components.map(
        (x: { components: Array<ModalData> }) => x.components[0].value
      );
      return axios
        .post(process.env.WEBHOOK as string, {
          username: "回答通知",
          embeds: [
            new EmbedBuilder()
              .addFields(
                { name: "学年", value: `${values[0]}回生`, inline: true },
                { name: "組", value: `${values[1]}組`, inline: true },
                { name: "番号", value: `${values[2]}番`, inline: true },
                { name: "名前", value: `${values[3]}`, inline: true },
                {
                  name: "メンション",
                  value: `<@${interaction.member.user.id}>`,
                  inline: true,
                }
              )
              .setAuthor({
                name: `${interaction.member.user.username}#${interaction.member.user.discriminator}(${interaction.member.user.id})`,
                iconURL: interaction.member.user.avatar
                  ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png`
                  : undefined,
              })
              .setColor(3447003),
          ].map((x) => x.toJSON()),
        })
        .then(() => {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "回答を送信しました。\nロール付与までしばらくお待ちください。",
              flags: 1 << 6,
            },
          });
        })
        .catch(() => {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content:
                "回答を送信できませんでした。\nしばらく時間をおいてもう一度お試しください。",
              flags: 1 << 6,
            },
          });
        });
    }
  }
);

app.listen(9999);
