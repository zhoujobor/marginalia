import type { User, Project, Note } from '@/types';

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

export const SEED_USER: User = {
  id: 'user_demo',
  email: 'demo@marginalia.app',
  name: '陆衡',
  createdAt: now - DAY * 90,
};

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj_atlas',
    userId: 'user_demo',
    name: 'Atlas 商城重构',
    description: '下一代电商平台核心系统重构，目标支撑单日千万级订单。',
    status: 'active',
    color: '#D4A24C',
    startDate: '2026-05-01',
    endDate: '2026-09-30',
    createdAt: now - DAY * 30,
    updatedAt: now - HOUR,
  },
  {
    id: 'proj_orion',
    userId: 'user_demo',
    name: 'Orion 数据中台',
    description: '统一数据采集与指标平台，打通业务系统数据孤岛。',
    status: 'active',
    color: '#6FB2B2',
    startDate: '2026-04-15',
    createdAt: now - DAY * 60,
    updatedAt: now - HOUR * 3,
  },
  {
    id: 'proj_lyra',
    userId: 'user_demo',
    name: 'Lyra 客户增长',
    description: '私域客户增长与触达体系，含企微 SCRM 与会员积分。',
    status: 'paused',
    color: '#C8543C',
    startDate: '2026-03-01',
    createdAt: now - DAY * 90,
    updatedAt: now - DAY * 5,
  },
];

const noteHTML = (body: string) => `<p>${body}</p>`;

