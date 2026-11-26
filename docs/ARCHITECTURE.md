# المعمارية التقنية وحدود الوحدات — ARCHITECTURE.md

> **الإصدار:** 1.0.0 (G1 Baseline)  
> **المشروع:** «رواد المعمل» — هاكاثون شِراع 2026

---

## 1. فلسفة التصميم المعماري (Architectural Philosophy)
يعتمد المشروع نمط **Modular Monolith** أحادي الكود ومحكم الحدود، ويفصل تماماً بين:
1. **المنطق العلمي الكهربائي (`domain/circuit`):** محرك نقي 100%، عديم الحالة (Stateless)، حتمي (Deterministic)، لا يعتمد على أي مكتبات واجهات أو اتصال بالشبكة.
2. **طبقة العرض والتفاعل (`presentation` & `features`):** واجهة مستخدم تعتمد على Native SVG وDOM وتدعم اللمس المتعدد، لوحة المفاتيح، والوصولية الكاملة لشاشات الهواتف وأجهزة اللابتوب.
3. **طبقة التكامل والإرشاد الذكي (`integrations/tutor`):** منفذ اتصال مجرد (`TutorAdapter`) يستهلك مخرجات المحاكاة في اتجاه واحد للقراءة فقط (Read-Only)، ولا يملك صلاحية تعديل الدائرة أو اختراع قراءات كهربائية جديدة.

---

## 2. مخطط تدفق البيانات والعلاقات

```text
[أحداث المستخدم: نقر / لمس / لوحة مفاتيح]
        │
        ▼
[Lab Presentation: LabCanvas & Toolbar]
        │
        ▼  (Action / Command)
[Lab State Manager: Immutable Snapshot v1]
        │
        ▼  (Pure Function Call: simulate(snapshot))
[Circuit Core Engine: Normalizer ──> Graph Classifier ──> DC Solver ──> Diagnostics]
        │
        ▼  (Deterministic SimulationResult)
┌───────┴────────────────────────────────────────┐
│                                                │
▼                                                ▼
[UI Updates: Meters / Diagnostics / LED Glow]     [Tutor Port: Read-Only Context]
                                                 │
                                                 ├──> [Local Rules Tutor (Offline)]
                                                 └──> [Remote Tutor Adapter (Mock/Live)]
```

---

## 3. تصنيف حالات القياس الكهربائي (Solver Measurement States)
تم تحديد 4 حالات دقيقة للمحرك لمنع أي تضليل علمي:

1. **القياسات المحسوبة الصحيحة (`status: 'valid'`):**
   - الدائرة مغلقة بالكامل، الـ LED باتجاه أمامي، ومقاومة الحماية متصلة.
   - القيم: \(I = (V_s - V_f) / R\)، \(V_R = I \times R\)، \(V_{LED} \approx V_f\).
   - حالة الصمام: `ledOn: true`.

2. **التيار الصفري في الدائرة المفتوحة (`status: 'open'`):**
   - المفتاح مفتوح (`SWITCH_OPEN`) أو هناك سلك ناقص (`OPEN_CIRCUIT`).
   - القيم: \(I = 0\text{A}\)، وهبوط الجهد غير محدد (`null`).
   - حالة الصمام: `ledOn: false`.

3. **الحالات الخطرة وحجب الحسابات (`status: 'unsafe'`):**
   - قصر المصدر (`SOURCE_SHORT`)، غياب المقاومة (`MISSING_RESISTOR`)، أو تجاوز المقاومة (`BYPASSED_RESISTOR`).
   - القيم: يتم حجب الأرقام فورياً وتظهر كـ `null` ("غير محسوب") لمنع إظهار حالة خطرة وكأنها تشغيل آمن.
   - حالة الصمام: `ledOn: false`.

4. **القياسات غير المحددة أو الطوبولوجيا غير المدعومة (`status: 'unsupported'`):**
   - توصيلات معقدة أو متفرعة تتجاوز النموذج التعليمي السلسلي الأولي.
   - القيم: `null` لكافة القراءات مع توضيح تشخيصي يفسر حدود النموذج للطالب.
   - حالة الصمام: `ledOn: false`.

---

## 4. سياسة ملكية الملفات (File Ownership Policy)
- **الوكلاء الاستشاريون (Read-Only):** `product-analyst`, `ux-ui-designer`, `system-architect`, `security-engineer`, `plan-critic`, `code-reviewer`, `qa-engineer`, `release-auditor` — لا يكتبون كوداً في المشروع.
- **وكلاء التنفيذ (Writers):**
  - `backend-engineer`: يملك حصرياً `src/domain/circuit/` و`src/domain/experiments/`.
  - `frontend-engineer`: يملك حصرياً `src/presentation/`, `src/features/lab/`, `src/design-system/`, `src/i18n/`, `index.html`.
  - `integration-engineer`: يملك حصرياً `contracts/tutor/v1/`, `src/integrations/tutor/`.
  - `test-automation-engineer`: يملك حصرياً `tests/`.
