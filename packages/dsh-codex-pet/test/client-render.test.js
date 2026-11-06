import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');
const source = fs.readFileSync(path.join(pkgRoot, 'src', 'client.js'), 'utf8');

// Resolve the paired development dependencies from this package so the test
// behaves the same on every checkout and in CI.
const req = createRequire(import.meta.url);
const react = req('react');
const renderToString = req('react-dom/server').renderToString;

let factory = null;
const fakeWindow = { __ModuleLoader__: { load: (def) => { factory = def.factory; } } };
const requireReactOnly = (name) => {
  if (name === 'react') return react;
  throw new Error('client.js required unexpected module: ' + name);
};
new Function('window', 'require', source)(fakeWindow, requireReactOnly);
assert.ok(factory, 'module loader captured the factory');

const mod = factory(requireReactOnly);
assert.ok(mod.__internals, 'internals hook exposed');

test('SoundControls renders the unified scenario panel', () => {
  const html = renderToString(react.createElement(mod.__internals.SoundControls, {
    sound: {
      enabled: true,
      volume: 60,
      tracks: {
        done: { enabled: true, volume: 100 },
        error: { enabled: false, volume: 70 },
        interrupt: { enabled: true, volume: 100 },
      },
    },
    hasCustomSounds: { done: false, error: true, interrupt: false },
    reload: () => {},
  }));
  for (const needle of ['任务完成时', '遇到错误时', '被中断时', '启用场景语音', '内置', '试听']) {
    assert.ok(html.includes(needle), 'rendered html should contain ' + needle);
  }
  assert.ok(!html.includes('音色风格'), 'the persona picker is gone - takes rotate instead');
  const afterErrorRow = html.split('遇到错误时')[1] || '';
  assert.ok(afterErrorRow.includes('内置'), 'error row with an override should offer the built-in revert');
});

test('latestTurnInterrupted flags the newest aborted turn only', () => {
  const { latestTurnInterrupted, completedTurnsOf } = mod.__internals;
  const snap = {
    turnEnds: new Map([[1, 12], [2, 30]]),
    nodes: [
      { kind: 'assistant', turn: 1, blocks: [] },
      { kind: 'assistant', turn: 2, interrupted: true, blocks: [] },
    ],
  };
  assert.deepEqual(completedTurnsOf(snap), [1, 2]);
  assert.equal(latestTurnInterrupted(snap), true, 'turn 2 is interrupted');
  assert.equal(latestTurnInterrupted({ turnEnds: snap.turnEnds, nodes: [{ kind: 'assistant', turn: 2, blocks: [] }] }), false, 'clean turn is not interrupted');
  assert.equal(latestTurnInterrupted(null), false);
  assert.equal(latestTurnInterrupted({ turnEnds: new Map(), nodes: [] }), false);
});

test('latestTurnErrored flags the newest failed turn only', () => {
  const { latestTurnErrored } = mod.__internals;
  const snap = {
    turnEnds: new Map([[1, 12], [2, 30]]),
    nodes: [
      { kind: 'turn-error', turn: 1, message: 'old failure' },
      { kind: 'assistant', turn: 2, blocks: [] },
    ],
  };
  assert.equal(latestTurnErrored(snap), false, 'turn 2 finished cleanly');
  const errored = {
    turnEnds: new Map([[1, 12], [2, 30]]),
    nodes: [{ kind: 'turn-error', turn: 2, message: 'boom' }],
  };
  assert.equal(latestTurnErrored(errored), true, 'turn 2 died on an error');
});

test('deferred done check uses the latest failure state', () => {
  const { shouldPlayDone } = mod.__internals;
  const state = {
    activeSessionId: 'session-a',
    expectedSessionId: 'session-a',
    activity: 'idle',
    muteUntil: 0,
    now: 100,
  };
  const clean = {
    turnEnds: new Map([[1, 12]]),
    nodes: [{ kind: 'assistant', turn: 1, blocks: [] }],
  };
  const failed = {
    turnEnds: new Map([[1, 12]]),
    nodes: [{ kind: 'turn-error', turn: 1, message: 'boom' }],
  };

  assert.equal(shouldPlayDone(clean, state), true);
  assert.equal(shouldPlayDone(failed, state), false, 'a failure arriving during the delay suppresses done');
  assert.equal(shouldPlayDone(clean, { ...state, activeSessionId: 'session-b' }), false, 'a session switch cancels done');
  assert.equal(shouldPlayDone(clean, { ...state, muteUntil: 101 }), false, 'an error/interrupt mute cancels done');
});

