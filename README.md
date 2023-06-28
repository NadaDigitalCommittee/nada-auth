# nada-auth
デジタル委員会の認証システム

# 動作フロー
## ベース
1. 誰かがボタンを押す
2. そのユーザーが確認済みロールを保持しているかを確認し、(分岐A、分岐B)へ飛ぶ

## 分岐A
1. 保持しているため、`既に認証済みである`旨を返信し終了。

## 分岐B
1. 認証を開始するため、ユーザーの情報を収集するフォームを返信する。
2. フォームが返信されるまで待機する。
3. フォームの内容を承認、否認ボタンと共に管理者にしか見えないチャンネルに送信する。
4. 管理者がどちらかを押すまで待機し、結果によって(分岐C, 分岐D)へ飛ぶ

## 分岐C
1. 承認するために、ユーザーのidをEmbedの`footer.text`フィールドから切り取る
2. ユーザーとしてapiから取得する。失敗した場合は`失敗した`旨を返信し終了。
3. ユーザーのロール一覧に確認済みロール月存在するか否かで(分岐E, 分岐F)へ飛ぶ

## 分岐D
1. フォーム通知のメッセージからボタンを消し、否認したことを明示し終了。

## 分岐E
1. ロールを付与する。
2. フォーム通知のメッセージからボタンを消し、承認したことを明示し終了。

## 分岐F
1. ロールがなぜか既に存在するため、既に付与されていることを明示し終了。
