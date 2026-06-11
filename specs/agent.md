为了帮你落地这套“以人为本”且“智子化”的 Agent 后台系统，我们需要设计一套**高扩展性、能同时支撑前端 3D 渲染和后端 LLM（大模型）Prompt 生成的数据参数结构**。

既然我们要“把 Agent 当人”，那么每个 Agent 就像是一个拥有身份、性格、状态、技能和记忆的“数字员工”。以下为你详细说明一个 Agent 应该具备的所有核心参数及其细节定义：

---

### 一、 基础身份参数 (Identity Parameters)

*用来在后台建立“员工档案”，定义其在团队中的社会属性。*

| 参数字段        | 类型          | 说明及取值范围                               | UI & 业务用途                          |
| :-------------- | :------------ | :------------------------------------------- | :------------------------------------- |
| `id`            | String (UUID) | 唯一标识符。                                 | 数据库检索与路由。                     |
| `name`          | String        | 姓名（例如：“小美”、“老张”）。               | UI 称呼、对话框名字。                  |
| `role_title`    | String        | 岗位职称（例如：“数据挖掘师”、“媒介主编”）。 | 突出其专业分工。                       |
| `department`    | String        | 所属部门（例如：“市场部”、“研发中心”）。     | 用于在“组织架构栏”进行分组。           |
| `avatar_backup` | String (URL)  | 2D 静态头像/缩略图。                         | 在 3D 渲染降级（或小尺寸列表）时使用。 |

---

### 二、 智子化视觉参数 (Sophon Visual & Shader Parameters)

*这组参数**直接对接 3D 渲染引擎**（如 Three.js / Spline），决定了这个 Agent 的“智子球”长什么样、怎么动。*

| 参数字段        | 类型             | 推荐取值范围                                                                                    | 对应视觉效果                                             |
| :-------------- | :--------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `geometry_type` | String           | `sphere` (球体) / `octahedron` (八面体) / `torus` (圆环) / `cube` (立方体)                      | 决定“智子”的基础几何构型。                               |
| `material_type` | String           | `liquid_chrome` (液态铬) / `frosted_glass` (磨砂玻璃) / `iridescent` (虹彩) / `hologram` (全息) | 决定“智子”的反射、折射与表面质感。                       |
| `base_color`    | String (Hex/RGB) | 示例：`#00FFCC` (极光绿) / `#FF3366` (晚霞粉)                                                   | “智子”的核心电磁色、脉冲微光的颜色。                     |
| `core_pulse_hz` | Float            | `0.1` ~ `10.0` (Hz)                                                                             | 内核能量脉冲的频率，值越大，球体内部光芒闪烁越快。       |
| `orbit_rings`   | Integer          | `0` ~ `3`                                                                                       | 绕转星环的数量，常用来表征挂载技能的多少或层级。         |
| `noise_scale`   | Float            | `0.0` (光滑) ~ `2.0` (剧烈起伏)                                                                 | 作用于顶点着色器的噪声强度，决定表面流体的波动剧烈程度。 |

---

### 三、 性格与人设参数 (Personality & Persona Parameters)

*这组参数是后台的“灵魂”。它将作为元数据，在后端自动拼装进 LLM 的 **System Prompt**（系统提示词），从而控制 Agent 的说话语气和行事作风。*

#### 1. 认知维度（数值化性格控制，通常为 0.0 ~ 1.0 的滑块）

* `rigor_level` (严谨度)：
  * **高（0.8-1.0）**：Agent 会反复校对、严密论证，不轻易下结论；
  * **低（0.1-0.3）**：Agent 追求速度，允许模糊和发散。
* `creativity_level` (创造力)：
  * **高**：回答更具有想象力、联想性，适合文案、头脑风暴；
  * **低**：严格按照事实说话，拒绝任何胡编乱造（幻觉控制）。
* `proactivity_level` (主动性)：
  * **高**：完成任务后，会主动提出下一步建议，或者在发现问题时主动弹窗提示用户；
  * **低**：严格“听话”，不问不答，不指令不执行。

#### 2. 沟通风格与温度

* `conversational_style` (沟通风格)：
  * 取值：`professional` (严谨专业) / `empathetic` (温暖亲和) / `concise` (冷酷极简) / `playful` (幽默风趣)。
* `response_temperature` (LLM采样温度)：
  * 直接对应大模型的 `temperature` 参数。
