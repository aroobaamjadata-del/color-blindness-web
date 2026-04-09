/**
 * textureOverlay.js
 * Non-destructive texture overlays for canvas previews.
 * Exposed as window.textureOverlay for compatibility with existing script loading.
 */
(function () {
    "use strict";

    function makeCacheKey(type, width, height) {
        return type + ":" + width + "x" + height;
    }

    function createPatternCanvas(width, height, type) {
        var off = document.createElement("canvas");
        off.width = width;
        off.height = height;
        var pctx = off.getContext("2d");
        if (!pctx) return off;

        pctx.clearRect(0, 0, width, height);
        pctx.strokeStyle = "rgba(255,255,255,1)";
        pctx.fillStyle = "rgba(255,255,255,1)";
        pctx.lineWidth = 1;

        var step = Math.max(8, Math.round(Math.min(width, height) / 42));

        if (type === "dots") {
            var radius = Math.max(1, Math.floor(step / 6));
            var gap = step;
            for (var y = Math.floor(gap / 2); y < height; y += gap) {
                for (var x = Math.floor(gap / 2); x < width; x += gap) {
                    pctx.beginPath();
                    pctx.arc(x, y, radius, 0, Math.PI * 2);
                    pctx.fill();
                }
            }
            return off;
        }

        if (type === "grid") {
            for (var gy = 0; gy <= height; gy += step) {
                pctx.beginPath();
                pctx.moveTo(0, gy + 0.5);
                pctx.lineTo(width, gy + 0.5);
                pctx.stroke();
            }
            for (var gx = 0; gx <= width; gx += step) {
                pctx.beginPath();
                pctx.moveTo(gx + 0.5, 0);
                pctx.lineTo(gx + 0.5, height);
                pctx.stroke();
            }
            return off;
        }

        /* default: stripes */
        var stripeGap = step;
        for (var i = -height; i < width; i += stripeGap) {
            pctx.beginPath();
            pctx.moveTo(i, 0);
            pctx.lineTo(i + height, height);
            pctx.stroke();
        }
        return off;
    }

    var cache = {};

    window.textureOverlay = {
        /**
         * Draw a non-destructive texture overlay on current canvas content.
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} width
         * @param {number} height
         * @param {{type:string,intensity:number}} options
         */
        apply: function (ctx, width, height, options) {
            if (!ctx || !width || !height) return;
            var type = (options && options.type) || "none";
            var intensity = options && typeof options.intensity === "number" ? options.intensity : 0;
            if (type === "none" || intensity <= 0) return;

            var clampedIntensity = Math.max(0, Math.min(1, intensity));
            var key = makeCacheKey(type, width, height);
            if (!cache[key]) {
                cache[key] = createPatternCanvas(width, height, type);
            }

            ctx.save();
            ctx.globalAlpha = clampedIntensity;
            ctx.drawImage(cache[key], 0, 0);
            ctx.restore();
        },

        clearCache: function () {
            cache = {};
        }
    };
})();
