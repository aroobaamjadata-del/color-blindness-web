/**
 * contrastChecker.js - WCAG 2.1 Contrast Ratio Calculator
 * Exposed as window.contrastChecker for UXP compatibility (no ES modules)
 */

window.contrastChecker = {

    hexToRgb: function(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
        return {
            r: parseInt(h.substring(0,2), 16),
            g: parseInt(h.substring(2,4), 16),
            b: parseInt(h.substring(4,6), 16)
        };
    },

    /**
     * Relative luminance as defined by WCAG 2.1
     * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
     */
    luminance: function(rgb) {
        var linearize = function(v) {
            v = v / 255;
            return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * linearize(rgb.r) +
               0.7152 * linearize(rgb.g) +
               0.0722 * linearize(rgb.b);
    },

    /**
     * Contrast ratio between two colors.
     * @param {string|{r,g,b}} fg - Foreground color
     * @param {string|{r,g,b}} bg - Background color
     * @returns {number} contrast ratio (e.g. 4.5)
     */
    ratio: function(fg, bg) {
        var c1 = typeof fg === 'string' ? this.hexToRgb(fg) : fg;
        var c2 = typeof bg === 'string' ? this.hexToRgb(bg) : bg;
        var l1 = this.luminance(c1);
        var l2 = this.luminance(c2);
        var lighter = Math.max(l1, l2);
        var darker  = Math.min(l1, l2);
        var r = (lighter + 0.05) / (darker + 0.05);
        return Math.round(r * 100) / 100;
    },

    /**
     * Full WCAG AA / AAA evaluation.
     * @param {string|{r,g,b}} fg
     * @param {string|{r,g,b}} bg
     * @param {boolean} largeText - true for 18pt+ / 14pt+ bold text
     * @returns {object} { ratio, ratioString, AA, AAA, status }
     */
    check: function(fg, bg, largeText) {
        var r = this.ratio(fg, bg);
        var aa, aaa;
        if (largeText) {
            aa  = r >= 3.0;
            aaa = r >= 4.5;
        } else {
            aa  = r >= 4.5;
            aaa = r >= 7.0;
        }
        return {
            foreground:  fg,
            background:  bg,
            ratio:       r,
            ratioString: r + ':1',
            AA:          aa,
            AAA:         aaa,
            largeText:   !!largeText,
            status:      aaa ? 'AAA ✓' : aa ? 'AA ✓' : 'Fail ✗'
        };
    }
};