test('summary cadence counts completed model requests within one turn', () => {
  const { completedModelRequestsOf, buildSummaryPayload } = mod.__internals;
  const requests = [
    { purpose: 'assistant', startSeq: 10, resultSeq: 20, turn: 1, step: 1, status: 'complete' },
    { purpose: 'assistant', startSeq: 30, resultSeq: 40, turn: 1, step: 2, status: 'complete' },
    { purpose: 'assistant', startSeq: 50, turn: 1, step: 3, status: 'error', error: 'provider failed' },
    { purpose: 'assistant', startSeq: 60, turn: 1, step: 4, status: 'running' },
    { purpose: 'compaction', startSeq: 70, turn: 1, step: 0, status: 'complete' },
  ];
  const nodes = [
    { kind: 'user', seq: 1, content: [{ type: 'text', text: 'fix login' }] },
    { kind: 'assistant', seq: 20, turn: 1, step: 1, blocks: [{ kind: 'tool-call', callId: 'call-1', name: 'read', argsRaw: 'auth.js' }] },
    { kind: 'tool-result', seq: 25, callId: 'call-1', isError: true },
    { kind: 'assistant', seq: 40, turn: 1, step: 2, blocks: [{ kind: 'text', text: 'fixed it' }] },
  ];
  const snap = { views: { get: (name) => name === 'trajectory' ? { requests } : undefined }, nodes };

  const completed = completedModelRequestsOf(snap);
  assert.deepEqual(completed.map((request) => request.startSeq), [10, 30, 50]);
  const payload = buildSummaryPayload(nodes, completed.slice(0, 2), 'session-a');
  assert.equal(payload.fromRequestSeq, 10);
  assert.equal(payload.toRequestSeq, 30);
  assert.deepEqual(payload.requests.map((request) => [request.turn, request.step]), [[1, 1], [1, 2]]);
  assert.equal(payload.requests[0].user, 'fix login');
  assert.equal(payload.requests[0].actions[0].failed, true);
  assert.equal(payload.requests[1].assistant, 'fixed it');
  assert.equal(payload.requests[1].user, '', 'the same turn instruction is not repeated for later requests');
});

test('automatic summary baseline excludes requests that existed before session selection', () => {
  const { baselineAutoTracker } = mod.__internals;
  assert.deepEqual(baselineAutoTracker('historical', [{ startSeq: 10 }, { startSeq: 30 }]), {
    sessionId: 'historical', ready: true, lastSeenRequestSeq: 30, windowStartRequestSeq: 31, retryCount: 0,
  });
  assert.deepEqual(baselineAutoTracker('empty', []), {
    sessionId: 'empty', ready: true, lastSeenRequestSeq: -1, windowStartRequestSeq: null, retryCount: 0,
  });
});

test('automatic summaries ignore historical requests hydrated after an empty selected snapshot', () => {
  const { baselineAutoTracker, selectAutoSummaryBatch } = mod.__internals;
  const historicalRequests = [{ startSeq: 10 }, { startSeq: 20 }, { startSeq: 30 }];
  let tracker = baselineAutoTracker(null, []);

  let selection = selectAutoSummaryBatch(tracker, 'historical', 'loading', [], 3, false);
  assert.equal(selection.batch, null, 'loading empty snapshot only waits for open');
  tracker = selection.tracker;

  selection = selectAutoSummaryBatch(tracker, 'historical', 'loading', historicalRequests, 3, false);
  assert.equal(selection.batch, null, 'loading hydration does not advance the window');
  tracker = selection.tracker;

  selection = selectAutoSummaryBatch(tracker, 'historical', 'open', historicalRequests, 3, false);
  assert.equal(selection.batch, null, 'the first open snapshot baselines hydrated history');
});

test('direct-open session selection baselines old history without missing new requests', () => {
  const { baselineAutoTracker, selectAutoSummaryBatch } = mod.__internals;
  const historicalRequests = [{ startSeq: 10 }, { startSeq: 20 }, { startSeq: 30 }];
  let tracker = baselineAutoTracker('previous-session', [{ startSeq: 1 }]);

  let selection = selectAutoSummaryBatch(tracker, 'direct-open', 'open', historicalRequests, 3, false);
  assert.equal(selection.batch, null, 'the first open snapshot does not summarize old history');
  tracker = selection.tracker;

  selection = selectAutoSummaryBatch(tracker, 'direct-open', 'open', [...historicalRequests, { startSeq: 40 }, { startSeq: 50 }, { startSeq: 60 }], 3, false);
  assert.deepEqual(selection.batch, [{ startSeq: 40 }, { startSeq: 50 }, { startSeq: 60 }], 'the first request after selection starts the next interval');
});

test('automatic summaries batch requests completed after a stable live baseline', () => {
  const { baselineAutoTracker, selectAutoSummaryBatch } = mod.__internals;
  let tracker = baselineAutoTracker(null, []);

  let selection = selectAutoSummaryBatch(tracker, 'live', 'loading', [], 3, false);
  tracker = selection.tracker;
  selection = selectAutoSummaryBatch(tracker, 'live', 'open', [{ startSeq: 10 }], 3, false);
  assert.equal(selection.batch, null, 'open establishes the live baseline');
  tracker = selection.tracker;
  selection = selectAutoSummaryBatch(tracker, 'live', 'open', [{ startSeq: 10 }, { startSeq: 20 }, { startSeq: 30 }, { startSeq: 40 }], 3, false);

  assert.deepEqual(selection.batch, [{ startSeq: 20 }, { startSeq: 30 }, { startSeq: 40 }]);
});

