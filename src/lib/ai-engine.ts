import type {
  Note,
  Project,
  NoteAnalysis,
  SimilarNote,
  CategorizeSuggestion,
  AskResponse,
  DocGenOptions,
  NoteType,
  AISuggestion,
} from '@/types';

// ============================ 工具函数 ============================

const STOP_WORDS = new Set([
  '的', '了', '是', '在', '和', '与', '或', '也', '都', '但', '而', '则', '为', '以', '于',
  '对', '由', '从', '到', '上', '下', '中', '后', '前', '内', '外', '等', '们', '这', '那',
  '一', '二', '三', '个', '些', '所', '被', '把', '将', '已', '正', '将', '会', '可', '能',
  '应', '需', '要', '有', '无', '不', '未', '已', '再', '又', '还', '只', '即', '便', '就',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'in', 'on', 'at',
  'and', 'or', 'but', 'not', 'no', 'yes', 'for', 'with', 'as', 'by', 'this', 'that', 'it',
  'i', 'we', 'you', 'they', 'he', 'she', 'my', 'our', 'your', 'their',
]);

// 分词：中文按字 + 英文按词
function tokenize(text: string): string[] {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ');
  const tokens: string[] = [];

  // 提取英文词
  const englishWords = cleaned.match(/[a-z]{2,}/g) || [];
  for (const w of englishWords) {
    if (!STOP_WORDS.has(w) && w.length >= 2) tokens.push(w);
  }

  // 提取中文 2-4 字组合（简化分词）
  const chinese = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
  for (const seg of chinese) {
    // 2-字滑窗
    for (let i = 0; i < seg.length - 1; i++) {
      const t = seg.substring(i, i + 2);
      if (!STOP_WORDS.has(t)) tokens.push(t);
    }
    // 单字过滤（仅保留高频有意义字）
    if (seg.length <= 3) tokens.push(seg);
  }

  return tokens;
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // 归一化
  const total = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / total);
  return tf;
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of a) {
    normA += v * v;
    const bv = b.get(k);
    if (bv) dot += v * bv;
  }
  for (const [, v] of b) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 简易"项目特征词"字典：根据项目名称/描述与历史笔记推断
function projectSignature(project: Project, notes: Note[]): Set<string> {
  const sig = new Set<string>();
  // 项目名分词
  tokenize(project.name).forEach((t) => sig.add(t));
  tokenize(project.description).forEach((t) => sig.add(t));
  // 该项目历史笔记的高频词
  const projNotes = notes.filter((n) => n.projectId === project.id);
  const wordFreq = new Map<string, number>();
  for (const n of projNotes) {
    for (const t of tokenize(n.plainText)) {
      wordFreq.set(t, (wordFreq.get(t) || 0) + 1);
    }
  }
  // 取频率前 20
  const top = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  top.forEach(([t]) => sig.add(t));
  return sig;
}

// 关键词提取：基于 TF 与位置加权（标题权重更高）
function extractKeywords(title: string, body: string, max = 6): string[] {
  const titleTokens = tokenize(title);
  const bodyTokens = tokenize(body);
  const score = new Map<string, number>();
  // 标题加权 ×3
  for (const t of titleTokens) score.set(t, (score.get(t) || 0) + 3);
  for (const t of bodyTokens) score.set(t, (score.get(t) || 0) + 1);
  // 去除过短
  return [...score.entries()]
    .filter(([t]) => t.length >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([t]) => t);
}

