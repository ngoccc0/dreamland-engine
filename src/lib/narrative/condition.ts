export type ComparisonOp = '<' | '<=' | '>' | '>=' | '==' | '!=';

export type Comparison = {
  path: string; // dot path into context
  op: ComparisonOp;
  value: any;
};

export type RequiredEntities = {
  requiredEntities: { enemyType?: string; itemType?: string };
};

export type ConditionExpr =
  | { all: ConditionExpr[] }
  | { any: ConditionExpr[] }
  | { not: ConditionExpr }
  | Comparison
  | RequiredEntities;

/**
 * Type guards for condition expressions.
 */
function isComparison(cond: ConditionExpr): cond is Comparison {
  return 'path' in cond;
}

function isRequiredEntities(cond: ConditionExpr): cond is RequiredEntities {
  return 'requiredEntities' in cond;
}

function isAllCondition(cond: ConditionExpr): cond is { all: ConditionExpr[] } {
  return 'all' in cond;
}

function isAnyCondition(cond: ConditionExpr): cond is { any: ConditionExpr[] } {
  return 'any' in cond;
}

function isNotCondition(cond: ConditionExpr): cond is { not: ConditionExpr } {
  return 'not' in cond;
}

function getPath(obj: any, path: string): any {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export type EvalResult = { matches: boolean; score: number };

export function compileCondition(cond?: ConditionExpr) {
  if (!cond) return (_ctx: any, _state: any) => ({ matches: true, score: 1 });

  const fn = (ctx: any, state: any): EvalResult => {
    // Comparison
    if (isComparison(cond)) {
      const v = getPath(ctx, cond.path);
      let matches = false;
      switch (cond.op) {
        case '<': matches = v < cond.value; break;
        case '<=': matches = v <= cond.value; break;
        case '>': matches = v > cond.value; break;
        case '>=': matches = v >= cond.value; break;
        case '==': matches = v == cond.value; break;
        case '!=': matches = v != cond.value; break;
      }
      return { matches, score: matches ? 1 : 0 };
    }

    if (isRequiredEntities(cond)) {
      const { enemyType, itemType } = cond.requiredEntities;
      let found = false;
      const chunk = ctx?.chunk;
      if (enemyType && chunk?.enemy && chunk.enemy.type === enemyType) found = true;
      if (itemType && chunk?.items && Array.isArray(chunk.items)) {
        if (chunk.items.some((it: any) => it.name === itemType)) found = true;
      }
      return { matches: found, score: found ? 1 : 0 };
    }

    if (isAllCondition(cond)) {
      const subs: ConditionExpr[] = cond.all;
      let total = 0;
      for (const s of subs) {
        const r = compileCondition(s)(ctx, state);
        if (!r.matches) return { matches: false, score: 0 };
        total += r.score;
      }
      return { matches: true, score: total / subs.length };
    }

    if (isAnyCondition(cond)) {
      const subs: ConditionExpr[] = cond.any;
      let best = 0;
      for (const s of subs) {
        const r = compileCondition(s)(ctx, state);
        if (r.matches) return { matches: true, score: Math.max(best, r.score) };
        best = Math.max(best, r.score);
      }
      return { matches: false, score: best };
    }

    if (isNotCondition(cond)) {
      const r = compileCondition(cond.not)(ctx, state);
      return { matches: !r.matches, score: r.matches ? 0 : 1 };
    }

    return { matches: false, score: 0 };
  };

  return fn;
}

export default compileCondition;
