
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        var val = attrs[key];
        if (val === null || val === undefined || val === false) continue;
        if (key === 'class') node.className = val;
        else if (key === 'text') node.textContent = val;
        else if (key === 'html') node.innerHTML = val;
        else if (key === 'dataset') { for (var d in val) node.dataset[d] = val[d]; }
        else if (key.indexOf('on') === 0 && typeof val === 'function') node.addEventListener(key.slice(2), val);
        else if (val === true) node.setAttribute(key, '');
        else node.setAttribute(key, val);
      }
    }
    var kids = Array.prototype.slice.call(arguments, 2);
    (function walk(list) {
      list.forEach(function (child) {
        if (child === null || child === undefined || child === false) return;
        if (Array.isArray(child)) { walk(child); return; }
        node.appendChild(typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child)) : child);
      });
    })(kids);
    return node;
  }

  var pad2 = function (n) { return String(n).padStart(2, '0'); };
  var num = function (v) { var n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  var clamp = function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); };

  var SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR;
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  function parseClock(str) {
    if (str === null || str === undefined || str === '') return null;
    var s = String(str).trim().toLowerCase();
    var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (!m) m = /^(\d{1,2})\s*(am|pm)$/.exec(s);
    if (!m) m = /^(\d{2})(\d{2})$/.exec(s);
    if (!m) return null;
    var h = 0, mi = 0, sec = 0, ap = null;
    if (m.length === 4 && (m[2] === 'am' || m[2] === 'pm')) { h = +m[1]; ap = m[2]; }
    else if (m.length === 4) { h = +m[1]; mi = +m[2]; sec = +(m[3] || 0); }
    else if (m.length === 3) { h = +m[1]; mi = +m[2]; }
    else { h = +m[1]; mi = +m[2]; }
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (h > 23 || mi > 59 || sec > 59) return null;
    return h * 3600 + mi * 60 + sec;
  }

  function clockStr(totalSec) {
    var s = Math.round(totalSec);
    s = ((s % 86400) + 86400) % 86400;
    return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor((s % 3600) / 60));
  }

  function formatClock(totalSec, use12, showSeconds) {
    var s = Math.round(totalSec);
    s = ((s % 86400) + 86400) % 86400;
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (use12) {
      var ap = h < 12 ? 'AM' : 'PM';
      var h12 = h % 12 === 0 ? 12 : h % 12;
      return h12 + ':' + pad2(m) + (showSeconds ? ':' + pad2(sec) : '') + ' ' + ap;
    }
    return showSeconds ? pad2(h) + ':' + pad2(m) + ':' + pad2(sec) : pad2(h) + ':' + pad2(m);
  }

  function fmtDuration(totalSec, opts) {
    opts = opts || {};
    var negative = totalSec < 0;
    var s = Math.abs(Math.round(totalSec));
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    var parts = [];
    if (d) parts.push(plural(d, 'day'));
    if (h) parts.push(plural(h, 'hour'));
    if (m) parts.push(plural(m, 'minute'));
    if (s || parts.length === 0) parts.push(plural(s, 'second'));
    if (opts.short) {
      var short = [];
      if (d) short.push(d + 'd');
      if (h) short.push(h + 'h');
      if (m) short.push(m + 'm');
      if (s && !d && !h) short.push(s + 's');
      return (negative ? '\u2212' : '') + (short.join(' ') || '0s');
    }
    return (negative ? '\u2212' : '') + parts.join(' ');
  }

  function decimalHours(sec) { return (sec / 3600).toFixed(4).replace(/\.?0+$/, '') || '0'; }
  function decimalDays(sec) { return (sec / 86400).toFixed(6).replace(/\.?0+$/, '') || '0'; }

  var locale = navigator.language || 'en-US';
  function numberFmt(n, opts) { return new Intl.NumberFormat(locale, opts || { maximumFractionDigits: 2 }).format(n); }
  function localeUses24h() {
    try {
      var s = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(new Date(2020, 0, 1, 13));
      return !/am|pm/i.test(s);
    } catch (e) { return false; }
  }
  var uses24Default = localeUses24h();

  function isoDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function isoToday() { return isoDate(new Date()); }
  function timeNow(withSeconds) {
    var d = new Date();
    return withSeconds ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) : pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function toDate(dateStr, timeStr) {
    if (!dateStr) return null;
    var t = (timeStr && timeStr.length === 5) ? timeStr + ':00' : (timeStr || '00:00:00');
    var d = new Date(dateStr + 'T' + t);
    return isNaN(d.getTime()) ? null : d;
  }

  function calendarDiff(start, end) {
    var y = end.getFullYear() - start.getFullYear();
    var mo = end.getMonth() - start.getMonth();
    var d = end.getDate() - start.getDate();
    var h = end.getHours() - start.getHours();
    var mi = end.getMinutes() - start.getMinutes();
    var s = end.getSeconds() - start.getSeconds();
    if (s < 0) { s += 60; mi -= 1; }
    if (mi < 0) { mi += 60; h -= 1; }
    if (h < 0) { h += 24; d -= 1; }
    if (d < 0) { d += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); mo -= 1; }
    if (mo < 0) { mo += 12; y -= 1; }
    return { years: y, months: mo, days: d, hours: h, minutes: mi, seconds: s };
  }
  function isWeekend(date) { var day = date.getDay(); return day === 0 || day === 6; }
  function parseHolidays(text) {
    var set = new Set();
    if (!text) return set;
    String(text).split(/[\s,;]+/).forEach(function (token) {
      var t = token.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) set.add(t);
    });
    return set;
  }
  function countBusinessDays(start, end, holidays) {
    var a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (b < a) return 0;
    var count = 0, cursor = new Date(a), guard = 0;
    while (cursor <= b && guard < 400000) {
      guard++;
      if (!isWeekend(cursor) && !holidays.has(isoDate(cursor))) count += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }
  function addBusinessDays(start, days, holidays) {
    var set = holidays || new Set();
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var remaining = Math.abs(days), dir = days >= 0 ? 1 : -1, guard = 0;
    while (remaining > 0 && guard < 400000) {
      guard++;
      cursor.setDate(cursor.getDate() + dir);
      if (!isWeekend(cursor) && !set.has(isoDate(cursor))) remaining -= 1;
    }
    return cursor;
  }

  var TIMEZONES = ['UTC','Pacific/Honolulu','America/Anchorage','America/Los_Angeles','America/Denver','America/Phoenix','America/Chicago','America/New_York','America/Toronto','America/Halifax','America/Mexico_City','America/Bogota','America/Lima','America/Sao_Paulo','America/Argentina/Buenos_Aires','Atlantic/Reykjavik','Europe/London','Europe/Dublin','Europe/Lisbon','Europe/Madrid','Europe/Paris','Europe/Brussels','Europe/Amsterdam','Europe/Berlin','Europe/Zurich','Europe/Rome','Europe/Vienna','Europe/Prague','Europe/Warsaw','Europe/Stockholm','Europe/Oslo','Europe/Copenhagen','Europe/Helsinki','Europe/Athens','Europe/Bucharest','Europe/Istanbul','Europe/Moscow','Europe/Kyiv','Africa/Cairo','Africa/Lagos','Africa/Nairobi','Africa/Johannesburg','Asia/Jerusalem','Asia/Riyadh','Asia/Dubai','Asia/Tehran','Asia/Karachi','Asia/Kolkata','Asia/Colombo','Asia/Kathmandu','Asia/Dhaka','Asia/Bangkok','Asia/Jakarta','Asia/Singapore','Asia/Kuala_Lumpur','Asia/Hong_Kong','Asia/Shanghai','Asia/Taipei','Asia/Manila','Asia/Seoul','Asia/Tokyo','Australia/Perth','Australia/Adelaide','Australia/Brisbane','Australia/Sydney','Australia/Melbourne','Pacific/Auckland','Pacific/Fiji'];

  var _offsetFormatters = new Map();
  function offsetFormatter(tz) {
    if (!_offsetFormatters.has(tz)) {
      _offsetFormatters.set(tz, new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    return _offsetFormatters.get(tz);
  }
  function zoneOffsetMs(instant, tz) {
    var parts;
    try { parts = offsetFormatter(tz).formatToParts(instant); } catch (e) { return 0; }
    var p = {};
    parts.forEach(function (part) { p[part.type] = part.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return asUTC - Math.floor(instant.getTime() / 1000) * 1000;
  }
  function zonedToInstant(dateStr, timeStr, tz) {
    var t = (timeStr && timeStr.length === 5) ? timeStr + ':00' : (timeStr || '00:00:00');
    var guess = new Date(dateStr + 'T' + t + 'Z');
    if (isNaN(guess.getTime())) return null;
    var offset = zoneOffsetMs(guess, tz);
    var instant = new Date(guess.getTime() - offset);
    offset = zoneOffsetMs(instant, tz);
    return new Date(guess.getTime() - offset);
  }
  var _zoneFormatters = new Map();
  function zoneFormatter(tz, withSeconds) {
    var key = tz + '|' + (withSeconds ? 's' : '');
    if (!_zoneFormatters.has(key)) {
      var opts = { timeZone: tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
      if (withSeconds) opts.second = '2-digit';
      _zoneFormatters.set(key, new Intl.DateTimeFormat('en-GB', opts));
    }
    return _zoneFormatters.get(key);
  }
  function formatInZone(instant, tz, withSeconds) {
    try { return zoneFormatter(tz, withSeconds).format(instant); } catch (e) { return '\u2014'; }
  }
  function zoneOffsetLabel(instant, tz) {
    var off = zoneOffsetMs(instant, tz);
    var sign = off < 0 ? '\u2212' : '+';
    var mins = Math.abs(off) / 60000;
    return 'UTC' + sign + pad2(Math.floor(mins / 60)) + ':' + pad2(Math.round(mins % 60));
  }
  function zoneAbbr(instant, tz) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(instant);
      var found = parts.find(function (p) { return p.type === 'timeZoneName'; });
      return found ? found.value : '';
    } catch (e) { return ''; }
  }
  function hourInZone(instant, tz) {
    try { return +new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: '2-digit' }).format(instant); }
    catch (e) { return 12; }
  }
  function detectUserTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  }
  function dstTransitionOn(dateStr, tz) {
    var a = new Date(dateStr + 'T00:00:00Z');
    var b = new Date(dateStr + 'T23:59:00Z');
    if (isNaN(a.getTime())) return false;
    return zoneOffsetMs(a, tz) !== zoneOffsetMs(b, tz);
  }

  var ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    plusminus: '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9" opacity=".25"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    hourglass: '<path d="M7 3h10M7 21h10M7 3c0 4 5 5 5 9s-5 5-5 9M17 3c0 4-5 5-5 9s5 5 5 9"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 8v4l3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3.2 2.6 14.8 0 18M12 3c-2.6 3.2-2.6 14.8 0 18"/>',
    trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    coins: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.6 9.4h3.6a1.9 1.9 0 0 1 0 3.8H9.6"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2M4 21h14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    sliders: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="17" r="2"/>',
    cake: '<path d="M12 3v3M8 6h8a3 3 0 0 1 3 3v8H5V9a3 3 0 0 1 3-3Z"/><path d="M5 17h14M9 12h6"/>',
    play: '<path d="m6 4 12 8-12 8V4Z"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    creditcard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    book: '<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z"/><path d="M4 4h12a2 2 0 0 1 2 2v14"/>',
    playcircle: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-5-5"/>'
  };
  function iconSvg(name) {
    var path = ICONS[name] || ICONS.clock;
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  var CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
    { code: 'EUR', symbol: '\u20AC', label: 'EUR — Euro' },
    { code: 'GBP', symbol: '\u00A3', label: 'GBP — Pound' },
    { code: 'INR', symbol: '\u20B9', label: 'INR — Rupee' },
    { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
    { code: 'CAD', symbol: 'C$', label: 'CAD — Canadian Dollar' },
    { code: 'JPY', symbol: '\u00A5', label: 'JPY — Yen' },
    { code: 'CUSTOM', symbol: '', label: 'Custom symbol' }
  ];

  var WEEK_STARTS = [{ v: '0', t: 'Sunday' }, { v: '1', t: 'Monday' }, { v: '6', t: 'Saturday' }];

  var OT_TEMPLATES = [
    { v: 'custom', t: 'Custom' },
    { v: 'us-flsa', t: 'US FLSA (1.5x after 40h/week)' },
    { v: 'us-ca', t: 'California (1.5x after 8h/day, 2x after 12h)' },
    { v: 'eu', t: 'EU Working Time Directive (1.25x typical)' },
    { v: 'uk', t: 'UK (1.5x typical after 40h)' },
    { v: 'au', t: 'Australia (1.5x after 38h)' }
  ];

  function M(label, value) { return { label: label, value: String(value) }; }

  var CALCS = [];
  function defineCalc(def) { CALCS.push(def); return def; }
  function getCalc(id) { return CALCS.find(function (c) { return c.id === id; }) || CALCS[0]; }

  defineCalc({
    id: 'duration', group: 'Time Duration', short: 'Time Duration',
    name: 'Time Duration Calculator', desc: 'Calculate the elapsed time between two times or two dates.',
    icon: 'clock', disclaimer: 'Times use your browser\'s local time zone.',
    fields: [
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'startTime', label: 'Start time', type: 'time', nowBtn: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'endTime', label: 'End time', type: 'time', nowBtn: true },
      { type: 'heading', label: 'Display options' },
      { name: 'use12', label: '12-hour format', type: 'checkbox' },
      { name: 'showSeconds', label: 'Show seconds', type: 'checkbox' },
      { name: 'autoOvernight', label: 'Detect overnight shifts', type: 'checkbox' },
      { name: 'showDecimal', label: 'Decimal hours', type: 'checkbox' },
      { name: 'showMinutes', label: 'Total minutes', type: 'checkbox' },
      { name: 'showSecondsTotal', label: 'Total seconds', type: 'checkbox' },
      { name: 'showDays', label: 'Total days', type: 'checkbox' },
      { name: 'laps', label: 'Lap / waypoint times', type: 'laps', hint: 'Optional intermediate times.', sub: [
        { name: 'label', label: 'Label', type: 'text', placeholder: 'Leg 1' },
        { name: 'time', label: 'Time', type: 'time' }
      ] }
    ],
    defaults: function () {
      return { startDate: isoToday(), startTime: '09:00', endDate: isoToday(), endTime: '17:30', use12: !uses24Default, showSeconds: false, autoOvernight: true, showDecimal: true, showMinutes: true, showSecondsTotal: true, showDays: true, laps: [] };
    },
    compute: function (v) {
      var sc = parseClock(v.startTime), ec = parseClock(v.endTime);
      if (sc === null) return { error: 'Enter a valid start time.' };
      if (ec === null) return { error: 'Enter a valid end time.' };
      var start = toDate(v.startDate, v.startTime), end = toDate(v.endDate, v.endTime);
      if (!start) return { error: 'Enter a valid start date.' };
      if (!end) return { error: 'Enter a valid end date.' };
      var ms = end.getTime() - start.getTime();
      var sameDay = v.startDate === v.endDate;
      var overnight = ec < sc;
      var adjusted = false;
      if (ms < 0) {
        if (v.autoOvernight && sameDay) { ms += DAY; adjusted = true; }
        else return { error: 'End is before start. Add a later end date or enable overnight detection.' };
      } else if (ms === 0 && sameDay && v.autoOvernight && ec < sc) { ms += DAY; adjusted = true; }
      var sec = ms / 1000;
      var meta = [];
      if (v.showMinutes) meta.push(M('Total minutes', numberFmt(sec / 60, { maximumFractionDigits: 2 })));
      if (v.showSecondsTotal) meta.push(M('Total seconds', numberFmt(Math.round(sec))));
      if (v.showDecimal) meta.push(M('Decimal hours', decimalHours(sec)));
      if (v.showDays) meta.push(M('Decimal days', decimalDays(sec)));
      var breakdown = [M('Start', v.startDate + ' ' + formatClock(sc, v.use12, v.showSeconds)), M('End', v.endDate + ' ' + formatClock(ec, v.use12, v.showSeconds)), M('Human readable', fmtDuration(sec)), M('Total minutes', numberFmt(sec / 60, { maximumFractionDigits: 2 })), M('Total hours', decimalHours(sec))];
      var laps = (v.laps || []).filter(function (l) { return l.time; });
      if (laps.length) {
        var prev = sc;
        var all = laps.map(function (l) { return { label: l.label || 'Lap', sec: parseClock(l.time) }; }).filter(function (x) { return x.sec !== null; });
        all.push({ label: 'End', sec: ec + (overnight && adjusted ? 86400 : 0) });
        all.forEach(function (lap, i) {
          var dur = lap.sec - prev;
          if (dur < 0) dur += 86400;
          breakdown.push(M(lap.label || 'Lap ' + (i + 1), formatClock(lap.sec % 86400, v.use12, v.showSeconds) + ' \u00B7 +' + fmtDuration(dur, { short: true })));
          prev = lap.sec;
        });
      }
      var timeline = { segments: [{ label: 'Elapsed', start: 0, end: 1, type: 'work' }], labels: [formatClock(sc, v.use12, v.showSeconds), formatClock(ec, v.use12, v.showSeconds)] };
      var now = new Date();
      var totalMs = end.getTime() - start.getTime();
      if (totalMs > 0 && now >= start && now <= end) timeline.now = (now.getTime() - start.getTime()) / totalMs;
      var warnings = [];
      if (adjusted) warnings.push({ level: 'info', text: 'Overnight detected. One day was added.' });
      if (sec === 0) warnings.push({ level: 'info', text: 'Start and end are identical.' });
      return { primary: fmtDuration(sec), sub: formatClock(sc, v.use12, v.showSeconds) + ' \u2192 ' + formatClock(ec, v.use12, v.showSeconds), meta: meta, breakdown: breakdown, timeline: timeline, badge: overnight ? 'Overnight' : '', warnings: warnings, value: sec, how: 'end \u2212 start = ' + ms + ' ms\n\u00F7 1000 = ' + sec.toFixed(3) + ' s' };
    }
  });

  defineCalc({
    id: 'work-hours', group: 'Work & Pay', short: 'Work Hours',
    name: 'Work Hours Calculator', desc: 'Calculate working time after paid and unpaid breaks.',
    icon: 'briefcase', disclaimer: 'Break rules vary by employer. Verify against your policy.',
    fields: [
      { name: 'preset', label: 'Shift preset', type: 'select', options: [
        { v: 'custom', t: 'Custom' }, { v: 'morning', t: 'Morning (09:00-17:30)' },
        { v: 'evening', t: 'Evening (14:00-22:00)' }, { v: 'night', t: 'Night (22:00-06:30)' },
        { v: 'split', t: 'Split (08:00-18:30)' }
      ] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'clockIn', label: 'Clock in', type: 'time', nowBtn: true },
      { name: 'clockOut', label: 'Clock out', type: 'time', nowBtn: true },
      { name: 'autoOvernight', label: 'Detect overnight', type: 'checkbox' },
      { name: 'autoBreakRule', label: 'Deduct 30m unpaid break when shift \u2265 6h', type: 'checkbox' },
      { name: 'scheduledHours', label: 'Scheduled hours', type: 'number', min: 0, step: 0.25 },
      { name: 'breaks', label: 'Breaks', type: 'breaks', hint: 'Paid breaks count as working time.', sub: [
        { name: 'start', label: 'Start', type: 'time' }, { name: 'end', label: 'End', type: 'time' },
        { name: 'paid', label: 'Type', type: 'select', options: [{ v: 'unpaid', t: 'Unpaid' }, { v: 'paid', t: 'Paid' }] }
      ] }
    ],
    defaults: function () {
      return { preset: 'custom', date: isoToday(), clockIn: '09:00', clockOut: '17:30', autoOvernight: true, autoBreakRule: false, scheduledHours: '8', breaks: [{ start: '12:30', end: '13:00', paid: 'unpaid' }] };
    },
    compute: function (v) {
      var inSec, outSec, breaks = v.breaks || [];
      if (v.preset === 'morning') { inSec = parseClock('09:00'); outSec = parseClock('17:30'); breaks = [{ start: '12:30', end: '13:00', paid: 'unpaid' }]; }
      else if (v.preset === 'evening') { inSec = parseClock('14:00'); outSec = parseClock('22:00'); breaks = [{ start: '18:00', end: '18:30', paid: 'unpaid' }]; }
      else if (v.preset === 'night') { inSec = parseClock('22:00'); outSec = parseClock('06:30'); breaks = [{ start: '02:00', end: '02:30', paid: 'unpaid' }]; }
      else if (v.preset === 'split') { inSec = parseClock('08:00'); outSec = parseClock('18:30'); breaks = [{ start: '12:30', end: '14:00', paid: 'unpaid' }]; }
      else { inSec = parseClock(v.clockIn); outSec = parseClock(v.clockOut); }
      if (inSec === null) return { error: 'Enter a valid clock-in time.' };
      if (outSec === null) return { error: 'Enter a valid clock-out time.' };
      var gross = outSec - inSec;
      if (gross < 0) { if (v.autoOvernight) gross += 86400; else return { error: 'Clock-out is before clock-in.' }; }
      if (gross === 0) return { error: 'Shift has zero length.' };
      var paidBreak = 0, unpaidBreak = 0, breakRows = [], breakSegments = [];
      breaks.forEach(function (b, i) {
        var bs = parseClock(b.start), be = parseClock(b.end);
        if (bs === null || be === null) return;
        var dur = be - bs;
        if (dur < 0) dur += 86400;
        if (dur <= 0) return;
        if (b.paid === 'paid') paidBreak += dur; else unpaidBreak += dur;
        breakRows.push(M('Break ' + (i + 1) + ' (' + b.paid + ')', fmtDuration(dur)));
        breakSegments.push({ start: bs, end: bs + dur, type: b.paid === 'paid' ? 'paid' : 'break' });
      });
      var warnings = [];
      if (v.autoBreakRule && gross >= 6 * 3600 && unpaidBreak === 0) {
        unpaidBreak += 30 * 60;
        breakRows.push(M('Auto-deducted break', '30 minutes'));
        warnings.push({ level: 'info', text: '30-minute unpaid break auto-deducted.' });
      }
      var totalBreak = paidBreak + unpaidBreak;
      var net = gross - totalBreak;
      if (net < 0) warnings.push({ level: 'error', text: 'Breaks exceed the shift.' });
      var netClamped = Math.max(0, net);
      var scheduledSec = num(v.scheduledHours) * 3600;
      var overtime = scheduledSec > 0 ? Math.max(0, netClamped - scheduledSec) : 0;
      var undertime = scheduledSec > 0 ? Math.max(0, scheduledSec - netClamped) : 0;
      var timeline = buildShiftTimeline(inSec, gross, breakSegments);
      var meta = [M('Gross shift', fmtDuration(gross)), M('Total breaks', fmtDuration(totalBreak)), M('Net working', fmtDuration(netClamped)), M('Decimal hours', decimalHours(netClamped))];
      if (scheduledSec > 0) { meta.push(M('Scheduled', fmtDuration(scheduledSec))); meta.push(M(overtime > 0 ? 'Overtime' : 'Undertime', fmtDuration(overtime > 0 ? overtime : undertime))); }
      var breakdown = [M('Clock in', formatClock(inSec, false, false)), M('Clock out', formatClock(outSec, false, false)), M('Gross', fmtDuration(gross))].concat(breakRows, [M('Paid break', fmtDuration(paidBreak)), M('Unpaid break', fmtDuration(unpaidBreak)), M('Net', fmtDuration(netClamped)), M('Decimal hours', decimalHours(netClamped))]);
      if (scheduledSec > 0) { breakdown.push(M('Scheduled', fmtDuration(scheduledSec))); breakdown.push(M('Overtime', fmtDuration(overtime))); breakdown.push(M('Undertime', fmtDuration(undertime))); }
      var chart = [
        { label: 'Net work', value: netClamped / 3600, display: fmtDuration(netClamped, { short: true }), type: 'primary' },
        { label: 'Paid breaks', value: paidBreak / 3600, display: fmtDuration(paidBreak, { short: true }), type: 'paid' },
        { label: 'Unpaid breaks', value: unpaidBreak / 3600, display: fmtDuration(unpaidBreak, { short: true }), type: 'break' }
      ];
      if (overtime > 0) chart.push({ label: 'Overtime', value: overtime / 3600, display: fmtDuration(overtime, { short: true }), type: 'overtime' });
      return { primary: fmtDuration(netClamped), sub: 'Net working time', meta: meta, breakdown: breakdown, chart: chart, timeline: timeline, badge: gross > 86400 ? 'Multi-day' : (outSec < inSec ? 'Overnight' : ''), warnings: warnings, value: netClamped };
    }
  });

  function buildShiftTimeline(startSec, durationSec, breakSegments) {
    if (durationSec <= 0) return null;
    var segments = [];
    var end = startSec + durationSec;
    var sorted = breakSegments.filter(function (b) { return b.end > startSec && b.start < end; }).sort(function (a, b) { return a.start - b.start; });
    var cursor = startSec;
    sorted.forEach(function (b) {
      var bs = clamp(b.start, startSec, end), be = clamp(b.end, startSec, end);
      if (bs > cursor) segments.push({ label: 'Work', start: (cursor - startSec) / durationSec, end: (bs - startSec) / durationSec, type: 'work' });
      segments.push({ label: b.type === 'paid' ? 'Paid break' : 'Break', start: (bs - startSec) / durationSec, end: (be - startSec) / durationSec, type: b.type });
      cursor = Math.max(cursor, be);
    });
    if (cursor < end) segments.push({ label: 'Work', start: (cursor - startSec) / durationSec, end: 1, type: 'work' });
    if (!segments.length) segments.push({ label: 'Work', start: 0, end: 1, type: 'work' });
    return { segments: segments, labels: [clockStr(startSec), clockStr(end)] };
  }

  defineCalc({
    id: 'timesheet', group: 'Work & Pay', short: 'Timesheet',
    name: 'Timesheet Calculator', desc: 'Track work periods, billable hours and earnings.',
    icon: 'table', disclaimer: 'Earnings are estimates before tax.',
    fields: [
      { name: 'rows', label: 'Entries', type: 'rows', hint: 'One row per work period.', sub: [
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'client', label: 'Client', type: 'text', placeholder: 'Client' },
        { name: 'project', label: 'Project', type: 'text', placeholder: 'Project' },
        { name: 'task', label: 'Task', type: 'text', placeholder: 'Task' },
        { name: 'start', label: 'Start', type: 'time' },
        { name: 'end', label: 'End', type: 'time' },
        { name: 'breakMin', label: 'Break (min)', type: 'number', min: 0, step: 5 },
        { name: 'billable', label: 'Billable', type: 'select', options: [{ v: 'yes', t: 'Billable' }, { v: 'no', t: 'Non-billable' }] },
        { name: 'rate', label: 'Rate / h', type: 'number', min: 0, step: 0.01 },
        { name: 'notes', label: 'Notes', type: 'text', placeholder: 'Notes' }
      ] },
      { name: 'otAfter', label: 'Overtime after (h/day)', type: 'number', min: 0, step: 0.5 },
      { name: 'weekStart', label: 'Week starts', type: 'select', options: WEEK_STARTS },
      { name: 'currency', label: 'Currency', type: 'select', options: CURRENCIES.map(function (c) { return { v: c.code, t: c.label }; }) },
      { name: 'showInvoice', label: 'Show invoice summary', type: 'checkbox' }
    ],
    defaults: function () {
      return { otAfter: '8', weekStart: '1', currency: 'USD', showInvoice: false, rows: [
        { date: isoToday(), client: '', project: '', task: '', start: '09:00', end: '12:30', breakMin: '0', billable: 'yes', rate: '45', notes: '' },
        { date: isoToday(), client: '', project: '', task: '', start: '13:00', end: '17:30', breakMin: '0', billable: 'yes', rate: '45', notes: '' }
      ] };
    },
    compute: function (v) {
      var rows = (v.rows || []).filter(function (r) { return r.start || r.end || r.date; });
      if (!rows.length) return { error: 'Add at least one row.' };
      var otAfterSec = num(v.otAfter) * 3600;
      var parsed = [], warnings = [];
      rows.forEach(function (r, i) {
        var s = parseClock(r.start), e = parseClock(r.end);
        if (s === null || e === null) { warnings.push({ level: 'warn', text: 'Row ' + (i + 1) + ' skipped (invalid times).' }); return; }
        var dur = e - s;
        if (dur < 0) dur += 86400;
        dur -= Math.max(0, num(r.breakMin) * 60);
        if (dur < 0) { warnings.push({ level: 'warn', text: 'Row ' + (i + 1) + ': break longer than shift.' }); dur = 0; }
        parsed.push({ date: r.date || isoToday(), start: r.start, end: r.end, client: r.client || '', project: r.project || '', task: r.task || '', notes: r.notes || '', breakMin: r.breakMin || '0', seconds: dur, billable: r.billable !== 'no', rate: num(r.rate) });
      });
      if (!parsed.length) return { error: 'No valid rows.' };
      var byDay = new Map();
      parsed.forEach(function (p) { byDay.set(p.date, (byDay.get(p.date) || 0) + p.seconds); });
      var regularSec = 0, overtimeSec = 0;
      byDay.forEach(function (total) {
        if (otAfterSec > 0) { regularSec += Math.min(total, otAfterSec); overtimeSec += Math.max(0, total - otAfterSec); }
        else regularSec += total;
      });
      var totalSec = parsed.reduce(function (a, p) { return a + p.seconds; }, 0);
      var billableSec = parsed.filter(function (p) { return p.billable; }).reduce(function (a, p) { return a + p.seconds; }, 0);
      var nonBillableSec = totalSec - billableSec;
      var billablePct = totalSec > 0 ? (billableSec / totalSec) * 100 : 0;
      var currency = (CURRENCIES.find(function (c) { return c.code === v.currency; }) || { symbol: '$' }).symbol;
      var money = function (n) { return currency + n.toFixed(2); };
      var earnings = 0;
      parsed.forEach(function (p) { if (p.billable && p.rate > 0) earnings += (p.seconds / 3600) * p.rate; });
      var rowsBreakdown = parsed.map(function (p, i) {
        return M('Row ' + (i + 1) + (p.date ? ' \u00B7 ' + p.date : ''), clockStr(parseClock(p.start)) + '\u2013' + clockStr(parseClock(p.end)) + ' \u00B7 ' + fmtDuration(p.seconds, { short: true }) + (p.billable ? '' : ' (non-billable)'));
      });
      var meta = [M('Total hours', fmtDuration(totalSec)), M('Decimal hours', decimalHours(totalSec)), M('Billable hours', fmtDuration(billableSec)), M('Billable %', billablePct.toFixed(1) + '%'), M('Total earnings', money(earnings)), M('Regular hours', fmtDuration(regularSec)), M('Overtime hours', fmtDuration(overtimeSec))];
      var breakdown = rowsBreakdown.concat([M('Days covered', String(byDay.size)), M('Billable hours', fmtDuration(billableSec)), M('Non-billable hours', fmtDuration(nonBillableSec)), M('Billable percentage', billablePct.toFixed(1) + '%'), M('Estimated earnings', money(earnings)), M('Regular hours', fmtDuration(regularSec)), M('Overtime hours', fmtDuration(overtimeSec))]);
      if (v.showInvoice) {
        var byClient = new Map();
        parsed.forEach(function (p) {
          if (!p.billable) return;
          var key = p.client || p.project || 'Unassigned';
          var cur = byClient.get(key) || { sec: 0, amount: 0 };
          cur.sec += p.seconds;
          cur.amount += (p.seconds / 3600) * p.rate;
          byClient.set(key, cur);
        });
        breakdown.push(M('\u2014', '\u2014'));
        breakdown.push(M('INVOICE SUMMARY', ''));
        byClient.forEach(function (val, key) { breakdown.push(M(key, fmtDuration(val.sec, { short: true }) + ' \u00B7 ' + money(val.amount))); });
        breakdown.push(M('Subtotal', money(earnings)));
        breakdown.push(M('Total due', money(earnings)));
      }
      var chart = [
        { label: 'Billable', value: billableSec / 3600, display: fmtDuration(billableSec, { short: true }), type: 'primary' },
        { label: 'Non-billable', value: nonBillableSec / 3600, display: fmtDuration(nonBillableSec, { short: true }), type: 'muted' },
        { label: 'Overtime', value: overtimeSec / 3600, display: fmtDuration(overtimeSec, { short: true }), type: 'overtime' }
      ];
      return { primary: fmtDuration(totalSec), sub: parsed.length + ' entr' + (parsed.length === 1 ? 'y' : 'ies') + ' \u00B7 ' + money(earnings), meta: meta, breakdown: breakdown, chart: chart, warnings: warnings, value: totalSec, rows: parsed };
    }
  });

  defineCalc({
    id: 'multi-interval', group: 'Time Duration', short: 'Multiple Intervals',
    name: 'Multiple Time Intervals', desc: 'Add several time periods together and detect overlaps.',
    icon: 'layers',
    fields: [
      { name: 'intervals', label: 'Intervals', type: 'intervals', hint: 'Times within a single day. End before start crosses midnight.', sub: [
        { name: 'start', label: 'Start', type: 'time' }, { name: 'end', label: 'End', type: 'time' }
      ] },
      { name: 'mergeOverlaps', label: 'Merge overlaps', type: 'checkbox' },
      { name: 'sortIntervals', label: 'Sort by start time', type: 'checkbox' },
      { name: 'gapTolerance', label: 'Merge gaps shorter than (min)', type: 'number', min: 0, step: 1 }
    ],
    defaults: function () {
      return { mergeOverlaps: false, sortIntervals: true, gapTolerance: '0', intervals: [
        { start: '09:00', end: '11:30' }, { start: '12:30', end: '15:00' }, { start: '16:00', end: '18:15' }
      ] };
    },
    compute: function (v) {
      var list = [], warnings = [];
      (v.intervals || []).forEach(function (row, i) {
        var s = parseClock(row.start), e = parseClock(row.end);
        if (s === null || e === null) { if (row.start || row.end) warnings.push({ level: 'warn', text: 'Interval ' + (i + 1) + ' skipped.' }); return; }
        var end = e;
        if (end <= s) end += 86400;
        list.push({ index: i + 1, start: s, end: end, seconds: end - s });
      });
      if (!list.length) return { error: 'Add at least one valid interval.' };
      var seen = new Set(), duplicates = [];
      list.forEach(function (item) { var key = item.start + '-' + item.end; if (seen.has(key)) duplicates.push(item.index); seen.add(key); });
      var sortedForOverlap = list.slice().sort(function (a, b) { return a.start - b.start; });
      var overlaps = [];
      for (var i = 0; i < sortedForOverlap.length - 1; i++) {
        if (sortedForOverlap[i + 1].start < sortedForOverlap[i].end) overlaps.push([sortedForOverlap[i].index, sortedForOverlap[i + 1].index]);
      }
      var working = v.sortIntervals ? list.slice().sort(function (a, b) { return a.start - b.start; }) : list;
      var toleranceSec = num(v.gapTolerance) * 60;
      var merged = [];
      if (v.mergeOverlaps) {
        working.forEach(function (item) {
          var last = merged[merged.length - 1];
          if (last && item.start <= last.end + toleranceSec) { last.end = Math.max(last.end, item.end); last.seconds = last.end - last.start; last.merged = true; }
          else merged.push(Object.assign({}, item));
        });
      } else merged = working;
      var totalSec = merged.reduce(function (a, i) { return a + i.seconds; }, 0);
      var gaps = [], totalGapSec = 0;
      for (var j = 0; j < merged.length - 1; j++) {
        var gap = merged[j + 1].start - merged[j].end;
        if (gap > 0) { gaps.push({ after: merged[j].index, sec: gap }); totalGapSec += gap; }
      }
      if (overlaps.length) warnings.push({ level: 'warn', text: 'Overlaps: ' + overlaps.map(function (p) { return p[0] + ' & ' + p[1]; }).join(', ') });
      if (duplicates.length) warnings.push({ level: 'warn', text: 'Duplicates: rows ' + duplicates.join(', ') });
      if (gaps.length) warnings.push({ level: 'info', text: 'Idle time: ' + fmtDuration(totalGapSec) });
      var breakdown = merged.map(function (i) { return M('Interval' + (i.merged ? ' (merged)' : ''), clockStr(i.start) + ' \u2013 ' + clockStr(i.end) + ' \u00B7 ' + fmtDuration(i.seconds, { short: true })); });
      breakdown.push(M('Interval count', String(merged.length)));
      breakdown.push(M('Total duration', fmtDuration(totalSec)));
      breakdown.push(M('Decimal hours', decimalHours(totalSec)));
      if (gaps.length) { breakdown.push(M('Total idle time', fmtDuration(totalGapSec))); gaps.forEach(function (g) { breakdown.push(M('Gap after ' + g.after, fmtDuration(g.sec))); }); }
      var timeline = { segments: [], labels: ['00:00', '24:00'] };
      for (var k = 0; k < merged.length; k++) {
        timeline.segments.push({ label: fmtDuration(merged[k].seconds, { short: true }), start: merged[k].start / 86400, end: Math.min(1, merged[k].end / 86400), type: 'work' });
        if (k < merged.length - 1) { var gS = merged[k].end, gE = merged[k + 1].start; if (gE > gS) timeline.segments.push({ label: 'Idle', start: gS / 86400, end: Math.min(1, gE / 86400), type: 'idle' }); }
      }
      var chart = merged.map(function (i, idx) { return { label: '#' + (idx + 1), value: i.seconds / 3600, display: fmtDuration(i.seconds, { short: true }), type: 'primary' }; });
      return { primary: fmtDuration(totalSec), sub: merged.length + ' interval' + (merged.length === 1 ? '' : 's') + (totalGapSec ? ' \u00B7 ' + fmtDuration(totalGapSec, { short: true }) + ' idle' : ''), meta: [M('Intervals', String(merged.length)), M('Total hours', decimalHours(totalSec)), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 2 })), M('Average interval', fmtDuration(totalSec / merged.length)), M('Total idle time', fmtDuration(totalGapSec))], breakdown: breakdown, timeline: timeline, chart: chart, warnings: warnings, value: totalSec };
    }
  });

  defineCalc({
    id: 'add-subtract', group: 'Time Arithmetic', short: 'Add / Subtract',
    name: 'Add / Subtract Time', desc: 'Add or subtract durations from a time, or combine two durations.',
    icon: 'plusminus',
    fields: [
      { name: 'op', label: 'Operation', type: 'select', options: [
        { v: 'time+dur', t: 'Time + duration' }, { v: 'time-dur', t: 'Time \u2212 duration' },
        { v: 'dur+dur', t: 'Duration + duration' }, { v: 'dur-dur', t: 'Duration \u2212 duration' }
      ] },
      { name: 'baseTime', label: 'Base time', type: 'time', showIf: function (v) { return v.op.indexOf('time') === 0; }, nowBtn: true },
      { type: 'heading', label: 'First duration' },
      { name: 'd1d', label: 'Days', type: 'number', min: 0, step: 1 },
      { name: 'd1h', label: 'Hours', type: 'number', min: 0, step: 1 },
      { name: 'd1m', label: 'Minutes', type: 'number', min: 0, max: 59, step: 1 },
      { name: 'd1s', label: 'Seconds', type: 'number', min: 0, max: 59, step: 1 },
      { type: 'heading', label: 'Second duration', showIf: function (v) { return v.op.indexOf('dur') !== -1 && v.op.indexOf('time') !== 0; } },
      { name: 'd2d', label: 'Days', type: 'number', min: 0, step: 1, showIf: function (v) { return v.op.indexOf('dur+dur') !== -1 || v.op.indexOf('dur-dur') !== -1; } },
      { name: 'd2h', label: 'Hours', type: 'number', min: 0, step: 1, showIf: function (v) { return v.op.indexOf('dur+dur') !== -1 || v.op.indexOf('dur-dur') !== -1; } },
      { name: 'd2m', label: 'Minutes', type: 'number', min: 0, max: 59, step: 1, showIf: function (v) { return v.op.indexOf('dur+dur') !== -1 || v.op.indexOf('dur-dur') !== -1; } },
      { name: 'd2s', label: 'Seconds', type: 'number', min: 0, max: 59, step: 1, showIf: function (v) { return v.op.indexOf('dur+dur') !== -1 || v.op.indexOf('dur-dur') !== -1; } },
      { name: 'use12', label: '12-hour result', type: 'checkbox', showIf: function (v) { return v.op.indexOf('time') === 0; } }
    ],
    defaults: function () { return { op: 'time+dur', baseTime: '14:30', use12: !uses24Default, d1d: '0', d1h: '2', d1m: '45', d1s: '0', d2d: '1', d2h: '3', d2m: '15', d2s: '0' }; },
    compute: function (v) {
      var dur1 = num(v.d1d) * 86400 + num(v.d1h) * 3600 + num(v.d1m) * 60 + num(v.d1s);
      var dur2 = num(v.d2d) * 86400 + num(v.d2h) * 3600 + num(v.d2m) * 60 + num(v.d2s);
      if (v.op === 'time+dur' || v.op === 'time-dur') {
        var base = parseClock(v.baseTime);
        if (base === null) return { error: 'Enter a valid base time.' };
        var delta = v.op === 'time+dur' ? dur1 : -dur1;
        var resultSec = base + delta;
        var wrapped = ((resultSec % 86400) + 86400) % 86400;
        var dayShift = Math.floor(resultSec / 86400);
        var warnings = [];
        if (Math.abs(resultSec) >= 86400) warnings.push({ level: 'info', text: 'Result crosses ' + Math.abs(dayShift) + ' day boundar' + (Math.abs(dayShift) === 1 ? 'y' : 'ies') + '.' });
        return { primary: formatClock(wrapped, v.use12, false), sub: formatClock(base, v.use12, false) + ' ' + (v.op === 'time+dur' ? '+' : '\u2212') + ' ' + fmtDuration(dur1), meta: [M('Result time', formatClock(wrapped, v.use12, false)), M('Days shifted', dayShift >= 0 ? '+' + dayShift : String(dayShift)), M('Duration applied', fmtDuration(dur1)), M('Result in seconds', numberFmt(Math.round(wrapped)))], breakdown: [M('Operation', v.op === 'time+dur' ? 'Time + duration' : 'Time \u2212 duration'), M('Base time', formatClock(base, v.use12, false)), M('Duration', num(v.d1d) + 'd ' + num(v.d1h) + 'h ' + num(v.d1m) + 'm ' + num(v.d1s) + 's'), M('Raw result', fmtDuration(resultSec)), M('Result time', formatClock(wrapped, v.use12, false))], warnings: warnings, value: wrapped };
      }
      var result = v.op === 'dur+dur' ? dur1 + dur2 : dur1 - dur2;
      var negative = result < 0;
      var warnings2 = [];
      if (negative) warnings2.push({ level: 'info', text: 'Result is negative.' });
      return { primary: fmtDuration(result), sub: fmtDuration(dur1, { short: true }) + ' ' + (v.op === 'dur+dur' ? '+' : '\u2212') + ' ' + fmtDuration(dur2, { short: true }), meta: [M('Result hours', decimalHours(result)), M('Result minutes', numberFmt(result / 60, { maximumFractionDigits: 2 })), M('First duration', fmtDuration(dur1)), M('Second duration', fmtDuration(dur2))], breakdown: [M('Operation', v.op === 'dur+dur' ? 'Duration + duration' : 'Duration \u2212 duration'), M('First duration', num(v.d1d) + 'd ' + num(v.d1h) + 'h ' + num(v.d1m) + 'm ' + num(v.d1s) + 's'), M('Second duration', num(v.d2d) + 'd ' + num(v.d2h) + 'h ' + num(v.d2m) + 'm ' + num(v.d2s) + 's'), M('Result', fmtDuration(result)), M('Result in seconds', numberFmt(Math.round(result)))], warnings: warnings2, value: result };
    }
  });

  defineCalc({
    id: 'date-difference', group: 'Dates', short: 'Date Difference',
    name: 'Date & Time Difference', desc: 'Elapsed time between two dates, with optional business days.',
    icon: 'calendar',
    fields: [
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'startTime', label: 'Start time', type: 'time' },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'endTime', label: 'End time', type: 'time' },
      { name: 'inclusive', label: 'Inclusive (count both endpoints)', type: 'checkbox' },
      { name: 'businessDays', label: 'Business days only', type: 'checkbox' },
      { name: 'excludeWeekends', label: 'Exclude weekends', type: 'checkbox' },
      { name: 'workdayHours', label: 'Working hours per business day', type: 'number', min: 0, step: 0.25 },
      { name: 'nextAnniversary', label: 'Show next anniversary', type: 'checkbox' },
      { name: 'holidays', label: 'Holidays', type: 'textarea', placeholder: 'YYYY-MM-DD, one per line', span: 2 }
    ],
    defaults: function () {
      var today = new Date();
      var future = new Date(today.getTime() + 30 * DAY);
      return { startDate: isoDate(today), startTime: '09:00', endDate: isoDate(future), endTime: '17:00', inclusive: false, businessDays: false, excludeWeekends: false, workdayHours: '8', nextAnniversary: false, holidays: '' };
    },
    compute: function (v) {
      var start = toDate(v.startDate, v.startTime), end = toDate(v.endDate, v.endTime);
      if (!start) return { error: 'Enter a valid start date.' };
      if (!end) return { error: 'Enter a valid end date.' };
      var warnings = [];
      var a = start, b = end;
      if (b < a) { warnings.push({ level: 'info', text: 'Dates swapped to keep duration positive.' }); var tmp = a; a = b; b = tmp; }
      var ms = b.getTime() - a.getTime();
      if (v.inclusive) ms += DAY;
      var totalSec = ms / 1000;
      var cal = calendarDiff(a, b);
      var holidaySet = parseHolidays(v.holidays);
      var businessDays = null, workingHoursSec = 0;
      if (v.businessDays || v.excludeWeekends) { businessDays = countBusinessDays(a, b, holidaySet); workingHoursSec = businessDays * num(v.workdayHours) * 3600; }
      var iso = 'P' + (cal.years ? cal.years + 'Y' : '') + (cal.months ? cal.months + 'M' : '') + (cal.days ? cal.days + 'D' : '') + ((cal.hours || cal.minutes || cal.seconds) ? 'T' : '') + (cal.hours ? cal.hours + 'H' : '') + (cal.minutes ? cal.minutes + 'M' : '') + (cal.seconds ? cal.seconds + 'S' : '');
      var meta = [M('Total days', numberFmt(totalSec / 86400, { maximumFractionDigits: 3 })), M('Total hours', numberFmt(totalSec / 3600, { maximumFractionDigits: 2 })), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 2 })), M('Total seconds', numberFmt(Math.round(totalSec)))];
      if (businessDays !== null) meta.unshift(M('Business days', String(businessDays)));
      var breakdown = [M('Start', v.startDate + ' ' + (v.startTime || '00:00')), M('End', v.endDate + ' ' + (v.endTime || '00:00')), M('ISO 8601', iso), M('Calendar years', String(cal.years)), M('Calendar months', String(cal.months)), M('Calendar days', String(cal.days)), M('Hours', String(cal.hours)), M('Minutes', String(cal.minutes)), M('Seconds', String(cal.seconds)), M('Weeks', numberFmt(totalSec / (7 * 86400), { maximumFractionDigits: 3 })), M('Total days', numberFmt(totalSec / 86400, { maximumFractionDigits: 3 })), M('Total hours', numberFmt(totalSec / 3600, { maximumFractionDigits: 2 })), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 2 })), M('Total seconds', numberFmt(Math.round(totalSec)))];
      if (businessDays !== null) { breakdown.push(M('Business days', String(businessDays))); breakdown.push(M('Working hours', fmtDuration(workingHoursSec))); }
      if (holidaySet.size) breakdown.push(M('Holidays supplied', String(holidaySet.size)));
      if (v.nextAnniversary && v.startDate) {
        var startObj = toDate(v.startDate, '00:00');
        var today = new Date();
        var next = new Date(today.getFullYear(), startObj.getMonth(), startObj.getDate());
        if (next < today) next = new Date(today.getFullYear() + 1, startObj.getMonth(), startObj.getDate());
        var days = Math.ceil((next - today) / DAY);
        breakdown.push(M('Next anniversary', isoDate(next) + ' (' + days + ' day' + (days === 1 ? '' : 's') + ' away)'));
      }
      var calendarText = [cal.years ? plural(cal.years, 'year') : '', cal.months ? plural(cal.months, 'month') : '', cal.days ? plural(cal.days, 'day') : ''].filter(Boolean).join(' ') || '0 days';
      return { primary: calendarText, sub: fmtDuration(totalSec) + ' total \u00B7 ' + iso, meta: meta, breakdown: breakdown, badge: v.businessDays ? 'Business days' : (v.inclusive ? 'Inclusive' : ''), warnings: warnings, value: totalSec };
    }
  });

  defineCalc({
    id: 'time-until', group: 'Countdowns', short: 'Time Until',
    name: 'Time Until', desc: 'Live countdown to a future date and time.',
    icon: 'hourglass',
    fields: [
      { name: 'targetDate', label: 'Target date', type: 'date' },
      { name: 'targetTime', label: 'Target time', type: 'time' },
      { name: 'label', label: 'Label', type: 'text', placeholder: 'Optional' },
      { name: 'notify', label: 'Notify when finished', type: 'checkbox' },
      { name: 'alarm', label: 'Play sound when finished', type: 'checkbox' }
    ],
    defaults: function () { var d = new Date(Date.now() + 7 * DAY); return { targetDate: isoDate(d), targetTime: '09:00', label: '', notify: false, alarm: false }; },
    compute: function (v) {
      var target = toDate(v.targetDate, v.targetTime);
      if (!target) return { error: 'Enter a valid target date and time.' };
      var now = new Date();
      var diffMs = target.getTime() - now.getTime();
      var past = diffMs < 0;
      var sec = Math.abs(diffMs) / 1000;
      var warnings = [];
      if (past) warnings.push({ level: 'warn', text: 'Target has passed. Showing time elapsed.' });
      var progress = past ? 100 : clamp(100 - (sec / 86400) * 100, 0, 100);
      return { primary: fmtDuration(sec), sub: (past ? 'since' : 'until') + ' ' + v.targetDate + ' ' + v.targetTime + (v.label ? ' \u00B7 ' + v.label : ''), meta: [M('Days', Math.floor(sec / 86400)), M('Hours', Math.floor((sec % 86400) / 3600)), M('Minutes', Math.floor((sec % 3600) / 60)), M('Seconds', Math.floor(sec % 60)), M('Total hours', numberFmt(sec / 3600, { maximumFractionDigits: 2 })), M('Total minutes', numberFmt(sec / 60, { maximumFractionDigits: 2 }))], breakdown: [M('Target', v.targetDate + ' ' + v.targetTime), M('Now', now.toLocaleString()), M('Status', past ? 'Elapsed' : 'Counting down'), M('Total seconds', numberFmt(Math.round(sec))), M('Progress', progress.toFixed(0) + '%')], badge: past ? 'Elapsed' : 'Live', warnings: warnings, live: !past, value: sec, notify: v.notify, alarm: v.alarm, label: v.label, targetMs: target.getTime() };
    }
  });

  defineCalc({
    id: 'time-since', group: 'Countdowns', short: 'Time Since',
    name: 'Time Since', desc: 'Live elapsed timer from a past date and time.',
    icon: 'history',
    fields: [
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'startTime', label: 'Start time', type: 'time' },
      { name: 'label', label: 'Label', type: 'text', placeholder: 'Optional' }
    ],
    defaults: function () { var d = new Date(Date.now() - 3 * DAY); return { startDate: isoDate(d), startTime: '09:00', label: '' }; },
    compute: function (v) {
      var start = toDate(v.startDate, v.startTime);
      if (!start) return { error: 'Enter a valid start date and time.' };
      var now = new Date();
      var diffMs = now.getTime() - start.getTime();
      var future = diffMs < 0;
      var sec = Math.abs(diffMs) / 1000;
      var warnings = [];
      if (future) warnings.push({ level: 'warn', text: 'Start is in the future.' });
      return { primary: fmtDuration(sec), sub: (future ? 'until' : 'since') + ' ' + v.startDate + ' ' + v.startTime + (v.label ? ' \u00B7 ' + v.label : ''), meta: [M('Days', Math.floor(sec / 86400)), M('Hours', Math.floor((sec % 86400) / 3600)), M('Minutes', Math.floor((sec % 3600) / 60)), M('Seconds', Math.floor(sec % 60)), M('Total hours', numberFmt(sec / 3600, { maximumFractionDigits: 2 })), M('Total minutes', numberFmt(sec / 60, { maximumFractionDigits: 2 }))], breakdown: [M('Start', v.startDate + ' ' + v.startTime), M('Now', now.toLocaleString()), M('Status', future ? 'Counting down' : 'Elapsed'), M('Total seconds', numberFmt(Math.round(sec)))], badge: future ? 'Future' : 'Live', warnings: warnings, live: true, value: sec };
    }
  });

  defineCalc({
    id: 'timezone', group: 'Dates', short: 'Time Zone Converter',
    name: 'Time Zone Converter', desc: 'Convert a time between IANA time zones.',
    icon: 'globe',
    fields: [
      { name: 'sourceZone', label: 'Source time zone', type: 'select', options: TIMEZONES.map(function (t) { return { v: t, t: t }; }) },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time', nowBtn: true },
      { name: 'useNow', label: 'Use current time', type: 'checkbox' },
      { name: 'showSeconds', label: 'Show seconds', type: 'checkbox' },
      { name: 'zones', label: 'Destinations', type: 'zones', sub: [{ name: 'zone', label: 'Time zone', type: 'select', options: TIMEZONES.map(function (t) { return { v: t, t: t }; }) }] },
      { name: 'showHeatmap', label: 'Show 24-hour heatmap', type: 'checkbox' }
    ],
    defaults: function () {
      return { sourceZone: detectUserTimezone(), date: isoToday(), time: timeNow(false), useNow: false, showSeconds: false, showHeatmap: false, zones: [{ zone: 'UTC' }, { zone: 'America/New_York' }, { zone: 'Europe/London' }, { zone: 'Asia/Kolkata' }, { zone: 'Asia/Tokyo' }] };
    },
    compute: function (v) {
      var dateStr = v.useNow ? isoToday() : v.date;
      var timeStr = v.useNow ? timeNow(true) : v.time;
      if (!dateStr || !timeStr) return { error: 'Enter a date and time.' };
      var instant = zonedToInstant(dateStr, timeStr, v.sourceZone);
      if (!instant) return { error: 'Could not interpret that date and time.' };
      var rows = [], chart = [], warnings = [], heatmapRows = [];
      (v.zones || []).forEach(function (entry) {
        var tz = entry.zone;
        if (!tz) return;
        var localHour = hourInZone(instant, tz);
        var period = 'Daytime';
        if (localHour >= 22 || localHour < 6) period = 'Overnight';
        else if (localHour >= 18) period = 'Evening';
        var formatted = formatInZone(instant, tz, v.showSeconds);
        var offset = zoneOffsetLabel(instant, tz);
        var abbr = zoneAbbr(instant, tz);
        rows.push(M(tz, formatted + ' \u00B7 ' + offset + (abbr ? ' (' + abbr + ')' : '') + ' \u00B7 ' + period));
        chart.push({ label: tz.split('/').pop().replace(/_/g, ' '), value: localHour + 1, display: pad2(localHour) + ':00 \u00B7 ' + period, type: (localHour >= 22 || localHour < 6) ? 'overtime' : (localHour >= 18 ? 'break' : 'primary') });
        var zoneDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
        if (zoneDate !== dateStr) warnings.push({ level: 'info', text: tz + ' falls on a different date (' + zoneDate + ').' });
        if (dstTransitionOn(dateStr, tz)) warnings.push({ level: 'info', text: 'DST changes in ' + tz + ' on ' + dateStr + '.' });
        if (v.showHeatmap) heatmapRows.push({ tz: tz, instant: instant });
      });
      if (!rows.length) return { error: 'Add at least one destination.' };
      return { primary: formatInZone(instant, v.sourceZone, v.showSeconds), sub: v.sourceZone + ' \u00B7 ' + zoneOffsetLabel(instant, v.sourceZone), meta: [M('Source zone', v.sourceZone), M('UTC', instant.toISOString().replace('T', ' ').slice(0, 19) + 'Z'), M('Destinations', String(rows.length)), M('DST aware', 'Yes')], breakdown: [M('Source', v.sourceZone + ' \u2192 ' + formatInZone(instant, v.sourceZone, v.showSeconds))].concat(rows), chart: chart.slice(0, 30), warnings: warnings, value: instant.getTime() };
    }
  });

  defineCalc({
    id: 'shift-planner', group: 'Work & Pay', short: 'Shift Planner',
    name: 'Shift Planner', desc: 'Plan shifts, totals, overtime and rest periods.',
    icon: 'calendar',
    fields: [
      { name: 'shifts', label: 'Shifts', type: 'shifts', sub: [
        { name: 'date', label: 'Date', type: 'date' }, { name: 'start', label: 'Start', type: 'time' },
        { name: 'end', label: 'End', type: 'time' }, { name: 'breakMin', label: 'Break (min)', type: 'number', min: 0, step: 5 },
        { name: 'scheduled', label: 'Scheduled (h)', type: 'number', min: 0, step: 0.25 }
      ] },
      { name: 'minRest', label: 'Minimum rest (hours)', type: 'number', min: 0, step: 0.5 }
    ],
    defaults: function () {
      var today = new Date();
      var tomorrow = new Date(today.getTime() + DAY);
      return { minRest: '11', shifts: [
        { date: isoDate(today), start: '09:00', end: '17:00', breakMin: '30', scheduled: '8' },
        { date: isoDate(tomorrow), start: '09:00', end: '17:00', breakMin: '30', scheduled: '8' }
      ] };
    },
    compute: function (v) {
      var parsed = [], warnings = [];
      (v.shifts || []).forEach(function (s, i) {
        var st = parseClock(s.start), en = parseClock(s.end);
        if (st === null || en === null || !s.date) { if (s.start || s.end || s.date) warnings.push({ level: 'warn', text: 'Shift ' + (i + 1) + ' incomplete.' }); return; }
        var dur = en - st;
        if (dur <= 0) dur += 86400;
        var brk = Math.max(0, num(s.breakMin) * 60);
        var net = Math.max(0, dur - brk);
        var scheduledSec = num(s.scheduled) * 3600;
        parsed.push({ index: i + 1, date: s.date, start: st, end: en, gross: dur, breakSec: brk, net: net, overtime: scheduledSec > 0 ? Math.max(0, net - scheduledSec) : 0, undertime: scheduledSec > 0 ? Math.max(0, scheduledSec - net) : 0, startInstant: toDate(s.date, s.start), endInstant: toDate(s.date, s.end) });
      });
      if (!parsed.length) return { error: 'Add at least one valid shift.' };
      var sorted = parsed.slice().sort(function (a, b) { return a.startInstant - b.startInstant; });
      var minRestSec = num(v.minRest) * 3600;
      var totalNet = 0, totalOt = 0, totalUt = 0;
      sorted.forEach(function (s) { totalNet += s.net; totalOt += s.overtime; totalUt += s.undertime; });
      var restRows = [], consecutiveShorts = 0;
      for (var i = 0; i < sorted.length - 1; i++) {
        var cur = sorted[i], next = sorted[i + 1];
        var endInstant = cur.endInstant;
        if (cur.end <= cur.start) endInstant = new Date(endInstant.getTime() + DAY);
        var restSec = (next.startInstant.getTime() - endInstant.getTime()) / 1000;
        if (restSec < 0) warnings.push({ level: 'error', text: 'Shift ' + next.index + ' starts before shift ' + cur.index + ' ends.' });
        else if (minRestSec > 0 && restSec < minRestSec) { consecutiveShorts++; warnings.push({ level: 'warn', text: 'Only ' + fmtDuration(restSec) + ' rest between ' + cur.index + ' and ' + next.index + '.' }); }
        restRows.push(M('Rest ' + cur.index + '\u2192' + next.index, fmtDuration(restSec)));
      }
      if (consecutiveShorts >= 3) warnings.push({ level: 'warn', text: consecutiveShorts + ' consecutive short rests.' });
      var breakdown = sorted.map(function (s) { return M('Shift ' + s.index + ' \u00B7 ' + s.date, clockStr(s.start) + '\u2013' + clockStr(s.end) + ' \u00B7 net ' + fmtDuration(s.net, { short: true })); });
      breakdown.push(M('Shift count', String(sorted.length)));
      breakdown.push(M('Total net hours', fmtDuration(totalNet)));
      breakdown.push(M('Overtime', fmtDuration(totalOt)));
      breakdown.push(M('Undertime', fmtDuration(totalUt)));
      Array.prototype.push.apply(breakdown, restRows);
      var chart = sorted.map(function (s) { return { label: s.date.slice(5), value: s.net / 3600, display: fmtDuration(s.net, { short: true }), type: s.overtime > 0 ? 'overtime' : 'primary' }; });
      return { primary: fmtDuration(totalNet), sub: sorted.length + ' shift' + (sorted.length === 1 ? '' : 's') + ' planned', meta: [M('Total net hours', fmtDuration(totalNet)), M('Decimal hours', decimalHours(totalNet)), M('Overtime', fmtDuration(totalOt)), M('Undertime', fmtDuration(totalUt))], breakdown: breakdown, chart: chart, warnings: warnings, value: totalNet };
    }
  });

  defineCalc({
    id: 'overtime', group: 'Work & Pay', short: 'Overtime',
    name: 'Overtime Calculator', desc: 'Split hours into regular, overtime and double time.',
    icon: 'trending',
    disclaimer: 'Overtime rules vary by jurisdiction. Templates are starting points only.',
    fields: [
      { name: 'template', label: 'Template', type: 'select', options: OT_TEMPLATES },
      { name: 'hoursPerDay', label: 'Hours per day', type: 'number', min: 0, step: 0.25 },
      { name: 'daysWorked', label: 'Days worked', type: 'number', min: 0, step: 1 },
      { name: 'dailyThreshold', label: 'Regular daily hours', type: 'number', min: 0, step: 0.5 },
      { name: 'weeklyThreshold', label: 'Regular weekly hours', type: 'number', min: 0, step: 0.5 },
      { name: 'doubleAfter', label: 'Double time after (OT h/day)', type: 'number', min: 0, step: 0.5 },
      { name: 'hourlyRate', label: 'Hourly rate', type: 'number', min: 0, step: 0.01 },
      { name: 'otMultiplier', label: 'OT multiplier', type: 'number', min: 0, step: 0.1 },
      { name: 'dtMultiplier', label: 'DT multiplier', type: 'number', min: 0, step: 0.1 },
      { name: 'weekStart', label: 'Week starts', type: 'select', options: WEEK_STARTS }
    ],
    defaults: function () { return { template: 'custom', hoursPerDay: '10', daysWorked: '5', dailyThreshold: '8', weeklyThreshold: '40', doubleAfter: '4', hourlyRate: '25', otMultiplier: '1.5', dtMultiplier: '2', weekStart: '1' }; },
    compute: function (v) {
      var dailyThreshold = num(v.dailyThreshold);
      var weeklyThreshold = num(v.weeklyThreshold);
      var doubleAfter = num(v.doubleAfter);
      var otMult = num(v.otMultiplier);
      var dtMult = num(v.dtMultiplier);
      if (v.template === 'us-flsa') { dailyThreshold = 0; weeklyThreshold = 40; doubleAfter = 0; otMult = 1.5; dtMult = 2; }
      else if (v.template === 'us-ca') { dailyThreshold = 8; weeklyThreshold = 40; doubleAfter = 4; otMult = 1.5; dtMult = 2; }
      else if (v.template === 'eu') { dailyThreshold = 8; weeklyThreshold = 48; doubleAfter = 0; otMult = 1.25; dtMult = 1.5; }
      else if (v.template === 'uk') { dailyThreshold = 0; weeklyThreshold = 40; doubleAfter = 0; otMult = 1.5; dtMult = 2; }
      else if (v.template === 'au') { dailyThreshold = 7.6; weeklyThreshold = 38; doubleAfter = 0; otMult = 1.5; dtMult = 2; }
      var perDay = num(v.hoursPerDay), days = num(v.daysWorked), rate = num(v.hourlyRate);
      if (days <= 0 || perDay <= 0) return { error: 'Enter hours per day and days worked.' };
      var dailyRegular = dailyThreshold > 0 ? Math.min(perDay, dailyThreshold) : Math.min(perDay, weeklyThreshold / days || perDay);
      var dailyOt = Math.max(0, perDay - dailyRegular);
      var dailyDt = doubleAfter > 0 ? Math.max(0, dailyOt - doubleAfter) : 0;
      var dailyOtOnly = dailyOt - dailyDt;
      var regularH = dailyRegular * days, overtimeH = dailyOtOnly * days, doubleH = dailyDt * days;
      var warnings = [];
      if (weeklyThreshold > 0 && regularH > weeklyThreshold) { var shift = regularH - weeklyThreshold; regularH -= shift; overtimeH += shift; warnings.push({ level: 'info', text: shift.toFixed(2) + ' hours moved to overtime.' }); }
      var regularPay = regularH * rate, overtimePay = overtimeH * rate * otMult, doublePay = doubleH * rate * dtMult;
      var totalPay = regularPay + overtimePay + doublePay;
      var totalHours = regularH + overtimeH + doubleH;
      var chart = [
        { label: 'Regular', value: regularH, display: regularH.toFixed(2) + ' h', type: 'primary' },
        { label: 'Overtime', value: overtimeH, display: overtimeH.toFixed(2) + ' h', type: 'break' },
        { label: 'Double time', value: doubleH, display: doubleH.toFixed(2) + ' h', type: 'overtime' }
      ];
      return { primary: fmtDuration(totalHours * 3600), sub: totalHours.toFixed(2) + ' total hours across ' + days + ' day' + (days === 1 ? '' : 's'), meta: [M('Regular hours', regularH.toFixed(2)), M('Overtime hours', overtimeH.toFixed(2)), M('Double-time hours', doubleH.toFixed(2)), M('Regular pay', regularPay.toFixed(2)), M('Overtime pay', overtimePay.toFixed(2)), M('Double-time pay', doublePay.toFixed(2)), M('Total pay', totalPay.toFixed(2))], breakdown: [M('Template', v.template), M('Hours per day', perDay.toFixed(2)), M('Days worked', String(days)), M('Daily threshold', dailyThreshold.toFixed(2) + ' h'), M('Weekly threshold', weeklyThreshold.toFixed(2) + ' h'), M('Double time after', doubleAfter.toFixed(2) + ' OT h/day'), M('Hourly rate', rate.toFixed(2)), M('OT multiplier', 'x' + otMult.toFixed(2)), M('DT multiplier', 'x' + dtMult.toFixed(2)), M('Regular hours', regularH.toFixed(2)), M('Overtime hours', overtimeH.toFixed(2)), M('Double-time hours', doubleH.toFixed(2)), M('Regular pay', regularPay.toFixed(2)), M('Overtime pay', overtimePay.toFixed(2)), M('Double-time pay', doublePay.toFixed(2)), M('Total pay', totalPay.toFixed(2))], chart: chart, warnings: warnings, value: totalPay };
    }
  });

  defineCalc({
    id: 'earnings', group: 'Work & Pay', short: 'Earnings',
    name: 'Time & Earnings Calculator', desc: 'Turn hours into pay with regular, overtime and double-time rates.',
    icon: 'coins', disclaimer: 'Tax figures are estimates only.',
    fields: [
      { name: 'regularHours', label: 'Regular hours', type: 'number', min: 0, step: 0.25 },
      { name: 'overtimeHours', label: 'Overtime hours', type: 'number', min: 0, step: 0.25 },
      { name: 'doubleHours', label: 'Double-time hours', type: 'number', min: 0, step: 0.25 },
      { name: 'hourlyRate', label: 'Hourly rate', type: 'number', min: 0, step: 0.01 },
      { name: 'otMultiplier', label: 'OT multiplier', type: 'number', min: 0, step: 0.1 },
      { name: 'dtMultiplier', label: 'DT multiplier', type: 'number', min: 0, step: 0.1 },
      { name: 'taxRate', label: 'Tax / deduction rate (%)', type: 'number', min: 0, max: 100, step: 0.1 },
      { name: 'currency', label: 'Currency', type: 'select', options: CURRENCIES.map(function (c) { return { v: c.code, t: c.label }; }) },
      { name: 'customSymbol', label: 'Custom symbol', type: 'text', placeholder: 'e.g. kr', showIf: function (v) { return v.currency === 'CUSTOM'; } }
    ],
    defaults: function () { return { regularHours: '40', overtimeHours: '5', doubleHours: '0', hourlyRate: '25', otMultiplier: '1.5', dtMultiplier: '2', taxRate: '0', currency: 'USD', customSymbol: '' }; },
    compute: function (v) {
      var reg = num(v.regularHours), ot = num(v.overtimeHours), dt = num(v.doubleHours);
      var rate = num(v.hourlyRate), otMult = num(v.otMultiplier), dtMult = num(v.dtMultiplier);
      var taxRate = num(v.taxRate);
      var symbol = v.currency === 'CUSTOM' ? (v.customSymbol || '') : ((CURRENCIES.find(function (c) { return c.code === v.currency; }) || {}).symbol || '');
      var regPay = reg * rate, otPay = ot * rate * otMult, dtPay = dt * rate * dtMult;
      var gross = regPay + otPay + dtPay;
      var tax = gross * (taxRate / 100);
      var net = gross - tax;
      var totalHours = reg + ot + dt;
      var effective = totalHours > 0 ? gross / totalHours : 0;
      var money = function (n) { return symbol + n.toFixed(2); };
      var warnings = [];
      if (totalHours <= 0) warnings.push({ level: 'warn', text: 'No hours entered.' });
      return { primary: money(net), sub: totalHours.toFixed(2) + ' h \u00B7 gross ' + money(gross) + ' \u00B7 effective ' + money(effective) + '/h', meta: [M('Regular earnings', money(regPay)), M('Overtime earnings', money(otPay)), M('Double-time earnings', money(dtPay)), M('Gross', money(gross)), M('Tax / deductions', money(tax)), M('Net', money(net)), M('Effective hourly rate', money(effective)), M('Total hours', totalHours.toFixed(2))], breakdown: [M('Regular hours', reg.toFixed(2)), M('Overtime hours', ot.toFixed(2)), M('Double-time hours', dt.toFixed(2)), M('Hourly rate', money(rate)), M('OT multiplier', 'x' + otMult.toFixed(2)), M('DT multiplier', 'x' + dtMult.toFixed(2)), M('Regular earnings', money(regPay)), M('Overtime earnings', money(otPay)), M('Double-time earnings', money(dtPay)), M('Gross', money(gross)), M('Tax rate', taxRate.toFixed(2) + '%'), M('Tax', money(tax)), M('Net', money(net))], warnings: warnings, value: net };
    }
  });

  defineCalc({
    id: 'breaks', group: 'Work & Pay', short: 'Break Calculator',
    name: 'Break Calculator', desc: 'See how paid and unpaid breaks change net working time.',
    icon: 'coffee',
    fields: [
      { name: 'shiftStart', label: 'Shift start', type: 'time', nowBtn: true },
      { name: 'shiftEnd', label: 'Shift end', type: 'time', nowBtn: true },
      { name: 'autoOvernight', label: 'Detect overnight', type: 'checkbox' },
      { name: 'breaks', label: 'Breaks', type: 'breaks', sub: [
        { name: 'start', label: 'Start', type: 'time' }, { name: 'end', label: 'End', type: 'time' },
        { name: 'paid', label: 'Type', type: 'select', options: [{ v: 'unpaid', t: 'Unpaid' }, { v: 'paid', t: 'Paid' }] }
      ] }
    ],
    defaults: function () { return { shiftStart: '09:00', shiftEnd: '18:00', autoOvernight: true, breaks: [{ start: '10:30', end: '10:45', paid: 'paid' }, { start: '13:00', end: '13:45', paid: 'unpaid' }] }; },
    compute: function (v) {
      var start = parseClock(v.shiftStart), end = parseClock(v.shiftEnd);
      if (start === null || end === null) return { error: 'Enter valid shift times.' };
      var gross = end - start;
      if (gross < 0) { if (v.autoOvernight) gross += 86400; else return { error: 'End is before start.' }; }
      if (gross === 0) return { error: 'Shift has zero length.' };
      var paid = 0, unpaid = 0, segments = [], rows = [];
      (v.breaks || []).forEach(function (b, i) {
        var bs = parseClock(b.start), be = parseClock(b.end);
        if (bs === null || be === null) return;
        var dur = be - bs;
        if (dur < 0) dur += 86400;
        if (dur <= 0) return;
        if (b.paid === 'paid') paid += dur; else unpaid += dur;
        segments.push({ start: bs, end: bs + dur, type: b.paid === 'paid' ? 'paid' : 'break' });
        rows.push(M('Break ' + (i + 1) + ' (' + b.paid + ')', fmtDuration(dur)));
      });
      var totalBreak = paid + unpaid;
      var net = Math.max(0, gross - totalBreak);
      var breakPct = gross > 0 ? (totalBreak / gross) * 100 : 0;
      var warnings = [];
      if (totalBreak > gross) warnings.push({ level: 'error', text: 'Breaks exceed shift.' });
      return { primary: fmtDuration(net), sub: breakPct.toFixed(1) + '% of the shift was break time', meta: [M('Gross', fmtDuration(gross)), M('Total break', fmtDuration(totalBreak)), M('Paid break', fmtDuration(paid)), M('Unpaid break', fmtDuration(unpaid)), M('Break %', breakPct.toFixed(1) + '%')], breakdown: [M('Shift start', clockStr(start)), M('Shift end', clockStr(end)), M('Gross', fmtDuration(gross))].concat(rows, [M('Paid', fmtDuration(paid)), M('Unpaid', fmtDuration(unpaid)), M('Net', fmtDuration(net))]), timeline: buildShiftTimeline(start, gross, segments), chart: [ { label: 'Work', value: net / 3600, display: fmtDuration(net, { short: true }), type: 'primary' }, { label: 'Paid break', value: paid / 3600, display: fmtDuration(paid, { short: true }), type: 'paid' }, { label: 'Unpaid break', value: unpaid / 3600, display: fmtDuration(unpaid, { short: true }), type: 'break' } ], warnings: warnings, value: net };
    }
  });

  defineCalc({
    id: 'breakdown', group: 'Time Duration', short: 'Time Breakdown',
    name: 'Time Breakdown', desc: 'Convert any duration into weeks, days, hours, minutes and seconds.',
    icon: 'list',
    fields: [
      { name: 'days', label: 'Days', type: 'number', min: 0, step: 1 },
      { name: 'hours', label: 'Hours', type: 'number', min: 0, step: 1 },
      { name: 'minutes', label: 'Minutes', type: 'number', min: 0, step: 1 },
      { name: 'seconds', label: 'Seconds', type: 'number', min: 0, step: 1 },
      { name: 'milliseconds', label: 'Milliseconds', type: 'number', min: 0, step: 1 }
    ],
    defaults: function () { return { days: '1', hours: '4', minutes: '30', seconds: '15', milliseconds: '0' }; },
    compute: function (v) {
      var totalMs = num(v.days) * 86400000 + num(v.hours) * 3600000 + num(v.minutes) * 60000 + num(v.seconds) * 1000 + num(v.milliseconds);
      if (totalMs < 0) return { error: 'Duration cannot be negative.' };
      var totalSec = totalMs / 1000;
      var rem = Math.floor(totalSec);
      var weeks = Math.floor(rem / 604800); rem -= weeks * 604800;
      var d = Math.floor(rem / 86400); rem -= d * 86400;
      var h = Math.floor(rem / 3600); rem -= h * 3600;
      var m = Math.floor(rem / 60);
      var s = rem - m * 60;
      return { primary: fmtDuration(totalSec), sub: weeks + 'w ' + d + 'd ' + h + 'h ' + m + 'm ' + s + 's', meta: [M('Total days', numberFmt(totalSec / 86400, { maximumFractionDigits: 4 })), M('Total hours', numberFmt(totalSec / 3600, { maximumFractionDigits: 4 })), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 4 })), M('Total seconds', numberFmt(totalSec, { maximumFractionDigits: 3 })), M('Total ms', numberFmt(Math.round(totalMs)))], breakdown: [M('Weeks', String(weeks)), M('Days', String(d)), M('Hours', String(h)), M('Minutes', String(m)), M('Seconds', String(s)), M('Milliseconds', String(num(v.milliseconds))), M('Total days', numberFmt(totalSec / 86400, { maximumFractionDigits: 4 })), M('Total hours', numberFmt(totalSec / 3600, { maximumFractionDigits: 4 })), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 4 })), M('Total seconds', numberFmt(totalSec, { maximumFractionDigits: 3 }))], value: totalSec };
    }
  });

  defineCalc({
    id: 'rounding', group: 'Work & Pay', short: 'Rounding',
    name: 'Timesheet Rounding Calculator', desc: 'Compare an exact duration against common rounding rules.',
    icon: 'sliders',
    fields: [
      { name: 'roundStartEnd', label: 'Round shift start and end separately', type: 'checkbox' },
      { name: 'startTime', label: 'Shift start', type: 'time', showIf: function (v) { return v.roundStartEnd; } },
      { name: 'endTime', label: 'Shift end', type: 'time', showIf: function (v) { return v.roundStartEnd; } },
      { name: 'hours', label: 'Hours', type: 'number', min: 0, step: 1, showIf: function (v) { return !v.roundStartEnd; } },
      { name: 'minutes', label: 'Minutes', type: 'number', min: 0, step: 1, showIf: function (v) { return !v.roundStartEnd; } },
      { name: 'seconds', label: 'Seconds', type: 'number', min: 0, step: 1, showIf: function (v) { return !v.roundStartEnd; } },
      { name: 'rule', label: 'Rule', type: 'select', options: [
        { v: 'exact', t: 'Exact' }, { v: '1', t: 'Nearest 1 minute' },
        { v: '5', t: 'Nearest 5 minutes' }, { v: '6', t: 'Nearest 6 minutes' },
        { v: '10', t: 'Nearest 10 minutes' }, { v: '15', t: 'Nearest 15 minutes' },
        { v: '30', t: 'Nearest 30 minutes' }, { v: '60', t: 'Nearest 60 minutes' },
        { v: 'up', t: 'Always round up' }, { v: 'down', t: 'Always round down' },
        { v: 'custom', t: 'Custom interval' }
      ] },
      { name: 'customMinutes', label: 'Custom interval (min)', type: 'number', min: 1, step: 1, showIf: function (v) { return v.rule === 'custom'; } }
    ],
    defaults: function () { return { roundStartEnd: false, startTime: '09:03', endTime: '17:52', hours: '7', minutes: '52', seconds: '0', rule: '15', customMinutes: '7' }; },
    compute: function (v) {
      var sec, startSec, endSec;
      if (v.roundStartEnd) {
        startSec = parseClock(v.startTime);
        endSec = parseClock(v.endTime);
        if (startSec === null || endSec === null) return { error: 'Enter valid shift times.' };
        var gross = endSec - startSec;
        if (gross < 0) gross += 86400;
        sec = gross;
      } else sec = num(v.hours) * 3600 + num(v.minutes) * 60 + num(v.seconds);
      if (sec < 0) return { error: 'Duration cannot be negative.' };
      var roundTo = function (s, minutes) { var step = Math.max(1, minutes) * 60; return Math.round(s / step) * step; };
      var roundUp = function (s, minutes) { var step = Math.max(1, minutes) * 60; return Math.ceil(s / step) * step; };
      var roundDown = function (s, minutes) { var step = Math.max(1, minutes) * 60; return Math.floor(s / step) * step; };
      var rules = [
        { key: 'exact', label: 'Exact', value: sec },
        { key: '1', label: 'Nearest 1 minute', value: roundTo(sec, 1) },
        { key: '5', label: 'Nearest 5 minutes', value: roundTo(sec, 5) },
        { key: '6', label: 'Nearest 6 minutes', value: roundTo(sec, 6) },
        { key: '10', label: 'Nearest 10 minutes', value: roundTo(sec, 10) },
        { key: '15', label: 'Nearest 15 minutes', value: roundTo(sec, 15) },
        { key: '30', label: 'Nearest 30 minutes', value: roundTo(sec, 30) },
        { key: '60', label: 'Nearest 60 minutes', value: roundTo(sec, 60) },
        { key: 'up', label: 'Always round up', value: roundUp(sec, 1) },
        { key: 'down', label: 'Always round down', value: roundDown(sec, 1) }
      ];
      if (v.rule === 'custom') { var interval = Math.max(1, num(v.customMinutes)); rules.push({ key: 'custom', label: 'Nearest ' + interval + ' minutes', value: roundTo(sec, interval) }); }
      if (v.roundStartEnd) {
        rules.forEach(function (r) {
          if (r.key === 'exact') { r.value = sec; return; }
          if (r.key === 'up') { r.value = roundUp(endSec, 1) - roundDown(startSec, 1); return; }
          if (r.key === 'down') { r.value = roundDown(endSec, 1) - roundUp(startSec, 1); return; }
          var iv = r.key === 'custom' ? Math.max(1, num(v.customMinutes)) : +r.key;
          r.value = roundTo(endSec, iv) - roundTo(startSec, iv);
        });
      }
      var selected = rules.find(function (r) { return r.key === v.rule; }) || rules[0];
      var diff = selected.value - sec;
      var breakdown = rules.map(function (r) { return M(r.label, fmtDuration(r.value) + ' \u00B7 ' + decimalHours(r.value) + ' h' + (r.key === selected.key ? ' \u2713' : '')); });
      var warnings = [];
      if (diff !== 0) warnings.push({ level: 'info', text: 'Rounding changed duration by ' + fmtDuration(Math.abs(diff)) + ' ' + (diff > 0 ? 'up' : 'down') + '.' });
      return { primary: fmtDuration(selected.value), sub: selected.label + ' \u00B7 exact was ' + fmtDuration(sec), meta: [M('Exact', fmtDuration(sec)), M('Rounded', fmtDuration(selected.value)), M('Difference', (diff >= 0 ? '+' : '\u2212') + fmtDuration(Math.abs(diff))), M('Decimal hours', decimalHours(selected.value))], breakdown: breakdown, warnings: warnings, value: selected.value };
    }
  });

  defineCalc({
    id: 'business-days', group: 'Dates', short: 'Business Days',
    name: 'Business Days Calculator', desc: 'Count or add business days.',
    icon: 'briefcase',
    fields: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ v: 'count', t: 'Count between two dates' }, { v: 'add', t: 'Add / subtract business days' }] },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date', showIf: function (v) { return v.mode === 'count'; } },
      { name: 'delta', label: 'Business days (+/\u2212)', type: 'number', step: 1, showIf: function (v) { return v.mode === 'add'; } },
      { name: 'includeStart', label: 'Include start date', type: 'checkbox', showIf: function (v) { return v.mode === 'count'; } },
      { name: 'holidays', label: 'Holidays', type: 'textarea', placeholder: 'YYYY-MM-DD, one per line', span: 2 }
    ],
    defaults: function () { var d = new Date(); var e = new Date(d.getTime() + 30 * DAY); return { mode: 'count', startDate: isoDate(d), endDate: isoDate(e), delta: '10', includeStart: false, holidays: '' }; },
    compute: function (v) {
      var holidays = parseHolidays(v.holidays);
      if (v.mode === 'count') {
        var a = toDate(v.startDate, '00:00'), b = toDate(v.endDate, '00:00');
        if (!a || !b) return { error: 'Enter valid start and end dates.' };
        var count = countBusinessDays(a, b, holidays);
        if (v.includeStart && !isWeekend(a) && !holidays.has(isoDate(a))) count += 1;
        var totalDays = Math.round((b - a) / DAY) + (v.includeStart ? 1 : 0);
        return { primary: count + ' business day' + (count === 1 ? '' : 's'), sub: v.startDate + ' \u2192 ' + v.endDate, meta: [M('Business days', String(count)), M('Calendar days', String(totalDays)), M('Holidays excluded', String(Array.from(holidays).filter(function (h) { return h >= v.startDate && h <= v.endDate; }).length))], breakdown: [M('Start', v.startDate), M('End', v.endDate), M('Business days', String(count)), M('Calendar days', String(totalDays))], value: count };
      }
      var base = toDate(v.startDate, '00:00');
      if (!base) return { error: 'Enter a valid start date.' };
      var delta = Math.trunc(num(v.delta));
      var result = addBusinessDays(base, delta, holidays);
      var calendarDelta = Math.round((result - base) / DAY);
      return { primary: isoDate(result), sub: (delta >= 0 ? '+' : '') + delta + ' business days from ' + v.startDate, meta: [M('Result', isoDate(result)), M('Weekday', result.toLocaleDateString(locale, { weekday: 'long' })), M('Calendar days', String(calendarDelta)), M('Business days requested', String(delta))], breakdown: [M('Base date', v.startDate), M('Business days', String(delta)), M('Result', isoDate(result)), M('Weekday', result.toLocaleDateString(locale, { weekday: 'long' }))], value: calendarDelta };
    }
  });

  defineCalc({
    id: 'age', group: 'Dates', short: 'Age',
    name: 'Age Calculator', desc: 'Exact age, next birthday and total time lived.',
    icon: 'cake',
    fields: [
      { name: 'birthDate', label: 'Date of birth', type: 'date' },
      { name: 'birthTime', label: 'Time of birth', type: 'time' },
      { name: 'asOfDate', label: 'Age at date', type: 'date' },
      { name: 'asOfTime', label: 'Time', type: 'time' }
    ],
    defaults: function () { return { birthDate: '1990-06-15', birthTime: '', asOfDate: isoToday(), asOfTime: '' }; },
    compute: function (v) {
      var birth = toDate(v.birthDate, v.birthTime || '00:00');
      var asOf = toDate(v.asOfDate || isoToday(), v.asOfTime || '00:00');
      if (!birth) return { error: 'Enter a valid date of birth.' };
      if (!asOf) return { error: 'Enter a valid reference date.' };
      if (birth > asOf) return { error: 'Date of birth must be before reference date.' };
      var cal = calendarDiff(birth, asOf);
      var totalSec = (asOf - birth) / 1000;
      var next = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < asOf) next.setFullYear(next.getFullYear() + 1);
      var daysToNext = Math.ceil((next - asOf) / DAY);
      var turning = next.getFullYear() - birth.getFullYear();
      var ageText = [plural(cal.years, 'year'), plural(cal.months, 'month'), plural(cal.days, 'day')].join(' ');
      var weekdayBorn = birth.toLocaleDateString(locale, { weekday: 'long' });
      return { primary: ageText, sub: 'Born ' + v.birthDate + ' (' + weekdayBorn + ')', meta: [M('Total days', numberFmt(totalSec / 86400, { maximumFractionDigits: 1 })), M('Total weeks', numberFmt(totalSec / (7 * 86400), { maximumFractionDigits: 2 })), M('Total hours', numberFmt(totalSec / 3600, { maximumFractionDigits: 0 })), M('Next birthday in', daysToNext + ' day' + (daysToNext === 1 ? '' : 's')), M('Turning', String(turning)), M('Born on a', weekdayBorn)], breakdown: [M('Date of birth', v.birthDate), M('Reference date', v.asOfDate), M('Years', String(cal.years)), M('Months', String(cal.months)), M('Days', String(cal.days)), M('Next birthday', isoDate(next)), M('Days to next birthday', String(daysToNext))], value: totalSec };
    }
  });

  defineCalc({
    id: 'speed', group: 'Time Duration', short: 'Speed Saver',
    name: 'Video / Audio Speed Saver', desc: 'See how long media takes to play at a different speed.',
    icon: 'play',
    fields: [
      { name: 'hours', label: 'Hours', type: 'number', min: 0, step: 1 },
      { name: 'minutes', label: 'Minutes', type: 'number', min: 0, max: 59, step: 1 },
      { name: 'seconds', label: 'Seconds', type: 'number', min: 0, max: 59, step: 1 },
      { name: 'speed', label: 'Playback speed', type: 'select', options: [
        { v: '0.5', t: '0.5x' }, { v: '0.75', t: '0.75x' }, { v: '1', t: '1x' },
        { v: '1.25', t: '1.25x' }, { v: '1.5', t: '1.5x' }, { v: '1.75', t: '1.75x' },
        { v: '2', t: '2x' }, { v: '2.5', t: '2.5x' }, { v: '3', t: '3x' }, { v: 'custom', t: 'Custom' }
      ] },
      { name: 'customSpeed', label: 'Custom speed', type: 'number', min: 0.1, step: 0.05, showIf: function (v) { return v.speed === 'custom'; } }
    ],
    defaults: function () { return { hours: '0', minutes: '45', seconds: '0', speed: '1.5', customSpeed: '1.3' }; },
    compute: function (v) {
      var original = num(v.hours) * 3600 + num(v.minutes) * 60 + num(v.seconds);
      if (original <= 0) return { error: 'Enter a duration greater than zero.' };
      var speed = v.speed === 'custom' ? num(v.customSpeed) : num(v.speed);
      if (speed <= 0) return { error: 'Speed must be greater than zero.' };
      var watched = original / speed;
      var saved = original - watched;
      return { primary: fmtDuration(watched), sub: fmtDuration(original) + ' at ' + speed + 'x', meta: [M('Original', fmtDuration(original)), M('Playback time', fmtDuration(watched)), M('Time saved', fmtDuration(Math.abs(saved))), M('Speed', speed + 'x')], breakdown: [M('Original', fmtDuration(original)), M('Speed', speed + 'x'), M('New duration', fmtDuration(watched)), M('Time ' + (saved >= 0 ? 'saved' : 'added'), fmtDuration(Math.abs(saved)))], value: watched };
    }
  });

  defineCalc({
    id: 'pomodoro', group: 'Countdowns', short: 'Pomodoro',
    name: 'Pomodoro Timer Planner', desc: 'Plan focus sessions and see total time committed.',
    icon: 'playcircle',
    fields: [
      { name: 'focusMin', label: 'Focus length (min)', type: 'number', min: 1, step: 1 },
      { name: 'breakMin', label: 'Short break (min)', type: 'number', min: 1, step: 1 },
      { name: 'longBreakMin', label: 'Long break (min)', type: 'number', min: 1, step: 1 },
      { name: 'longBreakAfter', label: 'Long break after N sessions', type: 'number', min: 1, step: 1 },
      { name: 'sessions', label: 'Sessions', type: 'number', min: 1, step: 1 }
    ],
    defaults: function () { return { focusMin: '25', breakMin: '5', longBreakMin: '15', longBreakAfter: '4', sessions: '8' }; },
    compute: function (v) {
      var focus = num(v.focusMin) * 60, brk = num(v.breakMin) * 60, longBrk = num(v.longBreakMin) * 60;
      var afterN = Math.max(1, num(v.longBreakAfter));
      var sessions = Math.max(1, Math.floor(num(v.sessions)));
      var totalFocus = 0, totalBreak = 0, schedule = [];
      for (var i = 0; i < sessions; i++) {
        totalFocus += focus;
        schedule.push(M('Focus ' + (i + 1), fmtDuration(focus)));
        if (i < sessions - 1) {
          var isLong = (i + 1) % afterN === 0;
          var b = isLong ? longBrk : brk;
          totalBreak += b;
          schedule.push(M('Break ' + (i + 1) + (isLong ? ' (long)' : ''), fmtDuration(b)));
        }
      }
      var total = totalFocus + totalBreak;
      return { primary: fmtDuration(total), sub: sessions + ' sessions \u00B7 ' + fmtDuration(totalFocus) + ' focused, ' + fmtDuration(totalBreak) + ' breaks', meta: [M('Focus time', fmtDuration(totalFocus)), M('Break time', fmtDuration(totalBreak)), M('Total', fmtDuration(total)), M('Sessions', String(sessions))], breakdown: schedule, value: total };
    }
  });

  defineCalc({
    id: 'world-clock', group: 'Dates', short: 'World Clock',
    name: 'World Clock', desc: 'Live clocks for multiple time zones.',
    icon: 'globe',
    fields: [{ name: 'zones', label: 'Time zones', type: 'zones', sub: [{ name: 'zone', label: 'Time zone', type: 'select', options: TIMEZONES.map(function (t) { return { v: t, t: t }; }) }] }],
    defaults: function () { return { zones: [{ zone: detectUserTimezone() }, { zone: 'UTC' }, { zone: 'America/New_York' }, { zone: 'Europe/London' }, { zone: 'Asia/Tokyo' }] }; },
    compute: function (v) {
      var now = new Date();
      var rows = [];
      (v.zones || []).forEach(function (entry) {
        var tz = entry.zone;
        if (!tz) return;
        var hour = hourInZone(now, tz);
        var period = 'Daytime';
        if (hour >= 22 || hour < 6) period = 'Overnight';
        else if (hour >= 18) period = 'Evening';
        rows.push(M(tz, formatInZone(now, tz, true) + ' \u00B7 ' + period));
      });
      return { primary: formatInZone(now, detectUserTimezone(), false), sub: 'Local time \u00B7 ' + detectUserTimezone(), meta: [M('Zones', String(rows.length)), M('UTC', now.toISOString().replace('T', ' ').slice(0, 19) + 'Z'), M('Local zone', detectUserTimezone())], breakdown: rows, live: true, value: now.getTime() };
    }
  });

  defineCalc({
    id: 'sleep', group: 'Countdowns', short: 'Sleep',
    name: 'Sleep Calculator', desc: 'Find ideal bedtimes or wake times based on 90-minute sleep cycles.',
    icon: 'moon',
    fields: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ v: 'wake', t: 'I want to wake up at...' }, { v: 'bed', t: 'I plan to go to bed at...' }] },
      { name: 'time', label: 'Time', type: 'time' },
      { name: 'fallAsleepMin', label: 'Minutes to fall asleep', type: 'number', min: 0, step: 1 },
      { name: 'cycles', label: 'Cycles to show', type: 'number', min: 1, max: 8, step: 1 }
    ],
    defaults: function () { return { mode: 'wake', time: '07:00', fallAsleepMin: '15', cycles: '4' }; },
    compute: function (v) {
      var t = parseClock(v.time);
      if (t === null) return { error: 'Enter a valid time.' };
      var cycles = Math.max(1, Math.min(8, Math.floor(num(v.cycles))));
      var fallAsleep = num(v.fallAsleepMin) * 60;
      var cycle = 90 * 60;
      var breakdown = [], rows = [];
      for (var i = cycles; i >= 1; i--) {
        var total = i * cycle;
        if (v.mode === 'wake') {
          var bedSec = t - fallAsleep - total;
          var bedWrapped = ((bedSec % 86400) + 86400) % 86400;
          breakdown.push(M(i + ' cycles', 'Bed at ' + clockStr(bedWrapped)));
          rows.push({ cycles: i, time: clockStr(bedWrapped) });
        } else {
          var wakeSec = t + fallAsleep + total;
          var wakeWrapped = ((wakeSec % 86400) + 86400) % 86400;
          breakdown.push(M(i + ' cycles', 'Wake at ' + clockStr(wakeWrapped)));
          rows.push({ cycles: i, time: clockStr(wakeWrapped) });
        }
      }
      var primary = rows[Math.min(rows.length - 1, rows.length >= 4 ? 3 : 0)];
      return { primary: primary ? primary.time : '\u2014', sub: v.mode === 'wake' ? 'Bedtimes to wake at ' + v.time : 'Wake times if you sleep at ' + v.time, meta: [M('Cycle length', '90 minutes'), M('To fall asleep', v.fallAsleepMin + ' min'), M('Options', String(cycles))], breakdown: breakdown, value: 0 };
    }
  });

  defineCalc({
    id: 'pay-period', group: 'Work & Pay', short: 'Pay Period',
    name: 'Pay Period Calculator', desc: 'Find pay period boundaries and forecast the next few cycles.',
    icon: 'creditcard',
    fields: [
      { name: 'frequency', label: 'Frequency', type: 'select', options: [{ v: 'weekly', t: 'Weekly' }, { v: 'biweekly', t: 'Bi-weekly' }, { v: 'semimonthly', t: 'Semi-monthly' }, { v: 'monthly', t: 'Monthly' }] },
      { name: 'anchorDate', label: 'Known pay date', type: 'date' },
      { name: 'payDelayDays', label: 'Days from period end to pay date', type: 'number', min: 0, step: 1 },
      { name: 'periods', label: 'Periods to show', type: 'number', min: 1, max: 12, step: 1 }
    ],
    defaults: function () { return { frequency: 'biweekly', anchorDate: isoToday(), payDelayDays: '5', periods: '4' }; },
    compute: function (v) {
      var anchor = toDate(v.anchorDate, '00:00');
      if (!anchor) return { error: 'Enter a valid anchor date.' };
      var n = Math.max(1, Math.min(12, Math.floor(num(v.periods))));
      var delay = num(v.payDelayDays);
      var rows = [];
      for (var i = 0; i < n; i++) {
        var ps, pe, payDate;
        if (v.frequency === 'weekly') { pe = new Date(anchor.getTime() + i * 7 * DAY); ps = new Date(pe.getTime() - 7 * DAY); payDate = new Date(pe.getTime() + delay * DAY); }
        else if (v.frequency === 'biweekly') { pe = new Date(anchor.getTime() + i * 14 * DAY); ps = new Date(pe.getTime() - 14 * DAY); payDate = new Date(pe.getTime() + delay * DAY); }
        else if (v.frequency === 'semimonthly') {
          var day = anchor.getDate() <= 15 ? 15 : 1;
          if (day === 15) { ps = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1); pe = new Date(anchor.getFullYear(), anchor.getMonth() + i, 15); }
          else { ps = new Date(anchor.getFullYear(), anchor.getMonth() + i, 15); pe = new Date(anchor.getFullYear(), anchor.getMonth() + i + 1, 0); }
          payDate = new Date(pe.getTime() + delay * DAY);
        } else {
          ps = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
          pe = new Date(anchor.getFullYear(), anchor.getMonth() + i + 1, 0);
          payDate = new Date(pe.getTime() + delay * DAY);
        }
        rows.push(M('Period ' + (i + 1), isoDate(ps) + ' \u2192 ' + isoDate(pe) + ' \u00B7 paid ' + isoDate(payDate)));
      }
      var today = new Date();
      var current = null;
      for (var j = -1; j < n + 4; j++) {
        var cps, cpe;
        if (v.frequency === 'weekly') { cpe = new Date(anchor.getTime() + j * 7 * DAY); cps = new Date(cpe.getTime() - 7 * DAY); }
        else if (v.frequency === 'biweekly') { cpe = new Date(anchor.getTime() + j * 14 * DAY); cps = new Date(cpe.getTime() - 14 * DAY); }
        else if (v.frequency === 'semimonthly') {
          var d2 = anchor.getDate() <= 15 ? 15 : 1;
          if (d2 === 15) { cps = new Date(anchor.getFullYear(), anchor.getMonth() + j, 1); cpe = new Date(anchor.getFullYear(), anchor.getMonth() + j, 15); }
          else { cps = new Date(anchor.getFullYear(), anchor.getMonth() + j, 15); cpe = new Date(anchor.getFullYear(), anchor.getMonth() + j + 1, 0); }
        } else { cps = new Date(anchor.getFullYear(), anchor.getMonth() + j, 1); cpe = new Date(anchor.getFullYear(), anchor.getMonth() + j + 1, 0); }
        if (today >= cps && today <= cpe) { current = { ps: cps, pe: cpe }; break; }
      }
      var daysLeft = current ? Math.ceil((current.pe - today) / DAY) : 0;
      return { primary: current ? isoDate(current.ps) + ' \u2192 ' + isoDate(current.pe) : '\u2014', sub: current ? daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left' : 'Current period not found', meta: [M('Frequency', v.frequency), M('Anchor', v.anchorDate), M('Pay delay', delay + ' day' + (delay === 1 ? '' : 's')), M('Periods shown', String(rows.length))], breakdown: rows, value: daysLeft };
    }
  });

  defineCalc({
    id: 'course-hours', group: 'Work & Pay', short: 'Course Hours',
    name: 'Course & Credit Hours', desc: 'Total contact hours across a term.',
    icon: 'book',
    fields: [
      { name: 'hoursPerWeek', label: 'Contact hours per week', type: 'number', min: 0, step: 0.25 },
      { name: 'weeks', label: 'Term length (weeks)', type: 'number', min: 1, step: 1 },
      { name: 'breakWeeks', label: 'Break weeks', type: 'number', min: 0, step: 1 },
      { name: 'sessionLengthMin', label: 'Session length (min)', type: 'number', min: 1, step: 5 },
      { name: 'creditHours', label: 'Credit hours', type: 'number', min: 0, step: 0.5 }
    ],
    defaults: function () { return { hoursPerWeek: '3', weeks: '15', breakWeeks: '1', sessionLengthMin: '60', creditHours: '3' }; },
    compute: function (v) {
      var hpw = num(v.hoursPerWeek), weeks = num(v.weeks), breaks = num(v.breakWeeks);
      var session = num(v.sessionLengthMin), credits = num(v.creditHours);
      var teachingWeeks = Math.max(0, weeks - breaks);
      var totalHours = hpw * teachingWeeks;
      var totalSec = totalHours * 3600;
      var sessions = session > 0 ? Math.round(totalSec / (session * 60)) : 0;
      var rows = [M('Teaching weeks', String(teachingWeeks)), M('Contact hours per week', hpw.toFixed(2)), M('Total contact hours', totalHours.toFixed(2)), M('Total sessions', String(sessions))];
      if (credits > 0) rows.push(M('Credit hours', credits.toFixed(2)));
      return { primary: totalHours.toFixed(2) + ' contact hours', sub: teachingWeeks + ' teaching week' + (teachingWeeks === 1 ? '' : 's') + ' \u00B7 ' + sessions + ' session' + (sessions === 1 ? '' : 's'), meta: [M('Contact hours', totalHours.toFixed(2)), M('Sessions', String(sessions)), M('Teaching weeks', String(teachingWeeks)), M('Total minutes', numberFmt(totalSec / 60, { maximumFractionDigits: 0 }))], breakdown: rows, value: totalSec };
    }
  });

  defineCalc({
    id: 'punch-clock', group: 'Work & Pay', short: 'Punch Clock',
    name: 'Punch Clock', desc: 'Track clock-in / clock-out pairs.',
    icon: 'zap',
    fields: [
      { name: 'punches', label: 'Punches', type: 'intervals', sub: [{ name: 'start', label: 'Clock in', type: 'time' }, { name: 'end', label: 'Clock out', type: 'time' }] },
      { name: 'rate', label: 'Hourly rate', type: 'number', min: 0, step: 0.01 }
    ],
    defaults: function () { return { rate: '25', punches: [{ start: '09:00', end: '12:30' }, { start: '13:00', end: '17:30' }] }; },
    compute: function (v) {
      var list = (v.punches || []).filter(function (p) { return p.start || p.end; });
      if (!list.length) return { error: 'Add at least one punch pair.' };
      var total = 0, rows = [];
      list.forEach(function (p, i) {
        var s = parseClock(p.start), e = parseClock(p.end);
        if (s === null || e === null) return;
        var dur = e - s;
        if (dur < 0) dur += 86400;
        total += dur;
        rows.push(M('Punch ' + (i + 1), clockStr(s) + ' \u2192 ' + clockStr(e) + ' \u00B7 ' + fmtDuration(dur, { short: true })));
      });
      var rate = num(v.rate);
      var earnings = rate > 0 ? (total / 3600) * rate : 0;
      var meta = [M('Total hours', fmtDuration(total)), M('Decimal hours', decimalHours(total)), M('Punches', String(list.length))];
      if (rate > 0) meta.push(M('Estimated earnings', earnings.toFixed(2)));
      return { primary: fmtDuration(total), sub: list.length + ' punch' + (list.length === 1 ? '' : 'es') + ' \u00B7 ' + decimalHours(total) + ' h', meta: meta, breakdown: rows, value: total };
    }
  });

  defineCalc({
    id: 'meeting-cost', group: 'Work & Pay', short: 'Meeting Cost',
    name: 'Meeting Cost Calculator', desc: 'See the real cost of a meeting based on attendees and hourly rates.',
    icon: 'users',
    disclaimer: 'Cost is an estimate based on the rate you enter. Fully-loaded labour costs, opportunity costs, and facilities are not included.',
    fields: [
      { name: 'attendees', label: 'Number of attendees', type: 'number', min: 1, step: 1 },
      { name: 'avgRate', label: 'Average hourly rate', type: 'number', min: 0, step: 0.01 },
      { name: 'hours', label: 'Duration hours', type: 'number', min: 0, step: 1 },
      { name: 'minutes', label: 'Duration minutes', type: 'number', min: 0, max: 59, step: 1 },
      { name: 'currency', label: 'Currency', type: 'select', options: CURRENCIES.map(function (c) { return { v: c.code, t: c.label }; }) },
      { name: 'frequency', label: 'Recurrence', type: 'select', options: [
        { v: 'once', t: 'One-off meeting' }, { v: 'daily', t: 'Daily (250/yr)' },
        { v: 'weekly', t: 'Weekly (52/yr)' }, { v: 'biweekly', t: 'Bi-weekly (26/yr)' },
        { v: 'monthly', t: 'Monthly (12/yr)' }, { v: 'quarterly', t: 'Quarterly (4/yr)' }
      ] },
      { name: 'agendaItems', label: 'Agenda items (optional)', type: 'number', min: 0, step: 1 },
      { name: 'withPrep', label: 'Include 15 min prep time per attendee', type: 'checkbox' }
    ],
    defaults: function () { return { attendees: '8', avgRate: '45', hours: '1', minutes: '0', currency: 'USD', frequency: 'weekly', agendaItems: '0', withPrep: false }; },
    compute: function (v) {
      var attendees = Math.max(1, num(v.attendees));
      var rate = num(v.avgRate);
      var durationSec = num(v.hours) * 3600 + num(v.minutes) * 60;
      if (durationSec <= 0) return { error: 'Enter a meeting duration greater than zero.' };
      var prepSec = v.withPrep ? attendees * 15 * 60 : 0;
      var personSeconds = attendees * durationSec + prepSec;
      var cost = (personSeconds / 3600) * rate;
      var occurrences = 1;
      if (v.frequency === 'daily') occurrences = 250;
      else if (v.frequency === 'weekly') occurrences = 52;
      else if (v.frequency === 'biweekly') occurrences = 26;
      else if (v.frequency === 'monthly') occurrences = 12;
      else if (v.frequency === 'quarterly') occurrences = 4;
      var annualCost = cost * occurrences;
      var perMinute = (cost / (durationSec / 60)) || 0;
      var symbol = v.currency === 'CUSTOM' ? '' : ((CURRENCIES.find(function (c) { return c.code === v.currency; }) || {}).symbol || '$');
      var money = function (n) { return symbol + n.toFixed(2); };
      var meta = [M('Cost per meeting', money(cost)), M('Cost per minute', money(perMinute)), M('Attendee hours', (personSeconds / 3600).toFixed(2) + ' h'), M('Cost per attendee', money(cost / attendees))];
      if (occurrences > 1) { meta.push(M('Occurrences per year', String(occurrences))); meta.push(M('Annual cost', money(annualCost))); }
      var breakdown = [M('Attendees', String(attendees)), M('Average hourly rate', money(rate)), M('Meeting duration', fmtDuration(durationSec)), M('Attendee-hours (meeting)', (attendees * durationSec / 3600).toFixed(2)), M('Preparation time', v.withPrep ? (attendees * 15) + ' minutes total' : 'Not included'), M('Cost per minute', money(perMinute)), M('Cost per meeting', money(cost))];
      if (occurrences > 1) { breakdown.push(M('Frequency', v.frequency + ' \u00B7 ' + occurrences + ' per year')); breakdown.push(M('Annual cost', money(annualCost))); }
      if (num(v.agendaItems) > 0) { breakdown.push(M('Agenda items', String(num(v.agendaItems)))); breakdown.push(M('Minutes per agenda item', (durationSec / 60 / num(v.agendaItems)).toFixed(1))); }
      var warnings = [];
      if (attendees >= 10) warnings.push({ level: 'info', text: 'Meetings with 10 or more attendees are often better split into smaller groups.' });
      if (durationSec >= 2 * 3600) warnings.push({ level: 'info', text: 'Meetings longer than two hours typically see a sharp drop in attention.' });
      if (occurrences > 1 && annualCost > 10000) warnings.push({ level: 'warn', text: 'This recurring meeting costs more than ' + money(10000) + ' per year. Consider whether every attendee is essential.' });
      var chart = [{ label: 'Meeting time', value: attendees * durationSec / 3600, display: (attendees * durationSec / 3600).toFixed(1) + ' h', type: 'primary' }];
      if (v.withPrep) chart.push({ label: 'Prep time', value: prepSec / 3600, display: (prepSec / 3600).toFixed(1) + ' h', type: 'break' });
      return { primary: money(occurrences > 1 ? annualCost : cost), sub: occurrences > 1 ? money(cost) + ' per meeting \u00B7 ' + occurrences + ' per year' : attendees + ' attendees \u00B7 ' + fmtDuration(durationSec) + ' \u00B7 ' + money(perMinute) + ' per minute', meta: meta, breakdown: breakdown, chart: chart, warnings: warnings, value: cost, how: 'cost = attendees \u00D7 duration \u00D7 rate' + (v.withPrep ? ' + prep time' : '') + '\n= ' + attendees + ' \u00D7 ' + (durationSec / 3600).toFixed(2) + ' h \u00D7 ' + rate + '\n= ' + cost.toFixed(2) };
    }
  });

  var LOCALES = {
    'en-US': { label: 'English (US)', currency: 'USD', otTemplate: 'us-flsa', weekStart: '0' },
    'en-GB': { label: 'English (UK)', currency: 'GBP', otTemplate: 'uk', weekStart: '1' },
    'en-IN': { label: 'English (India)', currency: 'INR', otTemplate: 'custom', weekStart: '1' },
    'de-DE': { label: 'Deutsch (Deutschland)', currency: 'EUR', otTemplate: 'eu', weekStart: '1' }
  };
  var currentLocale = 'en-US';

  function applyLocale(localeCode) {
    if (!LOCALES[localeCode]) localeCode = 'en-US';
    currentLocale = localeCode;
    writeStore('timecalc.locale', localeCode);
    try { locale = localeCode; } catch (e) {}
    var l = LOCALES[localeCode];
    var otVals = getValues('overtime');
    if (otVals && !otVals._userTouched) otVals.template = l.otTemplate;
    var tsVals = getValues('timesheet');
    if (tsVals && !tsVals._userTouchedCurrency) tsVals.currency = l.currency;
    var earnVals = getValues('earnings');
    if (earnVals && !earnVals._userTouchedCurrency) earnVals.currency = l.currency;
    var mcVals = getValues('meeting-cost');
    if (mcVals && !mcVals._userTouchedCurrency) mcVals.currency = l.currency;
    var overtimeVals = getValues('overtime');
    if (overtimeVals && !overtimeVals._userTouchedWeek) overtimeVals.weekStart = l.weekStart;
    if (state.calcId) { buildForm(); recompute(); }
  }

  var LS = {
    theme: 'timecalc.theme', contrast: 'timecalc.contrast', fontsize: 'timecalc.fontsize',
    history: 'timecalc.history', saved: 'timecalc.saved', favorites: 'timecalc.favorites',
    recents: 'timecalc.recents', drafts: 'timecalc.drafts'
  };

  var state = {
    calcId: (typeof window !== 'undefined' && window.__TIMECALC_DEFAULT__) || 'duration', values: {}, lastResult: null,
    history: [], saved: [], favorites: [], recents: [], drafts: {},
    timer: null, historyTimer: null, notifyTargets: new Set(),
    paletteIndex: 0, paletteItems: []
  };

  function getValues(id) {
    if (!state.values[id]) {
      var draft = state.drafts[id];
      state.values[id] = draft ? Object.assign(getCalc(id).defaults(), draft) : getCalc(id).defaults();
    }
    return state.values[id];
  }

  var dom = {
    form: $('#calcForm'), calcTitle: $('#calcTitle'), calcDesc: $('#calcDesc'),
    calcBreadcrumb: $('#calcBreadcrumb'), resultBadge: $('#resultBadge'),
    resultError: $('#resultError'), liveNotice: $('#liveNotice'),
    primaryResult: $('#primaryResult'), resultSub: $('#resultSub'),
    resultMeta: $('#resultMeta'), chartWrap: $('#chartWrap'), chartBody: $('#chartBody'),
    timelineWrap: $('#timelineWrap'), timelineBody: $('#timelineBody'),
    breakdownWrap: $('#breakdownWrap'), breakdownBody: $('#breakdownBody'),
    warningsWrap: $('#warningsWrap'), disclaimer: $('#disclaimer'),
    howDetails: $('#howDetails'), howPre: $('#howPre'), resultPanel: $('#resultPanel'),
    copyFormat: $('#copyFormat'), toolGrid: $('#toolGrid'), navList: $('#mainNavList'),
    mobileNav: $('#mobileNav'), searchBtn: $('#searchBtn'), searchBar: $('#searchBar'),
    globalSearch: $('#globalSearch'), searchResults: $('#searchResults'),
    heroSearch: $('#heroSearch'), heroSearchResults: $('#heroSearchResults'),
    paletteBtn: $('#paletteBtn'), paletteBackdrop: $('#paletteBackdrop'),
    paletteInput: $('#paletteInput'), paletteList: $('#paletteList'),
    settingsBtn: $('#settingsBtn'), settingsPop: $('#settingsPop'), menuBtn: $('#menuBtn'),
    fullscreenBtn: $('#fullscreenBtn'), icsBtn: $('#icsBtn'),
    historyWrap: $('#historyListWrap'), savedWrap: $('#savedListWrap'),
    historySearch: $('#historySearch'), historyFilter: $('#historyFilter'),
    clearHistory: $('#clearHistory'), exportHistory: $('#exportHistory'),
    exportSaved: $('#exportSaved'), importSaved: $('#importSaved'), importFile: $('#importFile'),
    historyEmpty: $('#historyEmpty'), savedEmpty: $('#savedEmpty'),
    tabHistory: $('#tabHistory'), tabSaved: $('#tabSaved'),
    panelHistory: $('#panelHistory'), panelSaved: $('#panelSaved'),
    recentStrip: $('#recentStrip'), recentList: $('#recentList'),
    favoritesStrip: $('#favoritesStrip'), favoritesList: $('#favoritesList'),
    recentsStrip: $('#recentsStrip'), recentsList: $('#recentsList'),
    toast: $('#toast'), liveRegion: $('#liveRegion'), mobileCalcBtn: $('#mobileCalcBtn')
  };

  function readStore(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var THEME_ORDER = ['system', 'light', 'dark'];
  var CONTRAST_ORDER = ['normal', 'high'];
  var FONT_ORDER = ['sm', 'md', 'lg'];

  var currentTheme = readStore(LS.theme, 'system');
  if (THEME_ORDER.indexOf(currentTheme) === -1) currentTheme = 'system';
  var currentContrast = readStore(LS.contrast, 'normal');
  if (CONTRAST_ORDER.indexOf(currentContrast) === -1) currentContrast = 'normal';
  var currentFont = readStore(LS.fontsize, 'md');
  if (FONT_ORDER.indexOf(currentFont) === -1) currentFont = 'md';

  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyAppearance() {
    var effective = currentTheme === 'system' ? (systemDark.matches ? 'dark' : 'light') : currentTheme;
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-contrast', currentContrast);
    document.documentElement.setAttribute('data-fontsize', currentFont);
    $$('[data-theme-set]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.themeSet === currentTheme); });
    $$('[data-contrast-set]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.contrastSet === currentContrast); });
    $$('[data-font-set]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.fontSet === currentFont); });
  }
  systemDark.addEventListener('change', function () { if (currentTheme === 'system') applyAppearance(); });

  var toastTimer = null;
  function toast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    void dom.toast.offsetWidth;
    dom.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      dom.toast.classList.remove('is-visible');
      setTimeout(function () { dom.toast.hidden = true; }, 240);
    }, 2200);
  }
  function announce(msg) { if (dom.liveRegion) dom.liveRegion.textContent = msg; }
  function haptic(ms) {
    if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { navigator.vibrate(ms || 10); } catch (e) {}
    }
  }

  function buildForm() {
    var calc = getCalc(state.calcId);
    var values = getValues(state.calcId);
    dom.calcTitle.textContent = calc.name;
    dom.calcDesc.textContent = calc.desc;
    dom.calcBreadcrumb.textContent = '';
    var groupBtn = el('button', { type: 'button', dataset: { gotoGroup: calc.group } }, calc.group);
    dom.calcBreadcrumb.appendChild(groupBtn);
    dom.calcBreadcrumb.appendChild(document.createTextNode(' \u203A ' + calc.short));
    dom.form.textContent = '';
    var grid = el('div', { class: 'field-grid' });
    calc.fields.forEach(function (field) { grid.appendChild(renderField(field, values)); });
    dom.form.appendChild(grid);
    dom.form.appendChild(buildFormActions(calc));
    applyVisibility();
  }

  function buildFormActions(calc) {
    var actions = el('div', { class: 'form-actions' });
    actions.appendChild(el('button', { type: 'submit', class: 'btn btn-primary' }, 'Calculate'));
    actions.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', dataset: { formAction: 'reset' } }, 'Reset'));
    if (calc.id === 'timesheet') {
      actions.appendChild(el('button', { type: 'button', class: 'btn', dataset: { formAction: 'paste-csv' } }, 'Paste CSV'));
      actions.appendChild(el('button', { type: 'button', class: 'btn', dataset: { formAction: 'export-csv' } }, 'Export CSV'));
      actions.appendChild(el('button', { type: 'button', class: 'btn', dataset: { formAction: 'export-json' } }, 'Export JSON'));
    }
    if (calc.id === 'multi-interval') {
      actions.appendChild(el('button', { type: 'button', class: 'btn', dataset: { formAction: 'export-csv' } }, 'Export CSV'));
    }
    return actions;
  }

  function renderField(field, values) {
    if (field.type === 'heading') {
      return el('p', { class: 'field-heading', dataset: { field: field.name || ('heading-' + Math.random().toString(36).slice(2)) } }, field.label);
    }
    var wrap = el('div', { class: 'field', dataset: { field: field.name } });
    if (field.span === 2) wrap.classList.add('span-2');
    if (field.type === 'checkbox') {
      var label = el('label', { class: 'check' });
      var input = el('input', { type: 'checkbox', id: 'f_' + field.name, dataset: { field: field.name } });
      input.checked = !!values[field.name];
      label.appendChild(input);
      label.appendChild(el('span', {}, field.label));
      wrap.appendChild(label);
      if (field.hint) wrap.appendChild(el('p', { class: 'hint' }, field.hint));
      return wrap;
    }
    if (field.type === 'breaks' || field.type === 'intervals' || field.type === 'rows' || field.type === 'shifts' || field.type === 'zones' || field.type === 'laps') {
      wrap.classList.add('repeater');
      wrap.appendChild(el('p', { class: 'label' }, field.label));
      if (field.hint) wrap.appendChild(el('p', { class: 'hint' }, field.hint));
      var list = el('div', { class: 'rep-list', dataset: { repList: field.name } });
      wrap.appendChild(list);
      wrap.appendChild(el('button', { type: 'button', class: 'btn btn-sm', dataset: { repAdd: field.name } }, '+ Add row'));
      renderRepeater(field, values, list);
      return wrap;
    }
    var id = 'f_' + field.name;
    wrap.appendChild(el('label', { class: 'label', for: id }, field.label));
    var inputEl;
    if (field.type === 'select') {
      inputEl = el('select', { id: id, class: 'input', dataset: { field: field.name } });
      (field.options || []).forEach(function (opt) {
        var option = el('option', { value: opt.v }, opt.t);
        if (String(values[field.name]) === String(opt.v)) option.selected = true;
        inputEl.appendChild(option);
      });
    } else if (field.type === 'textarea') {
      inputEl = el('textarea', { id: id, class: 'input', dataset: { field: field.name }, placeholder: field.placeholder || '', rows: 3 });
      inputEl.value = values[field.name] || '';
    } else {
      inputEl = el('input', { id: id, class: 'input', type: field.type, dataset: { field: field.name }, placeholder: field.placeholder || '' });
      if (field.min !== undefined) inputEl.min = field.min;
      if (field.max !== undefined) inputEl.max = field.max;
      if (field.step !== undefined) inputEl.step = field.step;
      inputEl.value = values[field.name] !== undefined ? values[field.name] : '';
    }
    if (field.nowBtn) {
      var holder = el('div', { class: 'field-with-action' });
      holder.appendChild(inputEl);
      holder.appendChild(el('button', { type: 'button', class: 'field-action', dataset: { setNow: field.name } }, 'Now'));
      wrap.appendChild(holder);
    } else wrap.appendChild(inputEl);
    if (field.hint) wrap.appendChild(el('p', { class: 'hint' }, field.hint));
    return wrap;
  }

  function renderRepeater(field, values, list) {
    list.textContent = '';
    var rows = Array.isArray(values[field.name]) ? values[field.name] : [];
    if (!rows.length) { list.appendChild(el('p', { class: 'rep-empty' }, 'No rows yet.')); return; }
    rows.forEach(function (row, index) { list.appendChild(renderRepeaterRow(field, row, index)); });
  }

  function renderRepeaterRow(field, row, index) {
    var rowEl = el('div', { class: 'rep-row', dataset: { repRow: field.name, idx: String(index) }, draggable: 'true' });
    rowEl.appendChild(el('span', { class: 'drag-handle', 'aria-hidden': 'true' }, '\u22EE\u22EE'));
    field.sub.forEach(function (sub) {
      var subWrap = el('div', { class: 'field' });
      var subId = 'r_' + field.name + '_' + index + '_' + sub.name;
      subWrap.appendChild(el('label', { class: 'label', for: subId }, sub.label));
      var control;
      if (sub.type === 'select') {
        control = el('select', { id: subId, class: 'input input-sm', dataset: { rep: field.name, idx: String(index), sub: sub.name } });
        (sub.options || []).forEach(function (opt) {
          var option = el('option', { value: opt.v }, opt.t);
          if (String(row[sub.name]) === String(opt.v)) option.selected = true;
          control.appendChild(option);
        });
      } else {
        control = el('input', { id: subId, class: 'input input-sm', type: sub.type, dataset: { rep: field.name, idx: String(index), sub: sub.name }, placeholder: sub.placeholder || '' });
        if (sub.min !== undefined) control.min = sub.min;
        if (sub.max !== undefined) control.max = sub.max;
        if (sub.step !== undefined) control.step = sub.step;
        control.value = row[sub.name] !== undefined ? row[sub.name] : '';
      }
      subWrap.appendChild(control);
      rowEl.appendChild(subWrap);
    });
    rowEl.appendChild(el('span', { class: 'row-total' }, computeRowPreview(field, row)));
    rowEl.appendChild(el('div', { class: 'row-actions' },
      el('button', { type: 'button', class: 'row-btn', dataset: { repDup: field.name, idx: String(index) } }, 'Dup'),
      el('button', { type: 'button', class: 'row-btn danger', dataset: { repDel: field.name, idx: String(index) } }, 'Del')
    ));
    return rowEl;
  }

  function computeRowPreview(field, row) {
    if (field.type === 'intervals' || field.type === 'breaks' || field.type === 'shifts' || field.type === 'rows' || field.type === 'laps') {
      var s = parseClock(row.start || row.time);
      var e = parseClock(row.end || row.time);
      if (s === null || e === null) return '\u2014';
      var dur = e - s;
      if (dur <= 0) dur += 86400;
      if (field.type !== 'intervals' && field.type !== 'laps') dur -= Math.max(0, num(row.breakMin) * 60);
      return fmtDuration(Math.max(0, dur), { short: true });
    }
    if (field.type === 'zones') return row.zone || '\u2014';
    return '';
  }

  function applyVisibility() {
    var calc = getCalc(state.calcId);
    var values = getValues(state.calcId);
    calc.fields.forEach(function (field) {
      if (!field.name || !field.showIf) return;
      var wrap = dom.form.querySelector('[data-field="' + field.name + '"]');
      if (wrap) wrap.hidden = !field.showIf(values);
    });
  }

  var draftTimer = null;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      state.drafts[state.calcId] = state.values[state.calcId];
      writeStore(LS.drafts, state.drafts);
    }, 500);
  }

  function onFormInput(event) {
    var target = event.target;
    if (!target || !target.dataset) return;
    var values = getValues(state.calcId);
    var repName = target.dataset.rep;
    if (repName) {
      var index = +target.dataset.idx;
      var sub = target.dataset.sub;
      if (values[repName] && values[repName][index]) {
        values[repName][index][sub] = target.value;
        var rowEl = target.closest('.rep-row');
        if (rowEl) {
          var preview = rowEl.querySelector('.row-total');
          var field = getCalc(state.calcId).fields.find(function (f) { return f.name === repName; });
          if (preview && field) preview.textContent = computeRowPreview(field, values[repName][index]);
        }
      }
    } else if (target.dataset.field) {
      var name = target.dataset.field;
      values[name] = target.type === 'checkbox' ? target.checked : target.value;
      if (name === 'currency') values._userTouchedCurrency = true;
      if (name === 'template') values._userTouched = true;
      if (name === 'weekStart') values._userTouchedWeek = true;
    } else return;
    applyVisibility();
    recompute();
    saveDraft();
  }

  function onFormClick(event) {
    var target = event.target.closest('button');
    if (!target) return;
    var values = getValues(state.calcId);
    if (target.dataset.setNow !== undefined) {
      var name = target.dataset.setNow;
      var field = getCalc(state.calcId).fields.find(function (f) { return f.name === name; });
      if (!field) return;
      values[name] = field.type === 'time' ? timeNow(false) : isoToday();
      var input = dom.form.querySelector('[data-field="' + name + '"] input');
      if (input) input.value = values[name];
      recompute();
      return;
    }
    if (target.dataset.repAdd) {
      var fieldName = target.dataset.repAdd;
      var fld = getCalc(state.calcId).fields.find(function (f) { return f.name === fieldName; });
      if (!fld) return;
      if (!Array.isArray(values[fieldName])) values[fieldName] = [];
      values[fieldName].push(makeEmptyRow(fld));
      var list = dom.form.querySelector('[data-rep-list="' + fieldName + '"]');
      if (list) renderRepeater(fld, values, list);
      recompute(); saveDraft();
      return;
    }
    if (target.dataset.repDel) {
      var fname = target.dataset.repDel;
      var ix = +target.dataset.idx;
      var f2 = getCalc(state.calcId).fields.find(function (f) { return f.name === fname; });
      if (!f2 || !Array.isArray(values[fname])) return;
      values[fname].splice(ix, 1);
      var l2 = dom.form.querySelector('[data-rep-list="' + fname + '"]');
      if (l2) renderRepeater(f2, values, l2);
      recompute(); saveDraft();
      return;
    }
    if (target.dataset.repDup) {
      var dn = target.dataset.repDup;
      var di = +target.dataset.idx;
      var df = getCalc(state.calcId).fields.find(function (f) { return f.name === dn; });
      if (!df || !Array.isArray(values[dn])) return;
      var copy = JSON.parse(JSON.stringify(values[dn][di]));
      values[dn].splice(di + 1, 0, copy);
      var dl = dom.form.querySelector('[data-rep-list="' + dn + '"]');
      if (dl) renderRepeater(df, values, dl);
      recompute(); saveDraft();
      return;
    }
    if (target.dataset.formAction === 'reset') { resetCurrentCalc(); return; }
    if (target.dataset.formAction === 'export-csv') { exportCurrentCalc('csv'); return; }
    if (target.dataset.formAction === 'export-json') { exportCurrentCalc('json'); return; }
    if (target.dataset.formAction === 'paste-csv') { promptPasteCsv(); }
  }

  function bindRepeaterDrag() {
    dom.form.addEventListener('dragstart', function (e) {
      var row = e.target.closest('.rep-row');
      if (!row) return;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.dataset.idx);
    });
    dom.form.addEventListener('dragover', function (e) {
      var row = e.target.closest('.rep-row');
      if (!row) return;
      e.preventDefault();
      row.classList.add('drag-over');
    });
    dom.form.addEventListener('dragleave', function (e) {
      var row = e.target.closest('.rep-row');
      if (row) row.classList.remove('drag-over');
    });
    dom.form.addEventListener('drop', function (e) {
      var target = e.target.closest('.rep-row');
      var source = e.target.closest('.dragging');
      if (!target || !source) return;
      e.preventDefault();
      var fieldName = target.dataset.repRow;
      var from = +source.dataset.idx;
      var to = +target.dataset.idx;
      var values = getValues(state.calcId);
      if (!Array.isArray(values[fieldName])) return;
      var item = values[fieldName].splice(from, 1)[0];
      values[fieldName].splice(to, 0, item);
      var field = getCalc(state.calcId).fields.find(function (f) { return f.name === fieldName; });
      var list = dom.form.querySelector('[data-rep-list="' + fieldName + '"]');
      if (list && field) renderRepeater(field, values, list);
      recompute(); saveDraft();
    });
    dom.form.addEventListener('dragend', function () {
      $$('.rep-row').forEach(function (r) { r.classList.remove('dragging', 'drag-over'); });
    });
  }

  function makeEmptyRow(field) {
    var row = {};
    field.sub.forEach(function (sub) {
      if (sub.type === 'select') row[sub.name] = (sub.options && sub.options[0]) ? sub.options[0].v : '';
      else if (sub.type === 'date') row[sub.name] = isoToday();
      else if (sub.type === 'time') row[sub.name] = '09:00';
      else if (sub.type === 'number') row[sub.name] = '0';
      else row[sub.name] = '';
    });
    if (field.type === 'zones') row.zone = 'Europe/London';
    return row;
  }

  function resetCurrentCalc() {
    state.values[state.calcId] = getCalc(state.calcId).defaults();
    delete state.drafts[state.calcId];
    writeStore(LS.drafts, state.drafts);
    buildForm();
    recompute();
    toast('Reset');
  }

  function promptPasteCsv() {
    var text = window.prompt('Paste CSV rows. Columns: Date, Client, Project, Task, Start, End, Break (min), Billable, Rate, Notes');
    if (!text) return;
    var lines = text.split(/\r?\n/).filter(Boolean);
    var values = getValues(state.calcId);
    var existing = Array.isArray(values.rows) ? values.rows : [];
    lines.forEach(function (line, i) {
      var cells = line.split(',').map(function (c) { return c.trim(); });
      if (i === 0 && /date/i.test(cells[0])) return;
      existing.push({
        date: cells[0] || isoToday(),
        client: cells[1] || '', project: cells[2] || '', task: cells[3] || '',
        start: cells[4] || '09:00', end: cells[5] || '17:00',
        breakMin: cells[6] || '0',
        billable: /no|false|n/i.test(cells[7]) ? 'no' : 'yes',
        rate: cells[8] || '', notes: cells[9] || ''
      });
    });
    values.rows = existing;
    buildForm();
    recompute();
    toast('Imported ' + lines.length + ' row(s)');
  }

  function recompute() {
    var calc = getCalc(state.calcId);
    var values = getValues(state.calcId);
    var result;
    try { result = calc.compute(values) || {}; }
    catch (err) { result = { error: 'Something went wrong.' }; }
    state.lastResult = result;
    renderResult(calc, values, result);
    if (!result.error && calc.id !== 'time-until' && calc.id !== 'time-since' && calc.id !== 'world-clock') {
      scheduleHistory(calc, values, result);
    }
    pushRecentResult(result);
  }

  function renderResult(calc, values, result) {
    if (result.error) {
      dom.resultError.hidden = false;
      dom.resultError.textContent = result.error;
      dom.primaryResult.textContent = '\u2014';
      dom.resultSub.textContent = '';
      dom.resultMeta.textContent = ''; dom.resultMeta.hidden = true;
      dom.chartWrap.hidden = true; dom.timelineWrap.hidden = true;
      dom.breakdownWrap.hidden = true; dom.warningsWrap.hidden = true;
      dom.resultBadge.hidden = true; dom.disclaimer.hidden = true;
      dom.howDetails.hidden = true; dom.icsBtn.hidden = true; dom.liveNotice.hidden = true;
      announce('Error: ' + result.error);
      return;
    }
    dom.resultError.hidden = true;
    var oldText = dom.primaryResult.textContent;
    if (oldText !== (result.primary || '\u2014')) {
      dom.primaryResult.classList.remove('pulse');
      void dom.primaryResult.offsetWidth;
      dom.primaryResult.classList.add('pulse');
      haptic(10);
    }
    dom.primaryResult.textContent = result.primary || '\u2014';
    dom.resultSub.textContent = result.sub || '';
    if (result.badge) { dom.resultBadge.hidden = false; dom.resultBadge.textContent = result.badge; }
    else dom.resultBadge.hidden = true;
    if (result.live) { dom.liveNotice.hidden = false; dom.liveNotice.textContent = 'Live \u2014 updates every second.'; }
    else dom.liveNotice.hidden = true;
    dom.resultMeta.textContent = '';
    if (result.meta && result.meta.length) {
      result.meta.forEach(function (item) {
        dom.resultMeta.appendChild(el('div', { class: 'meta-item' },
          el('span', { class: 'meta-label' }, item.label),
          el('span', { class: 'meta-value' }, item.value),
          el('button', { type: 'button', class: 'meta-copy', dataset: { copyMetric: item.value }, 'aria-label': 'Copy value' }, '\u29C9')
        ));
      });
      dom.resultMeta.hidden = false;
    } else dom.resultMeta.hidden = true;
    if (result.chart && result.chart.length) { renderChart(result.chart, dom.chartBody); dom.chartWrap.hidden = false; }
    else { dom.chartWrap.hidden = true; dom.chartBody.textContent = ''; }
    if (result.timeline && result.timeline.segments && result.timeline.segments.length) {
      renderTimeline(result.timeline, dom.timelineBody);
      dom.timelineWrap.hidden = false;
    } else { dom.timelineWrap.hidden = true; dom.timelineBody.textContent = ''; }
    if (result.breakdown && result.breakdown.length) {
      renderBreakdown(result.breakdown, dom.breakdownBody);
      dom.breakdownWrap.hidden = false;
    } else { dom.breakdownWrap.hidden = true; dom.breakdownBody.textContent = ''; }
    if (result.warnings && result.warnings.length) {
      var ul = el('ul');
      result.warnings.forEach(function (w) { ul.appendChild(el('li', { dataset: { level: w.level || 'warn' } }, w.text)); });
      dom.warningsWrap.textContent = '';
      dom.warningsWrap.appendChild(ul);
      dom.warningsWrap.hidden = false;
    } else { dom.warningsWrap.hidden = true; dom.warningsWrap.textContent = ''; }
    if (calc.disclaimer) { dom.disclaimer.hidden = false; dom.disclaimer.textContent = calc.disclaimer; }
    else dom.disclaimer.hidden = true;
    if (result.how) { dom.howDetails.hidden = false; dom.howPre.textContent = result.how; }
    else dom.howDetails.hidden = true;
    if (calc.id === 'time-until' || calc.id === 'time-since' || calc.id === 'timezone' || calc.id === 'date-difference') dom.icsBtn.hidden = false;
    else dom.icsBtn.hidden = true;
  }

  function renderChart(rows, container) {
    var max = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.value); }).concat([0.0001]));
    container.textContent = '';
    rows.forEach(function (row) {
      var pct = clamp(Math.abs(row.value) / max * 100, 0, 100);
      container.appendChild(el('div', { class: 'chart-row' },
        el('span', { class: 'chart-label', title: row.label }, row.label),
        el('div', { class: 'chart-track' }, el('div', { class: 'chart-fill', dataset: { type: row.type || 'primary' }, style: 'width:' + pct + '%' })),
        el('span', { class: 'chart-value' }, row.display)
      ));
    });
  }

  function renderTimeline(timeline, container) {
    container.textContent = '';
    var bar = el('div', { class: 'timeline-bar' });
    timeline.segments.forEach(function (seg) {
      var left = clamp(seg.start * 100, 0, 100);
      var width = clamp((seg.end - seg.start) * 100, 0.4, 100 - left);
      var node = el('div', { class: 'tl-seg', dataset: { type: seg.type || 'work' }, style: 'left:' + left + '%;width:' + width + '%', title: seg.label });
      if (width > 7) node.appendChild(el('span', {}, seg.label));
      bar.appendChild(node);
    });
    if (typeof timeline.now === 'number' && timeline.now >= 0 && timeline.now <= 1) {
      bar.appendChild(el('div', { class: 'tl-now', style: 'left:' + clamp(timeline.now * 100, 0, 100) + '%' }));
    }
    var labels = el('div', { class: 'timeline-labels' });
    (timeline.labels || []).forEach(function (l) { labels.appendChild(el('span', {}, l)); });
    container.appendChild(bar);
    container.appendChild(labels);
  }

  function renderBreakdown(items, container) {
    var ul = el('ul', { class: 'breakdown-list' });
    items.forEach(function (item) {
      ul.appendChild(el('li', {},
        el('span', { class: 'bd-label' }, item.label),
        el('span', { class: 'bd-value' }, item.value)
      ));
    });
    container.textContent = '';
    container.appendChild(ul);
  }

  var recentResults = [];
  function pushRecentResult(result) {
    if (!result || result.error || !result.primary) { dom.recentStrip.hidden = true; return; }
    if (recentResults[0] && recentResults[0].primary === result.primary) { renderRecentResults(); return; }
    recentResults.unshift({ primary: result.primary, sub: result.sub || '' });
    if (recentResults.length > 5) recentResults.pop();
    renderRecentResults();
  }
  function renderRecentResults() {
    dom.recentList.textContent = '';
    if (recentResults.length < 2) { dom.recentStrip.hidden = true; return; }
    recentResults.slice(1).forEach(function (r) {
      dom.recentList.appendChild(el('li', {},
        el('button', { type: 'button', dataset: { recentLoad: r.primary } }, r.primary)
      ));
    });
    dom.recentStrip.hidden = false;
  }
  function clearRecentResults() { recentResults.length = 0; dom.recentStrip.hidden = true; }

  function scheduleHistory(calc, values, result) {
    clearTimeout(state.historyTimer);
    state.historyTimer = setTimeout(function () {
      var title = result.primary || '';
      if (!title) return;
      var last = state.history[0];
      if (last && last.calcId === calc.id && last.primary === title && last.sub === (result.sub || '')) return;
      state.history.unshift({
        id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        calcId: calc.id, calcName: calc.name,
        primary: title, sub: result.sub || '',
        values: JSON.parse(JSON.stringify(values)),
        ts: Date.now()
      });
      state.history = state.history.slice(0, 300);
      writeStore(LS.history, state.history);
      renderHistory();
    }, 1200);
  }

  function sessionLabel(ts) {
    var now = new Date();
    var d = new Date(ts);
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var yesterdayStart = new Date(todayStart.getTime() - DAY);
    var weekAgo = new Date(todayStart.getTime() - 7 * DAY);
    if (d >= todayStart) return 'Today';
    if (d >= yesterdayStart) return 'Yesterday';
    if (d >= weekAgo) return 'Earlier this week';
    return 'Older';
  }

  function renderHistory() {
    var query = (dom.historySearch.value || '').trim().toLowerCase();
    var filter = dom.historyFilter.value;
    var items = state.history.filter(function (item) {
      if (filter && item.calcId !== filter) return false;
      if (!query) return true;
      var haystack = (item.calcName + ' ' + item.primary + ' ' + item.sub).toLowerCase();
      var vals = '';
      try { vals = JSON.stringify(item.values).toLowerCase(); } catch (e) {}
      return haystack.indexOf(query) !== -1 || vals.indexOf(query) !== -1;
    });
    dom.historyWrap.textContent = '';
    if (!items.length) {
      dom.historyEmpty.hidden = false;
      dom.historyEmpty.textContent = state.history.length ? 'No matches.' : 'No calculations yet.';
      return;
    }
    dom.historyEmpty.hidden = true;
    var groups = new Map();
    items.forEach(function (item) {
      var lbl = sessionLabel(item.ts);
      if (!groups.has(lbl)) groups.set(lbl, []);
      groups.get(lbl).push(item);
    });
    groups.forEach(function (list, label) {
      dom.historyWrap.appendChild(el('p', { class: 'session-heading' }, label));
      var listUl = el('ul', { class: 'library-list' });
      list.forEach(function (item) {
        listUl.appendChild(el('li', { class: 'library-item' },
          el('div', { class: 'li-main' },
            el('p', { class: 'li-title' }, item.primary),
            el('p', { class: 'li-sub' }, item.sub || ''),
            el('p', { class: 'li-meta' }, item.calcName + ' \u00B7 ' + new Date(item.ts).toLocaleString())
          ),
          el('div', { class: 'li-actions' },
            el('button', { type: 'button', class: 'btn btn-sm', dataset: { histLoad: item.id } }, 'Load'),
            el('button', { type: 'button', class: 'btn btn-sm btn-ghost', dataset: { histDelete: item.id } }, 'Delete')
          )
        ));
      });
      dom.historyWrap.appendChild(listUl);
    });
  }

  function populateHistoryFilter() {
    var current = dom.historyFilter.value;
    dom.historyFilter.textContent = '';
    dom.historyFilter.appendChild(el('option', { value: '' }, 'All calculators'));
    CALCS.forEach(function (calc) { dom.historyFilter.appendChild(el('option', { value: calc.id }, calc.short)); });
    dom.historyFilter.value = current;
  }

  function loadHistoryEntry(id) {
    var entry = state.history.find(function (h) { return h.id === id; });
    if (!entry) return;
    state.values[entry.calcId] = JSON.parse(JSON.stringify(entry.values));
    switchCalc(entry.calcId, { scroll: true });
    toast('Loaded');
  }
  function deleteHistoryEntry(id) {
    state.history = state.history.filter(function (h) { return h.id !== id; });
    writeStore(LS.history, state.history);
    renderHistory();
  }
  function clearHistory() {
    if (!state.history.length) return;
    if (!window.confirm('Clear all history?')) return;
    state.history = [];
    writeStore(LS.history, state.history);
    renderHistory();
    toast('Cleared');
  }
  function exportHistory() {
    if (!state.history.length) { toast('Nothing to export'); return; }
    downloadFile('timecalc-history.json', JSON.stringify(state.history, null, 2), 'application/json');
    toast('Exported');
  }

  function saveCurrent() {
    var calc = getCalc(state.calcId);
    var values = getValues(state.calcId);
    var result = state.lastResult;
    if (!result || result.error) { toast('Nothing to save'); return; }
    var defaultName = calc.short + ': ' + result.primary;
    var name = window.prompt('Name:', defaultName);
    if (name === null) return;
    name = name.trim() || defaultName;
    var tags = window.prompt('Tags (comma separated, optional):', '');
    tags = (tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    state.saved.unshift({
      id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name, tags: tags, calcId: calc.id, calcName: calc.name,
      primary: result.primary, sub: result.sub || '',
      values: JSON.parse(JSON.stringify(values)),
      ts: Date.now()
    });
    writeStore(LS.saved, state.saved);
    renderSaved();
    toast('Saved');
  }

  function renderSaved() {
    dom.savedWrap.textContent = '';
    if (!state.saved.length) { dom.savedEmpty.hidden = false; return; }
    dom.savedEmpty.hidden = true;
    var ul = el('ul', { class: 'library-list' });
    state.saved.forEach(function (item) {
      var tags = item.tags && item.tags.length ? el('div', { class: 'li-tags' }, item.tags.map(function (t) { return el('span', { class: 'li-tag' }, t); })) : null;
      ul.appendChild(el('li', { class: 'library-item' },
        el('div', { class: 'li-main' },
          el('p', { class: 'li-title' }, item.name),
          el('p', { class: 'li-sub' }, item.primary + ' \u00B7 ' + (item.sub || '')),
          el('p', { class: 'li-meta' }, item.calcName + ' \u00B7 saved ' + new Date(item.ts).toLocaleString()),
          tags
        ),
        el('div', { class: 'li-actions' },
          el('button', { type: 'button', class: 'btn btn-sm', dataset: { savedLoad: item.id } }, 'Load'),
          el('button', { type: 'button', class: 'btn btn-sm', dataset: { savedRename: item.id } }, 'Rename'),
          el('button', { type: 'button', class: 'btn btn-sm', dataset: { savedDuplicate: item.id } }, 'Duplicate'),
          el('button', { type: 'button', class: 'btn btn-sm btn-ghost', dataset: { savedDelete: item.id } }, 'Delete')
        )
      ));
    });
    dom.savedWrap.appendChild(ul);
  }

  function loadSaved(id) {
    var item = state.saved.find(function (s) { return s.id === id; });
    if (!item) return;
    state.values[item.calcId] = JSON.parse(JSON.stringify(item.values));
    switchCalc(item.calcId, { scroll: true });
    toast('Loaded');
  }
  function renameSaved(id) {
    var item = state.saved.find(function (s) { return s.id === id; });
    if (!item) return;
    var name = window.prompt('Rename:', item.name);
    if (name === null) return;
    item.name = name.trim() || item.name;
    writeStore(LS.saved, state.saved);
    renderSaved();
  }
  function duplicateSaved(id) {
    var item = state.saved.find(function (s) { return s.id === id; });
    if (!item) return;
    var copy = JSON.parse(JSON.stringify(item));
    copy.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    copy.name = item.name + ' (copy)';
    copy.ts = Date.now();
    state.saved.unshift(copy);
    writeStore(LS.saved, state.saved);
    renderSaved();
    toast('Duplicated');
  }
  function deleteSaved(id) {
    state.saved = state.saved.filter(function (s) { return s.id !== id; });
    writeStore(LS.saved, state.saved);
    renderSaved();
  }
  function exportSaved() {
    if (!state.saved.length) { toast('Nothing to export'); return; }
    downloadFile('timecalc-saved.json', JSON.stringify(state.saved, null, 2), 'application/json');
    toast('Exported');
  }
  function importSaved() { dom.importFile.click(); }
  function handleImportFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var arr = Array.isArray(data) ? data : (data.saved || []);
        if (!Array.isArray(arr)) throw new Error('bad');
        arr.forEach(function (item) {
          if (!item || !item.calcId || !item.values) return;
          item.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          item.ts = item.ts || Date.now();
          state.saved.unshift(item);
        });
        writeStore(LS.saved, state.saved);
        renderSaved();
        toast('Imported ' + arr.length);
      } catch (e) { toast('Could not import'); }
      dom.importFile.value = '';
    };
    reader.readAsText(file);
  }

  function toggleFavorite(id) {
    if (state.favorites.indexOf(id) !== -1) state.favorites = state.favorites.filter(function (x) { return x !== id; });
    else state.favorites.push(id);
    writeStore(LS.favorites, state.favorites);
    renderToolGrid();
    renderNav();
    renderFavoritesStrip();
  }
  function pushRecent(id) {
    state.recents = [id].concat(state.recents.filter(function (x) { return x !== id; })).slice(0, 6);
    writeStore(LS.recents, state.recents);
    renderRecentsStrip();
  }
  function renderFavoritesStrip() {
    dom.favoritesList.textContent = '';
    if (!state.favorites.length) { dom.favoritesStrip.hidden = true; return; }
    state.favorites.forEach(function (id) {
      var calc = CALCS.find(function (c) { return c.id === id; });
      if (!calc) return;
      dom.favoritesList.appendChild(el('button', { type: 'button', class: 'chip', dataset: { calc: id } },
        calc.short,
        el('span', { class: 'chip-x', dataset: { unfav: id }, title: 'Remove' }, '\u00D7')
      ));
    });
    dom.favoritesStrip.hidden = false;
  }
  function renderRecentsStrip() {
    dom.recentsList.textContent = '';
    if (!state.recents.length) { dom.recentsStrip.hidden = true; return; }
    state.recents.forEach(function (id) {
      var calc = CALCS.find(function (c) { return c.id === id; });
      if (!calc) return;
      dom.recentsList.appendChild(el('button', { type: 'button', class: 'chip', dataset: { calc: id } }, calc.short));
    });
    dom.recentsStrip.hidden = false;
  }

  function downloadFile(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function csvEscape(value) {
    var str = String(value === null || value === undefined ? '' : value);
    if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  }

  function exportCurrentCalc(format) {
    var calc = getCalc(state.calcId);
    var result = state.lastResult;
    if (!result || result.error) { toast('Nothing to export'); return; }
    var stamp = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      downloadFile('timecalc-' + calc.id + '-' + stamp + '.json', JSON.stringify({
        calculator: calc.name, exportedAt: new Date().toISOString(),
        values: getValues(state.calcId), result: result
      }, null, 2), 'application/json');
      toast('Exported');
      return;
    }
    var rows = result.rows || null;
    var csv;
    if (calc.id === 'timesheet' && rows) {
      var header = ['Date', 'Client', 'Project', 'Task', 'Start', 'End', 'Break (min)', 'Billable', 'Rate', 'Hours', 'Earnings', 'Notes'];
      csv = [header.join(',')];
      rows.forEach(function (r) {
        var hours = (r.seconds / 3600).toFixed(4);
        var earnings = r.billable && r.rate ? ((r.seconds / 3600) * r.rate).toFixed(2) : '';
        csv.push([r.date, r.client, r.project, r.task, r.start, r.end, r.breakMin, r.billable ? 'Yes' : 'No', r.rate, hours, earnings, r.notes].map(csvEscape).join(','));
      });
    } else {
      csv = ['Metric,Value'];
      csv.push(['Result', result.primary].map(csvEscape).join(','));
      if (result.sub) csv.push(['Detail', result.sub].map(csvEscape).join(','));
      (result.meta || []).forEach(function (m) { csv.push([m.label, m.value].map(csvEscape).join(',')); });
      (result.breakdown || []).forEach(function (m) { csv.push([m.label, m.value].map(csvEscape).join(',')); });
    }
    downloadFile('timecalc-' + calc.id + '-' + stamp + '.csv', csv.join('\n'), 'text/csv;charset=utf-8');
    toast('Exported');
  }

  function buildPlainText() {
    var calc = getCalc(state.calcId), result = state.lastResult;
    if (!result || result.error) return '';
    return [calc.name, result.primary, result.sub || ''].concat((result.meta || []).map(function (m) { return m.label + ': ' + m.value; })).join('\n').trim();
  }
  function buildFormattedText() {
    var calc = getCalc(state.calcId), result = state.lastResult;
    if (!result || result.error) return '';
    return [calc.name, 'Result: ' + result.primary, result.sub || ''].concat((result.meta || []).map(function (m) { return '\u2022 ' + m.label + ': ' + m.value; })).filter(Boolean).join('\n');
  }
  function buildDetailedText() {
    var calc = getCalc(state.calcId), result = state.lastResult;
    if (!result || result.error) return '';
    return [calc.name, '', 'Result: ' + result.primary, result.sub ? 'Detail: ' + result.sub : '', '', 'Metrics', '-------']
      .concat((result.meta || []).map(function (m) { return m.label + ': ' + m.value; }))
      .concat(['', 'Breakdown', '---------'])
      .concat((result.breakdown || []).map(function (m) { return m.label + ': ' + m.value; }))
      .concat(result.how ? ['', 'How it was calculated', '--------------------', result.how] : [])
      .join('\n');
  }

  async function copyResult() {
    var format = dom.copyFormat.value;
    var text = format === 'plain' ? buildPlainText() : format === 'formatted' ? buildFormattedText() : buildDetailedText();
    if (!text) { toast('Nothing to copy'); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); toast('Copied'); return; }
      throw new Error('no clipboard');
    } catch (err) {
      var ta = el('textarea', { style: 'position:fixed;top:-1000px;left:-1000px' });
      ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied'); } catch (e) { toast('Copy failed'); }
      document.body.removeChild(ta);
    }
  }

  function exportResultImage() {
    var result = state.lastResult;
    if (!result || result.error) { toast('Nothing to export'); return; }
    var calc = getCalc(state.calcId);
    var W = 1200, H = 630, scale = 2;
    var canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2f5bda';
    ctx.fillRect(0, 0, W, 84);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px -apple-system, system-ui, Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('TimeCalc', 44, 42);
    ctx.textAlign = 'right';
    ctx.font = '500 18px -apple-system, system-ui, Segoe UI, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    var calcName = calc.name;
    if (ctx.measureText(calcName).width > W - 300) calcName = calc.short;
    ctx.fillText(calcName, W - 44, 42);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#667085';
    ctx.font = '600 13px -apple-system, system-ui, sans-serif';
    ctx.fillText('RESULT', 44, 138);
    var primary = result.primary || '\u2014';
    var size = 96;
    ctx.fillStyle = '#101828';
    ctx.font = 'bold ' + size + 'px -apple-system, system-ui, sans-serif';
    while (ctx.measureText(primary).width > W - 88 && size > 28) {
      size -= 4;
      ctx.font = 'bold ' + size + 'px -apple-system, system-ui, sans-serif';
    }
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(primary, 44, 250);
    if (result.sub) {
      ctx.fillStyle = '#667085';
      ctx.font = '500 20px ui-monospace, Menlo, monospace';
      var sub = result.sub;
      if (ctx.measureText(sub).width > W - 88) {
        while (sub.length > 10 && ctx.measureText(sub + '\u2026').width > W - 88) sub = sub.slice(0, -2);
        sub += '\u2026';
      }
      ctx.fillText(sub, 44, 296);
    }
    ctx.strokeStyle = '#eaecf0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(44, 340);
    ctx.lineTo(W - 44, 340);
    ctx.stroke();
    var meta = (result.meta || []).slice(0, 6);
    var cols = meta.length > 3 ? 3 : (meta.length || 1);
    var colW = (W - 88) / cols;
    meta.forEach(function (m, i) {
      var x = 44 + (i % cols) * colW;
      var y = 400 + Math.floor(i / cols) * 100;
      ctx.fillStyle = '#667085';
      ctx.font = '600 12px -apple-system, system-ui, sans-serif';
      var label = m.label.toUpperCase();
      if (ctx.measureText(label).width > colW - 20) {
        while (label.length > 4 && ctx.measureText(label + '\u2026').width > colW - 20) label = label.slice(0, -2);
        label += '\u2026';
      }
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#101828';
      ctx.font = 'bold 26px -apple-system, system-ui, sans-serif';
      var val = String(m.value);
      if (ctx.measureText(val).width > colW - 20) {
        while (val.length > 4 && ctx.measureText(val + '\u2026').width > colW - 20) val = val.slice(0, -2);
        val += '\u2026';
      }
      ctx.fillText(val, x, y + 36);
    });
    ctx.fillStyle = '#f6f7f9';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.strokeStyle = '#eaecf0';
    ctx.beginPath();
    ctx.moveTo(0, H - 60);
    ctx.lineTo(W, H - 60);
    ctx.stroke();
    ctx.fillStyle = '#667085';
    ctx.font = '500 15px -apple-system, system-ui, sans-serif';
    ctx.fillText('timecalc.example.com', 44, H - 30);
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString(locale), W - 44, H - 30);
    ctx.textAlign = 'left';
    canvas.toBlob(function (blob) {
      if (!blob) { toast('Could not generate image'); return; }
      downloadFile('timecalc-' + calc.id + '.png', blob, 'image/png');
      toast('Image saved');
    }, 'image/png', 0.95);
  }

  function showEmbedModal() {
    var calc = getCalc(state.calcId);
    var baseUrl = location.origin + location.pathname;
    var embedUrl = baseUrl + '?embed=1&calc=' + calc.id;
    var code = '<iframe src="' + embedUrl + '" width="520" height="600" style="border:1px solid #eaecf0;border-radius:8px;max-width:100%" title="' + calc.name + '" loading="lazy"></iframe>';
    var ta = document.getElementById('embedCode');
    if (ta) ta.value = code;
    var backdrop = document.getElementById('embedBackdrop');
    if (backdrop) backdrop.hidden = false;
    setTimeout(function () { if (ta) ta.focus(); }, 30);
  }
  function closeEmbedModal() {
    var backdrop = document.getElementById('embedBackdrop');
    if (backdrop) backdrop.hidden = true;
  }
  function copyEmbedCode() {
    var ta = document.getElementById('embedCode');
    if (!ta) return;
    var code = ta.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () { toast('Embed code copied'); closeEmbedModal(); }, function () { ta.select(); document.execCommand('copy'); toast('Embed code copied'); closeEmbedModal(); });
    } else { ta.select(); document.execCommand('copy'); toast('Embed code copied'); closeEmbedModal(); }
  }

  function openDonate() {
    var backdrop = document.getElementById('donateBackdrop');
    if (!backdrop) return;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var closeBtn = document.getElementById('donateClose'); if (closeBtn) closeBtn.focus(); }, 30);
    updateDonateLinks();
  }
  function closeDonate() {
    var backdrop = document.getElementById('donateBackdrop');
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.style.overflow = '';
  }
  function getSelectedDonateAmount() {
    var custom = document.getElementById('donateCustom');
    if (custom && custom.value && Number(custom.value) > 0) return Math.floor(Number(custom.value));
    var active = document.querySelector('.donate-amount.is-active');
    return active ? Math.floor(Number(active.dataset.amount)) : 5;
  }
  function updateDonateLinks() {
    var amount = getSelectedDonateAmount();
    var kofi = document.getElementById('donateKofi');
    var bmc = document.getElementById('donateBmc');
    var pp = document.getElementById('donatePaypal');
    var gh = document.getElementById('donateGithub');
    if (kofi && kofi.href.indexOf('yourname') === -1) kofi.href = kofi.href.split('?')[0] + '?amount=' + amount;
    if (bmc && bmc.href.indexOf('yourname') === -1) bmc.href = bmc.href.split('?')[0] + '?amount=' + amount;
    if (pp && pp.href.indexOf('yourname') === -1) pp.href = pp.href.split('/').slice(0, -1).join('/') + '/' + amount;
    if (gh && gh.href.indexOf('yourname') === -1) gh.href = gh.href.split('?')[0] + '?frequency=one-time&amount=' + amount;
  }
  function bindDonateEvents() {
    var openBtns = [document.getElementById('donateBtn'), document.getElementById('footerDonateBtn')];
    openBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', openDonate); });
    var backdrop = document.getElementById('donateBackdrop');
    if (!backdrop) return;
    var closeBtn = document.getElementById('donateClose');
    if (closeBtn) closeBtn.addEventListener('click', closeDonate);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeDonate(); });
    var amountBtns = document.querySelectorAll('.donate-amount');
    amountBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        amountBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var custom = document.getElementById('donateCustom');
        if (custom) custom.value = '';
        updateDonateLinks();
      });
    });
    var custom = document.getElementById('donateCustom');
    if (custom) {
      custom.addEventListener('input', function () {
        if (custom.value && Number(custom.value) > 0) amountBtns.forEach(function (b) { b.classList.remove('is-active'); });
        updateDonateLinks();
      });
    }
    var shareBtn = document.getElementById('donateShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var url = location.origin + location.pathname;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link:', url); });
        } else window.prompt('Copy this link:', url);
      });
    }
  }

  function b64EncodeUnicode(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function b64DecodeUnicode(str) {
    var binary = atob(str);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function shareResult() {
    var result = state.lastResult;
    if (!result || result.error) { toast('Nothing to share'); return; }
    var payload = { c: state.calcId, v: getValues(state.calcId) };
    var encoded;
    try { encoded = b64EncodeUnicode(JSON.stringify(payload)); }
    catch (e) { toast('Could not build link'); return; }
    var url = location.origin + location.pathname + '#calc=' + encoded;
    var shareData = { title: 'TimeCalc', text: result.primary + '\n' + (result.sub || ''), url: url };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); toast('Shared'); return; } catch (e) {}
    }
    var proceed = window.confirm('Shared links contain the values you entered, encoded into the URL.\n\nCreate the share link?');
    if (!proceed) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link:', url); });
    } else window.prompt('Copy this link:', url);
  }

  function readShareHash() {
    var hash = location.hash || '';
    var match = /#calc=([A-Za-z0-9+/=]+)/.exec(hash);
    if (!match) return false;
    try {
      var payload = JSON.parse(b64DecodeUnicode(match[1]));
      if (!payload || !payload.c) return false;
      var calc = CALCS.find(function (c) { return c.id === payload.c; });
      if (!calc) return false;
      state.values[payload.c] = Object.assign(calc.defaults(), payload.v || {});
      switchCalc(payload.c, { scroll: true });
      toast('Loaded from link');
      return true;
    } catch (e) { return false; }
  }

  function buildIcs() {
    var result = state.lastResult;
    var calc = getCalc(state.calcId);
    var title = calc.name, start, end;
    if (calc.id === 'time-until' || calc.id === 'time-since') {
      var v = getValues(calc.id);
      start = toDate(v.targetDate || v.startDate, v.targetTime || v.startTime);
      if (!start) return null;
      end = new Date(start.getTime() + HOUR);
      title = v.label || calc.name;
    } else if (calc.id === 'date-difference') {
      var v2 = getValues(calc.id);
      start = toDate(v2.startDate, v2.startTime);
      end = toDate(v2.endDate, v2.endTime);
      if (!start || !end) return null;
      title = 'From ' + v2.startDate + ' to ' + v2.endDate;
    } else if (calc.id === 'timezone') {
      var v3 = getValues(calc.id);
      var instant = zonedToInstant(v3.date, v3.time, v3.sourceZone);
      if (!instant) return null;
      start = instant; end = new Date(instant.getTime() + HOUR);
      title = 'Time zone meeting';
    } else return null;
    var fmt = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var uid = 'timecalc-' + Date.now() + '@local';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TimeCalc//EN', 'BEGIN:VEVENT',
      'UID:' + uid, 'DTSTAMP:' + fmt(new Date()), 'DTSTART:' + fmt(start), 'DTEND:' + fmt(end),
      'SUMMARY:' + title.replace(/\n/g, ' '), result.sub ? 'DESCRIPTION:' + result.sub.replace(/\n/g, ' ') : '',
      'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
  }
  function exportIcs() {
    var ics = buildIcs();
    if (!ics) { toast('No date/time to export'); return; }
    downloadFile('timecalc-event.ics', ics, 'text/calendar;charset=utf-8');
    toast('Downloaded');
  }

  function switchCalc(id, opts) {
    opts = opts || {};
    if (!CALCS.some(function (c) { return c.id === id; })) return;
    if (state.calcId) { state.drafts[state.calcId] = state.values[state.calcId]; writeStore(LS.drafts, state.drafts); }
    state.calcId = id;
    getValues(id);
    pushRecent(id);
    clearRecentResults();
    buildForm();
    recompute();
    updateActiveStates();
    syncTicker();
    if (opts.scroll !== false) {
      var workspace = document.getElementById('workspace');
      if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateActiveStates() {
    $$('[data-calc]').forEach(function (node) { node.classList.toggle('is-active', node.dataset.calc === state.calcId); });
  }

  function renderToolGrid() {
    dom.toolGrid.textContent = '';
    CALCS.forEach(function (calc) {
      var isFav = state.favorites.indexOf(calc.id) !== -1;
      dom.toolGrid.appendChild(el('button', {
        type: 'button', class: 'tool-card', dataset: { calc: calc.id }, 'aria-label': calc.name
      },
        el('span', { class: 'tool-icon', html: iconSvg(calc.icon) }),
        el('span', { class: 'tool-name' }, calc.short),
        el('button', {
          type: 'button', class: 'tool-fav' + (isFav ? ' is-fav' : ''),
          dataset: { favToggle: calc.id },
          'aria-label': isFav ? 'Remove from favourites' : 'Add to favourites'
        }, isFav ? '\u2605' : '\u2606'),
        el('span', { class: 'tool-desc' }, calc.desc)
      ));
    });
  }

  var NAV_ITEMS = [
    { label: 'Duration', calc: 'duration' },
    { label: 'Work Hours', calc: 'work-hours' },
    { label: 'Timesheet', calc: 'timesheet' },
    { label: 'Meeting Cost', calc: 'meeting-cost' },
    { label: 'Time Zones', calc: 'timezone' },
    { label: 'Dates', calc: 'date-difference' },
    { label: 'Learn', link: '#learn' },
    { label: 'More', menu: true }
  ];

  function renderNav() {
    dom.navList.textContent = '';
    NAV_ITEMS.forEach(function (item) {
      var li = el('li', { class: 'nav-item' });
      if (item.menu) {
        var btn = el('button', { type: 'button', class: 'nav-link', 'aria-expanded': 'false', 'aria-haspopup': 'true', dataset: { menuToggle: 'more' } }, item.label);
        var menu = el('ul', { class: 'nav-menu', hidden: true, dataset: { menu: 'more' } });
        CALCS.filter(function (c) { return !NAV_ITEMS.some(function (n) { return n.calc === c.id; }); }).forEach(function (calc) {
          var isFav = state.favorites.indexOf(calc.id) !== -1;
          menu.appendChild(el('li', {},
            el('button', { type: 'button', dataset: { calc: calc.id } },
              calc.short,
              el('span', { class: 'fav-toggle' + (isFav ? ' is-fav' : ''), dataset: { favToggle: calc.id } }, isFav ? '\u2605' : '\u2606'),
              el('small', {}, calc.desc)
            )
          ));
        });
        li.appendChild(btn);
        li.appendChild(menu);
      } else if (item.link) {
        li.appendChild(el('a', { href: item.link, class: 'nav-link' }, item.label));
      } else {
        li.appendChild(el('button', { type: 'button', class: 'nav-link', dataset: { calc: item.calc } }, item.label));
      }
      dom.navList.appendChild(li);
    });
  }

  function renderMobileNav() {
    dom.mobileNav.textContent = '';
    var ul = el('ul');
    if (state.favorites.length) {
      ul.appendChild(el('li', {}, el('p', { class: 'mob-heading' }, 'Favourites')));
      state.favorites.forEach(function (id) {
        var calc = CALCS.find(function (c) { return c.id === id; });
        if (calc) ul.appendChild(el('li', {}, el('button', { type: 'button', dataset: { calc: calc.id } }, calc.short)));
      });
    }
    ul.appendChild(el('li', {}, el('p', { class: 'mob-heading' }, 'All')));
    CALCS.forEach(function (calc) {
      ul.appendChild(el('li', {}, el('button', { type: 'button', dataset: { calc: calc.id } }, calc.short)));
    });
    dom.mobileNav.appendChild(ul);
  }

  function closeMenus() {
    $$('.nav-menu').forEach(function (m) { m.hidden = true; });
    $$('[data-menu-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    dom.mobileNav.hidden = true;
    dom.menuBtn.setAttribute('aria-expanded', 'false');
    dom.settingsPop.hidden = true;
    dom.settingsBtn.setAttribute('aria-expanded', 'false');
  }

  function searchCalcs(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    return CALCS.filter(function (calc) {
      return calc.name.toLowerCase().indexOf(q) !== -1 || calc.short.toLowerCase().indexOf(q) !== -1 || calc.desc.toLowerCase().indexOf(q) !== -1 || calc.group.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
  }
  function renderSearchResults(listEl, results) {
    listEl.textContent = '';
    if (!results.length) { listEl.appendChild(el('li', {}, el('p', { class: 'search-empty' }, 'No matches.'))); listEl.hidden = false; return; }
    results.forEach(function (calc) {
      listEl.appendChild(el('li', {}, el('button', { type: 'button', dataset: { calc: calc.id } }, calc.short, el('small', {}, calc.desc))));
    });
    listEl.hidden = false;
  }
  function bindSearch(input, resultsEl) {
    input.addEventListener('input', function () {
      var value = input.value;
      if (!value.trim()) { resultsEl.hidden = true; resultsEl.textContent = ''; return; }
      renderSearchResults(resultsEl, searchCalcs(value));
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { input.value = ''; resultsEl.hidden = true; }
    });
  }

  function openPalette() {
    dom.paletteBackdrop.hidden = false;
    dom.paletteInput.value = '';
    state.paletteIndex = 0;
    renderPaletteItems('');
    setTimeout(function () { dom.paletteInput.focus(); }, 30);
  }
  function closePalette() { dom.paletteBackdrop.hidden = true; }

  function renderPaletteItems(query) {
    var q = query.trim().toLowerCase();
    var items = [];
    items.push({ kind: 'command', label: 'Toggle dark mode', action: function () { currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; writeStore(LS.theme, currentTheme); applyAppearance(); } });
    items.push({ kind: 'command', label: 'Toggle high contrast', action: function () { currentContrast = currentContrast === 'high' ? 'normal' : 'high'; writeStore(LS.contrast, currentContrast); applyAppearance(); } });
    items.push({ kind: 'command', label: 'Cycle text size', action: function () { var i = FONT_ORDER.indexOf(currentFont); currentFont = FONT_ORDER[(i + 1) % FONT_ORDER.length]; writeStore(LS.fontsize, currentFont); applyAppearance(); } });
    items.push({ kind: 'command', label: 'Print', action: function () { window.print(); } });
    items.push({ kind: 'command', label: 'Export result as image', action: function () { exportResultImage(); } });
    items.push({ kind: 'command', label: 'Show embed code', action: function () { showEmbedModal(); } });
    items.push({ kind: 'command', label: 'Support TimeCalc', action: function () { openDonate(); } });
    CALCS.forEach(function (c) { items.push({ kind: 'calc', id: c.id, label: c.name, sub: c.desc }); });
    state.saved.slice(0, 12).forEach(function (s) { items.push({ kind: 'saved', id: s.id, label: s.name, sub: s.calcName + ' \u00B7 ' + s.primary }); });
    var filtered = q ? items.filter(function (it) { return (it.label + ' ' + (it.sub || '')).toLowerCase().indexOf(q) !== -1; }) : items;
    state.paletteItems = filtered.slice(0, 30);
    dom.paletteList.textContent = '';
    var groups = { command: 'Commands', calc: 'Calculators', saved: 'Saved' };
    var seen = new Set();
    state.paletteItems.forEach(function (item, idx) {
      if (!seen.has(item.kind)) { seen.add(item.kind); dom.paletteList.appendChild(el('li', { class: 'palette-section' }, groups[item.kind])); }
      var isActive = idx === state.paletteIndex;
      dom.paletteList.appendChild(el('li', {},
        el('button', { type: 'button', class: isActive ? 'is-active' : '', dataset: { paletteIdx: String(idx) } }, item.label, item.sub ? el('small', {}, item.sub) : null)
      ));
    });
    if (!state.paletteItems.length) dom.paletteList.appendChild(el('li', { class: 'palette-empty' }, 'No matches'));
  }

  function runPaletteItem(index) {
    var item = state.paletteItems[index];
    if (!item) return;
    closePalette();
    if (item.kind === 'command') item.action();
    else if (item.kind === 'calc') switchCalc(item.id, { scroll: true });
    else if (item.kind === 'saved') loadSaved(item.id);
  }

  function paletteInputHandler(event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); state.paletteIndex = Math.min(state.paletteIndex + 1, state.paletteItems.length - 1); renderPaletteItems(dom.paletteInput.value); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); state.paletteIndex = Math.max(state.paletteIndex - 1, 0); renderPaletteItems(dom.paletteInput.value); }
    else if (event.key === 'Enter') { event.preventDefault(); runPaletteItem(state.paletteIndex); }
    else if (event.key === 'Escape') closePalette();
  }

  function syncTicker() {
    var needs = state.calcId === 'time-until' || state.calcId === 'time-since' || state.calcId === 'world-clock';
    if (needs && !state.timer) {
      state.timer = setInterval(function () { if (document.hidden) return; recompute(); checkNotifications(); }, 1000);
    } else if (!needs && state.timer) { clearInterval(state.timer); state.timer = null; }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncTicker(); });

  function checkNotifications() {
    var calc = getCalc(state.calcId);
    if (calc.id !== 'time-until') return;
    var v = getValues(calc.id);
    if (!v.notify && !v.alarm) return;
    var target = toDate(v.targetDate, v.targetTime);
    if (!target) return;
    var now = Date.now();
    if (now >= target.getTime() - 500 && now <= target.getTime() + 2000) {
      if (!state.notifyTargets.has(target.getTime())) {
        state.notifyTargets.add(target.getTime());
        if (v.notify && 'Notification' in window) {
          if (Notification.permission === 'granted') new Notification('Countdown finished', { body: v.label || '' });
          else if (Notification.permission !== 'denied') Notification.requestPermission().then(function (p) { if (p === 'granted') new Notification('Countdown finished', { body: v.label || '' }); });
        }
        if (v.alarm) beep();
        haptic(60);
      }
    }
  }
  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  function bindSegment(segId, attr, values, onChange) {
    var seg = document.getElementById(segId);
    if (!seg) return;
    seg.addEventListener('click', function (event) {
      var btn = event.target.closest('button');
      if (!btn) return;
      var val = btn.dataset[attr];
      if (values.indexOf(val) === -1) return;
      onChange(val);
      applyAppearance();
    });
  }

  function bindEvents() {
    dom.form.addEventListener('input', onFormInput);
    dom.form.addEventListener('change', onFormInput);
    dom.form.addEventListener('click', onFormClick);
    dom.form.addEventListener('submit', function (e) { e.preventDefault(); recompute(); });
    bindRepeaterDrag();

    document.addEventListener('click', function (event) {
      var favToggle = event.target.closest('[data-fav-toggle]');
      if (favToggle) { event.preventDefault(); event.stopPropagation(); toggleFavorite(favToggle.dataset.favToggle); return; }
      var unfav = event.target.closest('[data-unfav]');
      if (unfav) { event.preventDefault(); toggleFavorite(unfav.dataset.unfav); return; }
      var goto = event.target.closest('[data-goto-calc]');
      if (goto) {
        event.preventDefault();
        switchCalc(goto.dataset.gotoCalc, { scroll: true });
        var ws = document.getElementById('workspace');
        if (ws) ws.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      var calcBtn = event.target.closest('[data-calc]');
      if (calcBtn) {
        event.preventDefault();
        closeMenus();
        if (dom.searchBar && !dom.searchBar.hidden) { dom.searchBar.hidden = true; dom.searchBtn.setAttribute('aria-expanded', 'false'); }
        dom.searchResults.hidden = true;
        dom.heroSearchResults.hidden = true;
        switchCalc(calcBtn.dataset.calc);
        return;
      }
      var menuToggle = event.target.closest('[data-menu-toggle]');
      if (menuToggle) {
        var menu = document.querySelector('[data-menu="' + menuToggle.dataset.menuToggle + '"]');
        var isOpen = menu && !menu.hidden;
        closeMenus();
        if (menu && !isOpen) { menu.hidden = false; menuToggle.setAttribute('aria-expanded', 'true'); }
        return;
      }
      var copyBtn = event.target.closest('[data-copy-metric]');
      if (copyBtn) { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(copyBtn.dataset.copyMetric).then(function () { toast('Copied'); }); return; }
      var recentLoad = event.target.closest('[data-recent-load]');
      if (recentLoad) { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(recentLoad.dataset.recentLoad).then(function () { toast('Copied'); }); return; }
      var paletteItem = event.target.closest('[data-palette-idx]');
      if (paletteItem) { event.preventDefault(); runPaletteItem(+paletteItem.dataset.paletteIdx); return; }
      var toggle = event.target.closest('[data-toggle]');
      if (toggle) {
        var key = toggle.dataset.toggle;
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        var body = document.getElementById(key + 'Body');
        if (body) body.hidden = expanded;
        return;
      }
      var gotoGroup = event.target.closest('[data-goto-group]');
      if (gotoGroup) { event.preventDefault(); document.getElementById('tools').scrollIntoView({ behavior: 'smooth' }); return; }
      if (!event.target.closest('.nav-item') && !event.target.closest('.mobile-nav')) {
        $$('.nav-menu').forEach(function (m) { m.hidden = true; });
        $$('[data-menu-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      }
      if (!event.target.closest('.hero-search')) dom.heroSearchResults.hidden = true;
      if (!event.target.closest('.search-bar') && !event.target.closest('#searchBtn')) dom.searchResults.hidden = true;
      if (!event.target.closest('#settingsPop') && !event.target.closest('#settingsBtn')) {
        dom.settingsPop.hidden = true;
        dom.settingsBtn.setAttribute('aria-expanded', 'false');
      }
    });

    dom.resultPanel.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-result-action]');
      if (!btn) return;
      var action = btn.dataset.resultAction;
      if (action === 'copy') copyResult();
      else if (action === 'save') saveCurrent();
      else if (action === 'print') window.print();
      else if (action === 'share') shareResult();
      else if (action === 'reset') resetCurrentCalc();
      else if (action === 'ics') exportIcs();
      else if (action === 'image') exportResultImage();
      else if (action === 'embed') showEmbedModal();
    });

    var embedBackdrop = document.getElementById('embedBackdrop');
    if (embedBackdrop) {
      embedBackdrop.addEventListener('click', function (e) { if (e.target === embedBackdrop) closeEmbedModal(); });
      var embedClose = document.getElementById('embedClose');
      var embedCancel = document.getElementById('embedCancel');
      var embedCopy = document.getElementById('embedCopy');
      if (embedClose) embedClose.addEventListener('click', closeEmbedModal);
      if (embedCancel) embedCancel.addEventListener('click', closeEmbedModal);
      if (embedCopy) embedCopy.addEventListener('click', copyEmbedCode);
    }

    dom.historyWrap.addEventListener('click', function (event) {
      var load = event.target.closest('[data-hist-load]');
      if (load) { loadHistoryEntry(load.dataset.histLoad); return; }
      var del = event.target.closest('[data-hist-delete]');
      if (del) deleteHistoryEntry(del.dataset.histDelete);
    });
    dom.historySearch.addEventListener('input', renderHistory);
    dom.historyFilter.addEventListener('change', renderHistory);
    dom.clearHistory.addEventListener('click', clearHistory);
    dom.exportHistory.addEventListener('click', exportHistory);

    dom.savedWrap.addEventListener('click', function (event) {
      var load = event.target.closest('[data-saved-load]');
      if (load) { loadSaved(load.dataset.savedLoad); return; }
      var rename = event.target.closest('[data-saved-rename]');
      if (rename) { renameSaved(rename.dataset.savedRename); return; }
      var dup = event.target.closest('[data-saved-duplicate]');
      if (dup) { duplicateSaved(dup.dataset.savedDuplicate); return; }
      var del = event.target.closest('[data-saved-delete]');
      if (del) deleteSaved(del.dataset.savedDelete);
    });
    dom.exportSaved.addEventListener('click', exportSaved);
    dom.importSaved.addEventListener('click', importSaved);
    dom.importFile.addEventListener('change', handleImportFile);

    [dom.tabHistory, dom.tabSaved].forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        var historyActive = target === 'history';
        dom.tabHistory.classList.toggle('is-active', historyActive);
        dom.tabSaved.classList.toggle('is-active', !historyActive);
        dom.tabHistory.setAttribute('aria-selected', String(historyActive));
        dom.tabSaved.setAttribute('aria-selected', String(!historyActive));
        dom.panelHistory.hidden = !historyActive;
        dom.panelSaved.hidden = historyActive;
      });
    });

    dom.settingsBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var isOpen = !dom.settingsPop.hidden;
      dom.settingsPop.hidden = isOpen;
      dom.settingsBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    bindSegment('themeSeg', 'themeSet', THEME_ORDER, function (v) { currentTheme = v; writeStore(LS.theme, currentTheme); });
    bindSegment('contrastSeg', 'contrastSet', CONTRAST_ORDER, function (v) { currentContrast = v; writeStore(LS.contrast, currentContrast); });
    bindSegment('fontSeg', 'fontSet', FONT_ORDER, function (v) { currentFont = v; writeStore(LS.fontsize, currentFont); });

    dom.menuBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var isOpen = !dom.mobileNav.hidden;
      closeMenus();
      if (!isOpen) { dom.mobileNav.hidden = false; dom.menuBtn.setAttribute('aria-expanded', 'true'); renderMobileNav(); }
    });

    dom.searchBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var isOpen = !dom.searchBar.hidden;
      dom.searchBar.hidden = isOpen;
      dom.searchBtn.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) dom.globalSearch.focus();
    });

    dom.paletteBtn.addEventListener('click', openPalette);
    dom.paletteBackdrop.addEventListener('click', function (e) { if (e.target === dom.paletteBackdrop) closePalette(); });
    dom.paletteInput.addEventListener('input', function () { state.paletteIndex = 0; renderPaletteItems(dom.paletteInput.value); });
    dom.paletteInput.addEventListener('keydown', paletteInputHandler);

    dom.fullscreenBtn.addEventListener('click', function () {
      var isFs = dom.resultPanel.dataset.fullscreen === 'true';
      dom.resultPanel.dataset.fullscreen = isFs ? 'false' : 'true';
      dom.fullscreenBtn.setAttribute('aria-pressed', String(!isFs));
    });

    bindSearch(dom.globalSearch, dom.searchResults);
    bindSearch(dom.heroSearch, dom.heroSearchResults);

    document.addEventListener('keydown', function (event) {
      var mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); return; }
      if (mod && event.key === 'Enter') { event.preventDefault(); recompute(); return; }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); saveCurrent(); return; }
      if (mod && event.key.toLowerCase() === 'p') { event.preventDefault(); window.print(); return; }
      if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !mod) { event.preventDefault(); dom.heroSearch.focus(); }
      if (event.key === 'Escape') { closeMenus(); closePalette(); closeEmbedModal(); closeDonate(); }
    });

    dom.mobileCalcBtn.addEventListener('click', function () {
      recompute();
      dom.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    bindDonateEvents();
    window.addEventListener('hashchange', readShareHash);
  }

  function init() {
    var params = new URLSearchParams(location.search);
    if (params.get('embed') === '1') {
      document.body.classList.add('embed-mode');
      var embedCalc = params.get('calc');
      if (embedCalc && CALCS.some(function (c) { return c.id === embedCalc; })) state.calcId = embedCalc;
    }
    applyAppearance();
    renderToolGrid();
    renderNav();
    renderMobileNav();

    var storedLocale = readStore('timecalc.locale', null);
    var urlLocale = params.get('locale');
    if (urlLocale && LOCALES[urlLocale]) storedLocale = urlLocale;
    if (storedLocale && LOCALES[storedLocale]) { currentLocale = storedLocale; locale = storedLocale; }

    state.history = readStore(LS.history, []); if (!Array.isArray(state.history)) state.history = [];
    state.saved = readStore(LS.saved, []); if (!Array.isArray(state.saved)) state.saved = [];
    state.favorites = readStore(LS.favorites, []); if (!Array.isArray(state.favorites)) state.favorites = [];
    state.recents = readStore(LS.recents, []); if (!Array.isArray(state.recents)) state.recents = [];
    state.drafts = readStore(LS.drafts, {}); if (typeof state.drafts !== 'object' || state.drafts === null) state.drafts = {};

    populateHistoryFilter();
    renderHistory();
    renderSaved();
    renderFavoritesStrip();
    renderRecentsStrip();

    var localeSelect = document.getElementById('localeSelect');
    if (localeSelect) {
      localeSelect.value = currentLocale;
      localeSelect.addEventListener('change', function () {
        applyLocale(localeSelect.value);
        toast('Locale set to ' + LOCALES[localeSelect.value].label);
      });
    }

    bindEvents();

    var loaded = readShareHash();
    if (!loaded) switchCalc(state.calcId || 'duration', { scroll: false });
    else { updateActiveStates(); syncTicker(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
