# term-nba
terminal-nba 在终端看NBA文字直播

## 使用方法

```bash
npx term-nba
```

### options
目前仅支持一个选项：`npx term-nba -t 10`, `-t`，表示控制请求文字直播接口的频率，单位为：秒，最小值为`5`，则限制请求最快`5s`请求一次，避免被封。

```bash
$ npx term-nba -t 5 // 5s 请求一次
$ npx term-nba // 默认 10s 请求一次
```

## 直播来源
目前文字直播来源主要是虎扑，后续看情况添加直播吧或腾讯

- [x] 虎扑
- [ ] 直播吧
- [ ] 腾讯