test('current automatic tracker ownership is session-specific', () => {
  const { isCurrentAutoTrackerSession } = mod.__internals;
  const tracker = { sessionId: 'session-a' };
  assert.equal(isCurrentAutoTrackerSession(tracker, 'session-a'), true);
  assert.equal(isCurrentAutoTrackerSession(tracker, 'session-b'), false);
  assert.equal(isCurrentAutoTrackerSession(null, 'session-a'), false);
});

test('automatic summary settlement updates the current tracker only', () => {
  const { settleAutoTrackerAfterSummary } = mod.__internals;
  const inFlight = { sessionId: 'session-a', ready: true, lastSeenRequestSeq: 30, windowStartRequestSeq: 11, retryCount: 2 };
  const current = { ...inFlight, lastSeenRequestSeq: 50 };

  const succeeded = settleAutoTrackerAfterSummary(current, 'session-a', 31, true);
  assert.deepEqual(succeeded, { sessionId: 'session-a', ready: true, lastSeenRequestSeq: 50, windowStartRequestSeq: 31, retryCount: 0 }, 'success preserves requests seen while the fetch was in flight');
  assert.deepEqual(inFlight, { sessionId: 'session-a', ready: true, lastSeenRequestSeq: 30, windowStartRequestSeq: 11, retryCount: 2 }, 'the request-time tracker is not mutated');

  const failed = settleAutoTrackerAfterSummary(succeeded, 'session-a', 31, false);
  assert.deepEqual(failed, { sessionId: 'session-a', ready: true, lastSeenRequestSeq: 50, windowStartRequestSeq: 31, retryCount: 1 });

  assert.equal(settleAutoTrackerAfterSummary(failed, 'session-b', 61, true), failed, 'a stale session cannot alter the current tracker');
});

test('automatic summary route requires enabled plus a provider and model', () => {
  const { summaryRouteEnabled } = mod.__internals;
  assert.equal(summaryRouteEnabled({ enabled: true, provider: 'p', model: 'm' }), true);
  assert.equal(summaryRouteEnabled({ enabled: false, provider: 'p', model: 'm' }), false);
  assert.equal(summaryRouteEnabled({ enabled: true, provider: 'p', model: '' }), false);
  assert.equal(summaryRouteEnabled({ enabled: true, provider: '', model: 'm' }), false);
  assert.equal(summaryRouteEnabled({ summary: { enabled: true } }), false);
});

test('SummaryControls requires a provider and model before enabling summaries', () => {
  const html = renderToString(react.createElement(mod.__internals.SummaryControls, {
    summary: { enabled: true, provider: 'p', model: '' },
    reload: () => {},
  }));
  assert.ok(html.includes('disabled'), 'incomplete routes disable the enable checkbox');
  assert.ok(html.includes('Select provider and model first'), 'the route requirement is shown bilingually');
  assert.ok(!html.includes('自动（'), 'automatic route selection is not offered');
});

test('SettingsSection renders its loading state without a host', () => {
  const html = renderToString(react.createElement(mod.__internals.SettingsSection));
  assert.ok(html.includes('加载中'), 'initial render should show the loading state');
});

test('ResetControls offers both recovery buttons in the default idle state', () => {
  const html = renderToString(react.createElement(mod.__internals.ResetControls, { reload: () => {} }));
  assert.ok(html.includes('还原位置'), 'the position button is always reachable');
  assert.ok(html.includes('还原全部设定'), 'the full restore button is always reachable');
  assert.ok(!html.includes('disabled'), 'both buttons start enabled');
});

test('legacyProjectionOf rebuilds nodes and turn ends from trajectory events', () => {
  const { legacyProjectionOf } = mod.__internals;
  const projection = legacyProjectionOf({
    eventNodes: [
      { data: { kind: 'node', node: { kind: 'user', turn: 1, content: 'hi' } } },
      { data: { kind: 'assistant', node: { kind: 'assistant', turn: 1, blocks: [{ kind: 'text', text: 'hello' }] } } },
      { data: { kind: 'assistant', partial: { turn: 2, step: 0, blocks: [] } } },
      { data: { kind: 'turn-end', turn: 1, time: 12 } },
      { data: { kind: 'turn-end', turn: 2, time: 30, error: 'boom' } },
    ],
  });
  assert.deepEqual(projection.nodes.map((node) => node.kind), ['user', 'assistant', 'turn-error']);
  assert.equal(projection.nodes[2].message, 'boom');
  assert.equal(projection.turnEnds.get(1).time, 12);
  assert.equal(projection.turnEnds.get(1).error, undefined);
  assert.equal(projection.turnEnds.get(2).error, 'boom');

  assert.deepEqual(legacyProjectionOf(null), { nodes: null, turnEnds: null });
  assert.deepEqual(legacyProjectionOf({}), { nodes: null, turnEnds: null });
  assert.deepEqual(legacyProjectionOf({ eventNodes: [null, {}] }), { nodes: [], turnEnds: new Map() });
});

