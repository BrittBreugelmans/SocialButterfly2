---
name: "speckit"
description: "Shortcut for Spec Kit. Usage: /speckit <step> [input]. Forwards to the matching speckit-* skill (constitution, specify, clarify, plan, tasks, analyze, checklist, implement, converge, taskstoissues). Without a step, reports where the project is and suggests the next step."
argument-hint: "<step> [input], e.g. specify Add a contact by scanning a LinkedIn QR code"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

## What to do

This is a router. It does no Spec Kit work itself.

1. Take the first word of the input as the step. Accept all of these forms and
   normalise them to the bare step name: `specify`, `speckit-specify`,
   `speckit.specify`, `/speckit.specify`.
2. Valid steps: `constitution`, `specify`, `clarify`, `plan`, `tasks`, `analyze`,
   `checklist`, `implement`, `converge`, `taskstoissues`.
3. If the step is valid: invoke the skill `speckit-<step>` with the rest of the
   input as its arguments. Follow that skill's instructions exactly.
4. If the input is empty or the step is unknown, do not guess. Instead:
   - Check `.specify/memory/constitution.md`. If it still contains
     placeholders like `[PROJECT_NAME]`, the next step is `constitution`
     (input: `specs/constitution-prompt.md`).
   - Otherwise list the feature folders in `specs/` (e.g. `specs/001-*`) and
     which of `spec.md`, `plan.md`, `tasks.md` each has.
   - Suggest the next step as a ready-to-type command, e.g.
     `/speckit plan` or `/speckit specify <feature description>`.
   - Show the order: constitution → specify → (clarify) → plan → tasks →
     (analyze) → implement.
