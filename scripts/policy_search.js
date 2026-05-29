#!/usr/bin/env node

/**
 * 中国国务院政策检索工具
 * 直接调用 gov.cn 官方 API，零外部依赖
 *
 * 用法:
 *   node policy_search.js search --keyword "人工智能" --startdate 2025-01-01 --enddate 2025-12-31 --limit 10
 *   node policy_search.js fulltext --url "https://www.gov.cn/zhengce/..."
 *   node policy_search.js latest --limit 20
 */

const BASE_URL = 'https://sousuo.www.gov.cn/search-gov/data';
const GOV_LATEST_URL = 'https://www.gov.cn/zhengce/zuixin/';

// ========== 搜索政策 ==========
async function searchPolicies({ keyword, startdate, enddate, limit = 20 }) {
  const params = new URLSearchParams({
    t: 'zhengcelibrary_gw_bm_gb',
    q: keyword || '',
    searchfield: 'title:content:summary',
    sort: 'score',
    sortType: '1',
    p: '1',
    n: '100',
    timetype: 'timezd'
  });
  if (startdate) params.append('mintime', startdate);
  if (enddate) params.append('maxtime', enddate);

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    }
  });

  const data = await response.json();
  const items = [];

  // 解析 catMap 结构（官方最新格式）
  const catMap = data?.catMap || data?.searchVO?.catMap || data?.data?.catMap;
  if (catMap && typeof catMap === 'object') {
    for (const [, cat] of Object.entries(catMap)) {
      if (cat && Array.isArray(cat.listVO)) {
        for (const result of cat.listVO) {
          if (items.length >= limit) break;
          const url2 = normalizeUrl(result.url || result.link || '');
          const title = cleanHtml((result.title || '').toString());
          const date = formatDate(result.ptime || result.pubtime || result.pubtimeStr || result.publishtime || result.time || '');
          items.push({
            policy_id: url2,
            title,
            date,
            source: 'gov_cn_search_api',
            url: url2,
            summary: cleanHtml(result.summary || result.content || ''),
            issuing_agency: result.puborg || result.source || '国务院',
            document_number: result.pcode || result.pubnum || '',
            file_type: result.filetype || result.wjlx || 'html',
            catalog: cat.catName || undefined
          });
        }
      }
      if (items.length >= limit) break;
    }
  }

  // 兼容旧格式 results
  if (items.length === 0 && data && Array.isArray(data.results)) {
    for (const result of data.results) {
      if (items.length >= limit) break;
      const url2 = normalizeUrl(result.url || result.link || '');
      const title = cleanHtml(result.title || '');
      items.push({
        policy_id: url2,
        title,
        date: formatDate(result.pubtime || result.publishtime || result.time || ''),
        source: 'gov_cn_search_api',
        url: url2,
        summary: cleanHtml(result.summary || result.content || ''),
        issuing_agency: result.puborg || result.source || '国务院',
        document_number: result.pubnum || '',
        file_type: result.filetype || 'html'
      });
    }
  }

  return { count: items.length, items };
}

// ========== 获取最新政策列表 ==========
// 通过不传关键词调用搜索API来获取最新政策，比解析HTML更可靠
async function getLatestPolicies({ limit = 20, startdate, enddate } = {}) {
  return await searchPolicies({ keyword: '', startdate, enddate, limit });
}

// ========== 获取政策全文 ==========
async function getPolicyFulltext({ url }) {
  if (!url) throw new Error('url is required');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();

  // 提取标题
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? cleanHtml(titleMatch[1]) : '';

  // 提取日期
  let date = '';
  const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
  if (timeMatch) date = timeMatch[1].substring(0, 10);
  if (!date) date = extractDateFromText(html);

  // 提取发文字号
  let docNo = '';
  const docPatterns = [
    /([\u4e00-\u9fa5]{2,4})\s*发\s*〔\s*(20\d{2})\s*〕\s*(\d+)\s*号/,
    /(银发|财税|教发|国办发|国发)\s*〔\s*(20\d{2})\s*〕\s*(\d+)\s*号?/
  ];
  for (const p of docPatterns) {
    const m = html.match(p);
    if (m) { docNo = `${m[1]}〔${m[2]}〕${m[3]}号`; break; }
  }

  // 提取发文机关
  let issuer = '';
  const issPatterns = [/国务院/, /全国人民代表大会/, /中国人民银行/, /国家发展和改革委员会/, /财政部/];
  for (const p of issPatterns) {
    const m = html.match(p);
    if (m) { issuer = m[0]; break; }
  }

  // 提取正文
  let body = '';
  const bodySelectors = ['article', '.content', '.article', '.text', '#UCAP-CONTENT'];
  for (const sel of bodySelectors) {
    const regex = new RegExp(`<${sel}[^>]*>([\\s\\S]*?)<\\/${sel}>`, 'i');
    const m = html.match(regex);
    if (m) { body = cleanHtml(m[1]); break; }
  }
  if (!body) body = cleanHtml(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, ''));

  return {
    policy_id: url,
    title,
    date: date.substring(0, 10),
    doc_no: docNo,
    issuer,
    url,
    body: body.substring(0, 10000) // 限制正文长度
  };
}

// ========== 辅助函数 ==========
function cleanHtml(text) {
  return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://www.gov.cn' + url;
  if (!/^https?:\/\//i.test(url)) return 'https://www.gov.cn/' + url;
  return url;
}

function formatDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateVal === 'string') {
    return extractDateFromText(dateVal);
  }
  return String(dateVal);
}

function extractDateFromText(text) {
  const patterns = [
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /(\d{4})\.(\d{1,2})\.(\d{1,2})/
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const [_, y, mo, d] = m;
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return '';
}

function parseGovCnListHtml(html) {
  const items = [];
  // 提取li中的链接和日期
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const liContent = liMatch[1];
    const aMatch = liContent.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!aMatch) continue;
    const url = normalizeUrl(aMatch[1]);
    const title = cleanHtml(aMatch[2]);
    if (!title || title.length < 3) continue;
    const date = extractDateFromText(liContent);
    items.push({ policy_id: url, title, date, source: 'gov_cn_latest', url });
  }
  return items;
}

// ========== CLI 入口 ==========
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
中国国务院政策检索工具

用法:
  node policy_search.js search [选项]         关键词搜索政策
  node policy_search.js fulltext --url <URL>   获取政策全文
  node policy_search.js latest [选项]          获取最新政策列表

选项:
  --keyword <词>      搜索关键词
  --startdate <日期>   开始日期 (YYYY-MM-DD)
  --enddate <日期>     结束日期 (YYYY-MM-DD)
  --limit <数量>       返回条数上限 (默认20, 最大100)
  --url <链接>         政策页面URL (用于 fulltext)
  --json              输出纯JSON（无额外文字）
  --pretty            美化JSON输出
    `);
    return;
  }

  const parsed = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
      if (val !== true) i++;
    }
  }

  let result;
  switch (command) {
    case 'search':
      result = await searchPolicies({
        keyword: parsed.keyword,
        startdate: parsed.startdate,
        enddate: parsed.enddate,
        limit: parseInt(parsed.limit) || 20
      });
      break;
    case 'latest':
      result = await getLatestPolicies({
        limit: parseInt(parsed.limit) || 20,
        startdate: parsed.startdate,
        enddate: parsed.enddate
      });
      break;
    case 'fulltext':
      result = await getPolicyFulltext({ url: parsed.url });
      break;
    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }

  if (parsed.json) {
    console.log(JSON.stringify(result));
  } else if (parsed.pretty || !parsed.json) {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