test('legacyProjectionOf reads the finalized nodes the current host emits', () => {
  const { legacyProjectionOf } = mod.__internals;
  const user = { kind: 'user', seq: 1, turn: 1, content: [{ type: 'text', text: '读一下日志' }] };
  const assistant = {
    kind: 'assistant', seq: 20, turn: 1, step: 1,
    blocks: [{ kind: 'tool-call', callId: 'call-9', name: 'read_file', argsRaw: '{"path":"app.log"}' }],
  };
  const result = { kind: 'tool-result', seq: 24, callId: 'call-9', isError: false };

  // ui-trajectory pushes the produced node itself, not a { data } contribution.
  const projection = legacyProjectionOf({ eventNodes: [user, assistant, result] });
  assert.equal(projection.nodes.length, 3, 'every finalized node survives the projection');
  assert.equal(projection.nodes[0], user);
  assert.equal(projection.nodes[1], assistant);
  assert.equal(projection.nodes[2], result);

  // A host that still wraps something keeps working through the same fold.
  const mixed = legacyProjectionOf({
    eventNodes: [user, { data: { kind: 'node', node: { kind: 'user', seq: 5, content: [] } } }],
  });
  assert.deepEqual(mixed.nodes.map((node) => node.seq), [1, 5]);
});

test('the automatic summary receives the real actions from a current-host trajectory', () => {
  const { mergeConversationSnapshot, completedModelRequestsOf, buildSummaryPayload } = mod.__internals;
  const trajectory = {
    partial: null,
    runningCalls: [],
    requests: [
      { purpose: 'assistant', startSeq: 10, resultSeq: 20, turn: 1, step: 1, status: 'complete' },
      { purpose: 'assistant', startSeq: 30, resultSeq: 40, turn: 1, step: 2, status: 'complete' },
    ],
    eventNodes: [
      { kind: 'user', seq: 1, turn: 1, content: [{ type: 'text', text: '把日志里的报错找出来' }] },
      { kind: 'assistant', seq: 20, turn: 1, step: 1, blocks: [{ kind: 'tool-call', callId: 'call-1', name: 'read_file', argsRaw: '{"path":"app.log"}' }] },
      { kind: 'tool-result', seq: 24, callId: 'call-1', isError: true },
      { kind: 'assistant', seq: 40, turn: 1, step: 2, blocks: [{ kind: 'text', text: '找到了三处报错' }] },
    ],
  };

  const snap = mergeConversationSnapshot({ key: 'session-live', hooks: {} }, trajectory, null, null);
  assert.equal(snap.nodes.length, 4, 'the merged snapshot carries the nodes');

  const completed = completedModelRequestsOf(snap);
  const payload = buildSummaryPayload(snap.nodes, completed, 'session-live');
  assert.equal(payload.requests.length, 2);
  assert.equal(payload.requests[0].user, '把日志里的报错找出来', 'the user instruction reaches the summarizer');
  assert.deepEqual(payload.requests[0].actions.map((action) => action.tool), ['read_file'], 'tool calls reach the summarizer');
  assert.equal(payload.requests[0].actions[0].failed, true, 'a failed tool result is still marked');
  assert.equal(payload.requests[1].assistant, '找到了三处报错', 'the reply text reaches the summarizer');
});

test('the newest request of a turn decides the synthesized turn error', () => {
  const { legacyProjectionOf, latestTurnErrored } = mod.__internals;
  const failed = legacyProjectionOf({
    eventNodes: [],
    requests: [{ purpose: 'assistant', startSeq: 10, turn: 2, step: 1, status: 'error', error: 'provider failed' }],
  });
  assert.deepEqual(failed.nodes.map((node) => node.kind), ['turn-error']);
  assert.equal(failed.nodes[0].turn, 2);
  assert.equal(failed.nodes[0].message, 'provider failed');
  assert.equal(latestTurnErrored({ nodes: failed.nodes, turnEnds: new Map([[2, 99]]) }), true);

  // A retried step keeps updating its request, so a later success clears the turn.
  const recovered = legacyProjectionOf({
    eventNodes: [],
    requests: [
      { purpose: 'assistant', startSeq: 10, turn: 2, step: 1, status: 'error', error: 'provider failed' },
      { purpose: 'assistant', startSeq: 30, turn: 2, step: 2, status: 'complete' },
      { purpose: 'compaction', startSeq: 40, turn: 2, step: 0, status: 'error', error: 'ignored' },
    ],
  });
  assert.deepEqual(recovered.nodes, [], 'a turn that moved on is not reported as failed');
  assert.equal(latestTurnErrored({ nodes: recovered.nodes, turnEnds: new Map([[2, 99]]) }), false);
});

