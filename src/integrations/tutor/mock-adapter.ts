/**
 * Local Mock Tutor Adapter - Rowad Al-Mamal (TypeScript source)
 * Implements candidate TutorAdapter interface for isolated verification.
 *
 * Teaching style (Socratic ladder): the first message for a problem is a
 * question that points the student at the right idea without giving the fix.
 * If the student keeps editing the circuit and the same problem persists, the
 * hint gets more specific (level 1: narrows the search, level 2: states the
 * fix). The ladder resets as soon as the diagnosis changes.
 */

/** Edits (circuit revisions) with the same problem before the hint gets more direct. */
import type { TutorAdapter, TutorRequestV1, TutorResponseV1 } from '../../../contracts/tutor/v1/types.ts';

export const EDITS_PER_LEVEL = 3;
export const MAX_LEVEL = 2;
/**
 * While building (circuit simply not finished yet) every part and wire is a new
 * revision, so the student is not "stuck" after two edits. Be far more patient.
 */
export const EDITS_PER_LEVEL_BUILDING = 10;
const BUILDING_KEYS = new Set(['OPEN_CIRCUIT', 'NO_SOURCE', 'DEFAULT']);

/** Three hint levels per diagnostic code. Levels: 0 = question, 1 = narrowed question, 2 = direct fix. */
const LADDER: Record<string, string[]> = {
  SOURCE_SHORT: [
    'ما الذي يحدّ التيار إذا وصلنا قطبي البطارية ببعضهما مباشرة دون أي مكوّن بينهما؟',
    'التيار يسلك أسهل طريق. أين يجب أن يمرّ حتى يؤدي عملًا مفيدًا قبل أن يعود إلى القطب السالب؟',
    'احذف السلك الذي يصل القطبين مباشرة، ثم صِل القطب الموجب بمكوّن واحد فقط.',
  ],
  MISSING_RESISTOR: [
    'الصمام متصل بالمصدر مباشرة. ما الذي يحدّد مقدار التيار المار فيه؟ وماذا يحدث إن لم يكن هناك ما يقيّده؟',
    'جهد المصدر 5V بينما يحتاج الصمام نحو 2V فقط. أين سيذهب الفرق (3V)؟ تذكّر قانون أوم.',
    'ضع مقاومة في المسار بين المصدر والصمام. جرّب 330Ω ثم احسب التيار: I = (5 − 2) ÷ R.',
  ],
  BYPASSED_RESISTOR: [
    'يوجد سلك يصل طرفي المقاومة معًا. أي طريق يفضّله التيار: المقاومة أم السلك؟',
    'التيار يختار المسار الأقل مقاومة. هل ما زالت المقاومة تؤدي وظيفتها؟',
    'احذف السلك الذي يتجاوز المقاومة حتى يمرّ التيار عبرها.',
  ],
  REVERSED_LED: [
    'الصمام لا يضيء. الصمام الثنائي يسمح بمرور التيار في اتجاه واحد فقط. من أي طرف يجب أن يدخل التيار؟',
    'تتبّع المسار بدءًا من (+) البطارية: أي طرفي الصمام (A أو K) يصل إليه التيار أولًا؟ وأيهما يجب أن يكون؟',
    'بدّل اتجاه الصمام: يدخل التيار من المصعد (A) ويخرج من المهبط (K).',
  ],
  SWITCH_OPEN: [
    'التوصيلات تبدو مكتملة لكن لا يمرّ تيار. ما وظيفة المفتاح في الدائرة؟ وما حالته الآن؟',
    'المفتاح المفتوح يقطع الطريق كجسر مرفوع. ماذا تتوقع إن أغلقته؟',
    'اضغط على زر «المفتاح» في الشريط العلوي لإغلاقه.',
  ],
  OVERCURRENT: [
    'قارن التيار المحسوب بالحد الأقصى للصمام (20mA). أي قيمة في I = (V − Vf) ÷ R تستطيع تغييرها لتقليل التيار؟',
    'كلما زادت المقاومة قلّ التيار. كم يجب أن تكون المقاومة على الأقل حتى يبقى التيار أقل من 20mA؟',
    'استخدم مقاومة أكبر؛ مثلًا 330Ω تعطي نحو 9mA وهي آمنة للصمام.',
  ],
  UNSUPPORTED_TOPOLOGY: [
    'هذا المختبر يدرّس حلقة واحدة على التوالي. هل في دائرتك فرع أو سلك زائد؟',
    'اعدّ الأسلاك: كل منفذ يحتاج سلكًا واحدًا فقط، وكل عقدة تجمع طرفين فقط.',
    'احذف الأسلاك الزائدة حتى تصبح الدائرة حلقة واحدة: بطارية ← مقاومة ← LED ← مفتاح ← بطارية.',
  ],
  INVALID_DATA: [
    'بيانات إحدى القطع غير صالحة. ما القطعة التي تغيّرت قيمتها أو أُضيفت بشكل غير معتاد؟',
    'جرّب حذف القطع ثم إضافتها من صندوق الأدوات من جديد.',
    'استخدم «مسح الدائرة» ثم ابنِ الدائرة من جديد بالقطع الجاهزة في صندوق الأدوات.',
  ],
  OPEN_CIRCUIT: [
    'لا يمرّ تيار. تتبّع الدائرة بإصبعك من (+) البطارية: أين ينقطع المسار قبل أن يعود إلى (−)؟',
    'هل لكل قطعة طرفان موصولان بسلكين؟ ابحث عن منفذ تُرك دون توصيل أو قطعة لم تُضف بعد.',
    'أكمل الحلقة: بطارية ← مقاومة ← LED ← مفتاح ← بطارية، بحيث يكون كل منفذ موصولًا بسلك.',
  ],
};

