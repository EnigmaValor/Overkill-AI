# EVAL HARNESS — how to measure the skill (and how NOT to)

## What this directory is

The benchmark machinery for the POWER SKILL, plus the two scripts that produce REAL
runnable evidence inside any environment:

| Script | What it proves | Needs a model? |
|---|---|---|
| `validate_package.py` | structural integrity: files, links, frontmatter, task-suite sanity, zero placeholders, scripts compile | No |
| `run_eval.py --selftest` | harness pipeline integrity: module loading, check evaluation, scoring math, report writing | No (canned responses) |
| `run_eval.py` (full) | the actual BASELINE vs SKILL measurement | Yes — any OpenAI-compatible local endpoint |

## Honest-zero policy

`benchmarks/baseline.json` and `benchmarks/skill_eval.json` are **null / NOT_RUN by
design**. They are populated exclusively by `run_eval.py` against a real model. Nobody
hand-fills them; nobody extrapolates expected numbers into them. A claim that the skill
improves a model is only valid with the generated files present.

## Running the real benchmark (any machine with a local model)

```bash
# 1. start an OpenAI-compatible endpoint, e.g. Ollama:
#    ollama serve   &&   ollama pull <2b-model>
# 2. integrity gates first:
python3 eval/validate_package.py
python3 eval/run_eval.py --selftest
# 3. the measurement (both conditions, identical tasks):
python3 eval/run_eval.py \
  --base-url http://localhost:11434/v1 \
  --model <your-2b-model> \
  --mode both
# 4. optional judge pass with a stronger local model:
python3 eval/run_eval.py --base-url http://localhost:11434/v1 \
  --model <your-2b-model> --judge-model <your-8b-model> --mode both
```

Outputs land in `benchmarks/results/`: per-condition JSON + markdown report, plus a
printed `SKILL-DELTA` (skill minus baseline, det_score_overall). Interpretation rules and
success criteria: `benchmarks/scoring.md`. Component scores stay separate — no single
blended number.

## Failure-model note (RED phase status)

The baseline failure model in this package (patterns A1–A14, F1–F12, DF1–DF12) was
distilled from known small-model failure shapes in this domain, NOT from a measured run of
a specific 2B model in this environment (none was available). The task suite operationalizes
those failure modes as checks. The first real `run_eval.py` baseline run converts the
failure model from hypothesized to measured — treat unverified failure claims accordingly
until then. If the baseline run shows a task category already at ~1.0 without the skill,
that task is not discriminating: replace or harden it (see scoring.md mutation testing).

## Mutation + ablation regimens

Defined in `benchmarks/scoring.md` (M1–M4 mutations; component ablations). Run them after
the first passing measurement; a benchmark that cannot detect skill mutations is too weak
to certify deltas.