test('mergeConversationSnapshot folds the current host bindings into one snapshot', () => {
  const { mergeConversationSnapshot } = mod.__internals;
  const { deriveActivity } = mod;
  const binding = { key: 'session-7', hooks: {}, props: { sessionId: 'session-7' } };
  const trajectory = {
    partial: { turn: 3, step: 1, blocks: [{ kind: 'text', text: '正在整理' }] },
    runningCalls: [{ name: 'read_file' }],
    requests: [{ startSeq: 1 }],
    eventNodes: [{ data: { kind: 'turn-end', turn: 2, time: 5 } }],
  };
  const session = { sessionId: 'session-7', running: true, pendingSubmissions: [], openState: 'ready' };

  const snap = mergeConversationSnapshot(binding, trajectory, session);
  assert.equal(snap.sessionId, 'session-7');
  assert.equal(snap.running, true);
  assert.deepEqual(snap.pending, []);
  assert.equal(snap.openState, 'ready');
  assert.equal(snap.partial.blocks[0].text, '正在整理');
  assert.equal(snap.runningCalls[0].name, 'read_file');
  assert.deepEqual(snap.requests, [{ startSeq: 1 }]);
  assert.deepEqual(snap.nodes, [], 'a clean turn end contributes no node');
  assert.equal(snap.turnEnds.get(2).time, 5);
  assert.equal(deriveActivity(snap), 'running', 'a live tool call keeps the pet in its running pose');

  assert.equal(mergeConversationSnapshot(undefined, null, null), null);

  // Submission echoes do not hide an active tool or a streaming response.
  const submitting = { ...session, pendingSubmissions: [{ id: 1 }] };
  const active = mergeConversationSnapshot(binding, trajectory, submitting);
  assert.deepEqual(active.pending, []);
  assert.equal(deriveActivity(active), 'running');
  assert.equal(deriveActivity(mergeConversationSnapshot(binding, null, submitting)), 'review');

  for (const kind of ['approval', 'question', 'plan-review']) {
    const interaction = { kind, key: 'request-1', sessionId: 'session-7' };
    const waiting = mergeConversationSnapshot(binding, trajectory, session, undefined, { pendingInteraction: interaction });
    assert.deepEqual(waiting.pending, [interaction]);
    assert.equal(deriveActivity(waiting), 'waiting', 'an actual user interaction takes precedence');
  }
  const cleared = mergeConversationSnapshot(binding, trajectory, session, undefined, { pendingInteraction: undefined });
  assert.equal(deriveActivity(cleared), 'running', 'answering the interaction resumes activity');

  // Legacy host: the flat snapshot keeps its own nodes/turnEnds instead of a rebuild.
  const legacyNodes = [{ kind: 'assistant', turn: 1, blocks: [] }];
  const legacyTurnEnds = new Map([[1, 9]]);
  const legacy = mergeConversationSnapshot({ hooks: {} }, { nodes: legacyNodes, turnEnds: legacyTurnEnds, running: false, pending: [] }, null);
  assert.equal(legacy.nodes, legacyNodes);
  assert.equal(legacy.turnEnds, legacyTurnEnds);
  assert.equal(legacy.running, false);

  // The 0.2 live tail rides the `chat` hook; the trajectory snapshot can stay
  // empty (its own partial only fills in once its target accumulates chunks).
  const emptyTrajectory = { partial: null, runningCalls: [], requests: [], eventNodes: [] };
  const chat = {
    partial: { turn: 4, step: 1, blocks: [{ kind: 'text', text: '正在写代码' }] },
    runningCalls: [],
    turnEnds: new Map([[3, 21]]),
    nodes: [{ kind: 'assistant-step' }],
  };
  const live = mergeConversationSnapshot(binding, emptyTrajectory, session, { legacy: chat });
  assert.equal(live.partial.blocks[0].text, '正在写代码', 'the chat hook supplies the live text');
  assert.equal(deriveActivity(live), 'review', 'a streaming step with no tool call is the review pose');
  assert.equal(live.turnEnds.get(3), 21, 'chat turn ends stand in when trajectory has none');
  assert.deepEqual(live.runningCalls, []);
});

