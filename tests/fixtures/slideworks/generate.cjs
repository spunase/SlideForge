const fs = require('fs');
const path = require('path');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ri = (n, x) => Math.floor(Math.random() * (x - n + 1)) + n;

const themes = ['dark', 'light', 'offwhite'];
const bc = ['blue', 'navy', 'cyan', 'light-blue', 'gray', 'black', 'green'];
const hc = ['blue', 'navy', 'cyan', 'black'];
const met = ['Revenue', 'EBITDA', 'Net Income', 'Free Cash Flow', 'Gross Margin', 'Market Share', 'Customer Retention', 'Operating Margin'];
const yrs = ['2020', '2021', '2022', '2023', '2024', '2025E', '2026E'];
const qts = ['Q1', 'Q2', 'Q3', 'Q4'];
const regs = ['North America', 'EMEA', 'APAC', 'LATAM', 'Global'];
const dpts = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Legal', 'Product'];
const sc = ['green', 'yellow', 'red', 'green', 'gray'];

let sl = [];
let sn = 0;

function s(cls, content) {
  sn++;
  return `<section class="${cls}">\n${content}\n</section>`;
}

function ft() {
  return `<div class="slide-footer"><span>Confidential &mdash; SlideWorks Consulting</span><span>Slide ${sn}</span></div>`;
}

function hb() {
  return '<div class="header-bar"></div>';
}

// ─── 1-6: Title/Cover slides ───
sl.push(s('dark', `${hb()}<div class="section-divider"><div class="section-divider-content"><h2>Business Case Template</h2><p>Strategic Planning &amp; Analysis Framework</p><p class="mt-20 opacity-40 text-sm">Prepared by SlideWorks Consulting &mdash; March 2026</p></div></div><div class="section-num">SW</div>${ft()}`));
sl.push(s('light', `${hb()}<div style="margin-top:200px;text-align:center"><div class="slide-title" style="font-size:48px">Market Entry Assessment</div><p style="font-size:18px;opacity:0.5;margin-top:16px">Comprehensive Analysis &amp; Recommendations</p><p style="font-size:13px;opacity:0.35;margin-top:60px">Vertex Solutions &mdash; Confidential &mdash; v3.2</p></div>${ft()}`));
sl.push(s('dark', `<div class="section-divider"><div class="section-divider-content"><p class="opacity-40" style="font-size:14px;margin-bottom:12px">PROJECT DELIVERABLE</p><h2>Digital Transformation Roadmap</h2><p>Enterprise-wide modernization strategy FY2026&ndash;2028</p></div></div>${ft()}`));
sl.push(s('offwhite', `${hb()}<div style="margin-top:180px;text-align:center"><div class="slide-title" style="font-size:44px">[Title of document]</div><p style="font-size:16px;opacity:0.5;margin-top:16px">[Subtitle or description]</p><div style="margin-top:80px;font-size:12px;opacity:0.4"><p>Author: Strategy Team &mdash; Date: March 2026</p></div></div>${ft()}`));
sl.push(s('light', `${hb()}<div class="section-divider"><div class="section-divider-content"><h2>[Title of document]</h2><p>[Subtitle]</p></div></div><div class="section-num-visible">0</div>${ft()}`));
sl.push(s('dark', `<div class="section-divider"><div class="section-divider-content"><h2>Front pages<br>and content</h2><p>Table of contents and project overview</p></div></div><div class="section-num-visible">0</div>${ft()}`));

// ─── 7-22: Section dividers ───
const sections = [
  ['1', 'Executive summary'], ['2', 'Background and context'], ['3', 'What is the market opportunity?'],
  ['4', 'High-level objectives and vision'], ['5', 'Explore Analytics'], ['6', 'Recommended solution'],
  ['7', 'Implementation roadmap'], ['8', 'Risks and Mitigations'], ['9', 'Governance and monitoring'],
  ['10', 'Returns and cost analysis'], ['11', 'Appendix'], ['01', 'Background and context'],
  ['02', 'Objectives and solution'], ['03', 'Impact and assessment'], ['04', 'Plan'],
  ['1', 'The problem'],
];
for (const [num, title] of sections) {
  sl.push(s(pick(themes), `${hb()}<div class="section-divider"><div class="section-divider-content"><h2>${title}</h2><p>Detailed analysis and strategic recommendations</p></div></div><div class="section-num-visible">${num}</div>${ft()}`));
}