export const SEED_NOTES: Note[] = [
  // Atlas 项目笔记
  {
    id: 'note_001',
    userId: 'user_demo',
    title: '订单中心拆分决策',
    content: noteHTML(
      '<strong>背景</strong>：现有订单服务耦合了支付、库存、履约三个域的逻辑，每次迭代都互相阻塞。<br><strong>决策</strong>：采用 CQRS 拆分，订单中心仅负责聚合与状态机，支付/库存/履约各自独立服务。<br><strong>关键约束</strong>：订单状态变更必须保证最终一致性，依赖事件驱动补偿。',
    ),
    plainText:
      '背景：现有订单服务耦合了支付、库存、履约三个域的逻辑，每次迭代都互相阻塞。决策：采用 CQRS 拆分，订单中心仅负责聚合与状态机，支付/库存/履约各自独立服务。关键约束：订单状态变更必须保证最终一致性，依赖事件驱动补偿。',
    projectId: 'proj_atlas',
    type: 'decision',
    tags: ['架构', '订单中心', '微服务'],
    priority: 'high',
    relatedNoteIds: ['note_002', 'note_004'],
    summary:
      '订单中心拆分决策：采用 CQRS 拆分，订单中心仅负责聚合与状态机，支付/库存/履约各自独立服务。',
    keywords: ['订单', '服务', '支付', '库存', '履约', '拆分'],
    createdAt: now - DAY * 7,
    updatedAt: now - HOUR * 2,
  },
  {
    id: 'note_002',
    userId: 'user_demo',
    title: '支付通道异步化改造',
    content: noteHTML(
      '重点：将原有同步调用支付通道改为异步消息驱动，预计降低支付链路 P99 延迟 60%。关键点：1. 引入支付事件总线；2. 商户回调走幂等键；3. 对账 T+1 补偿。',
    ),
    plainText:
      '重点：将原有同步调用支付通道改为异步消息驱动，预计降低支付链路 P99 延迟 60%。关键点：1. 引入支付事件总线；2. 商户回调走幂等键；3. 对账 T+1 补偿。',
    projectId: 'proj_atlas',
    type: 'keypoint',
    tags: ['支付', '异步化', '性能'],
    priority: 'high',
    relatedNoteIds: ['note_001'],
    summary: '支付通道异步化改造：将原有同步调用改为异步消息驱动，降低 P99 延迟。',
    keywords: ['支付', '异步', '延迟', '回调', '对账'],
    createdAt: now - DAY * 5,
    updatedAt: now - DAY,
  },
  {
    id: 'note_003',
    userId: 'user_demo',
    title: '库存超卖问题排查',
    content: noteHTML(
      '<strong>问题</strong>：大促压测出现库存超卖 0.3%。<strong>原因</strong>：Redis 预扣库存与 DB 最终扣减之间存在窗口，多实例并发读取了未同步的缓存。<strong>方案</strong>：将库存扣减改为 Lua 脚本原子操作 + DB 行级乐观锁双校验。<strong>状态</strong>：待验证。',
    ),
    plainText:
      '问题：大促压测出现库存超卖 0.3%。原因：Redis 预扣库存与 DB 最终扣减之间存在窗口，多实例并发读取了未同步的缓存。方案：将库存扣减改为 Lua 脚本原子操作 + DB 行级乐观锁双校验。状态：待验证。',
    projectId: 'proj_atlas',
    type: 'problem',
    tags: ['库存', '超卖', 'Redis', '并发'],
    priority: 'high',
    relatedNoteIds: [],
    resolved: false,
    summary: '大促压测库存超卖 0.3%，根因是 Redis 预扣与 DB 同步窗口，方案是 Lua 原子 + 乐观锁。',
    keywords: ['库存', '超卖', 'Redis', '扣减', '缓存'],
    createdAt: now - DAY * 3,
    updatedAt: now - HOUR * 8,
  },
  {
    id: 'note_004',
    userId: 'user_demo',
    title: '履约系统接口契约',
    content: noteHTML(
      '描述：履约中心对外提供订单履约状态查询、发货指令下发、逆向退换货三类接口。所有接口遵循统一返回格式 {code, msg, data}，并支持幂等键。',
    ),
    plainText:
      '描述：履约中心对外提供订单履约状态查询、发货指令下发、逆向退换货三类接口。所有接口遵循统一返回格式 {code, msg, data}，并支持幂等键。',
    projectId: 'proj_atlas',
    type: 'description',
    tags: ['履约', '接口', '契约'],
    priority: 'medium',
    relatedNoteIds: ['note_001'],
    summary: '履约中心提供状态查询、发货下发、退换货三类接口，统一返回格式并支持幂等键。',
    keywords: ['履约', '接口', '订单', '幂等', '发货'],
    createdAt: now - DAY * 4,
    updatedAt: now - DAY * 2,
  },
  {
    id: 'note_005',
    userId: 'user_demo',
    title: '订单中心拆分决策',
    content: noteHTML(
      '决策：订单中心拆分，采用 CQRS 模式。订单聚合根负责状态机，支付/库存/履约各自独立服务。事件驱动补偿。',
    ),
    plainText:
      '决策：订单中心拆分，采用 CQRS 模式。订单聚合根负责状态机，支付/库存/履约各自独立服务。事件驱动补偿。',
    projectId: null,
    type: 'general',
    tags: [],
    priority: 'medium',
    relatedNoteIds: [],
    createdAt: now - HOUR * 6,
    updatedAt: now - HOUR * 6,
    summary: '订单中心拆分，CQRS 模式，订单聚合根负责状态机。',
    keywords: ['订单', '拆分', '服务'],
  },

  // Orion 项目笔记
  {
    id: 'note_006',
    userId: 'user_demo',
    title: '指标体系对齐方案',
    content: noteHTML(
      '<strong>决策</strong>：统一指标层使用 Dimensional Modeling，分 DWD/DWS/ADS 三层。指标定义维护在元数据中心，禁止业务方自定义同名指标。',
    ),
    plainText:
      '决策：统一指标层使用 Dimensional Modeling，分 DWD/DWS/ADS 三层。指标定义维护在元数据中心，禁止业务方自定义同名指标。',
    projectId: 'proj_orion',
    type: 'decision',
    tags: ['数据', '指标', '建模'],
    priority: 'high',
    relatedNoteIds: ['note_007'],
    summary: '指标层使用 Dimensional Modeling，分 DWD/DWS/ADS 三层，元数据中心统一管理定义。',
    keywords: ['指标', '建模', '数据', '维度', '中心'],
    createdAt: now - DAY * 8,
    updatedAt: now - HOUR * 3,
  },
  {
    id: 'note_007',
    userId: 'user_demo',
    title: '实时计算引擎选型',
    content: noteHTML(
      '重点：Flink vs Spark Streaming 选型。结论：选用 Flink 1.18，因其 exactly-once 与状态后端更适合订单实时指标场景。需关注 RocksDB 状态调优。',
    ),
    plainText:
      '重点：Flink vs Spark Streaming 选型。结论：选用 Flink 1.18，因其 exactly-once 与状态后端更适合订单实时指标场景。需关注 RocksDB 状态调优。',
    projectId: 'proj_orion',
    type: 'keypoint',
    tags: ['Flink', '实时计算', '选型'],
    priority: 'high',
    relatedNoteIds: ['note_006'],
    summary: '实时计算选型：Flink 1.18，因为 exactly-once 与状态后端更适合订单实时指标。',
    keywords: ['Flink', '实时', '指标', '状态', '选型'],
    createdAt: now - DAY * 6,
    updatedAt: now - DAY * 2,
  },
  {
    id: 'note_008',
    userId: 'user_demo',
    title: 'Kafka 消费组延迟问题',
    content: noteHTML(
      '<strong>问题</strong>：消费者组 lag 持续上升至 200 万。<strong>原因</strong>：DWD 层任务反压，下游 checkpoint 超时。<strong>方案</strong>：临时扩容并行度 + 优化 RocksDB 状态。<strong>状态</strong>：已缓解但未根治。',
    ),
    plainText:
      '问题：消费者组 lag 持续上升至 200 万。原因：DWD 层任务反压，下游 checkpoint 超时。方案：临时扩容并行度 + 优化 RocksDB 状态。状态：已缓解但未根治。',
    projectId: 'proj_orion',
    type: 'problem',
    tags: ['Kafka', '延迟', '反压'],
    priority: 'high',
    relatedNoteIds: [],
    resolved: false,
    summary: 'Kafka 消费组 lag 200 万，反压与 checkpoint 超时导致，扩容并行度缓解但未根治。',
    keywords: ['Kafka', '消费组', '延迟', '反压', 'checkpoint'],
    createdAt: now - DAY * 2,
    updatedAt: now - HOUR * 12,
  },
  {
    id: 'note_009',
    userId: 'user_demo',
    title: '数据质量监控接入',
    content: noteHTML(
      '描述：在 DWD/DWS 层接入 Great Expectations 校验，覆盖空值率、唯一性、值域、跨表一致性四类规则。异常自动告警至飞书。',
    ),
    plainText:
      '描述：在 DWD/DWS 层接入 Great Expectations 校验，覆盖空值率、唯一性、值域、跨表一致性四类规则。异常自动告警至飞书。',
    projectId: 'proj_orion',
    type: 'description',
    tags: ['数据质量', '监控', 'Great Expectations'],
    priority: 'medium',
    relatedNoteIds: [],
    summary: '在 DWD/DWS 层接入 Great Expectations 校验空值/唯一性/值域/一致性，异常告警飞书。',
    keywords: ['数据', '监控', '校验', '告警', '一致性'],
    createdAt: now - DAY * 4,
    updatedAt: now - DAY,
  },

  // Lyra 项目笔记
  {
    id: 'note_010',
    userId: 'user_demo',
    title: '私域增长策略',
    content: noteHTML(
      '重点：从公域转私域的关键是企微社群运营 + 内容触达。月活用户的目标转化率 5%。重点搭建会员积分体系驱动留存。',
    ),
    plainText:
      '重点：从公域转私域的关键是企微社群运营 + 内容触达。月活用户的目标转化率 5%。重点搭建会员积分体系驱动留存。',
    projectId: 'proj_lyra',
    type: 'keypoint',
    tags: ['私域', '增长', '会员'],
    priority: 'high',
    relatedNoteIds: [],
    summary: '私域增长重点：企微社群 + 内容触达，目标转化率 5%，会员积分驱动留存。',
    keywords: ['私域', '增长', '企微', '会员', '积分'],
    createdAt: now - DAY * 10,
    updatedAt: now - DAY * 6,
  },
  {
    id: 'note_011',
    userId: 'user_demo',
    title: '客户增长项目暂停',
    content: noteHTML(
      '决策：因 Q2 预算调整，Lyra 项目暂停推进，核心团队转入 Atlas 项目。已沉淀的策略与素材归档，待 Q3 重启。',
    ),
    plainText:
      '决策：因 Q2 预算调整，Lyra 项目暂停推进，核心团队转入 Atlas 项目。已沉淀的策略与素材归档，待 Q3 重启。',
    projectId: 'proj_lyra',
    type: 'decision',
    tags: ['暂停', '预算', '调整'],
    priority: 'medium',
    relatedNoteIds: [],
    summary: 'Lyra 项目因 Q2 预算调整暂停，团队转入 Atlas，已沉淀内容归档待 Q3 重启。',
    keywords: ['暂停', '预算', '团队', '归档'],
    createdAt: now - DAY * 6,
    updatedAt: now - DAY * 5,
  },
];
