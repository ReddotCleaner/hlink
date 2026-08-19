<p align="center">
  <a href="https://hlink.likun.me" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://hlink.likun.me/logo.svg" alt="hlink logo">
  </a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/hlink"><img src="https://img.shields.io/npm/v/hlink.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/hlink.svg" alt="node compatibility"></a>
  <a href="https://npmjs.com/package/hlink"><img src="https://img.shields.io/npm/dm/hlink.svg" alt="downloads"></a>
  <a href="https://github.com/likun7981/hlink/actions/workflows/publish.yml"><img src="https://github.com/likun7981/hlink/actions/workflows/publish.yml/badge.svg" alt="license"></a>
  <a href="https://github.com/likun7981/hlink/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/hlink.svg" alt="license"></a>
</p>

# hlink

> 批量、快速硬链工具(The batch, fast hard link toolkit)

- 💡 重复检测：支持文件名变更的重复检测
- ⚡️ 快速：`20000+`文件只需要 1 分钟
- 📦 多平台：支持 Windows、Mac、Linux
- 🛠️ 丰富的配置：支持黑白名单，缓存等多个配置
- 🔩 修剪机制：让你更方便的同步源文件和硬链
- 🌐 WebUI：图形化界面让你更方便的管理
- 🐳 Docker：无需关心环境问题

更多介绍：https://hlink.likun.me

## 最近更新 (2.0.11)

### 🐛 问题修复

- **超大文件量任务崩溃**：单个分析任务返回 ~20 万+ 文件时，`parseResults.push(...arr)` 因参数过多触发 `RangeError: Maximum call stack size exceeded`，改为循环逐个 push 彻底解决（[#141](https://github.com/likun7981/hlink/issues/141)）
- **单文件权限失败中断整任务**：遇到 `EACCES` 等权限错误时，现在会记入失败列表并跳过该文件，不再让一个文件拖死整个任务
- **WebUI 进度看不到文件名**：非 TTY（WebUI）场景下进度条现在会显示当前正在处理的文件
- **重跑大库卡顿**：分析阶段 `dstInodes`/`cached` 改用 `Set` 查找，消除原有 O(n²) 卡顿
- **浏览器卡顿**：运行日志改用滚动窗口（500 条）+ 即时滚动，条数再多也不会卡

### ✨ 新功能

- **任务执行状态**：任务列表新增"执行中"徽章（5 秒轮询 `/api/task/running`），关闭页面重开后仍能看到运行状态，点击可重新接入实时进度
- **状态同步到 Docker 日志**：任务进度与状态现在会输出到 `docker logs`，关闭浏览器也能查看；并新增 `开始/完成/失败` 任务级边界标记
- **镜像从源码构建**：Dockerfile 改为多阶段从本地源码构建，不再 `npm i -g hlink` 拉取发布包

## 使用 docker run

```bash
docker run -d --name hlink \
-e PUID=$YOUR_USER_ID \
-e PGID=$YOUR_GROUP_ID \
-e UMASK=$YOUR_UMASK \
-e HLINK_HOME=$YOUR_HLINK_HOME_DIR \
-p 9090:9090 \
-v $YOUR_NAS_VOLUME_PATH:$DOCKER_VOLUME_PATH \
likun7981/hlink:latest
```

## 使用 docker compose

```yml
version: '2'

services:
  docker:
    image: likun7981/hlink:latest # docker镜像名称
    restart: on-failure
    ports: # 这个端口映射
      - 9090:9090
    volumes: # 这个表示存储空间映射
      - $YOUR_NAS_VOLUME_PATH:$DOCKER_VOLUME_PATH
    environment:
      - PUID=$YOUR_USER_ID
      - PGID=$YOUR_GROUP_ID
      - UMASK=$YOUR_UMASK
      - HLINK_HOME=$YOUR_HLINK_HOME_DIR # 这个是环境变量
```

`$YOUR_USER_ID`、`$YOUR_GROUP_ID`、`$YOUR_UMASK`、`$YOUR_HLINK_HOME_DIR`、`$YOUR_NAS_VOLUME_PATH`、`$DOCKER_VOLUME_PATH`为变量，根据自己的情况自行设置

## WebUI 截图

<img src="https://user-images.githubusercontent.com/13427467/177048631-04dc6ace-af3a-4459-8848-13cc3c928856.png" width="520"/>

## 效果截图

<img src="https://user-images.githubusercontent.com/13427467/148171766-ccbe2a1a-c30c-4e1a-868c-4e2c69617d29.png" width="520"/>

# License

[MIT](https://github.com/likun7981/hlink/blob/master/LICENSE)
