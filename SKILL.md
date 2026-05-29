---
name: cn-policy-search
description: 国务院政策检索 - 直接调用gov.cn官方接口，搜索国务院政策文件、获取政策全文。支持关键词搜索、日期筛选、最新政策列表查看。
trigger: 当用户提到"查政策"、"搜政策"、"政策文件"、"国务院政策"、"政府文件"、"政策检索"、"中央政策"、"政策查询"、"找政策"、"政策搜索"等关键词时，自动触发此技能。
---

# 🇨🇳 国务院政策检索技能

> 直接对接 gov.cn 官方接口，实时检索国务院政策文件，获取结构化政策数据。

## 功能概述

本技能提供 **三大核心功能**，覆盖政策检索的完整场景：

| 功能 | 说明 |
|------|------|
| 🔍 **关键词搜索** | 按关键词、日期范围检索国务院政策文件 |
| 📋 **最新政策** | 获取国务院最新发布的政策列表 |
| 📄 **政策全文** | 从政策详情页URL获取完整的结构化正文 |

## 前置条件

**无需任何配置！** 脚本使用 Node.js 内置 fetch API，零外部依赖，开箱即用。

脚本路径：`scripts/policy_search.js`

## 使用方法

### 🔍 搜索政策（推荐）

按关键词搜索，支持日期范围过滤：

```bash
node scripts/policy_search.js search --keyword "人工智能" --startdate 2025-01-01 --enddate 2025-12-31 --limit 10
```

**参数说明：**

| 参数 | 必填 | 说明 |
|------|------|------|
| `--keyword` | 可选 | 搜索关键词（标题/正文/摘要范围） |
| `--startdate` | 可选 | 开始日期，格式 `YYYY-MM-DD` |
| `--enddate` | 可选 | 结束日期，格式 `YYYY-MM-DD` |
| `--limit` | 可选 | 返回条数上限，默认 20，最大 100 |
| `--pretty` | 可选 | 美化JSON输出（默认启用） |
| `--json` | 可选 | 输出纯JSON（无额外文字） |

**返回字段：**

| 字段 | 说明 |
|------|------|
| `policy_id` | 政策唯一标识（URL） |
| `title` | 政策标题 |
| `date` | 发布日期 |
| `url` | 政策详情页链接 |
| `summary` | 政策摘要 |
| `issuing_agency` | 发文机关 |
| `document_number` | 发文字号 |
| `file_type` | 文件类型 |
| `catalog` | 来源分类 |

### 📋 获取最新政策

获取国务院最新发布的政策列表：

```bash
# 获取最近20条最新政策
node scripts/policy_search.js latest --limit 20

# 按日期范围筛选
node scripts/policy_search.js latest --startdate 2026-01-01 --enddate 2026-05-29 --limit 30
```

### 📄 获取政策全文

从政策详情页URL获取完整的结构化正文：

```bash
node scripts/policy_search.js fulltext --url "https://www.gov.cn/zhengce/zhengceku/202507/content_7031216.htm"
```

**返回字段：**

| 字段 | 说明 |
|------|------|
| `policy_id` | 政策URL |
| `title` | 政策标题 |
| `date` | 发布日期 |
| `doc_no` | 发文字号（如 国发〔2023〕X号） |
| `issuer` | 发文机关 |
| `url` | 政策链接 |
| `body` | 政策正文 |

## 使用示例

### 示例1：搜索人工智能相关政策

```json
{
  "count": 10,
  "items": [
    {
      "policy_id": "https://www.gov.cn/zhengce/...",
      "title": "国务院关于印发新一代人工智能发展规划的通知",
      "date": "2024-12-15",
      "url": "https://www.gov.cn/zhengce/...",
      "summary": "为贯彻落实……",
      "issuing_agency": "国务院",
      "document_number": "国发〔2024〕XX号"
    }
  ]
}
```

### 示例2：获取最新几条政策

```bash
node scripts/policy_search.js latest --limit 5
```

### 示例3：搜索特定领域+日期范围

```bash
node scripts/policy_search.js search --keyword "新能源汽车" --startdate 2026-01-01 --limit 15
```

## 数据来源

- **搜索API**：`sousuo.www.gov.cn` 官方检索接口
- **最新政策**：`www.gov.cn/zhengce/zuixin/` 国务院最新政策页面
- **政策全文**：gov.cn 政策详情页

## 注意事项

- ⚠️ 本工具仅供学习、教学与学术研究使用
- ⚠️ 请合理控制请求频率，避免对政府网站造成不当负载
- ⚠️ 搜索接口每次最多返回100条，仅请求第一页
- ⚠️ 返回数据中的日期格式已统一为 `YYYY-MM-DD`