test('createServiceSource resolves a late internal service and notifies subscribers', async () => {
  const { createServiceSource } = mod.__internals;

  const immediate = createServiceSource({ get: (name) => (name === 'uiSession' ? { current: null } : undefined) }, 'uiSession');
  assert.deepEqual(immediate.getSnapshot(), { current: null }, 'an already-provided service resolves synchronously');
  immediate.dispose();

  let service;
  const source = createServiceSource({ get: (name) => (name === 'uiSession' ? service : undefined) }, 'uiSession', 5, 50);
  assert.equal(source.getSnapshot(), undefined);
  let notified = 0;
  const unsubscribe = source.subscribe(() => { notified += 1; });
  service = { current: 'ready' };
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.deepEqual(source.getSnapshot(), { current: 'ready' }, 'the poll picks the service up');
  assert.ok(notified >= 1, 'subscribers are told when the service arrives');
  unsubscribe();
  source.dispose();

  const never = createServiceSource({ get: () => undefined }, 'uiSession', 5, 2);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(never.getSnapshot(), undefined, 'an absent service stays unresolved');
  never.dispose();

  const noGet = createServiceSource({}, 'uiSession', 5, 1);
  assert.equal(noGet.getSnapshot(), undefined, 'a context without ctx.get does not throw');
  noGet.dispose();
});

test('pinPlacement keeps an empty or unknown pin in the bottom-right corner', () => {
  const { pinPlacement, DEFAULT_PIN } = mod.__internals;
  const pw = 1200, ph = 800, w = 120, h = 132, margin = 12;
  const bottomRight = { left: pw - w - margin, top: ph - h - margin };

  assert.deepEqual(pinPlacement('top-left', pw, ph, w, h, margin), { left: margin, top: margin });
  assert.deepEqual(pinPlacement('center', pw, ph, w, h, margin), { left: (pw - w) / 2, top: (ph - h) / 2 });
  assert.deepEqual(pinPlacement('bottom-right', pw, ph, w, h, margin), bottomRight);
  // A falsy pin used to leave the pet at the container origin, i.e. the top-left
  // corner of the screen, with its bubbles following it there.
  assert.deepEqual(pinPlacement('', pw, ph, w, h, margin), bottomRight, 'an empty pin falls back to the corner');
  assert.deepEqual(pinPlacement('sideways', pw, ph, w, h, margin), bottomRight, 'an unknown pin falls back to the corner');
  assert.equal(DEFAULT_PIN, 'bottom-right');
});

test('bubblePlacement refuses a pet box it cannot trust', () => {
  const { bubblePlacement } = mod.__internals;
  const host = { left: 0, top: 0, height: 800 };

  assert.equal(bubblePlacement(null, 160, host, 1200, 8), null, 'no box at all');
  assert.equal(bubblePlacement({ left: 0, top: 0, width: 0, height: 0 }, 160, host, 1200, 8), null, 'a zero-sized pet');
  assert.equal(bubblePlacement({ left: 10, top: 10, width: 120, height: 0 }, 160, host, 1200, 8), null, 'a pet without height');
  assert.equal(bubblePlacement({ left: Number.NaN, top: 10, width: 120, height: 132 }, 160, host, 1200, 8), null, 'a NaN offset');
});

test('bubblePlacement centers the bubble over the pet and puts the tail on the pet', () => {
  const { bubblePlacement } = mod.__internals;
  const host = { left: 0, top: 0, height: 800 };

  const spot = bubblePlacement({ left: 500, top: 300, width: 120, height: 132 }, 160, host, 1200, 8);
  assert.equal(spot.left, 480, 'the bubble is centered on the pet');
  assert.equal(spot.bottom, 508, 'the bubble sits gap px above the pet top edge');
  assert.equal(spot.tailX, 80, 'the tail points at the pet center, in bubble coordinates');
});

test('bubblePlacement clamps both viewport edges instead of leaving the screen', () => {
  const { bubblePlacement } = mod.__internals;
  const host = { left: 0, top: 0, height: 800 };
  const gap = 8;

  const leftEdge = bubblePlacement({ left: 0, top: 600, width: 120, height: 132 }, 160, host, 1200, gap);
  assert.equal(leftEdge.left, gap, 'a pet at the left edge keeps the bubble inside the viewport');
  assert.equal(leftEdge.bottom, 208);

  const rightEdge = bubblePlacement({ left: 1080, top: 668, width: 120, height: 132 }, 160, host, 1200, gap);
  assert.equal(rightEdge.left, 1200 - gap - 160, 'a pet at the right edge keeps the bubble inside the viewport');

  // A host that does not start at the viewport origin (the overlay is inset):
  // clamping works in viewport space, so the bubble still touches the edge.
  const inset = { left: 40, top: 20, height: 800 };
  const insetSpot = bubblePlacement({ left: 0, top: 600, width: 120, height: 132 }, 300, inset, 1200, gap);
  assert.equal(inset.left + insetSpot.left, gap, 'the clamp accounts for the host offset');

  // A pet pinned to the top-left corner: the bubble stays visible at the top.
  const corner = bubblePlacement({ left: 12, top: 12, width: 120, height: 132 }, 160, host, 1200, gap);
  assert.equal(corner.left, gap);
  assert.equal(corner.bottom, 796, 'the bubble hangs just above the pet instead of off-screen');
});

