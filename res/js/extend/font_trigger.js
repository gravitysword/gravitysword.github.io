// 字体主动加载 + 缓存自愈
// ---------------------------------------------------------------------------
// 背景一：跨域 @import 加载 fontsapi 的 result.css 时，冷加载下 @font-face 可能
//         晚于首帧注册，已渲染文字不会自动请求字体（font-display: swap 不补发）。
//         解决：window load 后主动 document.fonts.load() 触发，字体就绪自动重排。
// 背景二：fontsapi CDN 偶发返回 204/损坏响应，被浏览器钉进 HTTP 缓存
//         （woff2 为 immutable 1 年、result.css 为 max-age=600 + stale-while-revalidate），
//         普通刷新不会重新请求，导致字体一直加载失败（Ctrl+Shift+R 才能恢复）。
//         解决：自愈——检测到字族未注册、存在 error 分片或页面文字未被覆盖时，
//         用 fetch(..., {cache:'reload'}) 绕过缓存重拉 CSS 与页面所需的 woff2，
//         同时把正确副本写回 HTTP 缓存，并注入 Blob URL 的 @font-face 立即生效。
// ---------------------------------------------------------------------------
(function () {
    'use strict';

    // 与 extend.css 中的 @import 保持完全一致（换版本号时需同步修改）
    var FONT_CONFIG = [
        { css: 'https://fontsapi.zeoseven.com/285/main/result.css?v=2', family: 'Noto Serif CJK', weight: '500' },
        { css: 'https://fontsapi.zeoseven.com/69/main/result.css?v=2',  family: 'Noto Sans CJK',  weight: '400' }
    ];
    var state = {};    // css url -> 'healing' | 'healed' | ''（未处理）
    var rehealed = {}; // 覆盖补愈已执行过（防止反复自愈死循环）

    // ---------- 正常路径：主动触发字体加载 ----------
    function forceLoadFonts() {
        if (!document.fonts || !document.fonts.load) return;
        FONT_CONFIG.forEach(function (cfg) {
            try {
                document.fonts.load(cfg.weight + ' 1em "' + cfg.family + '"', '测试字体加载').catch(function () {});
            } catch (e) {}
        });
    }

    // ---------- 字体状态查询 ----------
    function getAllFontFaces() {
        var faces = [];
        if (!document.fonts) return faces;
        if (typeof document.fonts.forEach === 'function') {
            document.fonts.forEach(function (face) { faces.push(face); });
        } else {
            var it = document.fonts.entries && document.fonts.entries();
            if (it) {
                var e;
                while (!(e = it.next()).done) faces.push(e.value[1]);
            }
        }
        return faces;
    }

    function familyFaces(family) {
        return getAllFontFaces().filter(function (face) {
            return String(face.family).replace(/["']/g, '').trim() === family;
        });
    }

    // 收集页面可见文本的字符码点（innerText 不含 display:none）
    function pageCodeSet() {
        var set = new Set();
        var text = (document.body && (document.body.innerText || '')) || '';
        for (var i = 0; i < text.length; i++) {
            var cp = text.codePointAt(i);
            set.add(cp);
            if (cp > 0xFFFF) i++; // 跳过代理对低半区
        }
        return set;
    }

    // unicode-range 与页面字符集是否有交集（解析失败时保守返回 true）
    function rangesCoverSet(rangeStr, codeSet) {
        if (!codeSet.size) return true;
        var parts = rangeStr.split(',');
        var ranges = [];
        for (var i = 0; i < parts.length; i++) {
            var m = parts[i].trim().match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
            if (!m) return true;
            ranges.push([parseInt(m[1], 16), m[2] ? parseInt(m[2], 16) : parseInt(m[1], 16)]);
        }
        var codes = Array.from(codeSet);
        for (var j = 0; j < codes.length; j++) {
            for (var k = 0; k < ranges.length; k++) {
                if (codes[j] >= ranges[k][0] && codes[j] <= ranges[k][1]) return true;
            }
        }
        return false;
    }

    // 只保留思源字体确实覆盖的字符，避免 emoji/生僻字符造成 check() 误判
    function sanitizedPageSample() {
        var text = (document.body && (document.body.innerText || '')) || '';
        var out = [], seen = {};
        for (var i = 0; i < text.length && out.length < 250; i++) {
            var c = text.charCodeAt(i);
            var ok = (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x20 && c <= 0x7E) ||
                (c >= 0xFF00 && c <= 0xFFEF) || c === 0x2014 || c === 0x2018 ||
                c === 0x2019 || c === 0x201C || c === 0x201D || c === 0x2026;
            if (!ok) continue;
            var ch = text[i];
            if (seen[ch]) continue;
            seen[ch] = true;
            out.push(ch);
        }
        return out.join('');
    }

    // 页面文字是否已被该字族完整覆盖（用于检测"补愈后仍缺分片"）
    function familyCoversPage(family, weight) {
        if (!document.fonts || !document.fonts.check) return true;
        var sample = sanitizedPageSample();
        if (!sample) return true;
        try {
            return document.fonts.check(weight + ' 1em "' + family + '"', sample);
        } catch (e) {
            return true;
        }
    }

    // ---------- 自愈：绕过 HTTP 缓存重拉 + 注入 Blob @font-face ----------
    function cssProp(block, name) {
        var p = new RegExp('(?:^|[;\\s])' + name + '\\s*:\\s*([^;]+)', 'i');
        var m = block.match(p);
        return m ? m[1].trim().replace(/["']/g, '') : null;
    }

    // 解析 result.css 中的全部 @font-face（相对路径转绝对路径）
    function parseFontFaces(cssText, baseUrl) {
        var faces = [];
        var re = /@font-face\s*\{([^{}]*)\}/g;
        var m;
        while ((m = re.exec(cssText)) !== null) {
            var block = m[1];
            var src = block.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
            var family = cssProp(block, 'font-family');
            if (!src || !family) continue;
            faces.push({
                family: family,
                weight: cssProp(block, 'font-weight') || '400',
                style: cssProp(block, 'font-style') || 'normal',
                range: cssProp(block, 'unicode-range') || 'U+0-10FFFF',
                url: new URL(src[1], baseUrl).href
            });
        }
        return faces;
    }

    // cache:'reload' = 绕过内存/磁盘缓存强制重新下载，并把正确副本写回 HTTP 缓存（顺带修复污染）
    function reload(url) {
        return fetch(url, { cache: 'reload' }).then(function (res) {
            if (!res.ok) throw new Error('reload failed: ' + url + ' -> ' + res.status);
            return res;
        });
    }

    function selfHealFamily(cfg) {
        return reload(cfg.css).then(function (res) {
            return res.text();
        }).then(function (cssText) {
            var faces = parseFontFaces(cssText, cfg.css);
            if (!faces.length) throw new Error('no @font-face parsed: ' + cfg.css);
            // 只重拉页面用到的分片（一个字体 600+ 分片，全量太重）
            var codeSet = pageCodeSet();
            var needed = faces.filter(function (face) {
                return rangesCoverSet(face.range, codeSet);
            });
            if (!needed.length) needed = faces; // 保守兜底
            return Promise.all(needed.map(function (face) {
                return reload(face.url).then(function (res) {
                    return res.blob();
                }).then(function (blob) {
                    return '@font-face{font-family:"' + face.family + '";' +
                        'src:url("' + URL.createObjectURL(blob) + '") format("woff2");' +
                        'font-style:' + face.style + ';font-display:swap;' +
                        'font-weight:' + face.weight + ';unicode-range:' + face.range + ';}';
                });
            }));
        }).then(function (rules) {
            var style = document.createElement('style');
            style.textContent = rules.join('\n');
            document.head.appendChild(style);
            // 注入后主动触发一次匹配，让浏览器立即重排
            try {
                document.fonts.load(cfg.weight + ' 1em "' + cfg.family + '"', '测试字体加载').catch(function () {});
            } catch (e) {}
        });
    }

    // ---------- 检测 + 自愈调度 ----------
    function diagnoseFamily(cfg) {
        var faces = familyFaces(cfg.family);
        if (!faces.length) return 'missing-css';   // CSS 未加载（204/空响应）
        var hasError = faces.some(function (f) { return f.status === 'error'; });
        if (hasError) return 'errored';            // 有分片加载失败（缓存坏副本）
        if (state[cfg.css] === 'healed' && !familyCoversPage(cfg.family, cfg.weight)) {
            return 'coverage-gap';                 // 补愈后新渲染的正文仍未覆盖
        }
        return 'ok';
    }

    function startHeal(cfg) {
        state[cfg.css] = 'healing';
        selfHealFamily(cfg).then(function () {
            state[cfg.css] = 'healed';
        }, function () {
            state[cfg.css] = ''; // 本轮失败，后续检查可重试
        });
    }

    function checkAndHeal() {
        if (!document.fonts) return;
        FONT_CONFIG.forEach(function (cfg) {
            if (state[cfg.css] === 'healing') return;
            var verdict = diagnoseFamily(cfg);
            if (verdict === 'ok') { state[cfg.css] = 'healed'; return; }
            if (verdict === 'coverage-gap' && rehealed[cfg.css]) return; // 补过一次仍缺 → 等下次加载
            if (verdict === 'coverage-gap') rehealed[cfg.css] = true;
            startHeal(cfg);
        });
    }

    function boot() {
        forceLoadFonts();
        // 正文由 marked.js 异步渲染，延迟后再检测；两轮以覆盖慢渲染
        setTimeout(checkAndHeal, 1500);
        setTimeout(checkAndHeal, 4000);
    }

    if (document.readyState === 'complete') {
        boot();
    } else {
        window.addEventListener('load', boot);
    }
})();
