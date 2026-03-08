/**
 * Shared wire rendering logic: crossover arcs, junction detection, priority.
 * Single source of truth consumed by both editor.js and export.js.
 */
(function initWireRender() {
  const pointKey = (point) => `${point.x},${point.y}`;

  const getWirePriority = (wire) => {
    const id = String(wire?.id ?? "");
    if (id.startsWith("__")) {
      return { order: Number.MAX_SAFE_INTEGER, id };
    }
    const match = /^W(\d+)$/i.exec(id);
    const parsed = match ? Number(match[1]) : 0;
    const order = Number.isFinite(parsed) ? parsed : 0;
    return { order, id };
  };

  const isHigherPriority = (current, other) => {
    if (!other) {
      return true;
    }
    if (current.order !== other.order) {
      return current.order > other.order;
    }
    return current.id > other.id;
  };

  const collectWireSegments = (wires) => {
    const segments = [];
    wires.forEach((wire) => {
      const points = Array.isArray(wire.points) ? wire.points : [];
      const priority = getWirePriority(wire);
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        if (!start || !end) {
          continue;
        }
        if (start.x === end.x && start.y === end.y) {
          continue;
        }
        if (start.x === end.x) {
          segments.push({
            wireId: String(wire.id ?? ""),
            priority,
            orientation: "v",
            start,
            end,
            coord: start.x,
            min: Math.min(start.y, end.y),
            max: Math.max(start.y, end.y)
          });
        } else if (start.y === end.y) {
          segments.push({
            wireId: String(wire.id ?? ""),
            priority,
            orientation: "h",
            start,
            end,
            coord: start.y,
            min: Math.min(start.x, end.x),
            max: Math.max(start.x, end.x)
          });
        }
      }
    });
    return segments;
  };

  const getWireCrossings = (segment, verticalSegments, pointKeys, currentPriority) => {
    const crossings = [];
    const y = segment.coord;
    verticalSegments.forEach((vert) => {
      if (vert.wireId === segment.wireId) {
        return;
      }
      if (!isHigherPriority(currentPriority, vert.priority)) {
        return;
      }
      const x = vert.coord;
      if (x <= segment.min || x >= segment.max) {
        return;
      }
      if (y <= vert.min || y >= vert.max) {
        return;
      }
      const key = `${x},${y}`;
      if (pointKeys.has(key)) {
        return;
      }
      crossings.push(x);
    });
    return crossings;
  };

  const getWireCrossingsForVertical = (segment, horizontalSegments, pointKeys, currentPriority) => {
    const crossings = [];
    const x = segment.coord;
    horizontalSegments.forEach((horiz) => {
      if (horiz.wireId === segment.wireId) {
        return;
      }
      if (!isHigherPriority(currentPriority, horiz.priority)) {
        return;
      }
      const y = horiz.coord;
      if (y <= segment.min || y >= segment.max) {
        return;
      }
      if (x <= horiz.min || x >= horiz.max) {
        return;
      }
      const key = `${x},${y}`;
      if (pointKeys.has(key)) {
        return;
      }
      crossings.push(y);
    });
    return crossings;
  };

  const buildWirePath = (points, wireId, segments, pointKeys, options) => {
    if (!Array.isArray(points) || points.length < 2) {
      return { d: "", hasJump: false };
    }
    const verticalSegments = segments.filter((segment) => segment.orientation === "v");
    const horizontalSegments = segments.filter((segment) => segment.orientation === "h");
    const allowHorizontalJumps = options?.allowHorizontalJumps !== false;
    const allowVerticalJumps = options?.allowVerticalJumps === true;
    const currentPriority = options?.priority ?? getWirePriority({ id: wireId });
    const radius = options?.jumpRadius ?? 6;
    const minSpacing = radius * 2 + 2;
    let hasJump = false;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      if (!start || !end) {
        continue;
      }
      if (start.y === end.y) {
        if (allowHorizontalJumps) {
          const segment = {
            wireId,
            coord: start.y,
            min: Math.min(start.x, end.x),
            max: Math.max(start.x, end.x)
          };
          const rawCrossings = getWireCrossings(segment, verticalSegments, pointKeys, currentPriority);
          const dir = end.x >= start.x ? 1 : -1;
          const ordered = rawCrossings.sort((a, b) => (dir > 0 ? a - b : b - a));
          const filtered = [];
          ordered.forEach((x) => {
            if (Math.abs(x - start.x) <= radius || Math.abs(x - end.x) <= radius) {
              return;
            }
            if (filtered.length && Math.abs(x - filtered[filtered.length - 1]) < minSpacing) {
              return;
            }
            filtered.push(x);
          });
          if (filtered.length) {
            hasJump = true;
            let cursorX = start.x;
            filtered.forEach((x) => {
              const beforeX = x - dir * radius;
              const afterX = x + dir * radius;
              if (dir > 0 && beforeX <= cursorX) {
                return;
              }
              if (dir < 0 && beforeX >= cursorX) {
                return;
              }
              if (dir > 0 && afterX >= end.x) {
                return;
              }
              if (dir < 0 && afterX <= end.x) {
                return;
              }
              d += ` L ${beforeX} ${start.y}`;
              const sweep = dir > 0 ? 1 : 0;
              d += ` A ${radius} ${radius} 0 0 ${sweep} ${afterX} ${start.y}`;
              cursorX = afterX;
            });
          }
        }
        d += ` L ${end.x} ${end.y}`;
        continue;
      }
      if (start.x === end.x) {
        if (allowVerticalJumps) {
          const segment = {
            wireId,
            coord: start.x,
            min: Math.min(start.y, end.y),
            max: Math.max(start.y, end.y)
          };
          const rawCrossings = getWireCrossingsForVertical(segment, horizontalSegments, pointKeys, currentPriority);
          const dir = end.y >= start.y ? 1 : -1;
          const ordered = rawCrossings.sort((a, b) => (dir > 0 ? a - b : b - a));
          const filtered = [];
          ordered.forEach((y) => {
            if (Math.abs(y - start.y) <= radius || Math.abs(y - end.y) <= radius) {
              return;
            }
            if (filtered.length && Math.abs(y - filtered[filtered.length - 1]) < minSpacing) {
              return;
            }
            filtered.push(y);
          });
          if (filtered.length) {
            hasJump = true;
            let cursorY = start.y;
            filtered.forEach((y) => {
              const beforeY = y - dir * radius;
              const afterY = y + dir * radius;
              if (dir > 0 && beforeY <= cursorY) {
                return;
              }
              if (dir < 0 && beforeY >= cursorY) {
                return;
              }
              if (dir > 0 && afterY >= end.y) {
                return;
              }
              if (dir < 0 && afterY <= end.y) {
                return;
              }
              d += ` L ${start.x} ${beforeY}`;
              const sweep = dir > 0 ? 1 : 0;
              d += ` A ${radius} ${radius} 0 0 ${sweep} ${start.x} ${afterY}`;
              cursorY = afterY;
            });
          }
        }
        d += ` L ${end.x} ${end.y}`;
      }
    }
    return { d, hasJump };
  };

  const buildNodeAxisIndex = (nodes) => {
    const rows = new Map();
    const cols = new Map();
    nodes.forEach((node) => {
      let row = rows.get(node.y);
      if (!row) {
        row = [];
        rows.set(node.y, row);
      }
      row.push(node);
      let col = cols.get(node.x);
      if (!col) {
        col = [];
        cols.set(node.x, col);
      }
      col.push(node);
    });
    rows.forEach((row) => {
      row.sort((a, b) => a.x - b.x);
    });
    cols.forEach((col) => {
      col.sort((a, b) => a.y - b.y);
    });
    return { rows, cols };
  };

  const collectJunctionInfo = (wires, components, isElectricalFn) => {
    const pinCounts = new Map();
    const nodeByKey = new Map();
    const safeWires = Array.isArray(wires) ? wires : [];
    const safeComponents = Array.isArray(components) ? components : [];

    safeWires.forEach((wire) => {
      const points = Array.isArray(wire?.points) ? wire.points : [];
      points.forEach((point) => {
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          return;
        }
        const key = pointKey(point);
        if (!nodeByKey.has(key)) {
          nodeByKey.set(key, { key, x: point.x, y: point.y });
        }
      });
    });

    safeComponents.forEach((component) => {
      if (!isElectricalFn(component?.type)) {
        return;
      }
      const pins = Array.isArray(component?.pins) ? component.pins : [];
      pins.forEach((pin) => {
        if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
          return;
        }
        const key = pointKey(pin);
        pinCounts.set(key, (pinCounts.get(key) ?? 0) + 1);
        if (!nodeByKey.has(key)) {
          nodeByKey.set(key, { key, x: pin.x, y: pin.y });
        }
      });
    });

    const { rows, cols } = buildNodeAxisIndex(Array.from(nodeByKey.values()));
    const degrees = new Map();
    const addDegree = (key) => {
      degrees.set(key, (degrees.get(key) ?? 0) + 1);
    };
    const addSegmentDegrees = (candidates) => {
      if (!Array.isArray(candidates) || candidates.length < 2) {
        return;
      }
      for (let index = 0; index < candidates.length - 1; index += 1) {
        const start = candidates[index];
        const end = candidates[index + 1];
        if (!start || !end) {
          continue;
        }
        if (start.x === end.x && start.y === end.y) {
          continue;
        }
        addDegree(start.key);
        addDegree(end.key);
      }
    };
    const collectHorizontalCandidates = (y, minX, maxX) => {
      const row = rows.get(y);
      if (!row?.length) {
        return [];
      }
      const candidates = [];
      row.forEach((node) => {
        if (node.x < minX) {
          return;
        }
        if (node.x > maxX) {
          return;
        }
        candidates.push(node);
      });
      return candidates;
    };
    const collectVerticalCandidates = (x, minY, maxY) => {
      const col = cols.get(x);
      if (!col?.length) {
        return [];
      }
      const candidates = [];
      col.forEach((node) => {
        if (node.y < minY) {
          return;
        }
        if (node.y > maxY) {
          return;
        }
        candidates.push(node);
      });
      return candidates;
    };

    safeWires.forEach((wire) => {
      const points = Array.isArray(wire?.points) ? wire.points : [];
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        if (!start || !end) {
          continue;
        }
        if (start.x === end.x && start.y === end.y) {
          continue;
        }
        if (start.y === end.y) {
          const minX = Math.min(start.x, end.x);
          const maxX = Math.max(start.x, end.x);
          const candidates = collectHorizontalCandidates(start.y, minX, maxX);
          if (candidates.length >= 2) {
            addSegmentDegrees(candidates);
          } else {
            addDegree(pointKey(start));
            addDegree(pointKey(end));
          }
          continue;
        }
        if (start.x === end.x) {
          const minY = Math.min(start.y, end.y);
          const maxY = Math.max(start.y, end.y);
          const candidates = collectVerticalCandidates(start.x, minY, maxY);
          if (candidates.length >= 2) {
            addSegmentDegrees(candidates);
          } else {
            addDegree(pointKey(start));
            addDegree(pointKey(end));
          }
          continue;
        }
        addDegree(pointKey(start));
        addDegree(pointKey(end));
      }
    });

    const combinedDegrees = new Map(degrees);
    pinCounts.forEach((count, key) => {
      combinedDegrees.set(key, (combinedDegrees.get(key) ?? 0) + count);
    });
    return { pinCounts, combinedDegrees };
  };

  const wireRenderApi = {
    pointKey,
    getWirePriority,
    isHigherPriority,
    collectWireSegments,
    buildWirePath,
    collectJunctionInfo
  };

  if (typeof self !== "undefined") {
    self.SpjutSimWireRender = wireRenderApi;
  }
})();
