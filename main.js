(function () {
    if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.classList.add("vx-js");
    }

    function visionxSiteMotionInit() {
        var ioOpts = { threshold: 0.15 };
        if ("IntersectionObserver" in window) {
            var scrollObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        scrollObs.unobserve(entry.target);
                    }
                });
            }, ioOpts);
            document.querySelectorAll(".anim-fadeup, .anim-fadein, .anim-scalein, .anim-stagger").forEach(function (el) {
                scrollObs.observe(el);
            });
        } else {
            document.querySelectorAll(".anim-fadeup, .anim-fadein, .anim-scalein, .anim-stagger").forEach(function (el) {
                el.classList.add("is-visible");
            });
        }

        var wrap = document.querySelector(".vx-nav-wrap");
        var toggle = document.querySelector(".vx-nav-toggle");
        if (wrap && toggle) {
            var backdrop = document.getElementById("vx-nav-backdrop");
            if (!backdrop) {
                backdrop = document.createElement("div");
                backdrop.id = "vx-nav-backdrop";
                backdrop.className = "vx-nav-backdrop";
                backdrop.setAttribute("aria-hidden", "true");
                wrap.parentNode.insertBefore(backdrop, wrap.nextSibling);
            }
            backdrop.addEventListener("click", function () {
                wrap.classList.remove("vx-nav-wrap--open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-label", "Open menu");
            });
            toggle.addEventListener("click", function () {
                window.setTimeout(function () {
                    var open = wrap.classList.contains("vx-nav-wrap--open");
                    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
                }, 0);
            });
        }

        var hero = document.querySelector(".hero-section");
        if (hero && window.matchMedia && !window.matchMedia("(max-width: 767px)").matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            var glow = document.createElement("div");
            glow.className = "cursor-glow";
            glow.setAttribute("aria-hidden", "true");
            hero.appendChild(glow);
            hero.addEventListener("mousemove", function (e) {
                var rect = hero.getBoundingClientRect();
                glow.style.left = e.clientX - rect.left + "px";
                glow.style.top = e.clientY - rect.top + "px";
            });
        }

        var dl = document.getElementById("downloadBtn");
        if (dl && document.documentElement.getAttribute("data-visionx-tool") === "true") {
            dl.addEventListener("click", function () {
                dl.classList.add("vx-tool-btn-download--flash");
                window.setTimeout(function () {
                    dl.classList.remove("vx-tool-btn-download--flash");
                }, 320);
                var ico = dl.querySelector(".vx-tool-btn-ico");
                if (ico) {
                    ico.classList.add("vx-tool-btn-ico--bounce");
                    window.setTimeout(function () {
                        ico.classList.remove("vx-tool-btn-ico--bounce");
                    }, 320);
                }
            });
        }

    }

    var docEl = typeof document !== "undefined" && document.documentElement;
    var isMarketing = docEl && docEl.getAttribute("data-visionx-marketing") === "true";
    var isTool = docEl && docEl.getAttribute("data-visionx-tool") === "true";
    var isContact = docEl && docEl.getAttribute("data-visionx-contact") === "true";
    var isPluginPage = docEl && docEl.getAttribute("data-visionx-plugin") === "true";
    var isAbout = docEl && docEl.getAttribute("data-visionx-about") === "true";

    if (isMarketing || isTool || isContact || isPluginPage || isAbout) {
        document.addEventListener("DOMContentLoaded", function () {
            visionxSiteMotionInit();
            if (isMarketing) visionxMarketingInit();
            if (isTool) visionXToolInit();
            if (isAbout) visionxAboutInit();
        });
    }

    function visionxMarketingInit() {
        var heroCv = document.getElementById("vx-hero-canvas");
        if (heroCv && window.colorEngine && window.colorEngine.simulateColor) {
            var ctx = heroCv.getContext("2d");
            var img = new Image();
            img.onload = function () {
                var w = heroCv.width;
                var h = heroCv.height;
                ctx.drawImage(img, 0, 0, w, h);
                var leftW = Math.floor(w / 2);
                try {
                    var full = ctx.getImageData(0, 0, w, h);
                    var d = full.data;
                    var ce = window.colorEngine;
                    for (var py = 0; py < h; py++) {
                        for (var px = leftW; px < w; px++) {
                            var i = (py * w + px) * 4;
                            var rgb = ce.simulateColor({ r: d[i], g: d[i + 1], b: d[i + 2] }, "protanopia", 1);
                            d[i] = Math.round(rgb.r);
                            d[i + 1] = Math.round(rgb.g);
                            d[i + 2] = Math.round(rgb.b);
                        }
                    }
                    ctx.putImageData(full, 0, 0);
                } catch (e) {
                    /* canvas taint or other */
                }
            };
            img.onerror = function () {
                var w = heroCv.width;
                var h = heroCv.height;
                var lw = Math.floor(w / 2);
                ctx.fillStyle = "#2a2a38";
                ctx.fillRect(0, 0, lw, h);
                ctx.fillStyle = "#222230";
                ctx.fillRect(lw, 0, w - lw, h);
            };
            img.src = "assets/images/sample.png";
        }

        var revealEls = document.querySelectorAll(".vx-reveal");
        if (revealEls.length && "IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) {
                        en.target.classList.add("vx-reveal--visible");
                    }
                });
            }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
            for (var r = 0; r < revealEls.length; r++) {
                io.observe(revealEls[r]);
            }
        } else if (revealEls.length) {
            for (var rr = 0; rr < revealEls.length; rr++) {
                revealEls[rr].classList.add("vx-reveal--visible");
            }
        }

        var statsDone = false;
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        function runCounter(el, end, suffix, duration) {
            if (!el) return;
            var startTime = null;
            function frame(ts) {
                if (startTime === null) startTime = ts;
                var p = Math.min(1, (ts - startTime) / duration);
                var v = Math.round(easeOutCubic(p) * end);
                el.textContent = v + (suffix || "");
                if (p < 1) requestAnimationFrame(frame);
                else el.textContent = end + (suffix || "");
            }
            requestAnimationFrame(frame);
        }

        var statSection = document.getElementById("vx-stats");
        if (statSection && "IntersectionObserver" in window) {
            var ioStats = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting || statsDone) return;
                    statsDone = true;
                    var nums = statSection.querySelectorAll(".vx-stat-num[data-vx-count]");
                    for (var i = 0; i < nums.length; i++) {
                        var el = nums[i];
                        var end = parseInt(el.getAttribute("data-vx-count"), 10);
                        var suffix = el.getAttribute("data-vx-suffix") || "";
                        if (!isFinite(end)) continue;
                        runCounter(el, end, suffix, 1000 + i * 80);
                    }
                });
            }, { threshold: 0.25 });
            ioStats.observe(statSection);
        }

        var triggers = document.querySelectorAll(".vx-faq-trigger");
        for (var f = 0; f < triggers.length; f++) {
            triggers[f].addEventListener("click", function () {
                var item = this.closest(".vx-faq-item");
                var panel = item ? item.querySelector(".vx-faq-panel") : null;
                var open = item && !item.classList.contains("vx-faq-item--open");
                var all = document.querySelectorAll(".vx-faq-item");
                for (var j = 0; j < all.length; j++) {
                    all[j].classList.remove("vx-faq-item--open");
                    var b = all[j].querySelector(".vx-faq-trigger");
                    var p = all[j].querySelector(".vx-faq-panel");
                    if (b) b.setAttribute("aria-expanded", "false");
                    if (p) p.setAttribute("aria-hidden", "true");
                }
                if (open && item) {
                    item.classList.add("vx-faq-item--open");
                    this.setAttribute("aria-expanded", "true");
                    if (panel) panel.setAttribute("aria-hidden", "false");
                }
            });
        }
    }

    function visionXToolInit() {
        "use strict";

        var fileInput = document.getElementById("fileInput");
        var dropZone = document.getElementById("dropZone");
        var browseBtn = document.getElementById("browseBtn");
        var uploadPrompt = document.getElementById("uploadPrompt");
        var uploadThumbWrap = document.getElementById("uploadThumbWrap");
        var uploadThumb = document.getElementById("uploadThumb");
        var uploadError = document.getElementById("uploadError");
        var typeSelect = document.getElementById("typeSelect");
        var modePills = document.getElementById("modePills");
        var intensity = document.getElementById("intensity");
        var intensityVal = document.getElementById("intensityVal");
        var sourceColorInput = document.getElementById("sourceColor");
        var targetColorInput = document.getElementById("targetColor");
        var colorToleranceInput = document.getElementById("colorTolerance");
        var colorToleranceVal = document.getElementById("colorToleranceVal");
        var hueShiftInput = document.getElementById("hueShift");
        var hueShiftVal = document.getElementById("hueShiftVal");
        var luminanceContrastInput = document.getElementById("luminanceContrast");
        var luminanceContrastVal = document.getElementById("luminanceContrastVal");
        var enableColorSwapInput = document.getElementById("enableColorSwap");
        var sourceColorPreview = document.getElementById("sourceColorPreview");
        var targetColorPreview = document.getElementById("targetColorPreview");
        var sourceColorHex = document.getElementById("sourceColorHex");
        var targetColorHex = document.getElementById("targetColorHex");
        var colorPresetList = document.getElementById("colorPresetList");
        var pickSourceColorBtn = document.getElementById("pickSourceColorBtn");
        var textureType = document.getElementById("textureType");
        var textureIntensity = document.getElementById("textureIntensity");
        var textureIntensityVal = document.getElementById("textureIntensityVal");
        var compareBtn = document.getElementById("compareBtn");
        var compareBtnLabel = document.getElementById("compareBtnLabel");
        var downloadBtn = document.getElementById("downloadBtn");
        var resetBtn = document.getElementById("resetBtn");
        var toolCanvas = document.getElementById("toolCanvas");
        var emptyState = document.getElementById("emptyState");
        var emptyUploadBtn = document.getElementById("emptyUploadBtn");
        var canvasInner = document.getElementById("canvasInner");
        var canvasPanel = document.getElementById("canvasPanel");
        var processingIndicator = document.getElementById("processingIndicator");
        var imageInfo = document.getElementById("imageInfo");
        var imageFileName = document.getElementById("imageFileName");
        var imageDims = document.getElementById("imageDims");
        var modeLabelText = document.getElementById("modeLabelText");
        var modeLabelDot = document.getElementById("modeLabelDot");
        var contrastFgSwatch = document.getElementById("contrastFgSwatch");
        var contrastBgSwatch = document.getElementById("contrastBgSwatch");
        var contrastFgHex = document.getElementById("contrastFgHex");
        var contrastBgHex = document.getElementById("contrastBgHex");
        var contrastRatio = document.getElementById("contrastRatio");
        var contrastBadge = document.getElementById("contrastBadge");
        var contrastHint = document.getElementById("contrastHint");
        var toolSidebar = document.getElementById("toolSidebar");
        var controlsToggle = document.getElementById("controlsToggle");

        if (!toolCanvas || !window.colorEngine || !window.colorEngine.simulateColor) return;

        var colorPresets = [
            { name: "Digital Azure", color: "#3B82F6" },
            { name: "Onyx Surface", color: "#131313" },
            { name: "Danger", color: "#FF5451" },
            { name: "Warning", color: "#FFB347" },
            { name: "Success", color: "#4D8EFF" }
        ];

        var ctx = toolCanvas.getContext("2d", { willReadFrequently: true });
        var originalImageData = null;
        var workImageData = null;
        var swapImageData = null;
        var loadedFileName = "";
        var objectUrl = null;
        var simGeneration = 0;
        var comparing = false;
        var contrastPhase = 0;
        var fgRgb = null;
        var bgRgb = null;
        var uploadErrorTimer = null;
        var spaceCompareHeld = false;
        var applyRafTicket = 0;
        var colorSwapState = {
            enabled: true,
            sourceColor: { r: 255, g: 0, b: 0 },
            targetColor: { r: 0, g: 0, b: 255 },
            tolerance: 20,
            activePreset: null
        };
        var processingState = {
            hueShift: 0,
            contrast: 0
        };
        var pickingSourceColor = false;

        var ALLOWED_TYPES = {
            "image/png": true,
            "image/jpeg": true,
            "image/webp": true,
            "image/gif": true
        };

        var MODE_LABELS = {
            normal: "Normal Vision",
            protanopia: "Protanopia",
            deuteranopia: "Deuteranopia",
            tritanopia: "Tritanopia"
        };
        var MODE_DOT_CLASS = {
            normal: "vx-tool-mode-dot--gray",
            protanopia: "vx-tool-mode-dot--red",
            deuteranopia: "vx-tool-mode-dot--green",
            tritanopia: "vx-tool-mode-dot--blue"
        };

        function showUploadError(msg) {
            if (!uploadError) {
                window.alert(msg);
                return;
            }
            uploadError.textContent = msg;
            uploadError.hidden = false;
            if (uploadErrorTimer) clearTimeout(uploadErrorTimer);
            uploadErrorTimer = setTimeout(function () {
                uploadError.hidden = true;
                uploadErrorTimer = null;
            }, 3000);
        }

        function showProcessing() {
            if (processingIndicator) processingIndicator.hidden = false;
        }

        function hideProcessing() {
            if (processingIndicator) processingIndicator.hidden = true;
        }

        function syncIntensityLabel() {
            if (intensityVal && intensity) intensityVal.textContent = intensity.value + "%";
        }

        function syncTextureIntensityLabel() {
            if (!textureIntensity || !textureIntensityVal) return;
            textureIntensityVal.textContent = Number(textureIntensity.value).toFixed(2);
        }

        function syncToleranceLabel() {
            if (!colorToleranceInput || !colorToleranceVal) return;
            colorToleranceVal.textContent = String(parseInt(colorToleranceInput.value, 10) || 0);
        }

        function syncHueLabel() {
            if (!hueShiftInput || !hueShiftVal) return;
            var v = parseInt(hueShiftInput.value, 10) || 0;
            hueShiftVal.textContent = v + "°";
        }

        function syncContrastLabel() {
            if (!luminanceContrastInput || !luminanceContrastVal) return;
            var v = parseInt(luminanceContrastInput.value, 10) || 0;
            luminanceContrastVal.textContent = String(v);
        }

        function getProcessingSettings() {
            var h = hueShiftInput ? parseInt(hueShiftInput.value, 10) : 0;
            var c = luminanceContrastInput ? parseInt(luminanceContrastInput.value, 10) : 0;
            if (!isFinite(h)) h = 0;
            if (!isFinite(c)) c = 0;
            if (h < -180) h = -180;
            if (h > 180) h = 180;
            if (c < -100) c = -100;
            if (c > 100) c = 100;
            processingState.hueShift = h;
            processingState.contrast = c;
            return {
                hueShift: h,
                contrast: c
            };
        }

        function hexToRgbSafe(hex, fallback) {
            if (window.colorEngine && window.colorEngine.hexToRgb) {
                try {
                    var rgb = window.colorEngine.hexToRgb(hex);
                    if (isFinite(rgb.r) && isFinite(rgb.g) && isFinite(rgb.b)) return rgb;
                } catch (e) {}
            }
            return fallback || { r: 0, g: 0, b: 0 };
        }

        function syncColorSwapStateFromUI() {
            var targetHex = targetColorInput && targetColorInput.value ? targetColorInput.value.toUpperCase() : "#0000FF";
            var matchedPreset = null;
            for (var i = 0; i < colorPresets.length; i++) {
                if (colorPresets[i].color.toUpperCase() === targetHex) {
                    matchedPreset = colorPresets[i];
                    break;
                }
            }
            colorSwapState = {
                enabled: enableColorSwapInput ? !!enableColorSwapInput.checked : true,
                sourceColor: hexToRgbSafe(sourceColorInput ? sourceColorInput.value : "#ff0000", { r: 255, g: 0, b: 0 }),
                targetColor: hexToRgbSafe(targetColorInput ? targetColorInput.value : "#0000ff", { r: 0, g: 0, b: 255 }),
                tolerance: colorToleranceInput ? Math.max(0, Math.min(100, parseInt(colorToleranceInput.value, 10) || 0)) : 20,
                activePreset: matchedPreset ? { name: matchedPreset.name, color: matchedPreset.color } : null
            };
        }

        function syncColorPreviewUI() {
            var sourceHex = sourceColorInput && sourceColorInput.value ? sourceColorInput.value.toUpperCase() : "#FF0000";
            var targetHex = targetColorInput && targetColorInput.value ? targetColorInput.value.toUpperCase() : "#0000FF";
            if (sourceColorPreview) sourceColorPreview.style.background = sourceHex;
            if (targetColorPreview) targetColorPreview.style.background = targetHex;
            if (sourceColorHex) sourceColorHex.textContent = sourceHex;
            if (targetColorHex) targetColorHex.textContent = targetHex;
        }

        function syncPickSourceColorButton() {
            if (!pickSourceColorBtn) return;
            if (pickingSourceColor) {
                pickSourceColorBtn.textContent = "Click Image to Pick...";
                pickSourceColorBtn.classList.add("vx-tool-btn-primary");
            } else {
                pickSourceColorBtn.textContent = "Pick Color from Image";
                pickSourceColorBtn.classList.remove("vx-tool-btn-primary");
            }
        }

        function setTargetHex(hex) {
            if (!targetColorInput || !hex) return;
            targetColorInput.value = String(hex).toLowerCase();
        }

        function applyPresetColor(presetColor) {
            setTargetHex(presetColor);
            syncColorSwapStateFromUI();
            syncColorPreviewUI();
            renderPresetCards();
            if (!originalImageData) return;
            cancelCompareOnly();
            scheduleApply();
        }

        function makePresetCard(preset, isActive) {
            var row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "auto 1fr auto";
            row.style.alignItems = "center";
            row.style.gap = "0.5rem";
            row.style.padding = "0.45rem 0.5rem";
            row.style.borderRadius = "10px";
            row.style.background = isActive ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.04)";
            row.style.border = isActive ? "1px solid rgba(59,130,246,0.55)" : "1px solid rgba(255,255,255,0.12)";
            row.style.transition = "background 120ms ease,border-color 120ms ease,transform 120ms ease";

            var swatch = document.createElement("span");
            swatch.style.width = "16px";
            swatch.style.height = "16px";
            swatch.style.borderRadius = "4px";
            swatch.style.display = "inline-block";
            swatch.style.background = preset.color;
            swatch.style.border = "1px solid rgba(255,255,255,0.25)";

            var textWrap = document.createElement("div");
            var name = document.createElement("div");
            name.textContent = preset.name;
            name.style.fontSize = "0.85rem";
            name.style.fontWeight = "600";
            var hex = document.createElement("div");
            hex.textContent = preset.color.toUpperCase();
            hex.style.fontSize = "0.75rem";
            hex.style.color = "#A9A9B2";
            textWrap.appendChild(name);
            textWrap.appendChild(hex);

            var applyBtn = document.createElement("button");
            applyBtn.type = "button";
            applyBtn.className = "vx-tool-btn vx-tool-btn-outline";
            applyBtn.textContent = isActive ? "Applied" : "Apply";
            applyBtn.style.padding = "0.28rem 0.65rem";
            applyBtn.style.minHeight = "0";
            applyBtn.style.fontSize = "0.78rem";
            applyBtn.style.borderColor = isActive ? "rgba(59,130,246,0.7)" : "";
            applyBtn.addEventListener("click", function () {
                applyPresetColor(preset.color);
            });

            row.addEventListener("mouseenter", function () {
                row.style.transform = "translateY(-1px)";
            });
            row.addEventListener("mouseleave", function () {
                row.style.transform = "translateY(0)";
            });

            row.appendChild(swatch);
            row.appendChild(textWrap);
            row.appendChild(applyBtn);
            return row;
        }

        function renderPresetCards() {
            if (!colorPresetList) return;
            colorPresetList.innerHTML = "";
            var activeHex = targetColorInput && targetColorInput.value ? targetColorInput.value.toUpperCase() : "";
            for (var i = 0; i < colorPresets.length; i++) {
                var preset = colorPresets[i];
                var isActive = preset.color.toUpperCase() === activeHex;
                colorPresetList.appendChild(makePresetCard(preset, isActive));
            }
        }

        function getTextureSettings() {
            var type = textureType && textureType.value ? textureType.value : "none";
            var intr = textureIntensity ? parseFloat(textureIntensity.value) : 0;
            if (!isFinite(intr)) intr = 0;
            return {
                type: type,
                intensity: Math.max(0, Math.min(1, intr))
            };
        }

        function applyTextureOverlayToCanvas() {
            if (!window.textureOverlay || !window.textureOverlay.apply) return;
            var t = getTextureSettings();
            window.textureOverlay.apply(ctx, toolCanvas.width, toolCanvas.height, t);
        }

        function getCurrentMode() {
            return typeSelect && typeSelect.value ? typeSelect.value : "normal";
        }

        function setModeUI(mode) {
            if (typeSelect) typeSelect.value = mode;
            var pills = modePills ? modePills.querySelectorAll(".vx-tool-mode-btn") : [];
            for (var i = 0; i < pills.length; i++) {
                var m = pills[i].getAttribute("data-mode");
                var on = m === mode;
                pills[i].classList.toggle("vx-tool-mode-btn--active", on);
                pills[i].setAttribute("aria-pressed", on ? "true" : "false");
            }
            if (modeLabelText) modeLabelText.textContent = MODE_LABELS[mode] || mode;
            if (modeLabelDot) {
                modeLabelDot.className = "vx-tool-mode-dot " + (MODE_DOT_CLASS[mode] || "");
            }
        }

        function updateContrastHint() {
            if (!contrastHint) return;
            if (contrastPhase === 0) contrastHint.textContent = "Click image to set foreground";
            else if (contrastPhase === 1) contrastHint.textContent = "Click image to set background";
            else contrastHint.textContent = "Click to reset and pick new colors";
        }

        function resetContrastUI() {
            contrastPhase = 0;
            fgRgb = null;
            bgRgb = null;
            if (contrastFgSwatch) contrastFgSwatch.style.background = "rgba(255,255,255,0.08)";
            if (contrastBgSwatch) contrastBgSwatch.style.background = "rgba(255,255,255,0.08)";
            if (contrastFgHex) contrastFgHex.textContent = "";
            if (contrastBgHex) contrastBgHex.textContent = "";
            if (contrastRatio) contrastRatio.textContent = "—";
            if (contrastBadge) {
                contrastBadge.textContent = "—";
                contrastBadge.setAttribute("data-state", "neutral");
                contrastBadge.style.color = "";
                contrastBadge.style.background = "";
            }
            updateContrastHint();
        }

        function applyContrastBadge(ratioNum) {
            if (!contrastBadge) return;
            contrastBadge.style.color = "";
            contrastBadge.style.background = "";
            if (ratioNum >= 7) {
                contrastBadge.textContent = "AAA Pass";
                contrastBadge.setAttribute("data-state", "pass");
            } else if (ratioNum >= 4.5) {
                contrastBadge.textContent = "AA Pass";
                contrastBadge.setAttribute("data-state", "pass");
            } else if (ratioNum >= 3) {
                contrastBadge.textContent = "AA Large";
                contrastBadge.setAttribute("data-state", "neutral");
                contrastBadge.style.color = "#FFD60A";
            } else {
                contrastBadge.textContent = "Fail";
                contrastBadge.setAttribute("data-state", "fail");
            }
        }

        function updateContrastFromColors() {
            if (!fgRgb || !bgRgb || !window.contrastChecker) return;
            var hexFg = window.colorEngine.rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
            var hexBg = window.colorEngine.rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
            if (contrastFgSwatch) contrastFgSwatch.style.background = hexFg;
            if (contrastBgSwatch) contrastBgSwatch.style.background = hexBg;
            if (contrastFgHex) contrastFgHex.textContent = hexFg;
            if (contrastBgHex) contrastBgHex.textContent = hexBg;
            var ratioNum = window.contrastChecker.ratio(hexFg, hexBg);
            if (contrastRatio) contrastRatio.textContent = ratioNum + ":1";
            applyContrastBadge(ratioNum);
            contrastPhase = 2;
            updateContrastHint();
        }

        function drawOriginal() {
            if (!originalImageData || !ctx) return;
            ctx.putImageData(originalImageData, 0, 0);
        }

        function copyWithColorSwap(src, dst) {
            if (window.colorSwap && window.colorSwap.applyToRgba) {
                window.colorSwap.applyToRgba(src, dst, {
                    sourceColor: colorSwapState.sourceColor,
                    targetColor: colorSwapState.targetColor,
                    tolerance: colorSwapState.tolerance,
                    enabled: colorSwapState.enabled
                });
                return;
            }
            for (var i = 0; i < src.length; i++) dst[i] = src[i];
        }

        function ensureSwapBuffer(w, h) {
            if (!swapImageData || swapImageData.width !== w || swapImageData.height !== h) {
                swapImageData = ctx.createImageData(w, h);
            }
            return swapImageData.data;
        }

        function clampByte(n) {
            if (n < 0) return 0;
            if (n > 255) return 255;
            return n;
        }

        function applyPostAdjustmentsToCanvasData(data, settings) {
            if (!data || !settings) return;
            var hueShift = settings.hueShift || 0;
            var contrast = settings.contrast || 0;
            if (hueShift === 0 && contrast === 0) return;

            var contrastFactor = 1;
            var doContrast = contrast !== 0;
            if (doContrast) {
                contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            }
            var doHue = hueShift !== 0;

            for (var i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;
                var r = data[i];
                var g = data[i + 1];
                var b = data[i + 2];

                if (doHue) {
                    var hsl = window.colorEngine.rgbToHsl({ r: r, g: g, b: b });
                    hsl.h = (hsl.h + hueShift) % 360;
                    if (hsl.h < 0) hsl.h += 360;
                    var shifted = window.colorEngine.hslToRgb(hsl);
                    r = shifted.r;
                    g = shifted.g;
                    b = shifted.b;
                }

                if (doContrast) {
                    r = clampByte(contrastFactor * (r - 128) + 128);
                    g = clampByte(contrastFactor * (g - 128) + 128);
                    b = clampByte(contrastFactor * (b - 128) + 128);
                }

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        }

        function applyHueShiftToCanvas(data) {
            applyPostAdjustmentsToCanvasData(data, {
                hueShift: getProcessingSettings().hueShift,
                contrast: 0
            });
        }

        function applyContrastToCanvas(data) {
            applyPostAdjustmentsToCanvasData(data, {
                hueShift: 0,
                contrast: getProcessingSettings().contrast
            });
        }

        function applySimulationSync() {
            if (!originalImageData || !ctx) return;
            if (comparing) {
                drawOriginal();
                return;
            }
            var w = originalImageData.width;
            var h = originalImageData.height;
            var type = getCurrentMode();
            var intr = intensity ? parseInt(intensity.value, 10) / 100 : 1;
            var proc = getProcessingSettings();
            var src = originalImageData.data;
            if (!workImageData || workImageData.width !== w || workImageData.height !== h) {
                workImageData = ctx.createImageData(w, h);
            }
            var dst = workImageData.data;
            var swapped = ensureSwapBuffer(w, h);
            copyWithColorSwap(src, swapped);
            if (type === "normal") {
                for (var i = 0; i < swapped.length; i++) dst[i] = swapped[i];
            } else {
                var ce = window.colorEngine;
                for (var p = 0; p < src.length; p += 4) {
                    var rgb = ce.simulateColor({ r: swapped[p], g: swapped[p + 1], b: swapped[p + 2] }, type, intr);
                    dst[p] = Math.round(rgb.r);
                    dst[p + 1] = Math.round(rgb.g);
                    dst[p + 2] = Math.round(rgb.b);
                    dst[p + 3] = swapped[p + 3];
                }
            }
            applyPostAdjustmentsToCanvasData(dst, proc);
            ctx.putImageData(workImageData, 0, 0);
            applyTextureOverlayToCanvas();
        }

        function applySimulationChunked(done) {
            if (!originalImageData || !ctx) {
                if (done) done();
                return;
            }
            if (comparing) {
                drawOriginal();
                if (done) done();
                return;
            }
            var gen = ++simGeneration;
            var w = originalImageData.width;
            var h = originalImageData.height;
            var type = getCurrentMode();
            var intr = intensity ? parseInt(intensity.value, 10) / 100 : 1;
            var proc = getProcessingSettings();
            var src = originalImageData.data;
            if (!workImageData || workImageData.width !== w || workImageData.height !== h) {
                workImageData = ctx.createImageData(w, h);
            }
            var dst = workImageData.data;
            var swapped = ensureSwapBuffer(w, h);
            copyWithColorSwap(src, swapped);
            if (type === "normal") {
                for (var c = 0; c < swapped.length; c++) dst[c] = swapped[c];
                applyPostAdjustmentsToCanvasData(dst, proc);
                if (gen !== simGeneration) return;
                ctx.putImageData(workImageData, 0, 0);
                applyTextureOverlayToCanvas();
                if (done) done();
                return;
            }
            var ce = window.colorEngine;
            var row = 0;
            var rowChunk = Math.max(8, Math.floor(120000 / w));
            function step() {
                if (gen !== simGeneration) return;
                var y1 = Math.min(h, row + rowChunk);
                for (var y = row; y < y1; y++) {
                    var o = y * w * 4;
                    for (var x = 0; x < w; x++) {
                        var idx = o + x * 4;
                        var rgb = ce.simulateColor({ r: swapped[idx], g: swapped[idx + 1], b: swapped[idx + 2] }, type, intr);
                        dst[idx] = Math.round(rgb.r);
                        dst[idx + 1] = Math.round(rgb.g);
                        dst[idx + 2] = Math.round(rgb.b);
                        dst[idx + 3] = swapped[idx + 3];
                    }
                }
                row = y1;
                if (row < h) {
                    requestAnimationFrame(step);
                } else {
                    if (gen !== simGeneration) return;
                    applyPostAdjustmentsToCanvasData(dst, proc);
                    ctx.putImageData(workImageData, 0, 0);
                    applyTextureOverlayToCanvas();
                    if (done) done();
                }
            }
            step();
        }

        /**
         * Coalesce rapid calls: only the latest requestAnimationFrame callback runs runApplyJob.
         * Prevents overlapping chunked jobs from bumping simGeneration and aborting before putImageData.
         */
        function scheduleApply() {
            if (!originalImageData) return;
            applyRafTicket++;
            var ticket = applyRafTicket;
            requestAnimationFrame(function () {
                if (ticket !== applyRafTicket) return;
                runApplyJob();
            });
        }

        function runApplyJob() {
            if (!originalImageData) return;
            var pixels = originalImageData.width * originalImageData.height;
            /* Most photos stay on sync path; chunk only very large canvases */
            if (pixels > 2800000) {
                showProcessing();
                applySimulationChunked(function () {
                    hideProcessing();
                });
            } else {
                showProcessing();
                setTimeout(function () {
                    try {
                        applySimulationSync();
                    } finally {
                        hideProcessing();
                    }
                }, 0);
            }
        }

        function validateImageFile(file) {
            if (!file) return false;
            if (!ALLOWED_TYPES[file.type]) {
                showUploadError("Please upload a PNG, JPG, WebP, or GIF file");
                return false;
            }
            return true;
        }

        function loadImageFile(file) {
            if (!validateImageFile(file)) return;
            if (objectUrl && objectUrl.indexOf("blob:") === 0) {
                URL.revokeObjectURL(objectUrl);
            }
            objectUrl = null;
            loadedFileName = file.name || "image";
            var reader = new FileReader();
            reader.onload = function () {
                var result = reader.result;
                var img = new Image();
                img.onload = function () {
                    var maxW = canvasInner ? canvasInner.clientWidth || 900 : 900;
                    var maxH = Math.min(640, window.innerHeight * 0.55);
                    if (maxW < 200) maxW = 320;
                    var iw = img.naturalWidth;
                    var ih = img.naturalHeight;
                    var scale = Math.min(maxW / iw, maxH / ih, 1);
                    var dw = Math.max(1, Math.round(iw * scale));
                    var dh = Math.max(1, Math.round(ih * scale));
                    toolCanvas.width = dw;
                    toolCanvas.height = dh;
                    ctx = toolCanvas.getContext("2d", { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0, dw, dh);
                    var snap = ctx.getImageData(0, 0, dw, dh);
                    originalImageData = new ImageData(new Uint8ClampedArray(snap.data), dw, dh);
                    workImageData = null;
                    emptyState.hidden = true;
                    canvasInner.hidden = false;
                    canvasPanel.classList.add("vx-tool-canvas-panel--active");
                    uploadPrompt.hidden = true;
                    uploadThumbWrap.hidden = false;
                    objectUrl = result;
                    if (uploadThumb) uploadThumb.src = objectUrl;
                    if (imageInfo) imageInfo.hidden = false;
                    if (imageFileName) imageFileName.textContent = loadedFileName;
                    if (imageDims) imageDims.textContent = dw + " × " + dh + " px";
                    resetContrastUI();
                    scheduleApply();
                };
                img.onerror = function () {
                    showUploadError("Could not load image.");
                };
                img.src = result;
            };
            reader.onerror = function () {
                showUploadError("Could not read file.");
            };
            reader.readAsDataURL(file);
        }

        function resetAll() {
            simGeneration++;
            comparing = false;
            if (compareBtnLabel) compareBtnLabel.textContent = "Hold: Before / After";
            originalImageData = null;
            workImageData = null;
            swapImageData = null;
            if (objectUrl && objectUrl.indexOf("blob:") === 0) {
                URL.revokeObjectURL(objectUrl);
            }
            objectUrl = null;
            if (fileInput) fileInput.value = "";
            ctx.clearRect(0, 0, toolCanvas.width, toolCanvas.height);
            emptyState.hidden = false;
            canvasInner.hidden = true;
            canvasPanel.classList.remove("vx-tool-canvas-panel--active");
            uploadPrompt.hidden = false;
            uploadThumbWrap.hidden = true;
            if (uploadThumb) uploadThumb.removeAttribute("src");
            if (imageInfo) imageInfo.hidden = true;
            if (imageFileName) imageFileName.textContent = "";
            if (imageDims) imageDims.textContent = "";
            hideProcessing();
            resetContrastUI();
            if (intensity) {
                intensity.value = "100";
                syncIntensityLabel();
            }
            if (textureType) textureType.value = "none";
            if (textureIntensity) {
                textureIntensity.value = "0.30";
                syncTextureIntensityLabel();
            }
            if (sourceColorInput) sourceColorInput.value = "#ff0000";
            if (targetColorInput) targetColorInput.value = "#3b82f6";
            if (enableColorSwapInput) enableColorSwapInput.checked = true;
            if (colorToleranceInput) {
                colorToleranceInput.value = "20";
                syncToleranceLabel();
            }
            if (hueShiftInput) {
                hueShiftInput.value = "0";
                syncHueLabel();
            }
            if (luminanceContrastInput) {
                luminanceContrastInput.value = "0";
                syncContrastLabel();
            }
            syncColorSwapStateFromUI();
            syncColorPreviewUI();
            renderPresetCards();
            pickingSourceColor = false;
            syncPickSourceColorButton();
            setModeUI("normal");
        }

        function setCompare(on) {
            comparing = !!on;
            if (compareBtnLabel) {
                compareBtnLabel.textContent = comparing ? "Showing Original" : "Hold: Before / After";
            }
            if (!originalImageData) return;
            if (comparing) {
                hideProcessing();
                drawOriginal();
            } else {
                scheduleApply();
            }
        }

        /** If compare was left "stuck" (lost mouseup / blur), simulation would never redraw — only original. */
        function cancelCompareOnly() {
            if (!comparing) return;
            comparing = false;
            if (compareBtnLabel) compareBtnLabel.textContent = "Hold: Before / After";
        }

        function releaseCompareAndReapply() {
            if (!comparing) return;
            cancelCompareOnly();
            if (originalImageData) scheduleApply();
        }

        function triggerDownload() {
            if (!originalImageData) {
                window.alert("Please upload an image first");
                return;
            }
            var mode = getCurrentMode();
            var name = "visionx-" + mode + "-simulation.png";
            var url = toolCanvas.toDataURL("image/png");
            var a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (!downloadBtn) return;
            downloadBtn.classList.add("vx-tool-btn-download--pulse");
            function onEnd() {
                downloadBtn.classList.remove("vx-tool-btn-download--pulse");
                downloadBtn.removeEventListener("animationend", onEnd);
            }
            downloadBtn.addEventListener("animationend", onEnd);
        }

        function clickModeButton(mode) {
            if (!modePills) return;
            var btn = modePills.querySelector('.vx-tool-mode-btn[data-mode="' + mode + '"]');
            if (btn) btn.click();
        }

        if (toolSidebar) {
            requestAnimationFrame(function () {
                toolSidebar.classList.add("vx-tool-sidebar--enter");
            });
        }

        if (toolSidebar && window.matchMedia && window.matchMedia("(max-width: 900px)").matches) {
            toolSidebar.classList.add("vx-tool-sidebar--expanded");
            if (controlsToggle) controlsToggle.setAttribute("aria-expanded", "true");
        }

        document.addEventListener("mouseup", releaseCompareAndReapply);
        document.addEventListener("touchend", releaseCompareAndReapply, { passive: true });
        window.addEventListener("blur", function () {
            spaceCompareHeld = false;
            releaseCompareAndReapply();
        });

        syncIntensityLabel();
        syncToleranceLabel();
        syncHueLabel();
        syncContrastLabel();
        syncColorSwapStateFromUI();
        syncColorPreviewUI();
        renderPresetCards();
        syncPickSourceColorButton();
        syncTextureIntensityLabel();
        updateContrastHint();

        if (browseBtn && fileInput) {
            browseBtn.addEventListener("click", function () { fileInput.click(); });
        }
        if (emptyUploadBtn && fileInput) {
            emptyUploadBtn.addEventListener("click", function () { fileInput.click(); });
        }
        if (fileInput) {
            fileInput.addEventListener("change", function () {
                if (fileInput.files && fileInput.files[0]) loadImageFile(fileInput.files[0]);
            });
        }
        if (dropZone) {
            dropZone.addEventListener("dragover", function (e) {
                e.preventDefault();
                dropZone.classList.add("vx-tool-dropzone--drag");
            });
            dropZone.addEventListener("dragleave", function () {
                dropZone.classList.remove("vx-tool-dropzone--drag");
            });
            dropZone.addEventListener("drop", function (e) {
                e.preventDefault();
                dropZone.classList.remove("vx-tool-dropzone--drag");
                var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (f) loadImageFile(f);
            });
            dropZone.addEventListener("click", function (e) {
                if (browseBtn && (e.target === browseBtn || browseBtn.contains(e.target))) return;
                if (fileInput) fileInput.click();
            });
        }

        if (modePills) {
            modePills.addEventListener("click", function (e) {
                var btn = e.target.closest(".vx-tool-mode-btn");
                if (!btn) return;
                var mode = btn.getAttribute("data-mode");
                if (!mode) return;
                btn.classList.add("vx-tool-mode-btn--pulse");
                window.setTimeout(function () {
                    btn.classList.remove("vx-tool-mode-btn--pulse");
                }, 220);
                cancelCompareOnly();
                setModeUI(mode);
                if (originalImageData) scheduleApply();
            });
        }

        if (intensity) {
            intensity.addEventListener("input", function () {
                syncIntensityLabel();
                if (originalImageData && getCurrentMode() !== "normal") {
                    cancelCompareOnly();
                    scheduleApply();
                }
            });
            intensity.addEventListener("mousedown", function () {
                intensity.classList.add("vx-tool-intensity-input--drag");
            });
            intensity.addEventListener("mouseup", function () {
                intensity.classList.remove("vx-tool-intensity-input--drag");
            });
            intensity.addEventListener("touchstart", function () {
                intensity.classList.add("vx-tool-intensity-input--drag");
            }, { passive: true });
            intensity.addEventListener("touchend", function () {
                intensity.classList.remove("vx-tool-intensity-input--drag");
            });
        }

        if (sourceColorInput) {
            sourceColorInput.addEventListener("input", function () {
                syncColorSwapStateFromUI();
                syncColorPreviewUI();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (targetColorInput) {
            targetColorInput.addEventListener("input", function () {
                syncColorSwapStateFromUI();
                syncColorPreviewUI();
                renderPresetCards();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (enableColorSwapInput) {
            enableColorSwapInput.addEventListener("change", function () {
                syncColorSwapStateFromUI();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (colorToleranceInput) {
            colorToleranceInput.addEventListener("input", function () {
                syncToleranceLabel();
                syncColorSwapStateFromUI();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
            colorToleranceInput.addEventListener("change", function () {
                syncToleranceLabel();
                syncColorSwapStateFromUI();
            });
        }

        if (hueShiftInput) {
            hueShiftInput.addEventListener("input", function () {
                syncHueLabel();
                getProcessingSettings();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (luminanceContrastInput) {
            luminanceContrastInput.addEventListener("input", function () {
                syncContrastLabel();
                getProcessingSettings();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (pickSourceColorBtn) {
            pickSourceColorBtn.addEventListener("click", function () {
                pickingSourceColor = !pickingSourceColor;
                syncPickSourceColorButton();
            });
        }

        if (textureType) {
            textureType.addEventListener("change", function () {
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
        }

        if (textureIntensity) {
            textureIntensity.addEventListener("input", function () {
                syncTextureIntensityLabel();
                if (!originalImageData) return;
                cancelCompareOnly();
                scheduleApply();
            });
            textureIntensity.addEventListener("change", syncTextureIntensityLabel);
        }

        if (compareBtn) {
            compareBtn.addEventListener("mousedown", function () { setCompare(true); });
            compareBtn.addEventListener("mouseup", function () { setCompare(false); });
            compareBtn.addEventListener("mouseleave", function () { setCompare(false); });
            compareBtn.addEventListener("touchstart", function (e) { e.preventDefault(); setCompare(true); }, { passive: false });
            compareBtn.addEventListener("touchend", function () { setCompare(false); });
            compareBtn.addEventListener("touchcancel", function () { setCompare(false); });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener("click", triggerDownload);
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", resetAll);
        }

        if (toolCanvas) {
            toolCanvas.addEventListener("click", function (e) {
                if (!originalImageData) return;
                var rect = toolCanvas.getBoundingClientRect();
                var sx = toolCanvas.width / rect.width;
                var sy = toolCanvas.height / rect.height;
                var x = Math.floor((e.clientX - rect.left) * sx);
                var y = Math.floor((e.clientY - rect.top) * sy);
                if (x < 0 || y < 0 || x >= toolCanvas.width || y >= toolCanvas.height) return;
                var px = ctx.getImageData(x, y, 1, 1).data;
                var rgb = { r: px[0], g: px[1], b: px[2] };

                if (pickingSourceColor) {
                    var pickedHex = window.colorEngine.rgbToHex(rgb.r, rgb.g, rgb.b);
                    if (sourceColorInput) sourceColorInput.value = pickedHex;
                    syncColorSwapStateFromUI();
                    syncColorPreviewUI();
                    pickingSourceColor = false;
                    syncPickSourceColorButton();
                    cancelCompareOnly();
                    scheduleApply();
                    return;
                }

                if (contrastPhase === 2) {
                    resetContrastUI();
                }

                if (contrastPhase === 0) {
                    fgRgb = rgb;
                    contrastPhase = 1;
                    var hex = window.colorEngine.rgbToHex(rgb.r, rgb.g, rgb.b);
                    if (contrastFgSwatch) contrastFgSwatch.style.background = hex;
                    if (contrastFgHex) contrastFgHex.textContent = hex;
                    if (contrastBgSwatch) contrastBgSwatch.style.background = "rgba(255,255,255,0.08)";
                    if (contrastBgHex) contrastBgHex.textContent = "";
                    if (contrastRatio) contrastRatio.textContent = "—";
                    if (contrastBadge) {
                        contrastBadge.textContent = "—";
                        contrastBadge.setAttribute("data-state", "neutral");
                        contrastBadge.style.color = "";
                        contrastBadge.style.background = "";
                    }
                } else if (contrastPhase === 1) {
                    bgRgb = rgb;
                    updateContrastFromColors();
                }
                updateContrastHint();
            });
        }

        function isTypingShortcutBlocked(el) {
            if (!el || !el.tagName) return false;
            var t = el.tagName;
            if (t === "INPUT" || t === "SELECT" || t === "TEXTAREA") return true;
            if (el.isContentEditable) return true;
            return false;
        }

        document.addEventListener("keydown", function (e) {
            if (isTypingShortcutBlocked(e.target)) return;
            var k = e.key.toLowerCase();
            if (k === "p") { clickModeButton("protanopia"); }
            else if (k === "d") { clickModeButton("deuteranopia"); }
            else if (k === "t") { clickModeButton("tritanopia"); }
            else if (k === "n") { clickModeButton("normal"); }
            else if (k === "r") { resetAll(); }
            else if (k === "s") { triggerDownload(); }
            else if (e.code === "Space" && !spaceCompareHeld) {
                e.preventDefault();
                spaceCompareHeld = true;
                setCompare(true);
            }
        });
        document.addEventListener("keyup", function (e) {
            if (e.code === "Space" && spaceCompareHeld) {
                e.preventDefault();
                spaceCompareHeld = false;
                setCompare(false);
            }
        });

        if (controlsToggle && toolSidebar) {
            controlsToggle.addEventListener("click", function () {
                var open = toolSidebar.classList.toggle("vx-tool-sidebar--expanded");
                controlsToggle.setAttribute("aria-expanded", open ? "true" : "false");
            });
        }

        setModeUI(typeSelect && typeSelect.value ? typeSelect.value : "normal");
    }

    function visionxAboutInit() {
        function animateCounter(el, target, suffix, duration) {
            if (!el) return;
            var start = 0;
            var step = target / (duration / 16);
            var timer = window.setInterval(function () {
                start += step;
                if (start >= target) {
                    start = target;
                    window.clearInterval(timer);
                }
                el.textContent = Math.floor(start) + (suffix || "");
            }, 16);
        }

        var nums = document.querySelectorAll(".vx-about-stat-num[data-about-count]");
        if (!nums.length) return;

        var done = false;
        function runAll() {
            if (done) return;
            done = true;
            nums.forEach(function (el) {
                var count = parseInt(el.getAttribute("data-about-count"), 10);
                var suffix = el.getAttribute("data-about-suffix") || "";
                var duration = 900;
                if (count === 4) duration = 800;
                else if (count === 20) duration = 1000;
                else if (count === 10) duration = 900;
                if (isFinite(count)) animateCounter(el, count, suffix, duration);
            });
        }

        if ("IntersectionObserver" in window) {
            var counterTarget = document.querySelector(".vx-about-stats");
            if (!counterTarget) {
                runAll();
                return;
            }
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    runAll();
                    io.unobserve(entry.target);
                });
            }, { threshold: 0.2 });
            io.observe(counterTarget);
        } else {
            runAll();
        }
    }


    if (isMarketing) return;
    if (isTool) return;
    if (isContact) return;
    if (isPluginPage) return;
    if (isAbout) return;

/**
 * main.js — Color Blind Guide UXP Plugin Entry Point
 * Uses window.colorEngine and window.contrastChecker (loaded via panel.html <script> tags)
 */

var ps = null;
var core = null;
var app = null;
var action = null;
var hostApp = null;
var ai = null;

try {
    ps = require("photoshop");
    core = ps.core;
    app = ps.app;
    action = ps.action;
    hostApp = "PS";
} catch (e) {
    try {
        ai = require("illustrator");
        hostApp = "ILST";
        app = ai.app || null;
    } catch (e2) {
        // Keep module load resilient so panel can still render and show an error.
    }
}

document.addEventListener("DOMContentLoaded", function() {
    try {

    var modeSelect   = document.getElementById("modeSelect");
    var typeSelect   = document.getElementById("typeSelect");
    var intensityEl  = document.getElementById("intensity");
    var intensityVal = document.getElementById("intensityVal");
    var scanBtn      = document.getElementById("scanBtn");
    var applyBtn     = document.getElementById("applyBtn");
    var previewToggle = document.getElementById("previewToggle");
    var revertBtn    = document.getElementById("revertBtn");
    var exportBtn    = document.getElementById("exportBtn");
    var exportFormat = document.getElementById("exportFormat");
    var suggestionsSection = document.getElementById("suggestionsSection");
    var suggestionsList = document.getElementById("suggestionsList");
    var applySuggestionsBtn = document.getElementById("applySuggestionsBtn");
    var guideColorInput = document.getElementById("guideColorInput");
    var guideColorDetails = document.getElementById("guideColorDetails");
    var useFgColorBtn = document.getElementById("useFgColorBtn");
    var refreshFgBtn = document.getElementById("refreshFgBtn");
    var currentFgText = document.getElementById("currentFgText");
    var results      = document.getElementById("results");

    var lastScan = null; // { type, colors, conflicts, suggestions, reportText }
    var lastPreviewLayerId = null;
    var scanRequestSeq = 0;

    // ─── COLOR GUIDE (AUTO ON TAP/PICK) ───────────────────────────────
    function rgbToHslLocal(rgb) {
        if (window.colorEngine && window.colorEngine.rgbToHsl) return window.colorEngine.rgbToHsl(rgb);
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
    }

    function describeColorFamily(hsl, rgb) {
        var h = hsl.h, s = hsl.s, l = hsl.l;
        var family = "Neutral";
        var name = "Neutral Gray";

        if (s < 0.1) {
            if (l < 0.15) { name = "Near Black"; family = "Neutral"; }
            else if (l > 0.9) { name = "Near White"; family = "Neutral"; }
            else { name = "Gray"; family = "Neutral"; }
        } else {
            if (h < 15 || h >= 345) { name = "Crimson Red"; family = "Warm tones"; }
            else if (h < 40) { name = "Burnt Orange"; family = "Warm tones"; }
            else if (h < 65) { name = "Golden Yellow"; family = "Warm tones"; }
            else if (h < 90) { name = "Lime Green"; family = "Cool tones"; }
            else if (h < 150) { name = "Moss Green"; family = "Cool tones"; }
            else if (h < 190) { name = "Aqua Teal"; family = "Cool tones"; }
            else if (h < 230) { name = "Sky Blue"; family = "Cool tones"; }
            else if (h < 270) { name = "Royal Blue"; family = "Cool tones"; }
            else if (h < 300) { name = "Violet"; family = "Cool tones"; }
            else if (h < 345) { name = "Magenta"; family = "Warm tones"; }

            if (l > 0.82 && s > 0.2) family = "Pastel";
        }

        var appearance;
        if (l < 0.2) appearance = "Very dark and deep";
        else if (l < 0.4) appearance = "Dark, rich tone";
        else if (l < 0.65) appearance = "Balanced mid-tone";
        else if (l < 0.85) appearance = "Light and soft";
        else appearance = "Very light, near pastel";

        // Fine-tune name for well-known hues
        if (rgb.r > 180 && rgb.g < 110 && rgb.b < 110) name = "Crimson Red";
        if (rgb.g > 150 && rgb.r < 120 && rgb.b < 120) name = "Moss Green";
        if (rgb.b > 170 && rgb.r < 130 && rgb.g < 170) name = "Sky Blue";

        return { name: name, family: family, appearance: appearance };
    }

    function updateColorGuide(hex) {
        if (!guideColorDetails || !hex) return;
        var rgb = window.colorEngine.hexToRgb(hex);
        if (!isFinite(rgb.r) || !isFinite(rgb.g) || !isFinite(rgb.b)) return;
        var hsl = rgbToHslLocal(rgb);
        var h = Math.round(hsl.h);
        var s = Math.round(hsl.s * 100);
        var l = Math.round(hsl.l * 100);
        var info = describeColorFamily(hsl, rgb);

        guideColorDetails.textContent =
            "Color Name: " + info.name + "\n" +
            "HEX: " + hex.toUpperCase() + "\n" +
            "RGB: rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")\n" +
            "HSL: hsl(" + h + ", " + s + "%, " + l + "%)\n" +
            "Appearance: " + info.appearance + "\n" +
            "Color Family: " + info.family;
    }

    // UXP/Chromium often fires `input` before type="color"'s .value updates; read on next frame(s).
    var colorGuideRaf = null;
    function scheduleColorGuideFromInput() {
        if (colorGuideRaf != null) cancelAnimationFrame(colorGuideRaf);
        colorGuideRaf = requestAnimationFrame(function() {
            colorGuideRaf = requestAnimationFrame(function() {
                colorGuideRaf = null;
                if (!guideColorInput) return;
                updateColorGuide(guideColorInput.value);
            });
        });
    }

    if (guideColorInput) {
        guideColorInput.addEventListener("input", scheduleColorGuideFromInput);
        guideColorInput.addEventListener("change", scheduleColorGuideFromInput);
        updateColorGuide(guideColorInput.value);
    }

    function readForegroundHex() {
        try {
            if (!app || !app.foregroundColor || !app.foregroundColor.rgb) return null;
            var c = app.foregroundColor.rgb;
            return window.colorEngine.rgbToHex(c.red, c.green, c.blue);
        } catch (e) {
            return null;
        }
    }

    function updateForegroundIndicator() {
        if (!currentFgText) return;
        var hex = readForegroundHex();
        currentFgText.textContent = "Current FG: " + (hex || "—");
    }

    if (refreshFgBtn) {
        refreshFgBtn.addEventListener("click", function() {
            updateForegroundIndicator();
            results.textContent = "Foreground color refreshed.";
        });
    }

    if (useFgColorBtn) {
        useFgColorBtn.addEventListener("click", function() {
            try {
                var hex = readForegroundHex();
                if (!hex) {
                    results.textContent = "Foreground color not available. Pick color with Eyedropper first.";
                    return;
                }
                if (guideColorInput) {
                    guideColorInput.value = hex;
                    updateColorGuide(hex);
                }
                updateForegroundIndicator();
                results.textContent = "✅ Color Guide updated from Photoshop foreground color (" + hex + ").";
            } catch (e) {
                results.textContent = "Could not read foreground color: " + e.message;
            }
        });
    }

    updateForegroundIndicator();

    function isTextLayer(layer) {
        // Different PS/UXP builds can expose text kind differently.
        return !!(layer &&
            layer.textItem &&
            layer.textItem.color &&
            layer.textItem.color.rgb &&
            (layer.kind === "text" || String(layer.kind).toLowerCase().indexOf("text") !== -1));
    }

    function collectVisibleTextLayers(layers, out) {
        if (!layers || !layers.length) return;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer || !layer.visible) continue;

            if (isTextLayer(layer)) {
                out.push(layer);
            }

            // Recurse into groups/artboards when present.
            if (layer.layers && layer.layers.length) {
                collectVisibleTextLayers(layer.layers, out);
            }
        }
    }

    if (hostApp === "ILST" && ai && app) {
        initIllustratorMode();
        return;
    }

    if (!ps || !core || !app || !action) {
        if (results) {
            results.textContent = hostApp === "ILST"
                ? "Illustrator detected, but API access is not available in this install."
                : "Plugin startup error: Photoshop API not available.";
        }
        return;
    }

    // Live intensity label update
    if (intensityEl && intensityVal) {
        intensityEl.addEventListener("input", function() {
            intensityVal.textContent = this.value;
        });
    }

    // ─── SCAN DOCUMENT ────────────────────────────────────────────────
    if (scanBtn) {
        scanBtn.addEventListener("click", async function() {
            var myScanSeq = ++scanRequestSeq;
            results.textContent = "Scanning...";
            hideSuggestions();

            try {
                await core.executeAsModal(async function() {
                    // Read values fresh inside the modal to avoid closure loss in UXP
                    var type = document.getElementById("typeSelect") ? document.getElementById("typeSelect").value : "protanopia";
                    var doc = app.activeDocument;
                    if (!doc) {
                        if (myScanSeq === scanRequestSeq) {
                            results.textContent = "No document open. Please open a file first.";
                        }
                        return;
                    }

                    var scan = await scanDocumentColors(doc, type);
                    var hexColors = scan.colors;
                    if (hexColors.length < 2) {
                        if (myScanSeq !== scanRequestSeq) return;
                        var msg = "No (or only one) detectable color found.\n" +
                                  "Tip: This scanner reads text + shape fills/strokes + gradient stops.\n" +
                                  "If your document is a single flattened background, use Correct → Apply Fix (global correction).";
                        lastScan = { type: type, colors: hexColors, conflicts: [], suggestions: [], reportText: msg };
                        results.textContent = msg;
                        return;
                    }

                    // Detect problematic pairs
                    var conflicts = window.colorEngine.detectProblematicPairs(hexColors, type);

                    if (conflicts.length === 0) {
                        if (myScanSeq !== scanRequestSeq) return;
                        var okMsg = "✅ No color conflicts found for " + type + ".\nColors: " + hexColors.join(", ");
                        lastScan = { type: type, colors: hexColors, conflicts: [], suggestions: [], reportText: okMsg };
                        results.textContent = okMsg;
                        return;
                    }

                    // WCAG contrast check each conflict
                    var lines = ["⚠️ Found " + conflicts.length + " conflict(s) for " + type + ":\n"];
                    for (var k = 0; k < conflicts.length; k++) {
                        var conf = conflicts[k];
                        var wcag = window.contrastChecker.check(conf.color1, conf.color2);
                        lines.push(
                            conf.color1 + " ↔ " + conf.color2 +
                            " | Contrast: " + wcag.ratioString +
                            " | WCAG: " + wcag.status +
                            " | Severity: " + conf.severity
                        );
                    }
                    var report = lines.join("\n");
                    var suggestions = buildSuggestionsFromConflicts(conflicts, type);
                    if (myScanSeq !== scanRequestSeq) return;
                    lastScan = { type: type, colors: hexColors, conflicts: conflicts, suggestions: suggestions, reportText: report };
                    results.textContent = report;
                    renderSuggestions(suggestions);

                }, { commandName: "Scan Document Colors" });

            } catch(e) {
                if (myScanSeq === scanRequestSeq) {
                    results.textContent = "Scan Error: " + e.message;
                }
            }
        });
    }

    // ─── APPLY FIX ────────────────────────────────────────────────────
    if (applyBtn) {
        applyBtn.addEventListener("click", async function() {
            results.textContent = "Applying...";

            try {
                await core.executeAsModal(async function() {
                    // Read fresh from DOM to avoid UXP closure loss
                    var mode      = document.getElementById("modeSelect") ? document.getElementById("modeSelect").value : "simulate";
                    var type      = document.getElementById("typeSelect") ? document.getElementById("typeSelect").value : "protanopia";
                    var intensityInput = document.getElementById("intensity");
                    var intensity = intensityInput ? parseInt(intensityInput.value) : 100;
                    var doc = app.activeDocument;
                    if (!doc) {
                        results.textContent = "No document open.";
                        return;
                    }

                    if (mode === "simulate") {
                        var isPreviewSim = previewToggle ? !!previewToggle.checked : true;
                        var simId = await applyChannelMixerLayer(doc, type, intensity / 100);
                        if (isPreviewSim && simId) lastPreviewLayerId = simId;
                        results.textContent = "✅ Applied " + type + " simulation layer at " + intensity + "%.";
                    } else {
                        var report = await correctTextLayerColors(doc, type, intensity / 100);
                        results.textContent = report;
                    }

                }, { commandName: "Apply Color Simulation" });

            } catch(e) {
                results.textContent = "Apply Error: " + e.message;
            }
        });
    }

    // ─── REVERT LAST PREVIEW ──────────────────────────────────────────
    if (revertBtn) {
        revertBtn.addEventListener("click", async function() {
            if (!lastPreviewLayerId) {
                results.textContent = "Nothing to revert yet.";
                return;
            }
            try {
                await core.executeAsModal(async function() {
                    await action.batchPlay([{
                        _obj: "delete",
                        _target: [{ _ref: "layer", _id: lastPreviewLayerId }]
                    }], { synchronousExecution: false });
                    lastPreviewLayerId = null;
                }, { commandName: "Revert Color Blind Preview" });

                results.textContent = "✅ Reverted last preview layer.";
            } catch (e) {
                results.textContent = "Revert Error: " + e.message;
            }
        });
    }

    // ─── EXPORT REPORT ────────────────────────────────────────────────
    if (exportBtn) {
        exportBtn.addEventListener("click", async function() {
            if (!lastScan || !lastScan.reportText) {
                results.textContent = "Nothing to export yet. Click Scan first.";
                return;
            }
            try {
                var uxp = require("uxp");
                var fs = uxp.storage.localFileSystem;
                var fmt = exportFormat ? exportFormat.value : "txt";
                var file = await fs.getFileForSaving(fmt === "pdf" ? "color-blind-report.pdf" : "color-blind-report.txt", { types: [fmt] });
                if (!file) return;
                if (fmt === "pdf") {
                    await file.write(buildSimplePdfBytes(lastScan.reportText));
                } else {
                    await file.write(lastScan.reportText);
                }
                results.textContent = "✅ Report exported.";
            } catch (e) {
                results.textContent = "Export Error: " + e.message;
            }
        });
    }

    // ─── SUGGESTIONS ──────────────────────────────────────────────────
    function hideSuggestions() {
        if (suggestionsSection) suggestionsSection.style.display = "none";
        if (suggestionsList) suggestionsList.innerHTML = "";
    }

    function buildSuggestionsFromConflicts(conflicts, type) {
        var byFrom = {};
        for (var i = 0; i < conflicts.length; i++) {
            var c = conflicts[i];
            var fromHex = c.color2;
            var againstHex = c.color1;
            if (byFrom[fromHex]) continue;
            var s = window.colorEngine.suggestCorrection(fromHex, againstHex, type, {
                threshold: 30,
                minContrast: 4.5,
                intensity: 1.0
            });
            if (!s || !s.hex || s.hex === fromHex) continue;
            byFrom[fromHex] = {
                fromHex: fromHex,
                toHex: s.hex,
                againstHex: againstHex,
                contrastRatio: s.contrastRatio || 0
            };
        }
        var out = [];
        for (var k in byFrom) if (Object.prototype.hasOwnProperty.call(byFrom, k)) out.push(byFrom[k]);
        return out;
    }

    function renderSuggestions(items) {
        if (!suggestionsSection || !suggestionsList) return;
        if (!items || items.length === 0) {
            hideSuggestions();
            return;
        }
        suggestionsSection.style.display = "block";
        suggestionsList.innerHTML = "";
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var row = document.createElement("div");
            var cbId = "suggestion_" + i;
            row.innerHTML =
                '<label style="text-transform:none;letter-spacing:0;margin:0;">' +
                '<input type="checkbox" id="' + cbId + '" checked style="margin-right:6px;">' +
                '<b>' + it.fromHex + '</b> → <b>' + it.toHex + '</b> ' +
                '<span style="color:#9e9e9e;">(vs ' + it.againstHex + (it.contrastRatio ? (', contrast≈' + it.contrastRatio) : '') + ')</span>' +
                '</label>';
            suggestionsList.appendChild(row);
        }
    }

    if (applySuggestionsBtn) {
        applySuggestionsBtn.addEventListener("click", async function() {
            if (!core || !ps) {
                results.textContent = "Apply selected is available in Photoshop mode for now.";
                return;
            }
            if (!lastScan || !lastScan.suggestions || lastScan.suggestions.length === 0) {
                results.textContent = "No suggestions available. Run Scan first.";
                return;
            }
            try {
                var selected = {};
                for (var i = 0; i < lastScan.suggestions.length; i++) {
                    var el = document.getElementById("suggestion_" + i);
                    if (el && el.checked) selected[lastScan.suggestions[i].fromHex] = lastScan.suggestions[i].toHex;
                }
                var keys = Object.keys(selected);
                if (keys.length === 0) {
                    results.textContent = "No suggestions selected.";
                    return;
                }

                await core.executeAsModal(async function() {
                    var doc = app.activeDocument;
                    if (!doc) throw new Error("No document open.");
                    var changed = 0;

                    var allText = [];
                    collectVisibleTextLayers(doc.layers, allText);
                    for (var t = 0; t < allText.length; t++) {
                        try {
                            var rgb = allText[t].textItem.color.rgb;
                            var fromHex = window.colorEngine.rgbToHex(rgb.red, rgb.green, rgb.blue);
                            var toHex = selected[fromHex];
                            if (!toHex) continue;
                            var toRgb = window.colorEngine.hexToRgb(toHex);
                            allText[t].textItem.color.rgb.red = toRgb.r;
                            allText[t].textItem.color.rgb.green = toRgb.g;
                            allText[t].textItem.color.rgb.blue = toRgb.b;
                            changed++;
                        } catch (e) {}
                    }

                    results.textContent = "✅ Applied " + keys.length + " suggestion(s). Updated " + changed + " text layer(s). Re-scan to verify.";
                }, { commandName: "Apply Suggestions" });
            } catch (e) {
                results.textContent = "Apply Suggestions Error: " + e.message;
            }
        });
    }

    function buildSimplePdfBytes(text) {
        var lines = String(text || "").split(/\r?\n/).slice(0, 55);
        function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
        var content = "BT\n/F1 10 Tf\n72 760 Td\n12 TL\n";
        for (var i = 0; i < lines.length; i++) {
            content += "(" + esc(lines[i]) + ") Tj\n";
            if (i !== lines.length - 1) content += "T*\n";
        }
        content += "ET\n";
        var objs = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "5 0 obj\n<< /Length " + content.length + " >>\nstream\n" + content + "endstream\nendobj\n"
        ];
        var header = "%PDF-1.4\n";
        var body = "";
        var offsets = [0];
        var pos = header.length;
        for (var j = 0; j < objs.length; j++) {
            offsets.push(pos);
            body += objs[j];
            pos += objs[j].length;
        }
        var xrefStart = pos;
        var xref = "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
        for (var k = 1; k < offsets.length; k++) xref += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
        var trailer = "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF\n";
        var pdf = header + body + xref + trailer;
        var bytes = new Uint8Array(pdf.length);
        for (var x = 0; x < pdf.length; x++) bytes[x] = pdf.charCodeAt(x) & 0xff;
        return bytes;
    }

    function initIllustratorMode() {
        if (results) results.textContent = "Illustrator mode: scan swatches/selection and export reports. Apply simulation/correction is limited by host API.";
        if (revertBtn) revertBtn.disabled = true;
        if (applyBtn) applyBtn.disabled = true;
        if (applySuggestionsBtn) applySuggestionsBtn.disabled = true;
        if (scanBtn) {
            scanBtn.addEventListener("click", function() {
                try {
                    var type = typeSelect ? typeSelect.value : "protanopia";
                    var colors = scanIllustratorColors();
                    if (colors.length < 2) {
                        lastScan = { type: type, colors: colors, conflicts: [], suggestions: [], reportText: "No (or only one) detectable color in Illustrator swatches/selection." };
                        results.textContent = lastScan.reportText;
                        hideSuggestions();
                        return;
                    }
                    var conflicts = window.colorEngine.detectProblematicPairs(colors, type);
                    if (conflicts.length === 0) {
                        lastScan = { type: type, colors: colors, conflicts: [], suggestions: [], reportText: "✅ No color conflicts found for " + type + ".\nColors: " + colors.join(", ") };
                        results.textContent = lastScan.reportText;
                        hideSuggestions();
                        return;
                    }
                    var lines = ["⚠️ Found " + conflicts.length + " conflict(s) for " + type + ":\n"];
                    for (var i = 0; i < conflicts.length; i++) {
                        var conf = conflicts[i];
                        var wcag = window.contrastChecker.check(conf.color1, conf.color2);
                        lines.push(conf.color1 + " ↔ " + conf.color2 + " | Contrast: " + wcag.ratioString + " | WCAG: " + wcag.status + " | Severity: " + conf.severity);
                    }
                    var report = lines.join("\n");
                    var suggestions = buildSuggestionsFromConflicts(conflicts, type);
                    lastScan = { type: type, colors: colors, conflicts: conflicts, suggestions: suggestions, reportText: report };
                    results.textContent = report;
                    renderSuggestions(suggestions);
                } catch (e) {
                    results.textContent = "Illustrator Scan Error: " + e.message;
                }
            });
        }
    }

    function scanIllustratorColors() {
        var colors = [];
        var seen = {};
        function add(hex) { if (!hex) return; hex = String(hex).toUpperCase(); if (!seen[hex]) { seen[hex] = true; colors.push(hex); } }
        var doc = null;
        try { doc = app && app.activeDocument ? app.activeDocument : null; } catch (e) {}
        if (!doc) return colors;
        try {
            var swatches = doc.swatches || [];
            for (var i = 0; i < swatches.length; i++) {
                var c = swatches[i] && swatches[i].color ? illustratorColorToHex(swatches[i].color) : null;
                add(c);
            }
        } catch (e) {}
        try {
            var sel = doc.selection || [];
            for (var j = 0; j < sel.length; j++) {
                if (sel[j].fillColor) add(illustratorColorToHex(sel[j].fillColor));
                if (sel[j].strokeColor) add(illustratorColorToHex(sel[j].strokeColor));
            }
        } catch (e) {}
        return colors;
    }

    function illustratorColorToHex(color) {
        try {
            var t = String(color.typename || color._obj || "").toLowerCase();
            if (t.indexOf("rgb") !== -1 && typeof color.red === "number") return window.colorEngine.rgbToHex(color.red, color.green, color.blue);
            if (t.indexOf("gray") !== -1 && typeof color.gray === "number") {
                var v = Math.round((color.gray / 100) * 255);
                return window.colorEngine.rgbToHex(v, v, v);
            }
            if (t.indexOf("cmyk") !== -1 && typeof color.cyan === "number") {
                var c = color.cyan / 100, m = color.magenta / 100, y = color.yellow / 100, k = color.black / 100;
                return window.colorEngine.rgbToHex(255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k));
            }
        } catch (e) {}
        return null;
    }

    // ─── SCAN HELPERS ────────────────────────────────────────────────
    function collectVisibleLayers(layers, out) {
        if (!layers || !layers.length) return;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer || !layer.visible) continue;
            out.push(layer);
            if (layer.layers && layer.layers.length) {
                collectVisibleLayers(layer.layers, out);
            }
        }
    }

    function deepCollectRgb(obj, out) {
        if (!obj) return;
        if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) deepCollectRgb(obj[i], out);
            return;
        }
        if (typeof obj !== "object") return;

        // Common Photoshop descriptor shape: { _obj:"RGBColor", red:..., green:..., blue:... }
        if ((obj._obj && String(obj._obj).toLowerCase().indexOf("rgb") !== -1) &&
            typeof obj.red === "number" && typeof obj.green === "number" && typeof obj.blue === "number") {
            var r = obj.red, g = obj.green, b = obj.blue;
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                out.push(window.colorEngine.rgbToHex(r, g, b));
            }
        }

        // Recurse properties
        for (var k in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
            if (k === "_rawData") continue;
            deepCollectRgb(obj[k], out);
        }
    }

    async function getLayerDescriptor(layerId) {
        var res = await action.batchPlay([{
            _obj: "get",
            _target: [{ _ref: "layer", _id: layerId }]
        }], { synchronousExecution: false });
        return res && res[0] ? res[0] : null;
    }

    async function scanDocumentColors(doc, type) {
        var hexColors = [];
        var seen = {};
        var add = function(hex) {
            if (!hex) return;
            var u = String(hex).toUpperCase();
            if (seen[u]) return;
            seen[u] = true;
            hexColors.push(u);
        };

        // 1) Text via DOM (fast + reliable)
        var allText = [];
        collectVisibleTextLayers(doc.layers, allText);
        for (var i = 0; i < allText.length; i++) {
            try {
                var c = allText[i].textItem.color.rgb;
                add(window.colorEngine.rgbToHex(c.red, c.green, c.blue));
            } catch (e) {}
        }

        // 2) Shapes/fills/strokes/gradients via descriptors
        var allLayers = [];
        collectVisibleLayers(doc.layers, allLayers);

        var descCache = {};
        for (var j = 0; j < allLayers.length; j++) {
            var layer = allLayers[j];
            if (!layer || !layer.id) continue;
            if (descCache[layer.id]) continue;
            try {
                var desc = await getLayerDescriptor(layer.id);
                descCache[layer.id] = desc || true;
                if (desc) {
                    var found = [];
                    deepCollectRgb(desc, found);
                    for (var f = 0; f < found.length; f++) add(found[f]);
                }
            } catch (e) {
                // ignore per-layer failures
            }
        }

        return { colors: hexColors };
    }

    // ─── CORRECT TEXT LAYERS ───────────────────────────────────────────
    async function correctTextLayerColors(doc, type, intensity) {
        // Collect visible text layers + their colors
        var textLayers = [];
        var allText = [];
        collectVisibleTextLayers(doc.layers, allText);
        for (var i = 0; i < allText.length; i++) {
            var c = allText[i].textItem.color.rgb;
            var hex = window.colorEngine.rgbToHex(c.red, c.green, c.blue);
            textLayers.push({ layer: allText[i], hex: hex });
        }

        if (textLayers.length < 2) {
            // Fallback for flattened/raster docs: apply a global, non-destructive correction layer.
            var isPreview = previewToggle ? !!previewToggle.checked : true;
            var id = await applyDaltonizeLayer(doc, type, intensity);
            if (isPreview && id) lastPreviewLayerId = id;
            return "✅ Applied global correction layer for " + type + " at " + Math.round(intensity * 100) + "% (no editable text layers found).";
        }

        // Build unique palette and detect conflicts
        var palette = [];
        var seen = {};
        for (var p = 0; p < textLayers.length; p++) {
            if (!seen[textLayers[p].hex]) {
                seen[textLayers[p].hex] = true;
                palette.push(textLayers[p].hex);
            }
        }

        var conflicts = window.colorEngine.detectProblematicPairs(palette, type);
        if (conflicts.length === 0) {
            return "✅ No color conflicts found for " + type + ". Nothing to correct.";
        }

        // Decide replacements: we attempt to change color2 to something distinct from color1
        var replacements = {}; // oldHex -> newHex
        var lines = [];
        lines.push("⚙️ Correct mode: resolving " + conflicts.length + " conflict(s) for " + type + "...");

        for (var k = 0; k < conflicts.length; k++) {
            var conf = conflicts[k];
            var a = conf.color1;
            var b = conf.color2;

            // If b already has a replacement, use it as the new base.
            var currentB = replacements[b] || b;

            var suggestion = window.colorEngine.suggestCorrection(currentB, a, type, {
                threshold: 30,
                minContrast: 4.5,
                intensity: intensity
            });

            if (suggestion && suggestion.hex && suggestion.hex !== currentB) {
                replacements[b] = suggestion.hex;
                lines.push(
                    "- " + b + " → " + suggestion.hex +
                    " (simDist≈" + Math.round(suggestion.simulatedDistance) +
                    (suggestion.contrastRatio ? (", contrast≈" + suggestion.contrastRatio) : "") +
                    ") to separate from " + a
                );
            } else {
                lines.push("- Could not find a strong correction for " + b + " vs " + a + " (left unchanged).");
            }
        }

        // Apply replacements to layers (best effort)
        var changedCount = 0;
        var failedCount = 0;
        for (var t = 0; t < textLayers.length; t++) {
            var item = textLayers[t];
            var newHex = replacements[item.hex];
            if (!newHex) continue;

            try {
                var rgb = window.colorEngine.hexToRgb(newHex);
                // UXP: set SolidColor RGB components (best-effort; may vary by PS version)
                item.layer.textItem.color.rgb.red = rgb.r;
                item.layer.textItem.color.rgb.green = rgb.g;
                item.layer.textItem.color.rgb.blue = rgb.b;
                changedCount++;
            } catch (e) {
                failedCount++;
            }
        }

        lines.push("");
        lines.push("✅ Updated " + changedCount + " text layer(s)." + (failedCount ? (" Failed: " + failedCount + ".") : ""));
        lines.push("Tip: Re-scan to verify.");
        return lines.join("\n");
    }

    // ─── GLOBAL CORRECTION LAYER (DALTONIZE-STYLE) ────────────────────
    async function applyDaltonizeLayer(doc, type, intensity) {
        // Heuristic channel mixer settings that tend to increase separability
        // for common CVD types. This is not per-pixel daltonization, but a
        // practical global correction layer for flattened artwork.
        var mixers = {
            // Reduce red/green confusion by injecting some blue separation.
            protanopia:   { red: [80, 10, 10], green: [10, 80, 10], blue: [0, 20, 80] },
            deuteranopia: { red: [80, 10, 10], green: [10, 80, 10], blue: [0, 20, 80] },
            // Boost red/green contribution when blue-yellow discrimination is weak.
            tritanopia:   { red: [90, 10, 0],  green: [10, 80, 10], blue: [15, 35, 50] }
        };

        var m = mixers[type] || mixers.deuteranopia;

        var makeLayer = {
            _obj: "make",
            _target: [{ _ref: "adjustmentLayer" }],
            using: {
                _obj: "adjustmentLayer",
                type: {
                    _obj: "channelMixer",
                    presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
                    red:   { _obj: "channel", red: m.red[0],   green: m.red[1],   blue: m.red[2],   constant: 0 },
                    green: { _obj: "channel", red: m.green[0], green: m.green[1], blue: m.green[2], constant: 0 },
                    blue:  { _obj: "channel", red: m.blue[0],  green: m.blue[1],  blue: m.blue[2],  constant: 0 }
                }
            }
        };

        await action.batchPlay([makeLayer], { synchronousExecution: false });

        // Name + opacity (intensity slider)
        if (doc.activeLayers && doc.activeLayers.length > 0) {
            var layer = doc.activeLayers[0];
            layer.name = type.charAt(0).toUpperCase() + type.slice(1) + " Correct " + Math.round(intensity * 100) + "%";
            try {
                layer.opacity = Math.max(1, Math.min(100, Math.round(intensity * 100)));
            } catch (e) {
                // Some PS builds may not allow direct opacity set; ignore.
            }
            return layer.id || null;
        }
        return null;
    }

    // ─── CHANNEL MIXER LAYER via batchPlay ────────────────────────────
    async function applyChannelMixerLayer(doc, type, intensity) {
        // Approximate RGB-space Channel Mixer values per condition
        var mixers = {
            protanopia:   { red: [57, 43, 0], green: [56, 44, 0], blue: [0, 24, 76] },
            deuteranopia: { red: [63, 37, 0], green: [70, 30, 0], blue: [0, 30, 70] },
            tritanopia:   { red: [95, 5,  0], green: [0, 43, 57], blue: [0, 48, 52] }
        };

        var m = mixers[type] || mixers.protanopia;

        var makeLayer = {
            _obj: "make",
            _target: [{ _ref: "adjustmentLayer" }],
            using: {
                _obj: "adjustmentLayer",
                type: {
                    _obj: "channelMixer",
                    presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
                    red:   { _obj: "channel", red: m.red[0],   green: m.red[1],   blue: m.red[2],   constant: 0 },
                    green: { _obj: "channel", red: m.green[0], green: m.green[1], blue: m.green[2], constant: 0 },
                    blue:  { _obj: "channel", red: m.blue[0],  green: m.blue[1],  blue: m.blue[2],  constant: 0 }
                }
            }
        };

        await action.batchPlay([makeLayer], { synchronousExecution: false });

        // Name the new layer
        if (doc.activeLayers && doc.activeLayers.length > 0) {
            doc.activeLayers[0].name = type.charAt(0).toUpperCase() + type.slice(1) + " Sim " + Math.round(intensity * 100) + "%";
            return doc.activeLayers[0].id || null;
        }
        return null;
    }

    } catch (e) {
        var box = document.getElementById("results");
        if (box) {
            box.textContent = "Startup Error: " + (e && e.message ? e.message : String(e));
        }
    }
});

/* === HAMBURGER NAV === */
document.addEventListener("DOMContentLoaded", function () {
    var hamburger = document.querySelector(".nav-hamburger");
    var nav = document.querySelector(".vx-nav-wrap") || document.querySelector("nav") || document.querySelector("header");
    if (!hamburger || !nav) return;

    hamburger.addEventListener("click", function (e) {
        e.stopPropagation();
        nav.classList.toggle("nav-open");
    });

    document.addEventListener("click", function (e) {
        if (!nav.contains(e.target)) nav.classList.remove("nav-open");
    });
});
})();
