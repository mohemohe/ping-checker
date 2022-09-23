# ping-checker

[![](https://i.imgur.com/ZQ4A3l1.png)](https://i.imgur.com/ZQ4A3l1.png)

## require

- NodeJS 16.x or later
- MongoDB 5.0 or later

## 構成

### checker

pingの結果をひたすらMongoDBに放り込む

### server

MongoDBの結果を集計して返すAPI 兼 clientの静的ファイルをホストする

### client

いい感じに描画する

## あれこれ

### 使い方は？

`cp private.env .env` して適当に `.env` を書き換えてから、それぞれを起動する  
1回線だけしか使ってないなら、シングルインスタンスで全部起動すればOK  
serverを起動するインスタンスでは `yarn` した後に `yarn build:assets` してclientのビルドをしないと何も表示されないぞ！

複数回線の場合は `NETWORK_TYPE` が事実上タグのような挙動なので、変えればそれぞれの回線で集計できる  
物理的に別のネットワークを組むか、ネットワークのゲートウェイを変えるのを忘れないように

### 環境変数の説明はどこ

`sample.env` のコメント見ろよ見ろよ

### Docker無いん？

どうせProxmox VEのVMで動かすから、めんどくさくて作ってない  
[PM2](https://pm2.keymetrics.io/)とかで適当にdaemonizeするかcontributeしておくれ

### IPv4とIPv6を同時に測定したい

NUROでIPv6を使う、正気？（2プロセス起動すればいいんじゃねーの）

### 結局NUROはクソ回線？

パケットロスが0.1%を超えるからクソ回線で確定だけど、巷で言われてるような100Mbpsも出ないなんてことはねーよ

[![](https://www.speedtest.net/result/13708425615.png)](https://www.speedtest.net/result/13708425615.png)
