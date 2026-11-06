# dsh-codex-pet

中文 · [English](README.en.md)

为 DSH Web UI 和 Desktop 渲染 Codex 桌宠图集。支持拖拽、活动姿势、进度气泡、导入宠物及读取本机 Codex 宠物；可选定期总结和完成/错误/中断提示音。

本仓库是 [Signalight/codex-to-dsh-pet](https://github.com/Signalight/codex-to-dsh-pet) 的 fork。以下安装的是本 fork；运行时位于 `packages/dsh-codex-pet`，根目录另有可选的每宠插件导出工具。

## 安装

需要已安装 DSH、Node.js，以及 DSH 插件安装所需的 pnpm。从本 fork 获取代码：

```sh
git clone https://github.com/iBobbyTS/dsh-codex-pet.git
cd dsh-codex-pet
dsh plugin --profile web add "$PWD/packages/dsh-codex-pet"
```

运行时直接使用源码和内置素材，无需运行根目录 `build.js`。Desktop 请在应用插件管理器中选择 `packages/dsh-codex-pet` 目录；`desktop` profile 由应用管理。Windows cmd 使用完整目录路径，不使用 `$PWD`。

安装后重启 DSH Host 并刷新页面，在「设置 → 桌宠」选择或导入宠物。更新时更新本 checkout，并在同一 profile 重新添加同一目录；不要混装上游版本或每宠导出插件。

## 使用

- 「显示模型工作」统一控制思考提示、流式文本和运行工具气泡。
- Codex 宠物默认从 `~/.codex/pets` 读取，可用 `CODEX_HOME` 指定位置，也可在设置中关闭。
- 定期总结默认关闭；启用后会将有限的会话片段发送给所选模型，并产生模型用量。
- 「还原位置」修正位置；「还原全部设定」保留宠物选择、导入文件和自定义音频。

## 文档

- [运行时设置、兼容与 API](docs/runtime.md)
- [可选每宠导出工具](docs/exporter.md)
- [开发约定](AGENTS.md) · [历史记录](docs/CHANGELOG.md)
- [素材版权与许可](LEGAL.md) · [MIT 代码许可](LICENSE)

内置示例角色图集按 CC BY-NC 4.0 授权，声音素材与代码按 MIT 授权；用户导入素材需自行具备使用权。详见 LEGAL。