// ─── 23-52: Bullet slides ───
const bulletSets = [
  { t: 'Executive Summary', b: ['Revenue grew 23% YoY reaching $4.2B in FY2025', 'EBITDA margins expanded 340bps to 28.7%', 'Customer acquisition cost reduced by 18%', 'Three acquisitions completed totaling $890M', 'Launched 12 new products across 4 segments', 'Employee satisfaction at 82nd percentile'] },
  { t: 'Key Recommendations', b: ['Accelerate digital transformation by 6 months', 'Invest $150M in AI/ML capabilities', 'Consolidate EU operations into 3 hubs', 'Divest non-core assets below 5% margin', 'Launch premium enterprise tier', 'Establish 40-person innovation lab'] },
  { t: 'Market Overview', b: ['TAM estimated at $47.3B globally', 'Market growing at 12.4% CAGR', 'Top 5 players control 62% share', 'Regulatory tailwinds expected 2026-2027', 'Customer shift toward integrated platforms', 'Emerging markets at 34% of growth'] },
  { t: 'Current Challenges', b: ['Legacy stack limiting scalability', 'Fragmented data across business units', 'Talent gap in AI/ML and cloud roles', 'Rising CAC in mature markets', 'Supply chain vulnerabilities exposed', 'Margin pressure from new entrants'] },
  { t: 'Strategic Priorities', b: ['Achieve $500M in cost synergies by FY2027', 'Double digital revenue contribution to 40%', 'Expand into 3 new geographic markets', 'Improve NPS score from 42 to 65+', 'Reduce time-to-market by 50%', 'Build 5 strategic technology partnerships'] },
];

for (let i = 0; i < 30; i++) {
  const tp = bulletSets[i % bulletSets.length];
  const twoCol = i % 4 === 0;
  let c = `${hb()}<div class="slide-title">${tp.t}${i > 4 ? ' &mdash; View ' + (i + 1) : ''}</div><div class="slide-subtitle">Analysis and key takeaways</div><div class="content-area">`;
  if (twoCol) {
    c += `<div class="cols-2"><div><ul class="bullet-list">${tp.b.slice(0, 3).map(b => `<li>${b}</li>`).join('')}</ul></div><div><ul class="bullet-list check">${tp.b.slice(3).map(b => `<li>${b}</li>`).join('')}</ul></div></div>`;
  } else {
    c += `<ul class="bullet-list">${tp.b.map(b => `<li>${b}</li>`).join('')}</ul>`;
  }
  if (i % 5 === 0) c += '<div class="callout info mt-20"><strong>Key Insight:</strong> Organizations executing all priorities see 3.2x higher returns over a 5-year horizon.</div>';
  c += `</div>${ft()}`;
  sl.push(s(pick(themes), c));
}

// ─── 53-82: Vertical bar chart slides ───
for (let i = 0; i < 30; i++) {
  const nb = ri(5, 10);
  let bars = '';
  for (let j = 0; j < nb; j++) {
    const h = ri(30, 280);
    bars += `<div class="bar ${pick(bc)}" style="height:${h}px"><span class="bar-value">${ri(10, 999)}</span><span class="bar-label">${nb <= 7 ? yrs[j % yrs.length] : 'Cat ' + (j + 1)}</span></div>`;
  }
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(met)} by ${pick(['Region', 'Quarter', 'Year', 'Segment', 'Product Line'])}</div><div class="slide-subtitle">Values in $M unless otherwise stated</div><div class="content-area"><div class="bar-chart tall">${bars}</div></div>${ft()}`));
}

// ─── 83-97: Horizontal bar chart slides ───
for (let i = 0; i < 15; i++) {
  const nr = ri(5, 10);
  const labs = i % 2 === 0 ? dpts : regs.concat(['UK', 'Germany', 'Japan', 'Brazil', 'India']);
  let rows = '';
  for (let j = 0; j < nr; j++) {
    const w = ri(10, 95);
    rows += `<div class="hbar-row"><span class="hbar-label">${labs[j % labs.length]}</span><div class="hbar-track"><div class="hbar-fill ${pick(hc)}" style="width:${w}%"></div></div><span class="text-xs font-semi" style="width:40px">${w}%</span></div>`;
  }
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(['Performance Scores', 'Completion Rates', 'Budget Utilization', 'Satisfaction Index'])} by ${pick(['Department', 'Region', 'Unit'])}</div><div class="slide-subtitle">FY2025 actuals vs targets</div><div class="content-area"><div class="hbar-chart">${rows}</div></div>${ft()}`));
}