* `forbidden_words` (禁用词与语气禁忌)：
  * 类型：Array [String]。例如：`["抱歉", "作为AI", "亲爱的"]`。控制 Agent 说话不要像个毫无感情的机器。

---

### 四、 运行状态参数 (Operational & UI State Parameters)

*这组参数是前端 UI 的“状态机”。它告诉前端此时此刻应该播放哪种 3D 动画，并展示什么业务信息。*

#### 1. 核心状态值 (`current_state`)

这是一个枚举值（Enum），直接控制 3D 智子球的动作：

* `IDLE` (空闲)：静态悬浮，极慢自转，噪声强度极低，展现平静感。
* `THINKING` (思考)：球体表面呈流体波动（`noise_scale` 变大），内核高频闪烁，代表在运算。
* `EXECUTING` (执行中)：多维展开，星环围绕自转，流光溢彩，代表正在调用工具干活。
* `AWAITING_APPROVAL` (等待审批)：球体呈缓慢的黄色脉冲膨胀，提示用户需要签字。
* `ERROR` (异常中断)：硬化为尖角多面体，呈红色呼吸灯闪烁。
* `SLEEP` (休眠)：完全静止，材质变灰，关闭 3D 渲染循环以绝对省电。

#### 2. 任务 telemetry 数据

* `current_task_desc` (当前任务描述)：String（例如：“正在爬取 3 个竞品网站的定价...”）。展示在卡片中央。
* `task_progress` (进度百分比)：Float (`0.0` ~ `100.0`)。控制卡片下方的进度条。
* `active_run_id` (当前运行实例 ID)：关联的具体工作流 ID。

---

### 五、 技能与装备参数 (Skills & Tools Inventory)

*代表挂载在 Agent 身上的“武器”。在 UI 上以徽章或卡片形式装备在 Agent 卡片底部。*

* `equipped_tools` (已装备技能列表)：Array of Object

    ```json
    [
      {
        "tool_id": "tool_web_search_001",
        "tool_name": "谷歌学术检索",
        "category": "search",
        "status": "authorized", // authorized (已授权) / expired (已过期)
        "use_count": 142        // 累计调用次数，用于审计
      }
    ]
    ```

---

### 六、 记忆与认知范围参数 (Memory & Knowledge Limits)

*定义这个“人”知道什么、记得什么。*

* `knowledge_bases` (绑定的本地知识库/文件)：Array of Object（例如：`[{"doc_id": "doc_xyz", "name": "2026年公司制度.pdf"}]`）。
* `long_term_memory_enabled` (是否开启长期记忆)：Boolean（是否将该 Agent 与用户的历史对话持久化在向量数据库中）。
* `context_window_limit` (上下文限制)：Integer（最大支持多少 Token，防止长对话爆上下文）。

---

### 七、 能耗与审计参数 (Telemetry & Cost Parameters)

*作为后台的“管理者”，你必须知道这个“人”花了你多少钱、效率如何。*

* `daily_budget_limit` (每日预算限制)：Float（例如：`20.00` 美元，超过限制此 Agent 自动进入 SLEEP 状态并提醒人类）。
* `daily_cost_accumulated` (今日已消耗费用)：Float（实时统计今日调用 API 消耗的 Token 换算成的美金/人民币）。
* `avg_response_latency` (平均响应时间)：Float（单位：秒。反映 Agent 的办事效率）。
* `satisfaction_rate` (人类满意度评分)：Float（0.0 ~ 5.0，人类对该 Agent 完成任务后的评分平均值）。

---

### 总结：数据流是如何跑起来的？

当你在后台**新建或修改**一个 Agent 时：

1. 你在 UI 拖拽修改了 `rigor_level`（严谨度）和 `conversational_style`（风格） ➜ 写入数据库 ➜ 后端将这些参数格式化为 **System Prompt** 写入 LLM。
2. 你在 UI 装备了“谷歌搜索” ➜ 参数 `equipped_tools` 增加一条 ➜ 智子球视觉参数 `orbit_rings`（星环数）+1 ➜ **3D 引擎自动多渲染一个旋转光环**。
3. 后端 Agent 运行并调用了工具 ➜ `current_state` 变为 `EXECUTING` ➜ **前端 3D 球体立刻展开并加速旋转**。

这套参数结构完美地把**后端逻辑、AI 提示词工程、以及前端的“智子”3D 视觉变幻**紧密地绑定在了一起，真正实现了“表里如一”的数字生命感。
