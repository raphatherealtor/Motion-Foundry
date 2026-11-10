# Motion Suite — Recipe Starter Pack (v1)

Source: styles we have actually produced and approved (Mommy Issues journal collage, Dating Games editorial collage, Vox-style documentary explainer work, Miami Property Noir dossier, Observer Paradox case-file look). Each recipe is a named, parameterised move that compiles to ordinary layers/masks/keyframes/camera, stays undoable, and can be anchored to narration words (M3).

## Global rules every recipe obeys
- Timing in seconds; optional `anchor: {word, offset}` (land on or ≤0.2 s before the word, never >0.5 s early).
- Safe area 1080×1920: x 90–990, y 200–1720, checked through camera moves.
- Text reveals whole words (fade + 8–12 px rise); never left-to-right clip wipes that show half-letters.
- One primary attention target per shot; one camera move per hold; nothing animates constantly.
- No blank/flash frames: incoming layer must be fully in place before outgoing layer leaves.
- `preserve_occlusion: true` default — covered/missing eyes, faces, ears in source art are never filled or uncovered.
- Torn edges are generated per instance (seeded random deckle), never repeated back-to-back.

---

## A. Paper collage family

### 1. `collage.build`
Assemble an image or scene as separate cut-paper layers on a desk.
Params: `layers[]` (bg, figures, cutouts, details), `order` (bg→figures→cutouts→details), `stagger` 0.15–0.35 s, `drop` (overshoot 4–8%, settle), `shadow` 6–14 px, `parallax` 0.00–0.04 depth spread, `edge: torn|cut|serrated`.
Compiles to: cloned image layers with clip-path/mask per region, staggered scale/translate/opacity keys, per-layer drop shadows, z-depth.

### 2. `collage.disassemble`
Reverse of build (details lift, figures peel, bg strips tear away). Used for outros and as half of a swap.

### 3. `transition.tear_away`
Current composite rips along a jagged line; top piece curls and peels off with shadow, revealing the next already underneath.
Params: `direction`, `tear_angle`, `curl` 0–25°, `duration` 0.35–0.6 s, `edge_seed`, `fiber_rim` 2–3 px.

### 4. `transition.through_cutout`
Camera pushes into a hole (missing eyes/face/silhouette cutout); next scene is visible inside; hole tears outward into pieces that fall away.
Params: `cutout_mask` (layer ref), `push` 1.0→2.5×, `open_style: tear|serrate|iris_rip`.
Must keep the source occlusion intact until the frame is fully replaced.

### 5. `transition.strip_rebuild`
Next image arrives as 3–6 torn strips laid over the old; seams remain faintly visible.
Params: `count`, `orientation: vertical|diagonal|horizontal`, `stagger`, `seam_opacity`.

### 6. `transition.patch_over`
Torn scraps of next image are taped (stamped, not slid) over the old until covered.
Params: `patches` 4–9, `tape: true`, `stamp_scale` 1.06→1.0.

### 7. `transition.rip_split`
Image rips down the middle; halves pull apart like a page.
Params: `axis`, `gap_speed`, `jaggedness`.

### 8. `edge.serrated` / `edge.deckle` / `edge.scissor_cut` (mask generators)
Reusable masks: pinking-shear zigzag, torn deckle with fibers, clean scissor cut with slight wobble. Inputs: path or bounds, amplitude, frequency, seed.

### 9. `ink.word_reveal`
Handwritten text (Caveat) revealed word by word, ink colour #241c20 / #6e2a3a; optional underline stroke drawn after the word lands.

### 10. `slip.typed` / `slip.ransom`
Typed slips (Special Elite on torn cream #efe4d2) and ransom-letter words (mixed cut letters) that stamp down with a soft shadow; ransom = withheld connection, not crime.

### 11. `montage.hold`
Full collage hold with one motivated camera move (push, drift, truck) + layer parallax, 3–6 s.

---

## B. Magazine editorial family (Dating Games)

### 12. `editorial.spread_open`
Magazine spread opens: page turns or slides in; headline set in large serif with tracking tighten; pull-quote and folio arrive.

### 13. `editorial.cutout_pop`
Subject cut around silhouette lifts off a printed page (shadow grows, slight rotation), sits over bold colour block or halftone.

### 14. `editorial.halftone_wipe`
Colour/halftone block reveals behind subject on an angled edge; print-registration offset accent.

### 15. `editorial.callout`
Label/annotation with leader line draws from subject to a caption box, caption words reveal.

### 16. `editorial.page_flip_cut`
Scene change via quick page flip or paper slide, keeping editorial grid.

---

## C. Vox-style documentary family

### 17. `doc.spine_track`
Continuous visible spine (line/thread/timeline) across a long canvas; camera tracks along it while scenes build at nodes.
Params: `path`, `nodes[]` with anchors, `track_ease`, `node_build` (recipe ref).

### 18. `doc.map_highlight`
Map or diagram region highlights, labels slide in, connective lines draw between points.

### 19. `doc.chart_build`
Bar/line/number charts build from data with value counters; key value emphasised; source line at bottom.

### 20. `doc.document_zoom`
Archival document/photo pushes in; highlighter or red-pencil marks key phrase; quote enlarges as pull-quote.

### 21. `doc.cutpaper_diagram`
Concept diagrams as cut-paper shapes on notebook page (scales, arrows, loops, tags) connected by thread; each piece stamps in on its word.

### 22. `doc.lower_third` / `doc.pip_pocket`
Presenter lower third and corner pocket / PiP frame for talking-head segments.

### 23. `doc.chapter_card`
Chapter card (e.g., serif "CASE FILE" / ransom title) with assemble-in and tear-out.

---

## D. Dossier / noir & case-file family (Miami Property Noir, Observer Paradox)

### 24. `dossier.tag_track`
Evidence tags and labels pinned to moving subjects with depth-tracked strings.

### 25. `casefile.laser_nodes`
Signal-red laser lines connect glowing nodes over dark stone; glass-box nesting push-ins.

---

## Priority to build first
1. `collage.build` + `edge.deckle/serrated/scissor_cut` mask generator
2. `transition.tear_away`, `transition.through_cutout`, `transition.strip_rebuild`
3. `ink.word_reveal`, `slip.typed/ransom`, `montage.hold`
4. `doc.spine_track`, `doc.cutpaper_diagram`, `doc.document_zoom`
5. Editorial family
6. Dossier/case-file family

## Render self-checks each recipe should report
flash (luma jump), blank frames, text outside safe area, half-revealed words at holds, occlusion altered, repeated tear seeds.
