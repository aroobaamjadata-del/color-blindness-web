/**
 * colorEngine.js - Color Blindness Simulation Math
 * Exposed as window.colorEngine for UXP compatibility (no ES modules)
 */

window.colorEngine = {

    // Standard RGB-to-LMS cone response matrix (Hunt-Pointer-Estevez)
    rgbToLms: [
        [17.8824,  43.5161, 4.11935],
        [ 3.45565, 27.1554, 3.86714],
        [ 0.02996,  0.18431, 1.46709]
    ],

    // Inverse: LMS back to linear RGB
    lmsToRgb: [
        [ 0.080944, -0.130504,  0.116721],
        [-0.010249,  0.054019, -0.113615],
        [-0.000365, -0.004121,  0.693511]
    ],

    // Dichromat simulation matrices in LMS space
    simulationMatrices: {
        protanopia:   [[0, 2.02344, -2.52581], [0, 1, 0], [0, 0, 1]],
        deuteranopia: [[1, 0, 0], [0.494207, 0, 1.24827], [0, 0, 1]],
        tritanopia:   [[1, 0, 0], [0, 1, 0], [-0.395913, 0.801109, 0]]
    },

    hexToRgb: function(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
        return {
            r: parseInt(h.substring(0,2), 16),
            g: parseInt(h.substring(2,4), 16),
            b: parseInt(h.substring(4,6), 16)
        };
    },

    rgbToHex: function(r, g, b) {
        var hex = function(c) {
            var h = Math.max(0, Math.min(255, Math.round(c))).toString(16);
            return h.length === 1 ? '0'+h : h;
        };
        return ('#' + hex(r) + hex(g) + hex(b)).toUpperCase();
    },

    rgbToHsl: function(rgb) {
        var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max === min) {
            h = 0; s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4; break;
            }
            h = h * 60;
        }
        return { h: h, s: s, l: l };
    },

    hslToRgb: function(hsl) {
        var h = ((hsl.h % 360) + 360) % 360;
        var s = Math.max(0, Math.min(1, hsl.s));
        var l = Math.max(0, Math.min(1, hsl.l));

        if (s === 0) {
            var v = Math.round(l * 255);
            return { r: v, g: v, b: v };
        }

        var c = (1 - Math.abs(2 * l - 1)) * s;
        var hp = h / 60;
        var x = c * (1 - Math.abs((hp % 2) - 1));

        var r1, g1, b1;
        if (hp < 1)      { r1 = c; g1 = x; b1 = 0; }
        else if (hp < 2) { r1 = x; g1 = c; b1 = 0; }
        else if (hp < 3) { r1 = 0; g1 = c; b1 = x; }
        else if (hp < 4) { r1 = 0; g1 = x; b1 = c; }
        else if (hp < 5) { r1 = x; g1 = 0; b1 = c; }
        else             { r1 = c; g1 = 0; b1 = x; }

        var m = l - c / 2;
        return {
            r: Math.round((r1 + m) * 255),
            g: Math.round((g1 + m) * 255),
            b: Math.round((b1 + m) * 255)
        };
    },

    linearize: function(v) {
        v = v / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    },

    delinearize: function(v) {
        var c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1/2.4) - 0.055;
        return Math.round(Math.max(0, Math.min(1, c)) * 255);
    },

    mat3x3: function(m, v) {
        return [
            m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
            m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
            m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]
        ];
    },

    /**
     * Simulate a color as seen by someone with a specific color blindness type.
     * @param {{r,g,b}} rgb   - Input color
     * @param {string}  type  - 'protanopia' | 'deuteranopia' | 'tritanopia'
     * @param {number}  intensity - 0 to 1
     * @returns {{r,g,b}} simulated color
     */
    simulateColor: function(rgb, type, intensity) {
        if (intensity === undefined) intensity = 1.0;
        var mat = this.simulationMatrices[type];
        if (!mat) return rgb;

        var lin = [this.linearize(rgb.r), this.linearize(rgb.g), this.linearize(rgb.b)];
        var lms    = this.mat3x3(this.rgbToLms, lin);
        var simLms = this.mat3x3(mat, lms);
        var simLin = this.mat3x3(this.lmsToRgb, simLms);

        var sr = this.delinearize(simLin[0]);
        var sg = this.delinearize(simLin[1]);
        var sb = this.delinearize(simLin[2]);

        return {
            r: rgb.r + (sr - rgb.r) * intensity,
            g: rgb.g + (sg - rgb.g) * intensity,
            b: rgb.b + (sb - rgb.b) * intensity
        };
    },

    colorDistance: function(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    },

    /**
     * Find color pairs that become confused after simulation.
     * @param {string[]} hexColors - Array of hex colors
     * @param {string}   type      - Color blindness type
     * @param {number}   threshold - Minimum original distance to compare (default 30)
     * @returns {object[]} Array of conflict objects
     */
    detectProblematicPairs: function(hexColors, type, threshold) {
        if (!threshold) threshold = 30;
        var self = this;
        var cache = {};

        hexColors.forEach(function(hex) {
            var rgb = self.hexToRgb(hex);
            cache[hex] = { orig: rgb, sim: self.simulateColor(rgb, type) };
        });

        var conflicts = [];
        for (var i = 0; i < hexColors.length; i++) {
            for (var j = i + 1; j < hexColors.length; j++) {
                var a = cache[hexColors[i]];
                var b = cache[hexColors[j]];
                var origDist = self.colorDistance(a.orig, b.orig);
                if (origDist > threshold) {
                    var simDist = self.colorDistance(a.sim, b.sim);
                    if (simDist < threshold) {
                        conflicts.push({
                            color1: hexColors[i],
                            color2: hexColors[j],
                            originalDistance: Math.round(origDist),
                            simulatedDistance: Math.round(simDist),
                            severity: simDist < threshold / 2 ? 'high' : 'medium'
                        });
                    }
                }
            }
        }
        return conflicts;
    },

    /**
     * Produce a "corrected" candidate color that remains more distinct from `otherHex`
     * when viewed under `type` simulation. This is a best-effort heuristic.
     *
     * Strategy: rotate hue in steps, then nudge lightness if needed.
     */
    suggestCorrection: function(baseHex, otherHex, type, opts) {
        opts = opts || {};
        var threshold = opts.threshold || 30;
        var minContrast = opts.minContrast || 4.5;
        var intensity = opts.intensity === undefined ? 1.0 : opts.intensity;

        var baseRgb = this.hexToRgb(baseHex);
        var otherRgb = this.hexToRgb(otherHex);
        var baseHsl = this.rgbToHsl(baseRgb);

        var best = null;
        var bestScore = -Infinity;

        // Try hue rotations first.
        var hueSteps = [15, 30, 45, 60, 75, 90, 120, 150, 180];
        var lightSteps = [0, 0.08, -0.08, 0.15, -0.15, 0.25, -0.25];

        for (var i = 0; i < hueSteps.length; i++) {
            for (var dir = -1; dir <= 1; dir += 2) {
                for (var j = 0; j < lightSteps.length; j++) {
                    var candHsl = {
                        h: baseHsl.h + dir * hueSteps[i],
                        s: baseHsl.s,
                        l: Math.max(0.05, Math.min(0.95, baseHsl.l + lightSteps[j]))
                    };
                    var candRgb = this.hslToRgb(candHsl);

                    var simCand = this.simulateColor(candRgb, type, intensity);
                    var simOther = this.simulateColor(otherRgb, type, intensity);

                    var simDist = this.colorDistance(simCand, simOther);

                    // Use contrastChecker if available to bias toward higher contrast too.
                    var candHex = this.rgbToHex(candRgb.r, candRgb.g, candRgb.b);
                    var contrastOk = true;
                    var contrastRatio = 0;
                    try {
                        if (window.contrastChecker && window.contrastChecker.ratio) {
                            contrastRatio = window.contrastChecker.ratio(candHex, otherHex);
                            contrastOk = contrastRatio >= minContrast;
                        }
                    } catch (e) {
                        contrastOk = true;
                    }

                    // Score: prioritize simulation distance, then contrast.
                    var score = simDist + (contrastOk ? 1000 : 0) + contrastRatio;

                    if (simDist >= threshold && contrastOk) {
                        return { hex: candHex, simulatedDistance: simDist, contrastRatio: contrastRatio };
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        best = { hex: candHex, simulatedDistance: simDist, contrastRatio: contrastRatio };
                    }
                }
            }
        }

        // Fallback: return best effort even if thresholds not met.
        return best || { hex: baseHex, simulatedDistance: 0, contrastRatio: 0 };
    }
};