// ─── 98-127: Table slides ───
for (let i = 0; i < 30; i++) {
  const nc = ri(4, 7);
  const nr = ri(5, 10);
  const hds = ['Metric', 'Category', 'Region', 'Q1', 'Q2', 'Q3', 'Q4', 'YTD'];
  let tb = '<table class="data-table"><thead><tr>';
  for (let c = 0; c < nc; c++) tb += `<th>${hds[c % hds.length]}</th>`;
  tb += '</tr></thead><tbody>';
  for (let r = 0; r < nr; r++) {
    tb += '<tr>';
    for (let c = 0; c < nc; c++) {
      if (c === 0) tb += `<td>${pick(met)}</td>`;
      else if (c === 1) tb += `<td>${pick(dpts)}</td>`;
      else tb += `<td class="num">${(ri(1, 999) / 10).toFixed(1)}${c > 3 ? '%' : 'M'}</td>`;
    }
    tb += '</tr>';
  }
  tb += '</tbody></table>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(['Financial Summary', 'Quarterly Performance', 'Regional Breakdown', 'Operational Metrics', 'Cost Analysis', 'Revenue by Segment'])}</div><div class="slide-subtitle">Data as of March 2026</div><div class="content-area">${tb}</div>${ft()}`));
}

// ─── 128-139: Process/Flow slides ───
const processSteps = [
  ['Discovery', 'Analysis', 'Design', 'Build', 'Test', 'Deploy'],
  ['Assess', 'Plan', 'Execute', 'Monitor', 'Optimize'],
  ['Ideation', 'Validation', 'Development', 'Launch', 'Scale'],
  ['Intake', 'Triage', 'Investigate', 'Resolve', 'Review'],
];
const stepColors = ['navy', 'blue', 'cyan', 'blue', 'navy', 'cyan'];

for (let i = 0; i < 12; i++) {
  const ps = processSteps[i % processSteps.length];
  let flow = '<div class="process-flow">';
  ps.forEach((step, j) => {
    if (j > 0) flow += '<div class="process-arrow" style="border-left-color:var(--sw-gray-300)"></div>';
    flow += `<div class="process-step ${stepColors[j % stepColors.length]}">${step}</div>`;
  });
  flow += '</div>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(['Implementation Methodology', 'Project Lifecycle', 'Operating Model', 'Service Framework'])}</div><div class="slide-subtitle">End-to-end process with governance checkpoints</div><div class="content-area" style="padding-top:60px">${flow}</div>${ft()}`));
}

// ─── 140-151: Timeline/Gantt slides ───
const tasks = ['Requirements', 'Architecture', 'Backend dev', 'Frontend build', 'Integration test', 'UAT', 'Data migration', 'Training', 'Go-live prep', 'Post-launch', 'Security audit', 'Perf tuning', 'Documentation', 'Review'];

for (let i = 0; i < 12; i++) {
  const nt = ri(6, 12);
  let g = '<div class="gantt">';
  for (let j = 0; j < nt; j++) {
    const left = ri(0, 60);
    const width = ri(10, 35);
    g += `<div class="gantt-row"><span class="gantt-label">${tasks[j % tasks.length]}</span><div class="gantt-track"><div class="gantt-bar ${pick(['blue', 'navy', 'cyan', 'gray', 'green'])}" style="left:${left}%;width:${width}%"></div></div></div>`;
  }
  g += '</div>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">Project Timeline &mdash; Phase ${(i % 3) + 1}</div><div class="slide-subtitle">FY2026 implementation schedule</div><div class="content-area">${g}</div>${ft()}`));
}

// ─── 152-166: KPI/Metric Dashboard slides ───
const kpiLabels = ['Revenue', 'EBITDA', 'Customers', 'NPS', 'CAC', 'LTV', 'Churn Rate', 'ARR', 'MRR', 'ARPU'];
const kpiValues = ['$4.2B', '$1.2B', '2.4M', '62', '$247', '$3.8K', '4.2%', '$890M', '$74M', '$156'];

