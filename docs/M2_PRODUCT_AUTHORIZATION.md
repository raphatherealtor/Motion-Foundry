# M2 product edit authorization

Raphael authorized the listed M2 product edits in this topic on 2026-11-10: “[My decision] Authorize listed M2 product edits”.

Create `foundry/m2-renderer` at `db36db39821f46ec4b7057bb431ffb9e82473c33`. Existing files authorized for edits:
- src/motion/render/drawDocument.ts
- src/motion/export/pipeline.ts
- src/motion/components/CanvasPreview.tsx

New GPU backend/worker/shader files under src/motion/render/, helpers under src/motion/export/, and separate tests including tests/golden-gpu/ are authorized. Foundry works on m2-gpu-renderer. M0/M1 contracts/tests remain frozen. Canvas2D remains the default. Existing baselines and document schemas are frozen; no push, merge, PR, deploy or spend. Other existing-file paths require review before editing.

Work continues milestone by milestone under the attached M2 specification, committing each stable milestone before the next.
