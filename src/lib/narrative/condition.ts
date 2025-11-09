export type ComparisonOp = '<' | '<=' | '>' | '>=' | '==' | '!=';

export type Comparison = {
  path: string; // dot path into context
  op: ComparisonOp;
  value: any;
};

export type ConditionExpr =
  | { all: ConditionExpr[] }
  | { any: ConditionExpr[] }
  | { not: ConditionExpr }
  | Comparison
  | { requiredEntities: { enemyType?: string; itemType?: string } }
  ;

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
    if ((cond as any).path) {
      const c = cond as Comparison;
      const v = getPath(ctx, c.path);
      let matches = false;
      switch (c.op) {
        case '<': matches = v < c.value; break;
        case '<=': matches = v <= c.value; break;
        case '>': matches = v > c.value; break;
        case '>=': matches = v >= c.value; break;
        case '==': matches = v == c.value; break;
        case '!=': matches = v != c.value; break;
      }
      return { matches, score: matches ? 1 : 0 };
    }

    if ((cond as any).requiredEntities) {
      const req = (cond as any).requiredEntities;
      const enemyType = req.enemyType;
      const itemType = req.itemType;
      let found = false;
      const chunk = ctx?.chunk;
      if (enemyType && chunk?.enemy && chunk.enemy.type === enemyType) found = true;
      if (itemType && chunk?.items && Array.isArray(chunk.items)) {
        if (chunk.items.some((it: any) => it.name === itemType)) found = true;
      }
      return { matches: found, score: found ? 1 : 0 };
    }

    if ((cond as any).all) {
      const subs: ConditionExpr[] = (cond as any).all;
      let total = 0;
      for (const s of subs) {
        const r = compileCondition(s)(ctx, state);
        if (!r.matches) return { matches: false, score: 0 };
        total += r.score;
      }
      return { matches: true, score: total / subs.length };
    }

    if ((cond as any).any) {
      const subs: ConditionExpr[] = (cond as any).any;
      let best = 0;
      for (const s of subs) {
        const r = compileCondition(s)(ctx, state);
        if (r.matches) return { matches: true, score: Math.max(best, r.score) };
        best = Math.max(best, r.score);
      }
      return { matches: false, score: best };
    }

    if ((cond as any).not) {
      const r = compileCondition((cond as any).not)(ctx, state);
      return { matches: !r.matches, score: r.matches ? 0 : 1 };
    }

    return { matches: false, score: 0 };
  };

  return fn;
}

export default compileCondition;