for (let i = 0; i < 15; i++) {
  const nk = pick([3, 4, 5]);
  let k = `<div class="cols-${nk}">`;
  for (let j = 0; j < nk; j++) {
    const isUp = Math.random() > 0.3;
    k += `<div class="card kpi-box"><div class="kpi-value ${pick(['blue', 'green', 'navy'])}">${kpiValues[(i + j) % kpiValues.length]}</div><div class="kpi-label">${kpiLabels[(i + j) % kpiLabels.length]}</div><div class="kpi-delta ${isUp ? 'up' : 'down'}">${isUp ? '&#9650;' : '&#9660;'} ${ri(1, 30)}% YoY</div></div>`;
  }
  k += '</div>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">KPIs &mdash; ${pick(qts)} ${pick(['2025', '2026'])}</div><div class="slide-subtitle">Tracking against annual targets</div><div class="content-area">${k}</div>${ft()}`));
}

// ─── 167-176: Image Placeholder slides ───
const imgTypes = ['mountain', 'matrix', 'architecture', 'data-viz'];
const imgDescs = ['Alpine facility assessment', 'Cybersecurity infrastructure', 'Sustainable design concepts', 'Analytics dashboard prototype'];

for (let i = 0; i < 10; i++) {
  const tp = imgTypes[i % imgTypes.length];
  const hasText = i % 2 === 0;
  let c;
  if (hasText) {
    c = `<div class="cols-2"><div class="img-placeholder ${tp}" style="min-height:500px">${tp === 'matrix' ? '01001 10110 01101 00111 11010' : ''}</div><div><h3 class="text-xl font-bold mb-20">${imgDescs[i % imgDescs.length]}</h3><ul class="bullet-list"><li>Comprehensive infrastructure assessment</li><li>Integration with existing workflows</li><li>Projected ROI of 340% over 5 years</li><li>Phased rollout minimizing disruption</li></ul></div></div>`;
  } else {
    c = `<div class="img-placeholder ${tp}" style="min-height:700px;border-radius:12px">${tp === 'matrix' ? '01001110 10110010 01101001' : ''}</div>`;
  }
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${imgDescs[i % imgDescs.length]}</div><div class="slide-subtitle">Visual reference and analysis</div><div class="content-area">${c}</div>${ft()}`));
}

// ─── 177-184: Risk Matrix slides ───
for (let i = 0; i < 8; i++) {
  const cellColors = ['g', 'g', 'y', 'o', 'r', 'g', 'y', 'y', 'o', 'r', 'y', 'y', 'o', 'r', 'r', 'o', 'o', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r'];
  let mx = '<div class="risk-matrix">';
  for (let j = 0; j < 25; j++) mx += `<div class="risk-cell ${cellColors[j]}">${pick(['L', 'M', 'H', 'VH', 'C'])}</div>`;
  mx += '</div>';

  let rt = '<table class="data-table"><thead><tr><th>ID</th><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Owner</th></tr></thead><tbody>';
  for (let r = 0; r < 5; r++) {
    rt += `<tr><td>R-${100 + r + i * 5}</td><td>${pick(['Supply chain disruption', 'Regulatory breach', 'Key person departure', 'Platform failure', 'Budget overrun'])}</td><td><span class="status-dot ${pick(sc)}"></span>${pick(['Low', 'Med', 'High'])}</td><td>${pick(['Minor', 'Moderate', 'Major', 'Critical'])}</td><td>${pick(['CRO', 'CFO', 'CHRO', 'CTO', 'COO'])}</td></tr>`;
  }
  rt += '</tbody></table>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">Risk Assessment &mdash; ${pick(['Operational', 'Strategic', 'Financial', 'Technology'])}</div><div class="slide-subtitle">Likelihood &times; Impact scoring</div><div class="content-area"><div class="cols-2-1"><div>${rt}</div><div><p class="font-semi mb-10">Heat Map</p>${mx}</div></div></div>${ft()}`));
}

// ─── 185-190: Org Chart slides ───
for (let i = 0; i < 6; i++) {
  const ceo = pick(['Sarah Chen', 'James Miller', 'Anika Patel', 'Marcus Thompson']);
  const vps = ['VP Engineering', 'VP Sales', 'VP Marketing', 'VP Operations', 'VP Finance'];
  let o = `<div class="org-chart"><div class="org-node ceo">${ceo}<br><span style="font-size:9px;opacity:0.7">CEO</span></div><div class="org-connector"></div><div class="org-row">`;
  for (let j = 0; j < (i % 2 === 0 ? 4 : 5); j++) o += `<div class="org-node vp">${vps[j]}</div>`;
  o += '</div><div class="org-connector"></div><div class="org-row">';
  for (let j = 0; j < 6; j++) o += `<div class="org-node dir">Director ${j + 1}</div>`;
  o += '</div></div>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">Org Structure &mdash; ${pick(['Current State', 'Proposed', 'Target Model'])}</div><div class="slide-subtitle">Leadership and reporting lines</div><div class="content-area">${o}</div>${ft()}`));
}

