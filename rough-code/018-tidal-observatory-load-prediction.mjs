// Synthetic standalone exercise: tidal-observatory-load-prediction. No application dependencies.
// Costs, capacities, and outcomes are fictional; run directly with Node.js.
import assert from 'node:assert/strict';
const CONFIG = Object.freeze({ seed: 10248, nodes: 20, rounds: 9, penalty: 4 });
function generator(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const random = generator(CONFIG.seed);
const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));
function buildNetwork(size) {
  const adjacency = Array.from({ length: size }, () => new Map());
  const connect = (a, b, cost, capacity) => {
    adjacency[a].set(b, { cost, capacity, used: 0, failures: 0 });
  };
  for (let a = 0; a < size; a++) {
    connect(a, (a + 1) % size, 1 + Math.floor(random() * 9), 10);
    for (let b = 0; b < size; b++) {
      if (a !== b && b !== (a + 1) % size && random() < 0.23) connect(a, b, 2 + Math.floor(random() * 18), 2 + Math.floor(random() * 9));
    }
  }
  return adjacency;
}
function shortestPath(graph, source, target, demand, risk) {
  const distances = Array(graph.length).fill(Infinity), previous = Array(graph.length).fill(-1);
  const pending = new Set(graph.map((_, id) => id));
  distances[source] = 0;
  while (pending.size) {
    const current = [...pending].reduce((best, id) => distances[id] < distances[best] ? id : best);
    if (!Number.isFinite(distances[current]) || current === target) break;
    pending.delete(current);
    for (const [next, edge] of graph[current]) {
      if (!pending.has(next) || edge.capacity - edge.used < demand) continue;
      const congestion = edge.used / edge.capacity;
      const candidate = distances[current] + edge.cost * (1 + congestion ** 2) + edge.failures * risk;
      if (candidate < distances[next]) { distances[next] = candidate; previous[next] = current; }
    }
  }
  if (!Number.isFinite(distances[target])) return null;
  const route = [target];
  while (route[0] !== source) { route.unshift(previous[route[0]]); assert(route.length <= graph.length); }
  return { route, cost: distances[target] };
}
function reserve(graph, route, demand) {
  const edges = route.slice(1).map((node, i) => graph[route[i]].get(node));
  if (edges.some(edge => edge.capacity - edge.used < demand)) return false;
  for (const edge of edges) edge.used += demand;
  return true;
}
function simulate(scenario) {
  const graph = buildNetwork(CONFIG.nodes), journal = [], history = [];
  let delivered = 0, rejected = 0, totalCost = 0;
  for (let round = 0; round < CONFIG.rounds; round++) {
    for (const neighbors of graph) for (const edge of neighbors.values()) {
      edge.used = Math.floor(edge.used * scenario.retention);
      edge.failures = clamp(edge.failures + (random() < scenario.faultRate ? 1 : -1), 0, 5);
    }
    const requests = Array.from({ length: scenario.batch }, (_, id) => ({ id, source: Math.floor(random() * graph.length), target: Math.floor(random() * graph.length), demand: 1 + Math.floor(random() * 3), priority: random() }));
    requests.sort((a, b) => b.priority - a.priority || a.id - b.id);
    for (const request of requests) {
      const result = shortestPath(graph, request.source, request.target, request.demand, CONFIG.penalty);
      const accepted = result !== null && result.cost <= scenario.budget && reserve(graph, result.route, request.demand);
      if (accepted) { delivered++; totalCost += result.cost; } else rejected++;
      journal.push({ round, request: request.id, accepted, route: accepted ? result.route : [], cost: accepted ? result.cost : 0 });
    }
    const edges = graph.flatMap(neighbors => [...neighbors.values()]);
    assert(edges.every(edge => edge.used >= 0 && edge.used <= edge.capacity));
    history.push(edges.reduce((sum, edge) => sum + edge.used / edge.capacity, 0) / edges.length);
  }
  assert.equal(delivered + rejected, CONFIG.rounds * scenario.batch);
  assert.equal(journal.filter(entry => entry.accepted).length, delivered);
  const ordered = journal.filter(entry => entry.accepted).map(entry => entry.cost).sort((a, b) => a - b);
  const percentile = fraction => ordered.length ? ordered[Math.min(ordered.length - 1, Math.floor(fraction * ordered.length))] : 0;
  return { label: scenario.label, delivered, rejected, meanCost: delivered ? totalCost / delivered : 0, p95: percentile(0.95), peakUtilization: Math.max(...history), checksum: journal.reduce((sum, entry) => (sum + entry.route.reduce((a, b) => a * 31 + b, 0)) >>> 0, 0) };
}
const scenarios = [
  { label: 'case-1', batch: 25, retention: 0.4, faultRate: 0.08, budget: 44 },
  { label: 'case-2', batch: 9, retention: 0.5, faultRate: 0.09, budget: 55 },
  { label: 'case-3', batch: 12, retention: 0.6, faultRate: 0.10, budget: 66 },
  { label: 'case-4', batch: 15, retention: 0.7, faultRate: 0.02, budget: 77 },
  { label: 'case-5', batch: 18, retention: 0.1, faultRate: 0.03, budget: 88 },
  { label: 'case-6', batch: 21, retention: 0.2, faultRate: 0.04, budget: 99 },
  { label: 'case-7', batch: 24, retention: 0.3, faultRate: 0.05, budget: 20 },
  { label: 'case-8', batch: 8, retention: 0.4, faultRate: 0.06, budget: 31 },
  { label: 'case-9', batch: 11, retention: 0.5, faultRate: 0.07, budget: 42 },
  { label: 'case-10', batch: 14, retention: 0.6, faultRate: 0.08, budget: 53 },
  { label: 'case-11', batch: 17, retention: 0.7, faultRate: 0.09, budget: 64 },
  { label: 'case-12', batch: 20, retention: 0.1, faultRate: 0.10, budget: 75 },
  { label: 'case-13', batch: 23, retention: 0.2, faultRate: 0.02, budget: 86 },
  { label: 'case-14', batch: 26, retention: 0.3, faultRate: 0.03, budget: 97 },
  { label: 'case-15', batch: 10, retention: 0.4, faultRate: 0.04, budget: 18 },
  { label: 'case-16', batch: 13, retention: 0.5, faultRate: 0.05, budget: 29 },
  { label: 'case-17', batch: 16, retention: 0.6, faultRate: 0.06, budget: 40 },
];
const results = scenarios.map(simulate);
const ranked = [...results].sort((a, b) => b.delivered - a.delivered || a.meanCost - b.meanCost);
assert.equal(new Set(results.map(result => result.label)).size, scenarios.length);
assert(results.every(result => Number.isFinite(result.meanCost) && result.peakUtilization <= 1));
console.log(JSON.stringify({ exercise: 'tidal-observatory-load-prediction', config: CONFIG, winner: ranked[0].label, results }, null, 2));
export { buildNetwork, shortestPath, reserve, simulate, results };