// 简易摘要：取首句 + 含关键词的句子
function buildSummary(title: string, body: string, keywords: string[]): string {
  const sentences = body
    .split(/[。\n!?!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  if (sentences.length === 0) return body.slice(0, 80);
  if (sentences.length === 1) return sentences[0].slice(0, 100);

  // 第一句 + 含关键词的句子
  const scored = sentences.slice(1).map((s) => {
    const tokens = new Set(tokenize(s));
    let score = 0;
    for (const k of keywords) if (tokens.has(k)) score += 1;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.s ? scored[0].s : sentences[1];
  return `${sentences[0]}。${best}`.slice(0, 140);
}

// 类型推断：基于内容特征词
const TYPE_HINTS: Record<NoteType, string[]> = {
  problem: ['问题', 'bug', '故障', '报错', '失败', '阻塞', '风险', '待解决', '问题点', 'issue', 'blocker'],
  decision: ['决定', '决策', '方案', '采用', '拍板', '结论', '决定采用', '达成一致'],
  keypoint: ['重点', '关键', '核心', '要点', '注意', '切记', '关键点'],
  description: ['描述', '说明', '背景', '概述', '介绍', '文档'],
  general: [],
};

function inferType(text: string, existingType?: NoteType): NoteType {
  const lower = text.toLowerCase();
  const scores: Record<NoteType, number> = {
    problem: 0,
    decision: 0,
    keypoint: 0,
    description: 0,
    general: 0,
  };
  (Object.keys(TYPE_HINTS) as NoteType[]).forEach((t) => {
    for (const hint of TYPE_HINTS[t]) {
      if (lower.includes(hint.toLowerCase())) scores[t] += 1;
    }
  });
  let best: NoteType = 'general';
  let bestScore = 0;
  (Object.keys(scores) as NoteType[]).forEach((t) => {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      best = t;
    }
  });
  if (bestScore === 0 && existingType) return existingType;
  return best;
}

// ============================ AI 服务接口 ============================

export const aiEngine = {
  /** 分析笔记：摘要 / 关键词 / 推荐项目 / 推荐类型 */
  analyzeNote(
    content: string,
    title: string,
    projects: Project[],
    notes: Note[],
    currentProjectId?: string | null,
  ): NoteAnalysis {
    const keywords = extractKeywords(title, content);
    const summary = buildSummary(title, content, keywords);
    const suggestedType = inferType(content);

    // 项目推荐：计算与每个项目签名的相似度
    let suggestedProjectId: string | null = currentProjectId ?? null;
    let bestScore = 0;
    let reasoning = '内容与现有项目无强匹配，建议手动指定项目';

    const contentTokens = tokenize(content + ' ' + title);
    const contentTf = termFrequency(contentTokens);

    for (const p of projects) {
      const sig = projectSignature(p, notes);
      // 计算内容 token 与签名重叠度
      let overlap = 0;
      for (const t of contentTokens) if (sig.has(t)) overlap += 1;
      const score = overlap / (contentTokens.length || 1);
      if (score > bestScore) {
        bestScore = score;
        suggestedProjectId = p.id;
        reasoning = `检测到与「${p.name}」项目存在 ${overlap} 个特征词重叠`;
      }
    }

    if (bestScore < 0.02) {
      suggestedProjectId = currentProjectId ?? null;
      reasoning = '内容较新或独特，建议保留当前归属或创建新项目';
    }

    return {
      summary,
      keywords,
      suggestedProjectId,
      suggestedType,
      reasoning,
    };
  },

  /** 找相似笔记（TF-IDF 简化为 TF 余弦相似） */
  findSimilar(
    content: string,
    notes: Note[],
    excludeId?: string,
    threshold = 0.18,
  ): SimilarNote[] {
    const targetTf = termFrequency(tokenize(content));
    const results: SimilarNote[] = [];

    for (const note of notes) {
      if (note.id === excludeId) continue;
      const noteTf = termFrequency(tokenize(note.plainText));
      const sim = cosineSim(targetTf, noteTf);
      if (sim >= threshold) {
        // 找匹配片段
        const matchedSegments: string[] = [];
        const noteTokens = new Set(noteTf.keys());
        for (const t of targetTf.keys()) {
          if (noteTokens.has(t) && t.length >= 2) matchedSegments.push(t);
        }
        results.push({
          note,
          similarity: sim,
          matchedSegments: matchedSegments.slice(0, 5),
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  },

  /** 归类建议：找出未归属或归属不当的笔记 */
  categorizeNotes(notes: Note[], projects: Project[]): CategorizeSuggestion[] {
    const suggestions: CategorizeSuggestion[] = [];

    for (const note of notes) {
      // 未归属的笔记
      if (!note.projectId) {
        const analysis = this.analyzeNote(
          note.plainText,
          note.title,
          projects,
          notes,
        );
        if (analysis.suggestedProjectId) {
          suggestions.push({
            noteId: note.id,
            currentProjectId: null,
            suggestedProjectId: analysis.suggestedProjectId,
            reason: analysis.reasoning,
            confidence: 0.7,
          });
        }
      }
    }

    return suggestions.slice(0, 10);
  },

  /** 基于笔记内容回答问题 */
  ask(
    question: string,
    history: { role: string; content: string }[],
    notes: Note[],
    projects: Project[],
  ): AskResponse {
    const qTokens = tokenize(question);
    const qTf = termFrequency(qTokens);

    // 给笔记打分
    const scored = notes
      .map((note) => {
        const nTf = termFrequency(tokenize(note.plainText + ' ' + note.title));
        const sim = cosineSim(qTf, nTf);
        return { note, sim };
      })
      .filter((x) => x.sim > 0.05)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 4);

    if (scored.length === 0) {
      return {
        answer:
          '抱歉，我在你的笔记库中没有找到与该问题直接相关的内容。可以尝试换一个问法，或先在「笔记」中记录相关信息。',
        citations: [],
      };
    }

    const citations = scored.map((x) => ({
      noteId: x.note.id,
      snippet: x.note.plainText.slice(0, 80) + '…',
    }));

    // 检测问题意图
    const lowerQ = question.toLowerCase();
    const projectMatch = projects.find(
      (p) =>
        question.includes(p.name) ||
        lowerQ.includes(p.name.toLowerCase()),
    );

    let answer = '';

    // 是否问"问题"列表
    if (/问题|bug|故障|阻塞|风险|issue|blocker/.test(question)) {
      const relevant = projectMatch
        ? notes.filter((n) => n.projectId === projectMatch.id && n.type === 'problem')
        : notes.filter((n) => n.type === 'problem');
      const unresolved = relevant.filter((n) => !n.resolved);
      answer = `根据笔记记录，${projectMatch ? `「${projectMatch.name}」项目` : '所有项目'}共发现 ${relevant.length} 个问题笔记，其中 ${unresolved.length} 个尚未解决：\n\n`;
      unresolved.slice(0, 5).forEach((n, i) => {
        answer += `${i + 1}. ${n.title}\n   ${n.summary || n.plainText.slice(0, 60)}…\n\n`;
      });
      if (unresolved.length === 0 && relevant.length > 0) {
        answer += '所有已记录的问题均已标记为解决。';
      }
    }
    // 是否问"决策"
    else if (/决策|决定|方案|结论/.test(question)) {
      const relevant = projectMatch
        ? notes.filter((n) => n.projectId === projectMatch.id && n.type === 'decision')
        : notes.filter((n) => n.type === 'decision');
      answer = `${projectMatch ? `「${projectMatch.name}」项目` : '所有项目'}中已记录的决策要点：\n\n`;
      relevant.slice(0, 5).forEach((n, i) => {
        answer += `${i + 1}. ${n.title}\n   ${n.summary || n.plainText.slice(0, 80)}…\n\n`;
      });
      if (relevant.length === 0) answer = '未找到相关决策笔记。';
    }
    // 是否问"重点"
    else if (/重点|要点|关键|核心/.test(question)) {
      const relevant = projectMatch
        ? notes.filter((n) => n.projectId === projectMatch.id && (n.type === 'keypoint' || n.priority === 'high'))
        : notes.filter((n) => n.type === 'keypoint' || n.priority === 'high');
      answer = `${projectMatch ? `「${projectMatch.name}」项目` : '当前笔记库'}的关键要点：\n\n`;
      relevant.slice(0, 6).forEach((n, i) => {
        answer += `${i + 1}. ${n.title}\n   ${n.summary || n.plainText.slice(0, 80)}…\n\n`;
      });
      if (relevant.length === 0) answer = '未找到关键要点笔记。';
    }
    // 是否问"进展"
    else if (/进展|进度|状态|更新/.test(question)) {
      const relevant = projectMatch
        ? notes.filter((n) => n.projectId === projectMatch.id)
        : notes;
      const sorted = [...relevant].sort((a, b) => b.updatedAt - a.updatedAt);
      answer = `${projectMatch ? `「${projectMatch.name}」项目` : '全部笔记'}最近活动：\n\n`;
      sorted.slice(0, 6).forEach((n) => {
        const date = new Date(n.updatedAt).toLocaleDateString('zh-CN');
        answer += `· [${date}] ${n.title}（${typeLabel(n.type)}）\n   ${n.summary || n.plainText.slice(0, 60)}…\n\n`;
      });
    }
    // 通用：综合检索到的笔记内容
    else {
      answer = '根据你笔记库中的相关内容：\n\n';
      scored.forEach((x, i) => {
        const n = x.note;
        answer += `${i + 1}. ${n.title}\n   ${n.summary || n.plainText.slice(0, 100)}…\n\n`;
      });
      answer += '如需更精确的回答，可以指明项目名或问题类型（如「决策」「问题」「重点」）。';
    }

    return { answer, citations };
  },

  /** 生成项目说明文档 */
  generateDocument(
    projectId: string,
    options: DocGenOptions,
    notes: Note[],
    projects: Project[],
  ): string {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return '# 项目不存在';

    let projNotes = notes.filter((n) => n.projectId === projectId);
    if (options.startDate) projNotes = projNotes.filter((n) => n.updatedAt >= (options.startDate || 0));
    if (options.endDate) projNotes = projNotes.filter((n) => n.updatedAt <= (options.endDate || Date.now()));

    const lines: string[] = [];
    lines.push(`# ${project.name} 项目说明文档`);
    lines.push('');
    lines.push(`> 自动生成于 ${new Date().toLocaleString('zh-CN')} · 共综合 ${projNotes.length} 条笔记`);
    lines.push('');
    lines.push(`**项目描述**：${project.description}`);
    lines.push(`**起止时间**：${project.startDate || '未设定'} → ${project.endDate || '进行中'}`);
    lines.push(`**项目状态**：${statusLabel(project.status)}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (options.sections.includes('background')) {
      lines.push('## 一、项目背景');
      const desc = projNotes.filter((n) => n.type === 'description' || n.type === 'general');
      if (desc.length === 0) {
        lines.push('（暂无背景说明，建议补充项目背景描述类笔记。）');
      } else {
        desc.forEach((n) => {
          lines.push(`- ${n.summary || n.plainText.slice(0, 100)}`);
        });
      }
      lines.push('');
    }

    if (options.sections.includes('goals')) {
      lines.push('## 二、目标与重点');
      const key = projNotes.filter((n) => n.type === 'keypoint' || n.priority === 'high');
      if (key.length === 0) {
        lines.push('（暂无重点笔记。）');
      } else {
        key.forEach((n) => {
          lines.push(`- **${n.title}**：${n.summary || n.plainText.slice(0, 80)}`);
        });
      }
      lines.push('');
    }

    if (options.sections.includes('decisions')) {
      lines.push('## 三、关键决策');
      const dec = projNotes.filter((n) => n.type === 'decision');
      if (dec.length === 0) {
        lines.push('（暂无决策记录。）');
      } else {
        dec.forEach((n, i) => {
          lines.push(`${i + 1}. ${n.title}`);
          lines.push(`   ${n.summary || n.plainText.slice(0, 120)}`);
          lines.push('');
        });
      }
    }

    if (options.sections.includes('problems')) {
      lines.push('## 四、问题清单');
      const prob = projNotes.filter((n) => n.type === 'problem');
      if (prob.length === 0) {
        lines.push('（暂无问题记录。）');
      } else {
        prob.forEach((n) => {
          const status = n.resolved ? '✅ 已解决' : '⏳ 待处理';
          lines.push(`- [${status}] **${n.title}**：${n.summary || n.plainText.slice(0, 80)}`);
        });
      }
      lines.push('');
    }

    if (options.sections.includes('progress')) {
      lines.push('## 五、近期进展');
      const recent = [...projNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
      if (recent.length === 0) {
        lines.push('（暂无进展记录。）');
      } else {
        recent.forEach((n) => {
          const date = new Date(n.updatedAt).toLocaleDateString('zh-CN');
          lines.push(`- **${date}** · ${n.title}（${typeLabel(n.type)}）`);
        });
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('本文档由 Marginalia AI 自动综合笔记生成，请审阅后修订。');

    return lines.join('\n');
  },

  /** 生成工作台智能建议 */
  generateSuggestions(notes: Note[], projects: Project[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const now = Date.now();

    // 1. 未归属笔记 → 归档建议
    const uncategorized = notes.filter((n) => !n.projectId);
    if (uncategorized.length > 0) {
      const note = uncategorized[0];
      const analysis = this.analyzeNote(note.plainText, note.title, projects, notes);
      suggestions.push({
        id: `sug_cat_${note.id}`,
        type: 'categorize',
        title: `「${note.title}」尚未归入项目`,
        description: analysis.reasoning + (analysis.suggestedProjectId ? '，建议归入对应项目' : '，建议手动指定项目'),
        relatedNoteIds: [note.id],
        relatedProjectId: analysis.suggestedProjectId || undefined,
        createdAt: now,
      });
    }

    // 2. 高相似笔记 → 合并建议
    const pairs: { a: Note; b: Note; sim: number }[] = [];
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const aTf = termFrequency(tokenize(notes[i].plainText));
        const bTf = termFrequency(tokenize(notes[j].plainText));
        const sim = cosineSim(aTf, bTf);
        if (sim > 0.35) pairs.push({ a: notes[i], b: notes[j], sim });
      }
    }
    pairs.sort((a, b) => b.sim - a.sim);
    if (pairs.length > 0) {
      const p = pairs[0];
      suggestions.push({
        id: `sug_merge_${p.a.id}_${p.b.id}`,
        type: 'merge',
        title: `「${p.a.title}」与「${p.b.title}」内容高度相似`,
        description: `相似度 ${Math.round(p.sim * 100)}%，可能为重复记录，建议合并或互相引用。`,
        relatedNoteIds: [p.a.id, p.b.id],
        createdAt: now,
      });
    }

    // 3. 长期无文档的活跃项目 → 文档建议
    const activeProjects = projects.filter((p) => p.status === 'active');
    for (const p of activeProjects) {
      const projNotes = notes.filter((n) => n.projectId === p.id);
      if (projNotes.length >= 4) {
        suggestions.push({
          id: `sug_doc_${p.id}`,
          type: 'document',
          title: `「${p.name}」已积累 ${projNotes.length} 条笔记`,
          description: `建议生成一份项目说明文档，综合关键决策、问题清单与近期进展。`,
          relatedProjectId: p.id,
          createdAt: now,
        });
        break;
      }
    }

    // 4. 未解决问题 → 解决建议
    const problems = notes.filter((n) => n.type === 'problem' && !n.resolved);
    if (problems.length > 0) {
      const note = problems[0];
      suggestions.push({
        id: `sug_resolve_${note.id}`,
        type: 'resolve',
        title: `「${note.title}」问题待跟进`,
        description: `已记录 ${problems.length} 个未解决问题，建议确认最新状态并标记。`,
        relatedNoteIds: [note.id],
        createdAt: now,
      });
    }

    return suggestions;
  },
};

// ============================ 工具标签 ============================

export function typeLabel(type: NoteType): string {
  const map: Record<NoteType, string> = {
    keypoint: '重点',
    description: '描述',
    problem: '问题',
    decision: '决策',
    general: '常规',
  };
  return map[type];
}

export function statusLabel(status: Project['status']): string {
  const map = { active: '进行中', paused: '已暂停', archived: '已归档' };
  return map[status];
}

export function priorityLabel(p: Note['priority']): string {
  const map = { low: '低', medium: '中', high: '高' };
  return map[p];
}
