// Utilities to parse and compare roll numbers like 23ITR030

function parseRoll(roll) {
  if (!roll || typeof roll !== 'string') return null;
  const r = roll.trim().toUpperCase();
  const m = r.match(/^(\d{2})([A-Z]+)(\d{3})$/);
  if (!m) return null;
  return {
    year: parseInt(m[1], 10),
    code: m[2],
    seq: parseInt(m[3], 10),
    raw: r
  };
}

// returns -1 if a < b, 0 if equal, 1 if a > b
function compareRoll(a, b) {
  const pa = parseRoll(a);
  const pb = parseRoll(b);
  if (!pa || !pb) {
    // Fallback to string compare if format unknown
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return a.localeCompare(b);
  }
  if (pa.year !== pb.year) return pa.year < pb.year ? -1 : 1;
  if (pa.code !== pb.code) return pa.code < pb.code ? -1 : 1;
  if (pa.seq !== pb.seq) return pa.seq < pb.seq ? -1 : (pa.seq === pb.seq ? 0 : 1);
  return 0;
}

function inRange(roll, start, end) {
  if (!roll) return false;
  try {
    const c1 = compareRoll(roll, start);
    const c2 = compareRoll(roll, end);
    return c1 >= 0 && c2 <= 0;
  } catch (e) {
    return false;
  }
}

module.exports = { parseRoll, compareRoll, inRange };