const NO_SOURCE_LADDER: string[] = [
  'ما الذي يزوّد الدائرة بالطاقة؟ هل في المعمل شيء يؤدي هذه المهمة؟',
  'الدائرة تحتاج مصدر جهد يدفع التيار. ابحث عنه في «مصادر الطاقة».',
  'أضف مصدر الجهد (5V DC) من صندوق الأدوات ثم صِل قطبيه.',
];

const DEFAULT_LADDER: string[] = [
  'ماذا تلاحظ في حالة الدائرة الآن؟ ما الذي ينقصها لتعمل؟',
  'راجع كل منفذ وكل سلك: هل المسار مكتمل من (+) إلى (−)؟',
  'تأكد من توصيل كافة القطع بأسلاك سليمة في حلقة واحدة.',
];

/** Which component to highlight from level 1 upward. The first affected id is used. */
const HIGHLIGHTS = new Set<string>([
  'SOURCE_SHORT', 'MISSING_RESISTOR', 'BYPASSED_RESISTOR', 'REVERSED_LED', 'SWITCH_OPEN', 'OVERCURRENT',
]);

export class LocalMockTutorAdapter implements TutorAdapter {
  private currentSnapshotRevision: number;
  private ladderKey: string | null = null;
  private lastRevision = -1;
  private attempts = 0;

  constructor(initialRevision: number = 1) {
    this.currentSnapshotRevision = initialRevision;
    this.reset();
  }

  public setSnapshotRevision(rev: number): void {
    this.currentSnapshotRevision = rev;
  }

  /** Forget the hint ladder (e.g. when a new experiment starts). */
  public reset(): void {
    this.ladderKey = null;
    this.lastRevision = -1;
    this.attempts = 0;
  }

  public async getHint(request: TutorRequestV1, signal?: AbortSignal): Promise<TutorResponseV1> {
    if (signal?.aborted) {
      throw new Error('RequestAborted');
    }

    // Reject stale revisions
    if (request.snapshotRevision < this.currentSnapshotRevision) {
      throw new Error(`StaleRevisionError: request rev ${request.snapshotRevision} < current ${this.currentSnapshotRevision}`);
    }

    const { evidence } = request;
    const primary = evidence.diagnostics[0];
    const code = primary?.code;

    let message: string;
    let level = 0;
    let suggestedAction: TutorResponseV1['suggestedAction'] | undefined;

    if (code === 'OK') {
      this.reset();
      const mA = (evidence.measurements.circuitCurrentA || 0) * 1000;
      const vr = evidence.measurements.resistorVoltageV;
      message = `أحسنت! التيار المحسوب ${mA.toFixed(1)} mA والصمام يضيء. هل تستطيع التحقق من هذه القيمة بنفسك بقانون أوم: I = (V − Vf) ÷ R؟`
        + (vr == null ? '' : ` وماذا تتوقع لهبوط الجهد على المقاومة (${vr.toFixed(2)}V)؟`);
    } else {
      const noSource = code === 'OPEN_CIRCUIT' && evidence.measurements.sourceVoltageV == null;
      const ladder = noSource ? NO_SOURCE_LADDER : (LADDER[code as string] ?? DEFAULT_LADDER);
      const key = noSource ? 'NO_SOURCE' : (code ?? 'DEFAULT');

      if (key !== this.ladderKey) {
        this.ladderKey = key;
        this.attempts = 0;
        this.lastRevision = request.snapshotRevision;
      } else if (request.snapshotRevision > this.lastRevision) {
        // The student edited the circuit but the same problem remains.
        this.attempts++;
        this.lastRevision = request.snapshotRevision;
      }
      const perLevel = BUILDING_KEYS.has(key) ? EDITS_PER_LEVEL_BUILDING : EDITS_PER_LEVEL;
      level = Math.min(MAX_LEVEL, Math.floor(this.attempts / perLevel));
      message = ladder[level];

      const target = primary?.affectedIds?.[0];
      if (level >= 1 && HIGHLIGHTS.has(code as string) && target) {
        suggestedAction = { kind: 'highlight', targetId: target };
      }
    }

    // Never point at a component the UI does not know about.
    if (suggestedAction && !evidence.knownComponentIds.includes(suggestedAction.targetId)) {
      suggestedAction = undefined;
    }

    return {
      contractVersion: '1.0.0',
      requestId: request.requestId,
      snapshotRevision: request.snapshotRevision,
      message,
      suggestedAction,
      stepId: request.stepId,
    };
  }
}
