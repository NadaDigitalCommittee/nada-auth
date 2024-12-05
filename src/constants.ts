import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";
import { APIUser, ButtonStyle, TextInputStyle } from "discord-api-types/v10";
import { config } from "dotenv";

config();
const { SERVER_ID, ROLE_SELECTION_CHANNEL_ID } = process.env as Record<string, string>;
export const formatString = (template: string, ...args: any[]) =>
  template.replace(/{(\d+)}/g, (match, i) => (i < args.length ? args[i] : match));

export class ValidationError {
  static readonly FAILED_TO_INTERPRET_INTERACTION =
    "インタラクションを正しく解釈できませんでした。";
  static readonly ERROR_DUE_TO_MISSING = "理由: `{0}` が存在しません。";
}

export class ServerRulePostCommand {
  static readonly COMMAND_NAME = "post";
  static readonly DESCRIPTION = "サーバールールをチャンネルに送信します。";
  static readonly POSTED = "サーバールールを送信しました。";
  static readonly NO_PERMISSION = "あなたにはこのコマンドの実行権限がありません。";
  static readonly components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        // prettier-ignore
        new ButtonBuilder()
          .setCustomId("answer")
          .setLabel("回答する")
          .setStyle(ButtonStyle.Primary)
      )
      .toJSON(),
  ];
  static readonly SERVER_RULE = `サーバーでの禁止行為

- 過度な連投行為（10 秒の間に 5 回以上送信する）をしたとき、10 分間メッセージを送れません。（一時ミュート）
- 3 回の警告を受けるとメッセージを送れません。（ミュート）

- ミュートは管理者による注意のあと解除されます。

このサーバーは以下の人が利用します。

- デジタル委員
- Adobe ライセンス利用希望者
- Adobe ライセンス利用者
- デジタル委員会を利用する生徒会員
- 放送委員
- 顧問及びその他教職員

このサーバーの使い方

1. 灘生であることを確認するため下のボタンからフォームに回答してください（確認が取れ次第、管理者が確認済みロールを付与します）
2. https://discord.com/channels/${SERVER_ID}/${ROLE_SELECTION_CHANNEL_ID} の説明を読んで必要なものを選択してください。`;
}

export class VerificationProcess {
  static readonly approveOrReject = {
    approve: "approve",
    reject: "reject",
  };
  static readonly YOU_ARE_ALREADY_VERIFIED =
    "あなたは既に確認が取れているため、フォームに回答する必要はありません。";
  static readonly USER_IS_ALREADY_VERIFIED =
    "このユーザーは既に確認が取れているため、承認/否認を行う必要はありません。";
  static readonly ROLE_ASSIGNED = "確認済みロールが付与されました。";
  static readonly ROLE_NOT_ASSIGNED = "確認済みロールは付与されませんでした。";
  static readonly ERROR_WHILE_ASSIGNING_ROLE = "ロールの付与中にエラーが発生しました。";
  static readonly ERROR_WHILE_RETRIEVING_ROLE = "ロールの取得中にエラーが発生しました。";
  static readonly FORM_SUBMITTED = "回答を送信しました。\nロール付与までしばらくお待ちください。";
  static readonly FAILED_TO_SUBMIT_FORM =
    "回答を送信できませんでした。\nしばらく時間をおいてもう一度お試しください。";
  static readonly modal = new ModalBuilder()
    .setCustomId("modal")
    .setTitle("フォームに回答してください")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setLabel("回生")
          .setCustomId("generation")
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
          .setMinLength(2)
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
      )
    )
    .toJSON();
  static readonly approvalButtons = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(this.approveOrReject.approve)
          .setLabel("承認")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(this.approveOrReject.reject)
          .setLabel("否認")
          .setStyle(ButtonStyle.Danger)
      )
      .toJSON(),
  ];
  static modalSubmissionInfo(values: string[], user: APIUser) {
    return [
      new EmbedBuilder()
        .addFields(
          ...[
            { name: "回生", value: `${values[0]}回生` },
            { name: "組", value: `${values[1]}組` },
            { name: "番号", value: `${values[2]}番` },
            { name: "名前", value: `${values[3]}` },
            {
              name: "メンション",
              value: `<@${user.id}>`,
            },
          ].map((field) => ({ ...field, inline: true }))
        )
        .setAuthor({
          name: `${user.username}(${user.id})`,
          iconURL: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : undefined,
        })
        .setColor(0x3498db) // blue
        .setFooter({ text: user.id }),
    ];
  }
}
