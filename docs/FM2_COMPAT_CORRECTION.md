# Approved FM2.1 compat correction

Source: Raphael's instruction in this topic, 2026-11-10.

Compat preserves every legacy Canvas draw call in order, with its original opacity and blend. Each fill/stroke/other paint call is uploaded and GPU-composited separately. Flatten only at actual legacy isolation boundaries, documented individually. Linear-mode optimization is deferred.

Compat parity is now **pixel-for-pixel exact**, superseding M2 §5.2's provisional tolerance table and tolerance calibration for compat. Preserve the overlap discriminator as a permanent regression with fixed legacy pixels. Run five fresh launches and the full suite before committing a completed FM2.1 milestone. Existing product edit authorization remains valid.