// ---------------------------------------------------------------
// Pet gallery (settings picker over built-in / Codex / user pets).
// ---------------------------------------------------------------

const GALLERY_PETS = [
  { id: 'builtin-one', displayName: '内置一号', source: 'builtin', spriteVersionNumber: 1, rows: 9, columns: 8, atlasUrl: '/codex-pet/builtin-one/sheet.webp' },
  { id: 'codex-v2', displayName: 'Codex 二号', source: 'codex', spriteVersionNumber: 2, rows: 11, columns: 8, atlasUrl: '/codex-pet/codex-v2/sheet.webp' },
  { id: 'codex-v1', displayName: 'Codex 一号', source: 'codex', spriteVersionNumber: 1, rows: 9, columns: 8, atlasUrl: '/codex-pet/codex-v1/sheet.webp' },
  { id: 'mine', displayName: '我的', source: 'user', spriteVersionNumber: 2, rows: 11, columns: 8, atlasUrl: '/codex-pet/mine/sheet.webp' },
];

test('groupPets keeps only the sources that actually have pets, in display order', () => {
  const { groupPets } = mod.__internals;
  assert.deepEqual(groupPets(GALLERY_PETS).map((group) => group.source), ['user', 'codex', 'builtin']);
  assert.deepEqual(groupPets([GALLERY_PETS[1]]).map((group) => group.source), ['codex']);
  // A pet without a source tag counts as built-in, so old registries still show.
  assert.deepEqual(groupPets([{ id: 'old' }]).map((group) => group.source), ['builtin']);
  assert.deepEqual(groupPets(undefined), []);
});

test('PetGallery lists every pet with its version badge and the Codex switch', () => {
  const { PetGallery } = mod.__internals;
  const html = renderToString(react.createElement(PetGallery, {
    pets: GALLERY_PETS,
    petId: 'codex-v2',
    codexPets: { enabled: true },
    codexPetsDir: 'C:\\Users\\me\\.codex\\pets',
    post: () => {},
  }));
  assert.match(html, /读取本机 Codex 桌宠/, 'the switch is on screen');
  assert.match(html, /type="checkbox"/);
  assert.match(html, /我的桌宠（1）/);
  assert.match(html, /Codex 桌宠（2）/);
  assert.match(html, /内置桌宠（1）/);
  assert.match(html, /读取到 2 个桌宠/, 'it reports how many Codex pets were found');
  // v1 and v2 badges both appear; the selected card is marked.
  assert.match(html, />v1</);
  assert.match(html, />v2</);
  assert.match(html, /✓ Codex 二号/);
});

test('PetGallery explains a switched-off source instead of listing nothing', () => {
  const { PetGallery } = mod.__internals;
  const html = renderToString(react.createElement(PetGallery, {
    pets: [GALLERY_PETS[0], GALLERY_PETS[3]],
    petId: 'mine',
    codexPets: { enabled: false },
    codexPetsDir: 'C:\\Users\\me\\.codex\\pets',
    post: () => {},
  }));
  assert.match(html, /已关闭/);
  assert.ok(!/Codex 桌宠（\d+）/.test(html), 'no Codex group while the source is off');
});

