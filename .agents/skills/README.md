# Fable 5 Skills

Installed by `fable5-skills@1.2.0` on 2026-06-19T19:01:08.370Z.

These skills were distilled from 4,665 real Claude Fable 5 chain-of-thought traces
and tuned to Grade A (100% emulation accuracy against MiniMax M3).

## Installed skills
- `fable-think` — Foundational per-turn reasoning loop (ACKNOWLEDGE → OBSERVE → EXECUTE → VERIFY)
- `fable-code` — Code writing & editing (Read → Understand → Plan → Write → Verify → Iterate)
- `fable-debug` — Hypothesis-driven root cause analysis (OBSERVE → INVESTIGATE → HYPOTHESIZE → ROOT CAUSE → FIX → VERIFY)
- `fable-architect` — System design via vertical slices (UNDERSTAND → DESIGN → SLICE → VERIFY → ITERATE)
- `fable-verify` — 5-phrase verification vocabulary (should be / to verify / to ensure / to confirm / to make sure)

## Usage
Load the relevant SKILL.md into your agent's context, or reference it from your
system prompt. See https://github.com/Kuberwastaken/fable5-skills for full docs.

## Verify
Run `npx fable5-skills doctor` to re-verify package integrity.