// ─── 191-196: Waterfall Chart slides ───
for (let i = 0; i < 6; i++) {
  const items = ['Base', 'Price', 'New Cust', 'Churn', 'FX', 'Savings', 'Net'];
  let wf = '<div style="display:flex;align-items:flex-end;height:300px;gap:8px">';
  items.forEach((item, j) => {
    const neg = j === 3 || j === 4;
    const tot = j === 0 || j === items.length - 1;
    const h = tot ? ri(200, 290) : ri(40, 140);
    wf += `<div style="flex:1;height:${h}px;border-radius:4px 4px 0 0;background:var(--sw-${tot ? 'navy' : neg ? 'red' : 'blue'})"></div>`;
  });
  wf += '</div>';
  wf += `<div style="display:flex;gap:8px;margin-top:6px">${items.map(it => `<div style="flex:1;text-align:center;font-size:9px;opacity:0.5">${it}</div>`).join('')}</div>`;
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">Revenue Bridge &mdash; FY${2025 + (i % 3)}</div><div class="slide-subtitle">Key revenue drivers ($M)</div><div class="content-area">${wf}</div>${ft()}`));
}

// ─── 197-206: Comparison/Feature Matrix slides ───
for (let i = 0; i < 10; i++) {
  const feats = ['Cloud hosting', 'API access', 'Custom branding', '24/7 support', 'SSO integration', 'Data export', 'Audit logs', 'Multi-region'];
  let mx = '<table class="data-table"><thead><tr><th>Feature</th><th>Current</th><th>Proposed</th><th>Competitor A</th><th>Competitor B</th></tr></thead><tbody>';
  for (let j = 0; j < 8; j++) {
    const vs = [Math.random() > 0.4, Math.random() > 0.2, Math.random() > 0.5, Math.random() > 0.6];
    mx += `<tr><td>${feats[j]}</td>${vs.map(v => `<td style="text-align:center">${v ? '<span style="color:var(--sw-green);font-weight:700">&check;</span>' : '<span style="color:var(--sw-red);opacity:0.5">&cross;</span>'}</td>`).join('')}</tr>`;
  }
  mx += '</tbody></table>';
  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(['Feature Comparison', 'Competitive Benchmarking', 'Solution Assessment', 'Vendor Evaluation'])}</div><div class="slide-subtitle">Side-by-side evaluation</div><div class="content-area">${mx}</div>${ft()}`));
}

// ─── 207-216: Mixed Layout slides ───
for (let i = 0; i < 10; i++) {
  let bars = '<div class="bar-chart short">';
  for (let j = 0; j < 6; j++) bars += `<div class="bar ${pick(bc)}" style="height:${ri(20, 130)}px"><span class="bar-label">${yrs[j]}</span></div>`;
  bars += '</div>';

  let kpi = '<div class="cols-3">';
  for (let j = 0; j < 3; j++) kpi += `<div class="card kpi-box"><div class="kpi-value blue">${pick(['$2.1B', '847K', '18.4%', '$412M', '3.7x'])}</div><div class="kpi-label">${pick(['Revenue', 'Users', 'Growth', 'Profit', 'ROI'])}</div></div>`;
  kpi += '</div>';

  sl.push(s(pick(themes), `${hb()}<div class="slide-title">${pick(['Integrated View', 'Dashboard Summary', 'Strategic Scorecard', 'Operating Review'])}</div><div class="slide-subtitle">Combined metrics and trends</div><div class="content-area"><div class="cols-2"><div>${bars}<div class="callout info mt-20"><strong>Trend:</strong> ${pick(['Accelerating growth from enterprise segment', 'Margin expansion from efficiency gains', 'Base diversification reducing concentration risk'])}</div></div><div>${kpi}<ul class="bullet-list mt-20"><li>Performance exceeded targets in ${ri(3, 6)} of 8 categories</li><li>Pipeline coverage at ${ri(2, 5)}.2x &mdash; above threshold</li></ul></div></div></div>${ft()}`));
}

// ─── Build HTML ───
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SlideWorks &mdash; ${sl.length}-Slide Consulting Deck Stress Test</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
${sl.join('\n\n')}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log(`Generated ${sl.length} slides, ${Math.round(html.length / 1024)}KB`);
