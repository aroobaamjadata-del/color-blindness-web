/**
 * colorSwap.js
 * Perceptual color swap utility tuned for interactive canvas editing.
 * Exposed as window.colorSwap for compatibility with current script loading.
 */
(function () {
    "use strict";

    function clampByte(n) {
        if (n < 0) return 0;
        if (n > 255) return 255;
        return n | 0;
    }

    function clampTolerance(t) {
        if (!isFinite(t)) return 20;
        if (t < 0) return 0;
        if (t > 100) return 100;
        return t;
    }

    /**
     * Redmean perceptual distance upper bound approximation.
     * Keeps tolerance behavior consistent and predictable on 0..100.
     */
    var MAX_PERCEPTUAL_DIST = 650000;

    function toleranceToPerceptualThreshold(tolerance) {
        var t = clampTolerance(tolerance) / 100;
        // Squared response gives strict low end and gradual broadening at high end.
        var shaped = t * t;
        return shaped * MAX_PERCEPTUAL_DIST;
    }

    /**
     * Approximation of perceptual distance in RGB space (redmean model).
     * Returns squared-like scalar metric (no sqrt needed).
     */
    function perceptualDistance(r, g, b, sr, sg, sb) {
        var dr = r - sr;
        var dg = g - sg;
        var db = b - sb;
        var rMean = (r + sr) >> 1;
        return (((512 + rMean) * dr * dr) >> 8) + (4 * dg * dg) + (((767 - rMean) * db * db) >> 8);
    }

    function normalizeRgb(rgb) {
        if (!rgb) return { r: 0, g: 0, b: 0 };
        return {
            r: clampByte(rgb.r),
            g: clampByte(rgb.g),
            b: clampByte(rgb.b)
        };
    }

    window.colorSwap = {
        /**
         * Applies in-place color swap to destination data.
         * @param {Uint8ClampedArray} src Source RGBA data.
         * @param {Uint8ClampedArray} dst Destination RGBA data.
         * @param {{sourceColor:{r:number,g:number,b:number},targetColor:{r:number,g:number,b:number},tolerance:number,enabled:boolean}} options
         */
        applyToRgba: function (src, dst, options) {
            if (!src || !dst || src.length !== dst.length) return;
            var enabled = !options || options.enabled !== false;
            if (!enabled) {
                for (var c = 0; c < src.length; c++) dst[c] = src[c];
                return;
            }

            var source = normalizeRgb(options.sourceColor);
            var target = normalizeRgb(options.targetColor);
            var threshold = toleranceToPerceptualThreshold(options.tolerance);
            var sr = source.r, sg = source.g, sb = source.b;
            var tr = target.r, tg = target.g, tb = target.b;
            var exactOnly = threshold <= 0;
            var noOpSwap = sr === tr && sg === tg && sb === tb;

            if (noOpSwap) {
                for (var j = 0; j < src.length; j++) dst[j] = src[j];
                return;
            }

            for (var i = 0; i < src.length; i += 4) {
                var a = src[i + 3];
                if (a === 0) {
                    dst[i] = src[i];
                    dst[i + 1] = src[i + 1];
                    dst[i + 2] = src[i + 2];
                    dst[i + 3] = a;
                    continue;
                }

                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                var match = false;
                if (exactOnly) {
                    match = (r === sr && g === sg && b === sb);
                } else {
                    match = perceptualDistance(r, g, b, sr, sg, sb) <= threshold;
                }

                if (match) {
                    dst[i] = tr;
                    dst[i + 1] = tg;
                    dst[i + 2] = tb;
                } else {
                    dst[i] = r;
                    dst[i + 1] = g;
                    dst[i + 2] = b;
                }
                dst[i + 3] = a;
            }
        }
    };
})();
