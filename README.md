# 🇨🇳 中国国务院政策检索 Skill

> CherryStudio 技能包 — 直接对接 gov.cn 官方接口，实时检索国务院政策文件

本 Skill 将 [China-Central-Policy-MCP](https://github.com/guangxiangdebizi/China-Central-Policy-MCP) 的核心能力封装为 CherryStudio 可直接使用的技能。**零外部依赖**，开箱即用。

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔍 **关键词搜索** | 按关键词、日期范围检索国务院政策文件 |
| 📋 **最新政策** | 获取国务院最新发布的政策列表 |
| 📄 **政策全文** | 从政策详情页 URL 获取完整的结构化正文 |
| 🎯 **精确筛选** | 支持发文字号、发文机关、日期范围等多维度过滤 |
| ⚡ **零依赖** | 使用 Node.js 内置 fetch API，无需安装任何第三方包 |

## 📦 安装方法

### 方式一：CherryStudio 安装

1. 将 `cn-policy-search` 文件夹复制到 CherryStudio 的 `Data/Skills/` 目录
2. 在 CherryStudio 中注册该 Skill 即可启用

### 方式二：手动调用

```bash
node scripts/policy_search.js search --keyword "人工智能" --limit 5
```

## 🚀 快速使用

### 搜索政策

```bash
node scripts/policy_search.js search --keyword "新能源汽车" --startdate 2026-01-01 --limit 10
```

### 获取最新政策

```bash
node scripts/policy_search.js latest --limit 5
```

### 获取政策全文

```bash
node scripts/policy_search.js fulltext --url "https://www.gov.cn/zhengce/..."
```

## 📁 文件结构

```
cn-policy-search/
├── SKILL.md                  # Skill 定义与触发条件
├── README.md                 # 本文件
├── LICENSE                   # Apache-2.0 开源协议
└── scripts/
    └── policy_search.js      # 核心检索脚本（零依赖）
```

## 🔗 数据来源

- **搜索 API**：[sousuo.www.gov.cn](https://sousuo.www.gov.cn) 官方检索接口
- **最新政策**：[www.gov.cn/zhengce/zuixin/](https://www.gov.cn/zhengce/zuixin/)
- **政策全文**：gov.cn 政策详情页

## ⚠️ 免责声明

- 本工具仅供学习、教学与学术研究使用
- 数据来源为 gov.cn 公开接口，请合理控制请求频率
- 不得用于任何违法、侵权或不道德的用途

## 📄 许可证

[Apache-2.0](LICENSE)

## 🙏 致谢

基于 [guangxiangdebizi/China-Central-Policy-MCP](https://github.com/guangxiangdebizi/China-Central-Policy-MCP) 的核心逻辑重新封装为 CherryStudio Skill 格式。