test('model work switch controls thinking, output and tool status together', () => {
  const { bubbleContent } = mod.__internals;
  const partial = { partial: { blocks: [{ kind: 'text', text: 'streaming answer' }] } };
  const thinking = { partial: { blocks: [] } };
  const tools = { runningCalls: [{ name: 'git status' }] };
  assert.equal(bubbleContent(partial, 'review'), 'streaming answer');
  assert.equal(bubbleContent(thinking, 'review'), '思考中…');
  assert.equal(bubbleContent(tools, 'running'), '运行中：git status…');
  for (const [snap, activity, expected] of [
    [partial, 'review', 'streaming answer'],
    [thinking, 'review', '思考中…'],
    [tools, 'running', '运行中：git status…'],
    [{}, 'running', '工作中…'],
  ]) {
    assert.equal(bubbleContent(snap, activity, 140, { showModelWork: false }), '');
    assert.equal(bubbleContent(snap, activity, 140, { showModelWork: true }), expected);
  }
  assert.match(source, /checkboxField\("显示模型工作 Model work"/);
  assert.ok(!source.includes('显示思考提示 Thinking'));
  assert.ok(!source.includes('显示模型输出 Output'));
});

test('journal hover follows summary enablement, including its empty placeholder', () => {
  const body = source.split('function openJournal() {')[1].split('function closeJournal()')[0];
  const summaryStateRef = { current: null };
  let rendered = 0;
  let timersCleared = 0;
  const openJournal = new Function('summaryStateRef', 'journalHideTimerRef', 'activeSessionRef', 'clearTimeout', 'renderJournal',
    'return function openJournal() {' + body)(
      summaryStateRef, { current: 1 }, { current: null },
      () => { timersCleared++; }, () => { rendered++; },
    );
  for (const summary of [null, {}, { enabled: false }]) {
    summaryStateRef.current = summary;
    openJournal();
  }
  assert.equal(rendered, 0, 'disabled summaries never render the empty placeholder');
  assert.equal(timersCleared, 0, 'disabled hover returns before any journal work');
  summaryStateRef.current = { enabled: true };
  openJournal();
  assert.equal(rendered, 1, 'enabled summary can show its empty placeholder');
  assert.match(source, /if \(summaryStateRef\.current\?\.enabled !== true\) \{\s*clearTimeout\(journalHideTimerRef\.current\);\s*clearTimeout\(journalRevealTimerRef\.current\);\s*journalRef\.current\?\.classList\.remove\("visible"\)/);
});

test('pet position clamps to viewport, including a partly offscreen host and oversize sprites', () => {
  const { clampPetPosition } = mod.__internals;
  const savedWidth = fakeWindow.innerWidth, savedHeight = fakeWindow.innerHeight;
  fakeWindow.innerWidth = 800;
  fakeWindow.innerHeight = 600;
  try {
    const host = { clientWidth: 800, clientHeight: 600, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
    assert.deepEqual(clampPetPosition({ x: 750, y: 580 }, host, 120, 130), { x: 674, y: 464 });
    assert.deepEqual(clampPetPosition({ x: -40, y: -20 }, host, 120, 130), { x: 6, y: 6 });
    assert.deepEqual(clampPetPosition({ x: 50, y: 50 }, host, 120, 130), { x: 50, y: 50 });
    const clippedHost = { clientWidth: 900, clientHeight: 700, getBoundingClientRect: () => ({ left: -200, top: -100 }) };
    assert.deepEqual(clampPetPosition({ x: 0, y: 0 }, clippedHost, 120, 130), { x: 206, y: 106 });
    assert.deepEqual(clampPetPosition({ x: 700, y: 500 }, host, 1000, 900), { x: 6, y: 6 });
  } finally {
    fakeWindow.innerWidth = savedWidth;
    fakeWindow.innerHeight = savedHeight;
  }
});

test('right click has only the optional hide action, without a legacy menu', () => {
  assert.ok(!source.includes('codex-pet-menu'), 'menu CSS and DOM are removed');
  for (const name of ['analyzeButton', 'journalButton', 'resetPosButton', 'menuRef', 'closeMenuRef', 'analyzeUncovered', 'onOutsideMenu']) {
    assert.ok(!source.includes(name), name + ' should not survive the menu removal');
  }
  assert.match(source, /controller\.element\.addEventListener\("contextmenu", onContextMenu\)/);
  assert.match(source, /event\.preventDefault\(\);\s*if \(!rightClickHideRef\.current\) return;/);
  assert.match(source, /host\.style\.visibility = "hidden"/);
  assert.match(source, /RIGHT_CLICK_HIDE_MS = 10_000/);
  assert.match(source, /if \(ref\.current\) ref\.current\.style\.visibility = "visible"/);
  assert.match(source, /checkboxField\("右键隐藏 10 秒"/);
});


test('current host interaction source follows the selected binding, not another session', () => {
  const cleanups = [];
  const subscribed = new Set();
  const hookReact = { ...react,
    useSyncExternalStore: (subscribe, get) => { cleanups.push(subscribe(() => {})); return get(); },
    useMemo: calculate => calculate(),
  };
  const runtime = factory(name => {
    assert.equal(name, 'react');
    return hookReact;
  });
  const observable = (name, getSnapshot) => ({ getSnapshot,
    subscribe: () => { subscribed.add(name); return () => {}; },
  });
  const statuses = new Map();
  let selected = 'source';
  const binding = observable('binding', () => ({ key: selected, hooks: {
    session: observable('session', () => ({ sessionId: selected, running: true, pendingSubmissions: [{ id: 'echo' }] })),
    chat: observable('chat', () => ({ legacy: { runningCalls: [{ name: 'bash' }] } })),
  } }));
  const uiSession = { adapter: { current: binding }, sessionStatus: observable('status', () => statuses) };
  const uiSource = observable('service', () => uiSession);
  const read = () => runtime.__internals.useConversationSnapshot(null, uiSource);
  try {
    statuses.set('fork', { pendingInteraction: { kind: 'approval', key: 'approve-fork' } });
    assert.equal(runtime.deriveActivity(read()), 'running', 'another session cannot change this pet activity');
    selected = 'fork';
    assert.equal(read().sessionId, 'fork');
    assert.equal(runtime.deriveActivity(read()), 'waiting', 'the selected fork has its own pending interaction');
    statuses.delete('fork');
    assert.equal(runtime.deriveActivity(read()), 'running', 'answering resumes the tool activity');
    assert.ok(subscribed.has('status'), 'interaction changes are subscribed, not read only on another render');
  } finally { cleanups.forEach(dispose => dispose()); }
});
