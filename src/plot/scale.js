/** @typedef {{ min: number, max: number }} Scale */

(function initScale() {
  const EPSILON = 1e-12;

  /**
   * @param {number} range
   * @param {boolean} round
   * @returns {number}
   */
  const niceNumber = (range, round) => {
    if (!Number.isFinite(range) || range <= 0) {
      return 1;
    }
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
      if (fraction < 1.5) {
        niceFraction = 1;
      } else if (fraction < 3) {
        niceFraction = 2;
      } else if (fraction < 7) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    } else {
      if (fraction <= 1) {
        niceFraction = 1;
      } else if (fraction <= 2) {
        niceFraction = 2;
      } else if (fraction <= 5) {
        niceFraction = 5;
      } else {
        niceFraction = 10;
      }
    }
    return niceFraction * Math.pow(10, exponent);
  };

  /**
   * @param {number[]} values
   * @returns {Scale}
   */
  const getExtent = (values) => {
    if (!values.length) {
      return { min: 0, max: 1 };
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  /**
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  const normalize = (value, min, max) => {
    if (max === min) {
      return 0;
    }
    return (value - min) / (max - min);
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return "0";
    }
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
      return value.toExponential(2);
    }
    return value.toPrecision(4);
  };

  const buildTimeFormatter = (min, max) => {
    const span = Math.max(Math.abs(min || 0), Math.abs(max || 0));
    let unit = "s";
    let scale = 1;
    if (span < 1e-9) {
      unit = "ps";
      scale = 1e-12;
    } else if (span < 1e-6) {
      unit = "ns";
      scale = 1e-9;
    } else if (span < 1e-3) {
      unit = "us";
      scale = 1e-6;
    } else if (span < 1) {
      unit = "ms";
      scale = 1e-3;
    }
    return {
      unit,
      scale,
      format: (value) => formatNumber(value / scale)
    };
  };

  /**
   * @param {number} min
   * @param {number} max
   * @param {number} maxTicks
   */
  const buildLinearScale = (min, max, maxTicks) => {
    let lo = Number.isFinite(min) ? min : 0;
    let hi = Number.isFinite(max) ? max : 1;
    if (hi === lo) {
      const pad = Math.abs(hi) > EPSILON ? Math.abs(hi) * 0.1 : 1;
      lo -= pad;
      hi += pad;
    }
    if (hi < lo) {
      const tmp = lo;
      lo = hi;
      hi = tmp;
    }
    const ticksTarget = Number.isFinite(maxTicks) && maxTicks > 1 ? maxTicks : 5;
    const range = niceNumber(hi - lo, false);
    const step = niceNumber(range / (ticksTarget - 1), true);
    const tickMin = Math.floor(lo / step) * step;
    const tickMax = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let value = tickMin; value <= tickMax + step * 0.5; value += step) {
      ticks.push(Number(value.toPrecision(12)));
    }
    return {
      type: "linear",
      min: tickMin,
      max: tickMax,
      step,
      ticks
    };
  };

  /**
   * @param {number} min
   * @param {number} max
   */
  const buildLogScale = (min, max) => {
    const lo = Number.isFinite(min) ? min : 1;
    const hi = Number.isFinite(max) ? max : 10;
    if (lo <= 0 || hi <= 0) {
      return buildLinearScale(min, max, 5);
    }
    const logMin = Math.log10(lo);
    const logMax = Math.log10(hi);
    const tickStart = Math.floor(logMin);
    const tickEnd = Math.ceil(logMax);
    const ticks = [];
    for (let exp = tickStart; exp <= tickEnd; exp += 1) {
      const base = Math.pow(10, exp);
      ticks.push(base);
      if (tickEnd - tickStart <= 2) {
        ticks.push(base * 2);
        ticks.push(base * 5);
      }
    }
    const filtered = ticks.filter((value) => value >= lo && value <= hi);
    return {
      type: "log",
      min: lo,
      max: hi,
      logMin,
      logMax,
      ticks: filtered.length ? filtered : ticks
    };
  };

  self.SpjutSimScale = {
    getExtent,
    normalize,
    buildLinearScale,
    buildLogScale,
    buildTimeFormatter
  };
})();
