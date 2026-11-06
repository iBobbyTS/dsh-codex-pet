window.__ModuleLoader__.load({
	id: "@signalight/dsh-codex-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		// \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		let react = require("react");
		react = __toESM(react, 1);
		// packages/dsh-codex-pet/src/client.ts
		let createPortal = null;
		try {
			createPortal = require("react-dom").createPortal;
		} catch (e) {
			createPortal = null;
		}
		const FRAME_WIDTH = 192;
		const FRAME_HEIGHT = 208;
		const STATE_POLL_MS = 2e3;
		const DONE_CONFIRM_DELAY_MS = 2500;
		const ANIMATIONS = {
			idle: {
				row: 0,
				frames: 6,
				frameInterval: 160
			},
			runningRight: {
				row: 1,
				frames: 8,
				frameInterval: 120
			},
			runningLeft: {
				row: 2,
				frames: 8,
				frameInterval: 120
			},
			waving: {
				row: 3,
				frames: 4,
				frameInterval: 140
			},
			jumping: {
				row: 4,
				frames: 5,
				frameInterval: 140
			},
			failed: {
				row: 5,
				frames: 8,
				frameInterval: 140
			},
			waiting: {
				row: 6,
				frames: 6,
				frameInterval: 150
			},
			sleeping: {
				row: 6,
				frames: 6,
				frameInterval: 150
			},
			running: {
				row: 7,
				frames: 6,
				frameInterval: 120
			},
			review: {
				row: 8,
				frames: 6,
				frameInterval: 150
			}
		};
		const ALIASES = {
			"running-right": "runningRight",
			"running-left": "runningLeft",
			"run-right": "runningRight",
			"run-left": "runningLeft",
			run: "running"
		};
		const DEFAULT_ANIMATION = "idle";
		function resolveAnimation(name) {
			const key = name == null ? DEFAULT_ANIMATION : ALIASES[name] || name;
			return ANIMATIONS[key] || ANIMATIONS[DEFAULT_ANIMATION];
		}
		function resolveLook(direction, deadzone = 0) {
			if (direction == null) return void 0;
			let degrees;
			if (typeof direction === "number") degrees = direction;
			else {
				if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) return void 0;
				const magnitude = Math.hypot(direction.x, direction.y);
				if (magnitude === 0 || magnitude <= Math.max(0, deadzone)) return void 0;
				degrees = Math.atan2(direction.x, -direction.y) * 180 / Math.PI;
			}
			if (!Number.isFinite(degrees)) return void 0;
			const normalized = (degrees % 360 + 360) % 360;
			return Math.round(normalized / 22.5) % 16;
		}
		const PET_POSITION_MARGIN = 6;
		const RIGHT_CLICK_HIDE_MS = 1e4;
		function clampPetPosition(position, container, width, height, margin = PET_POSITION_MARGIN) {
			const rect = container && typeof container.getBoundingClientRect === "function" ? container.getBoundingClientRect() : {
				left: 0,
				top: 0
			};
			const cw = container && container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
			const ch = container && container.clientHeight > 0 ? container.clientHeight : window.innerHeight;
			if (!(cw > 0 && ch > 0)) return position;
			const vw = Number.isFinite(window.innerWidth) && window.innerWidth > 0 ? window.innerWidth : cw;
			const vh = Number.isFinite(window.innerHeight) && window.innerHeight > 0 ? window.innerHeight : ch;
			const visibleLeft = Math.max(0, -(rect.left || 0));
			const visibleTop = Math.max(0, -(rect.top || 0));
			const visibleRight = Math.min(cw, vw - (rect.left || 0));
			const visibleBottom = Math.min(ch, vh - (rect.top || 0));
			if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) return position;
			const bounded = (n, min, max) => Math.max(min, Math.min(Math.max(min, max), n));
			return {
				x: bounded(position.x, visibleLeft + margin, visibleRight - width - margin),
				y: bounded(position.y, visibleTop + margin, visibleBottom - height - margin)
			};
		}
		function createCodexPet(container, options = {}) {
			const version = options.spriteVersionNumber === 2 ? 2 : 1;
			const rows = version === 2 ? 11 : 9;
			const src = options.src || "";
			let scale = 1;
			if (typeof options.size === "number") scale = options.size / FRAME_WIDTH;
			else if (typeof options.size === "string" && options.size.endsWith("px")) {
				const n = Number(options.size.slice(0, -2));
				if (Number.isFinite(n) && n > 0) scale = n / FRAME_WIDTH;
			}
			const el = document.createElement("div");
			el.className = "codex-pet";
			Object.assign(el.style, {
				width: `${FRAME_WIDTH * scale}px`,
				height: `${FRAME_HEIGHT * scale}px`,
				backgroundImage: src ? `url("${src}")` : "none",
				backgroundRepeat: "no-repeat",
				backgroundSize: `${1536 * scale}px ${FRAME_HEIGHT * rows * scale}px`,
				position: "absolute",
				userSelect: "none",
				WebkitUserSelect: "none",
				cursor: "grab",
				pointerEvents: "auto"
			});
			container.appendChild(el);
			let animationName = DEFAULT_ANIMATION;
			let current = resolveAnimation(animationName);
			let frame = 0;
			let elapsed = 0;
			let mode = "loop";
			let thenName = null;
			let lookIndex = void 0;
			let rafId = 0;
			let lastTime = 0;
			let dragging = false;
			let dragOffset = {
				x: 0,
				y: 0
			};
			let disposed = false;
			function canonical(name) {
				return ALIASES[name] || name;
			}
			function paint() {
				let row, col;
				if (lookIndex !== void 0) {
					row = 9 + Math.floor(lookIndex / 8);
					col = lookIndex % 8;
				} else {
					row = current.row;
					col = frame % current.frames;
				}
				const n = options.normalize && options.normalize[row] || null;
				if (n) {
					el.style.backgroundSize = `${1536 * scale * n.s}px ${FRAME_HEIGHT * rows * scale * n.s}px`;
					el.style.backgroundPosition = `${FRAME_WIDTH / 2 * scale - (col * FRAME_WIDTH + n.cx) * scale * n.s}px ${FRAME_HEIGHT / 2 * scale - (row * FRAME_HEIGHT + n.cy) * scale * n.s}px`;
				} else {
					el.style.backgroundSize = `${1536 * scale}px ${FRAME_HEIGHT * rows * scale}px`;
					el.style.backgroundPosition = `${-col * FRAME_WIDTH * scale}px ${-row * FRAME_HEIGHT * scale}px`;
				}
			}
			function tick(t) {
				if (disposed) return;
				if (lastTime === 0) lastTime = t;
				const dt = t - lastTime;
				lastTime = t;
				if (lookIndex === void 0 || mode === "once") {
					elapsed += dt;
					while (elapsed >= current.frameInterval) {
						elapsed -= current.frameInterval;
						frame += 1;
						if (frame >= current.frames) {
							if (mode === "once") {
								if (thenName) setAnimation(thenName, { mode: "loop" });
								else frame = current.frames - 1;
							} else frame = 0;
						}
					}
				}
				paint();
				rafId = requestAnimationFrame(tick);
			}
			function setAnimation(name, opts = {}) {
				const key = canonical(name);
				current = resolveAnimation(key);
				animationName = key;
				frame = 0;
				elapsed = 0;
				mode = opts.mode || "loop";
				thenName = opts.then || null;
				paint();
				return controller;
			}
			let box = null;
			function setBox(left, top) {
				box = {
					left,
					top,
					width: FRAME_WIDTH * scale,
					height: FRAME_HEIGHT * scale
				};
			}
			function applyPlacement(pos) {
				el.style.left = pos.x + "px";
				el.style.top = pos.y + "px";
				setBox(pos.x, pos.y);
			}
			function place() {
				if (dragging) return;
				const w = FRAME_WIDTH * scale, h = FRAME_HEIGHT * scale;
				if (options.position) {
					const bounded = clampPetPosition(options.position, container, w, h);
					applyPlacement(bounded);
					if (bounded.x !== options.position.x || bounded.y !== options.position.y) {
						options.position = bounded;
						if (options.onPositionClamped) options.onPositionClamped(bounded);
					}
					return;
				}
				const at = pinPlacement(PINS.indexOf(options.pin) >= 0 ? options.pin : DEFAULT_PIN, container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight, w, h, 12);
				applyPlacement(clampPetPosition({
					x: at.left,
					y: at.top
				}, container, w, h));
			}
			place();
			const onResize = () => place();
			window.addEventListener("resize", onResize);
			const ResizeObserverClass = window.ResizeObserver;
			const resizeObserver = typeof ResizeObserverClass === "function" ? new ResizeObserverClass(onResize) : null;
			if (resizeObserver) resizeObserver.observe(container);
			if (window.visualViewport && window.visualViewport.addEventListener) window.visualViewport.addEventListener("resize", onResize);
			if (options.draggable !== false) {
				const DRAG_RUN_THRESHOLD = 4;
				let dragLastX = 0;
				let preDrag = null;
				el.addEventListener("pointerdown", (e) => {
					if (e.button !== 0 && e.pointerType === "mouse") return;
					dragging = true;
					const rect = el.getBoundingClientRect();
					dragOffset = {
						x: e.clientX - rect.left,
						y: e.clientY - rect.top
					};
					dragLastX = e.clientX;
					if (options.dragRun !== false) {
						preDrag = {
							name: animationName,
							mode,
							then: thenName
						};
						lookIndex = void 0;
						paint();
					}
					el.setPointerCapture(e.pointerId);
					el.style.cursor = "grabbing";
					e.preventDefault();
				});
				el.addEventListener("pointermove", (e) => {
					if (!dragging) return;
					if (options.dragRun !== false) {
						const dx = e.clientX - dragLastX;
						dragLastX = e.clientX;
						if (dx > DRAG_RUN_THRESHOLD && animationName !== "runningRight") setAnimation("runningRight", { mode: "loop" });
						else if (dx < -4 && animationName !== "runningLeft") setAnimation("runningLeft", { mode: "loop" });
					}
					const pr = container.getBoundingClientRect();
					applyPlacement(clampPetPosition({
						x: e.clientX - pr.left - dragOffset.x,
						y: e.clientY - pr.top - dragOffset.y
					}, container, FRAME_WIDTH * scale, FRAME_HEIGHT * scale));
				});
				const endDrag = () => {
					if (!dragging) return;
					dragging = false;
					el.style.cursor = "grab";
					if (options.dragRun !== false && preDrag) {
						setAnimation(preDrag.name, {
							mode: preDrag.mode,
							then: preDrag.then
						});
						preDrag = null;
					}
					const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
					if (Number.isFinite(x) && Number.isFinite(y)) {
						const bounded = clampPetPosition({
							x,
							y
						}, container, FRAME_WIDTH * scale, FRAME_HEIGHT * scale);
						applyPlacement(bounded);
						options.position = bounded;
						if (options.onDragEnd) options.onDragEnd(bounded);
					}
				};
				el.addEventListener("pointerup", endDrag);
				el.addEventListener("pointercancel", endDrag);
			}
			if (options.waveOnHover !== false) el.addEventListener("pointerenter", () => {
				if (dragging) return;
				const anim = canonical(animationName);
				if (anim !== "idle" && anim !== "waving") return;
				lookIndex = void 0;
				paint();
				setAnimation("waving", {
					mode: "once",
					then: DEFAULT_ANIMATION
				});
			});
			if (options.jumpOnDoubleClick !== false) el.addEventListener("dblclick", () => {
				if (dragging) return;
				lookIndex = void 0;
				paint();
				setAnimation("jumping", {
					mode: "once",
					then: mode === "loop" ? animationName : DEFAULT_ANIMATION
				});
			});
			const controller = {
				setAnimation(name, opts) {
					return setAnimation(name, opts);
				},
				play(name, opts = {}) {
					return setAnimation(name, {
						mode: "once",
						then: opts.then || DEFAULT_ANIMATION
					});
				},
				setLook(direction, deadzone = 0) {
					if (version !== 2) return controller;
					lookIndex = resolveLook(direction, deadzone);
					frame = 0;
					elapsed = 0;
					paint();
					return controller;
				},
				clearLook() {
					lookIndex = void 0;
					paint();
					return controller;
				},
				setScale(s) {
					scale = s;
					Object.assign(el.style, {
						width: `${FRAME_WIDTH * scale}px`,
						height: `${FRAME_HEIGHT * scale}px`,
						backgroundSize: `${1536 * scale}px ${FRAME_HEIGHT * rows * scale}px`
					});
					place();
					paint();
					return controller;
				},
				setPin(pin) {
					options.pin = pin;
					place();
					return controller;
				},
				setPosition(x, y) {
					const p = clampPetPosition({
						x,
						y
					}, container, FRAME_WIDTH * scale, FRAME_HEIGHT * scale);
					options.position = p;
					applyPlacement(p);
					return controller;
				},
				clearPosition() {
					options.position = void 0;
					place();
					return controller;
				},
				get animation() {
					return animationName;
				},
				get dragging() {
					return dragging;
				},
				get lookIndex() {
					return lookIndex;
				},
				get element() {
					return el;
				},
				get box() {
					return box;
				},
				dispose() {
					disposed = true;
					cancelAnimationFrame(rafId);
					window.removeEventListener("resize", onResize);
					if (resizeObserver) resizeObserver.disconnect();
					if (window.visualViewport && window.visualViewport.removeEventListener) window.visualViewport.removeEventListener("resize", onResize);
					el.remove();
				}
			};
			setAnimation(options.animation || DEFAULT_ANIMATION, { mode: "loop" });
			rafId = requestAnimationFrame(tick);
			return controller;
		}
		function deriveActivity(snap) {
			if (!snap) return "idle";
			if (snap.pending && snap.pending.length > 0) return "waiting";
			if (snap.runningCalls && snap.runningCalls.length > 0) return "running";
			if (snap.running === true) return "review";
			return "idle";
		}
		function partialTextOf(snap) {
			const p = snap && snap.partial;
			if (!p || !p.blocks) return "";
			for (let i = p.blocks.length - 1; i >= 0; i--) {
				const b = p.blocks[i];
				if (b && b.kind === "text" && b.text) return b.text;
			}
			return "";
		}
		function runningToolNameOf(snap) {
			const calls = snap && snap.runningCalls;
			if (!calls || !calls.length) return "";
			return calls[0] && calls[0].name || "";
		}
		function liveTail(text, n) {
			text = (text || "").trim();
			if (!text) return "";
			if (text.length <= n) return text;
			return "…" + text.slice(-(n - 1));
		}
		function coreTextOf(content) {
			if (!content) return "";
			for (const b of content) if (b && b.type === "text" && b.text) return b.text;
			return "";
		}
		function clip(text, n) {
			text = (text || "").trim();
			if (text.length <= n) return text;
			return text.slice(0, Math.max(1, n - 1)) + "…";
		}
		function firstAssistantText(node) {
			for (const b of node.blocks || []) if (b && b.kind === "text" && b.text) return b.text;
			return "";
		}
		/** Completed ordinary model requests, ordered by their durable start seq. */
		function completedModelRequestsOf(snap) {
			const view = snap && snap.views && typeof snap.views.get === "function" ? snap.views.get("trajectory") : null;
			const requests = snap && Array.isArray(snap.requests) ? snap.requests : view ? view.requests : null;
			if (!Array.isArray(requests)) return [];
			return requests.filter((request) => request && request.purpose === "assistant" && request.status !== "running" && Number.isSafeInteger(request.startSeq)).slice().sort((a, b) => a.startSeq - b.startSeq);
		}
		/** Fold each completed model request into one bounded summarizer record. */
		function collectRequestRecords(nodes, requests, options = {}) {
			const argLimit = options.argLimit ?? 60;
			const textLimit = options.textLimit ?? 200;
			const users = [];
			const assistantsBySeq = /* @__PURE__ */ new Map();
			const assistantsByStep = /* @__PURE__ */ new Map();
			const errorsByStep = /* @__PURE__ */ new Map();
			for (const node of nodes || []) {
				if (!node) continue;
				if (node.kind === "user" && Number.isSafeInteger(node.seq)) users.push(node);
				if (node.kind === "assistant" && Number.isSafeInteger(node.turn) && Number.isSafeInteger(node.step)) {
					if (Number.isSafeInteger(node.seq)) assistantsBySeq.set(node.seq, node);
					assistantsByStep.set(node.turn + ":" + node.step, node);
				}
				if (node.kind === "turn-error" && Number.isSafeInteger(node.turn) && Number.isSafeInteger(node.step)) errorsByStep.set(node.turn + ":" + node.step, node.message || "模型请求异常终止");
			}
			users.sort((a, b) => a.seq - b.seq);
			return markFailedActions((requests || []).map((request) => {
				const key = request.turn + ":" + request.step;
				const assistant = Number.isSafeInteger(request.resultSeq) && assistantsBySeq.get(request.resultSeq) || assistantsByStep.get(key);
				let user = "";
				if (request.step === 1) for (const node of users) {
					if (node.seq >= request.startSeq) break;
					user = clip(coreTextOf(node.content), textLimit);
				}
				const actions = [];
				for (const block of assistant && assistant.blocks || []) if (block && block.kind === "tool-call") actions.push({
					tool: block.name || "?",
					detail: clip(String(block.argsRaw || ""), argLimit),
					callId: block.callId,
					failed: false
				});
				let error = request.status === "error" ? clip(request.error || errorsByStep.get(key) || "模型请求失败", textLimit) : "";
				if (assistant && assistant.interrupted) error = error || "模型请求被用户中断";
				return {
					requestSeq: request.startSeq,
					turn: request.turn,
					step: request.step,
					user,
					assistant: clip(firstAssistantText(assistant || {}), textLimit),
					error,
					actions
				};
			}), nodes);
		}
		/** Completed turn numbers, ascending (the authoritative turnEnds map). */
		function completedTurnsOf(snap) {
			if (!snap || !snap.turnEnds || typeof snap.turnEnds.keys !== "function") return [];
			const out = [];
			for (const t of snap.turnEnds.keys()) if (typeof t === "number") out.push(t);
			return out.sort((a, b) => a - b);
		}
		/**
		* True when the latest finished turn was cut short by the user: the
		* conversation snapshot flags its partial assistant message. This is the
		* reliable abort signal — the agent loop never dispatches agent/turn-stopping
		* on an abort (it throws straight into the catch), so a host-side hook
		* cannot see user interrupts at all.
		*/
		function latestTurnInterrupted(snap) {
			if (!snap || !Array.isArray(snap.nodes)) return false;
			const turns = completedTurnsOf(snap);
			if (!turns.length) return false;
			const latest = turns[turns.length - 1];
			return snap.nodes.some((n) => n && n.kind === "assistant" && n.turn === latest && n.interrupted === true);
		}
		/** True when the latest finished turn died on a turn-error node. */
		function latestTurnErrored(snap) {
			if (!snap || !Array.isArray(snap.nodes)) return false;
			const turns = completedTurnsOf(snap);
			if (!turns.length) return false;
			const latest = turns[turns.length - 1];
			return snap.nodes.some((n) => n && n.kind === "turn-error" && n.turn === latest);
		}
		function shouldPlayDone(snap, state) {
			return state.activeSessionId === state.expectedSessionId && state.activity === "idle" && state.now >= state.muteUntil && !latestTurnInterrupted(snap) && !latestTurnErrored(snap);
		}
		/**
		* Mark failed flags onto the matching tool actions of each request record by
		* pairing tool-result callIds with the call heads collected above.
		*/
		function markFailedActions(records, nodes) {
			const failedCalls = /* @__PURE__ */ new Set();
			for (const node of nodes || []) if (node && node.kind === "tool-result" && node.isError && node.callId) failedCalls.add(node.callId);
			for (const rec of records) for (const action of rec.actions) if (action.callId && failedCalls.has(action.callId)) action.failed = true;
			return records;
		}
		/** Assemble one summarize POST body for a consecutive request batch. */
		function buildSummaryPayload(nodes, requests, sessionId) {
			return {
				sessionId: sessionId || void 0,
				fromRequestSeq: requests[0].startSeq,
				toRequestSeq: requests[requests.length - 1].startSeq,
				requests: collectRequestRecords(nodes, requests)
			};
		}
		/** Start automatic observation after the selected snapshot, never at journal history. */
		function baselineAutoTracker(sessionId, completedRequests) {
			const latest = completedRequests && completedRequests.length ? completedRequests[completedRequests.length - 1].startSeq : -1;
			return {
				sessionId: sessionId ?? null,
				ready: true,
				lastSeenRequestSeq: latest,
				windowStartRequestSeq: latest >= 0 ? latest + 1 : null,
				retryCount: 0
			};
		}
		function awaitingOpenAutoTracker(sessionId) {
			return {
				sessionId: sessionId ?? null,
				ready: false,
				lastSeenRequestSeq: -1,
				windowStartRequestSeq: null,
				retryCount: 0
			};
		}
		function isCurrentAutoTrackerSession(tracker, sessionId) {
			return !!tracker && tracker.sessionId === sessionId;
		}
		/** Select the next automatic batch without mutating the tracker. */
		function selectAutoSummaryBatch(tracker, sessionId, openState, completedRequests, interval, isSummarizing) {
			if (tracker.sessionId !== sessionId) {
				if (openState === "open") return {
					tracker: baselineAutoTracker(sessionId, completedRequests),
					batch: null
				};
				return {
					tracker: awaitingOpenAutoTracker(sessionId),
					batch: null
				};
			}
			if (openState !== "open") return {
				tracker,
				batch: null
			};
			if (!tracker.ready) return {
				tracker: baselineAutoTracker(sessionId, completedRequests),
				batch: null
			};
			if (!completedRequests.length) return {
				tracker,
				batch: null
			};
			const latest = completedRequests[completedRequests.length - 1].startSeq;
			const nextTracker = latest > tracker.lastSeenRequestSeq ? {
				...tracker,
				lastSeenRequestSeq: latest
			} : tracker;
			if (isSummarizing) return {
				tracker: nextTracker,
				batch: null
			};
			const start = nextTracker.windowStartRequestSeq != null ? nextTracker.windowStartRequestSeq : completedRequests[0].startSeq;
			const batch = completedRequests.filter((request) => request.startSeq >= start).slice(0, interval);
			return {
				tracker: nextTracker,
				batch: batch.length >= interval ? batch : null
			};
		}
		/** Settle an automatic summary against the current tracker, not its request-time snapshot. */
		function settleAutoTrackerAfterSummary(tracker, sessionId, nextStartRequestSeq, succeeded) {
			if (!isCurrentAutoTrackerSession(tracker, sessionId)) return tracker;
			if (!succeeded) return {
				...tracker,
				retryCount: tracker.retryCount + 1
			};
			return {
				...tracker,
				windowStartRequestSeq: tracker.windowStartRequestSeq == null ? nextStartRequestSeq : Math.max(tracker.windowStartRequestSeq, nextStartRequestSeq),
				retryCount: 0
			};
		}
		/** An automatic summary needs an explicitly configured provider and model. */
		function summaryRouteEnabled(summary) {
			return !!summary && summary.enabled === true && !!summary.provider && !!summary.model;
		}
		const BUBBLE_TEXT = {
			runningText: "运行中：{tool}…",
			workingText: "工作中…",
			thinkingText: "思考中…"
		};
		function bubbleContent(snap, activity, maxChars = 140, display = {}) {
			if (display.showModelWork === false) return "";
			if (activity === "running") {
				const tool = runningToolNameOf(snap);
				if (tool) return BUBBLE_TEXT.runningText.replace("{tool}", tool);
				return BUBBLE_TEXT.workingText;
			}
			if (activity === "review") {
				const t = partialTextOf(snap);
				if (t) return liveTail(t, maxChars);
				return BUBBLE_TEXT.thinkingText;
			}
			return "";
		}
		const BUBBLE_CSS = ".codex-pet-bubble{position:absolute;min-width:96px;max-width:min(440px,calc(100vw - 48px));padding:8px 12px;background:var(--cp-bubble-bg,rgba(24,27,34,0.94));color:var(--cp-bubble-color,#e7e9ee);border:1px solid var(--cp-bubble-border,rgba(255,255,255,0.12));border-radius:12px;font:12px/1.5 -apple-system,'Segoe UI','Microsoft YaHei',sans-serif;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;text-align:left;box-shadow:0 6px 18px rgba(0,0,0,0.35);pointer-events:none;user-select:none;-webkit-user-select:none;}.codex-pet-bubble::after{content:'';position:absolute;top:100%;left:var(--tail-x,50%);transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--cp-bubble-bg,rgba(24,27,34,0.94));}.codex-pet-summary-bubble{position:absolute;min-width:120px;max-width:min(480px,calc(100vw - 48px));padding:10px 14px;background:var(--cp-bubble-bg,rgba(24,27,34,0.94));color:var(--cp-bubble-color,#e7e9ee);border:1px solid var(--cp-bubble-border,rgba(255,255,255,0.12));border-radius:12px;font:12px/1.6 -apple-system,'Segoe UI','Microsoft YaHei',sans-serif;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;text-align:left;box-shadow:0 6px 18px rgba(0,0,0,0.35);pointer-events:none;user-select:none;-webkit-user-select:none;opacity:0;transition:opacity 0.45s ease;}.codex-pet-summary-bubble.visible{opacity:1}.codex-pet-summary-bubble::after{content:'';position:absolute;top:100%;left:var(--tail-x,50%);transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--cp-bubble-bg,rgba(24,27,34,0.94));}.codex-pet-journal{position:absolute;width:300px;max-height:330px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;padding:26px 8px 18px;box-sizing:border-box;pointer-events:none;user-select:none;-webkit-user-select:none;z-index:3;opacity:0;transform:translateY(8px) scale(0.965);transform-origin:50% 100%;transition:opacity 0.38s ease,transform 0.38s ease;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 30px,#000 calc(100% - 26px),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 30px,#000 calc(100% - 26px),transparent 100%);}.codex-pet-journal::-webkit-scrollbar{display:none}.codex-pet-journal.visible{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}.codex-pet-journal-item{position:relative;background:var(--cp-bubble-bg,rgba(24,27,34,0.92));color:var(--cp-bubble-color,#e7e9ee);border:1px solid var(--cp-bubble-border,rgba(255,255,255,0.12));border-radius:18px 24px 20px 16px;padding:8px 13px 9px;margin-top:10px;font:12px/1.65 -apple-system,'Segoe UI','Microsoft YaHei',sans-serif;box-shadow:0 5px 16px rgba(0,0,0,0.16);word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap;text-align:left;}.codex-pet-journal-item:nth-child(odd){transform:translateX(-5px);border-radius:24px 16px 22px 20px}.codex-pet-journal-item:nth-child(even){transform:translateX(7px)}.codex-pet-journal-meta{display:flex;gap:6px;align-items:baseline;opacity:0.6;font-size:10.5px;margin-bottom:2px;white-space:nowrap}.codex-pet-journal-empty{opacity:0.55;text-align:center;padding:14px 10px;font:12px/1.6 -apple-system,'Segoe UI','Microsoft YaHei',sans-serif;}";
		function ensureBubbleStyle() {
			try {
				if (!document.getElementById || !document.head) return;
				if (document.getElementById("codex-pet-style")) return;
				const style = document.createElement("style");
				style.id = "codex-pet-style";
				style.textContent = BUBBLE_CSS;
				document.head.appendChild(style);
			} catch (e) {}
		}
		const BUBBLE_THEMES = {
			gray: {
				rgb: [
					75,
					85,
					99
				],
				color: "#eef1f5",
				border: "rgba(255,255,255,0.16)"
			},
			black: {
				rgb: [
					0,
					0,
					0
				],
				color: "#ffffff",
				border: "rgba(255,255,255,0.25)"
			},
			white: {
				rgb: [
					255,
					255,
					255
				],
				color: "#1a1d24",
				border: "rgba(0,0,0,0.14)"
			},
			blue: {
				rgb: [
					59,
					130,
					246
				],
				color: "#ffffff",
				border: "rgba(255,255,255,0.28)"
			},
			green: {
				rgb: [
					47,
					84,
					63
				],
				color: "#ffffff",
				border: "rgba(255,255,255,0.22)"
			},
			pink: {
				rgb: [
					244,
					178,
					205
				],
				color: "#6b2139",
				border: "rgba(107,33,57,0.22)"
			},
			orange: {
				rgb: [
					234,
					88,
					12
				],
				color: "#ffffff",
				border: "rgba(255,255,255,0.28)"
			}
		};
		BUBBLE_THEMES.dark = BUBBLE_THEMES.gray;
		function bubbleStyle(theme, opacity) {
			const t = BUBBLE_THEMES[theme] || BUBBLE_THEMES.gray;
			const a = Math.max(0, Math.min(100, Number(opacity) || 94)) / 100;
			return {
				bg: "rgba(" + t.rgb[0] + "," + t.rgb[1] + "," + t.rgb[2] + "," + a.toFixed(2) + ")",
				color: t.color,
				border: t.border
			};
		}
		function applyBubbleTheme(el, theme, opacity) {
			const s = bubbleStyle(theme, opacity);
			el.style.setProperty("--cp-bubble-bg", s.bg);
			el.style.setProperty("--cp-bubble-color", s.color);
			el.style.setProperty("--cp-bubble-border", s.border);
		}
		/**
		* Lazily resolve an internal Client service without declaring it in the
		* plugin's `inject` list. A host that never provides the service would
		* park the whole plugin, so poll briefly instead and expose the result
		* as a subscribable source React can read.
		*/
		function createServiceSource(ctx, name, intervalMs = 500, attempts = 120) {
			const listeners = /* @__PURE__ */ new Set();
			let value = typeof ctx.get === "function" ? ctx.get(name) : void 0;
			let timer = 0;
			let remaining = attempts;
			if (value === void 0) timer = setInterval(() => {
				const next = typeof ctx.get === "function" ? ctx.get(name) : void 0;
				if (next === void 0) {
					if (--remaining <= 0) {
						clearInterval(timer);
						timer = 0;
					}
					return;
				}
				clearInterval(timer);
				timer = 0;
				value = next;
				for (const listener of [...listeners]) listener();
			}, intervalMs);
			return {
				getSnapshot: () => value,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				dispose: () => {
					if (timer) {
						clearInterval(timer);
						timer = 0;
					}
					listeners.clear();
				}
			};
		}
		/** Legacy node array + turnEnds map rebuilt from trajectory event nodes. */
		function legacyProjectionOf(trajectory) {
			const eventNodes = trajectory && Array.isArray(trajectory.eventNodes) ? trajectory.eventNodes : null;
			if (!eventNodes) return {
				nodes: null,
				turnEnds: null
			};
			const nodes = [];
			const turnEnds = /* @__PURE__ */ new Map();
			for (const entry of eventNodes) {
				if (!entry) continue;
				if (entry.kind === "user" || entry.kind === "assistant" || entry.kind === "tool-result") {
					nodes.push(entry);
					continue;
				}
				const data = entry.data;
				if (!data) continue;
				if (data.kind === "node" || data.kind === "assistant") {
					if (data.node) nodes.push(data.node);
					continue;
				}
				if (data.kind === "turn-end") {
					turnEnds.set(data.turn, {
						time: data.time,
						error: data.error,
						errorCode: data.errorCode
					});
					if (data.error !== void 0) nodes.push({
						kind: "turn-error",
						turn: data.turn,
						step: Number.MAX_SAFE_INTEGER,
						message: data.error
					});
				}
			}
			const requests = trajectory && Array.isArray(trajectory.requests) ? trajectory.requests : null;
			if (requests) {
				const newestPerTurn = /* @__PURE__ */ new Map();
				for (const request of requests) {
					if (!request || request.purpose !== "assistant") continue;
					if (!Number.isSafeInteger(request.turn) || !Number.isSafeInteger(request.startSeq)) continue;
					const seen = newestPerTurn.get(request.turn);
					if (!seen || seen.startSeq < request.startSeq) newestPerTurn.set(request.turn, request);
				}
				for (const [turn, request] of newestPerTurn) {
					if (request.status !== "error") continue;
					nodes.push({
						kind: "turn-error",
						turn,
						step: Number.MAX_SAFE_INTEGER,
						message: request.error || "模型请求失败"
					});
				}
			}
			return {
				nodes,
				turnEnds
			};
		}
		/**
		* Fold the host's split snapshots into the shape this file reads. `live`
		* carries the live tail: on 0.2.0-rc.1+ the trajectory snapshot
		* (authoritative for partial/runningCalls/requests/eventNodes), on 0.1.x
		* the retired flat snapshot.
		*/
		function mergeConversationSnapshot(binding, live, session, chat, status) {
			chat = chat?.legacy ?? chat;
			if (!binding && !live && !session && !chat) return null;
			const projection = legacyProjectionOf(live);
			const chatPartial = chat && chat.partial || null;
			const chatCalls = chat && Array.isArray(chat.runningCalls) ? chat.runningCalls : null;
			const liveCalls = live && Array.isArray(live.runningCalls) ? live.runningCalls : null;
			const liveTurns = live && live.turnEnds;
			const chatTurns = chat && chat.turnEnds;
			const bindingId = binding ? binding.key !== void 0 ? binding.key : binding.props && binding.props.sessionId : void 0;
			const pendingSource = status?.pendingInteraction !== void 0 ? [status.pendingInteraction] : session?.pending ?? live?.pending;
			const openState = session && session.openState !== void 0 ? session.openState : live ? live.openState : void 0;
			return {
				sessionId: bindingId || session && session.sessionId || live && live.sessionId || null,
				running: !!(session ? session.running : live && live.running),
				pending: Array.isArray(pendingSource) ? pendingSource : [],
				openState: openState === void 0 ? null : openState,
				partial: chatPartial || live && live.partial || null,
				runningCalls: chatCalls && chatCalls.length > 0 ? chatCalls : liveCalls || [],
				requests: live && Array.isArray(live.requests) ? live.requests : null,
				views: live && live.views || null,
				nodes: live && Array.isArray(live.nodes) ? live.nodes : projection.nodes,
				turnEnds: (liveTurns && liveTurns.size ? liveTurns : null) || (chatTurns && chatTurns.size ? chatTurns : null) || projection.turnEnds
			};
		}
		function useConversationSnapshot(sessions, uiSessionSource) {
			const uiSession = react.useSyncExternalStore((cb) => uiSessionSource ? uiSessionSource.subscribe(cb) : () => {}, () => uiSessionSource ? uiSessionSource.getSnapshot() : void 0);
			const mainSource = uiSession && (uiSession.adapter?.current ?? uiSession.current);
			const provide = sessions && sessions.currentProvideInfo;
			const binding = react.useSyncExternalStore((cb) => mainSource ? mainSource.subscribe(cb) : () => {}, () => mainSource ? mainSource.getSnapshot() : void 0);
			const info = react.useSyncExternalStore((cb) => provide && !mainSource ? provide.subscribe(cb) : () => {}, () => provide && !mainSource ? provide.getSnapshot() : void 0);
			const carrier = mainSource ? binding : info;
			const hooks = carrier && carrier.hooks;
			const sessionSource = hooks && hooks.session;
			const trajectorySource = hooks && hooks.trajectory;
			const chatSource = hooks && hooks.chat;
			const sessionSnap = react.useSyncExternalStore((cb) => sessionSource ? sessionSource.subscribe(cb) : () => {}, () => sessionSource ? sessionSource.getSnapshot() : null);
			const trajectorySnap = react.useSyncExternalStore((cb) => trajectorySource ? trajectorySource.subscribe(cb) : () => {}, () => trajectorySource ? trajectorySource.getSnapshot() : null);
			const chatSnap = react.useSyncExternalStore((cb) => chatSource ? chatSource.subscribe(cb) : () => {}, () => chatSource ? chatSource.getSnapshot() : null);
			const statusSource = uiSession && uiSession.sessionStatus;
			const status = react.useSyncExternalStore((cb) => statusSource ? statusSource.subscribe(cb) : () => {}, () => statusSource ? statusSource.getSnapshot() : void 0)?.get(carrier?.key);
			const live = trajectorySnap || sessionSnap;
			return react.useMemo(() => mergeConversationSnapshot(carrier, live, sessionSnap, chatSnap, status), [
				carrier,
				live,
				sessionSnap,
				chatSnap,
				status
			]);
		}
		function postJson(url, body) {
			return fetch(url, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			}).catch(() => {});
		}
		function PetOverlay({ sessions, uiSessionSource }) {
			const ref = react.useRef(null);
			const petRef = react.useRef(null);
			const bubbleRef = react.useRef(null);
			const activityRef = react.useRef("idle");
			const bubbleWidthRef = react.useRef(120);
			const summaryBubbleRef = react.useRef(null);
			const summaryHideTimerRef = react.useRef(0);
			const summarizingRef = react.useRef(false);
			const doneTimerRef = react.useRef(0);
			const journalRef = react.useRef(null);
			const journalHideTimerRef = react.useRef(0);
			const bubbleRevealTimerRef = react.useRef(0);
			const summaryRevealTimerRef = react.useRef(0);
			const journalRevealTimerRef = react.useRef(0);
			const journalCacheRef = react.useRef({
				sessionId: null,
				at: 0,
				items: null
			});
			const summaryRetryTimerRef = react.useRef(0);
			const activeAudioRef = react.useRef(/* @__PURE__ */ new Set());
			const trackerRef = react.useRef(baselineAutoTracker(null, []));
			const stopMuteUntilRef = react.useRef(0);
			const prevWorking = react.useRef(false);
			const activeSessionRef = react.useRef(null);
			const mouseTrackRef = react.useRef(true);
			const rightClickHideRef = react.useRef(false);
			const hiddenUntilRef = react.useRef(0);
			const hideTimerRef = react.useRef(0);
			const [state, setState] = react.useState(null);
			const [summaryTick, setSummaryTick] = react.useState(0);
			const soundStateRef = react.useRef({
				enabled: true,
				volume: 60,
				tracks: {}
			});
			const pulseSeenRef = react.useRef({
				error: 0,
				interrupt: 0
			});
			const summaryStateRef = react.useRef(null);
			const snap = useConversationSnapshot(sessions, uiSessionSource);
			const snapshotRef = react.useRef(snap);
			snapshotRef.current = snap;
			const activity = deriveActivity(snap);
			activityRef.current = activity;
			const showBubble = activity === "running" || activity === "review";
			const displayPrefs = state && state.display || {};
			const rightClickHideNow = displayPrefs.rightClickHide === true;
			rightClickHideRef.current = rightClickHideNow;
			const bubbleText = showBubble ? bubbleContent(snap, activity, 140, displayPrefs) : "";
			react.useEffect(() => {
				const sid = snap ? snap.sessionId ?? null : null;
				if (activeSessionRef.current !== null && activeSessionRef.current !== sid) {
					prevWorking.current = false;
					stopMuteUntilRef.current = 0;
					clearTimeout(doneTimerRef.current);
					clearTimeout(summaryHideTimerRef.current);
					clearTimeout(journalHideTimerRef.current);
					clearTimeout(bubbleRevealTimerRef.current);
					clearTimeout(summaryRevealTimerRef.current);
					clearTimeout(journalRevealTimerRef.current);
					if (summaryBubbleRef.current) summaryBubbleRef.current.classList.remove("visible");
					if (journalRef.current) journalRef.current.classList.remove("visible");
					journalCacheRef.current = {
						sessionId: null,
						at: 0,
						items: null
					};
					stopActiveAudio();
				}
				activeSessionRef.current = sid;
			}, [snap]);
			react.useEffect(() => () => {
				clearTimeout(summaryRetryTimerRef.current);
				clearTimeout(doneTimerRef.current);
				clearTimeout(hideTimerRef.current);
				stopActiveAudio();
			}, []);
			react.useEffect(() => {
				if (rightClickHideNow || !hiddenUntilRef.current) return;
				clearTimeout(hideTimerRef.current);
				hiddenUntilRef.current = 0;
				if (ref.current) ref.current.style.visibility = "visible";
			}, [rightClickHideNow]);
			react.useEffect(() => {
				let cancelled = false;
				let timer;
				let lastKey = "";
				const load = () => {
					fetch("/api/codex-pet/state").then((r) => r.json()).then((data) => {
						if (cancelled) return;
						const key = JSON.stringify(data);
						if (key !== lastKey) {
							lastKey = key;
							setState(data);
						}
					}).catch(() => {}).then(() => {
						if (!cancelled) timer = setTimeout(load, STATE_POLL_MS);
					});
				};
				load();
				return () => {
					cancelled = true;
					clearTimeout(timer);
				};
			}, []);
			react.useEffect(() => {
				const snd = state && state.sound || {};
				soundStateRef.current = {
					enabled: snd.enabled !== false,
					volume: typeof snd.volume === "number" ? snd.volume : 60,
					tracks: snd.tracks || {}
				};
				summaryStateRef.current = state && state.summary || null;
				if (summaryStateRef.current?.enabled !== true) {
					clearTimeout(journalHideTimerRef.current);
					clearTimeout(journalRevealTimerRef.current);
					journalRef.current?.classList.remove("visible");
				}
				const pulses = state && state.pulses;
				if (pulses) {
					const seen = pulseSeenRef.current;
					for (const kind of ["error", "interrupt"]) {
						const pulse = pulses[kind] || {};
						const at = typeof pulse === "number" ? pulse : pulse.at || 0;
						const owner = typeof pulse === "object" ? pulse.sessionId : "";
						if (at && at !== seen[kind]) {
							seen[kind] = at;
							if (owner && owner !== activeSessionRef.current) continue;
							const track = soundStateRef.current.tracks[kind] || {};
							const recent = at > Date.now() - 15e3;
							if (kind === "error" && recent) {
								stopMuteUntilRef.current = Date.now() + 8e3;
								clearTimeout(doneTimerRef.current);
							}
							if (soundStateRef.current.enabled && track.enabled !== false && recent) playTrack(kind, soundStateRef.current.volume * (typeof track.volume === "number" ? track.volume : 100) / 1e4);
						}
					}
				}
			}, [state, snap && snap.sessionId]);
			function currentPetBox(hostRect) {
				const pet = petRef.current;
				if (pet && pet.element && pet.element.isConnected) {
					const pr = pet.element.getBoundingClientRect();
					if (pr.width > 0 || pr.height > 0) return {
						left: pr.left - hostRect.left,
						top: pr.top - hostRect.top,
						width: pr.width,
						height: pr.height
					};
				}
				if (pet && pet.box) return pet.box;
				return null;
			}
			function positionBubbleEl(b, bw) {
				const host = ref.current;
				if (!b || !host || !b.isConnected) return false;
				const hostRect = host.getBoundingClientRect();
				const vw = window.innerWidth || document.documentElement && document.documentElement.clientWidth || 1200;
				const spot = bubblePlacement(currentPetBox(hostRect), bw, hostRect, vw, 8);
				if (!spot) return false;
				b.style.left = `${spot.left}px`;
				b.style.bottom = `${spot.bottom}px`;
				b.style.setProperty("--tail-x", `${spot.tailX}px`);
				return true;
			}
			function revealWhenPositioned(el, bw, timerRef, apply, attempt = 0) {
				clearTimeout(timerRef.current);
				timerRef.current = 0;
				if (!el) return false;
				if (positionBubbleEl(el, bw)) {
					apply();
					return true;
				}
				if (attempt >= REVEAL_RETRIES) return false;
				timerRef.current = setTimeout(() => {
					if (el !== bubbleRef.current && el !== summaryBubbleRef.current && el !== journalRef.current) return;
					revealWhenPositioned(el, bw, timerRef, apply, attempt + 1);
				}, REVEAL_RETRY_MS);
				return false;
			}
			function positionBubble() {
				const b = bubbleRef.current;
				if (!b || b.style.display === "none") return;
				bubbleWidthRef.current = b.offsetWidth || 120;
				positionBubbleEl(b, bubbleWidthRef.current);
			}
			function positionSummaryBubble() {
				const b = summaryBubbleRef.current;
				if (!b) return;
				positionBubbleEl(b, b.offsetWidth || 160);
			}
			function positionJournal() {
				const j = journalRef.current;
				if (!j || !j.classList.contains("visible")) return;
				positionBubbleEl(j, 300);
			}
			const petIdNow = state && state.pet ? state.pet.id : null;
			const displayNow = state ? state.display : null;
			const configKey = JSON.stringify({
				petId: petIdNow,
				visible: !displayNow || displayNow.visible !== false,
				size: displayNow ? displayNow.size ?? null : null,
				pin: displayNow ? displayNow.pin ?? null : null
			});
			const layoutRevNow = displayNow ? displayNow.layoutRev ?? 0 : null;
			react.useEffect(() => {
				const host = ref.current;
				if (!host) return;
				if (!state || !state.pet) return;
				if (state.display && state.display.visible === false) return;
				const pet = state.pet;
				const display = state.display || {};
				const position = display.left != null && display.top != null ? {
					x: display.left,
					y: display.top
				} : void 0;
				const controller = createCodexPet(host, {
					src: pet.atlasUrl,
					spriteVersionNumber: pet.spriteVersionNumber,
					size: display.size != null ? display.size : pet.size,
					pin: display.pin != null ? display.pin : pet.pin,
					position,
					draggable: true,
					jumpOnDoubleClick: false,
					onDragEnd: ({ x, y }) => {
						postJson("/api/codex-pet/set-config", {
							left: x,
							top: y
						});
					},
					onPositionClamped: ({ x, y }) => {
						postJson("/api/codex-pet/set-config", {
							left: x,
							top: y
						});
					}
				});
				petRef.current = controller;
				console.log("[dsh-codex-pet] ready —", pet.id);
				ensureBubbleStyle();
				const bubble = document.createElement("div");
				bubble.className = "codex-pet-bubble";
				bubble.style.display = "none";
				applyBubbleTheme(bubble, display.bubbleTheme ?? "gray", display.bubbleOpacity ?? 94);
				host.appendChild(bubble);
				bubbleRef.current = bubble;
				const summaryBubble = document.createElement("div");
				summaryBubble.className = "codex-pet-summary-bubble";
				applyBubbleTheme(summaryBubble, display.bubbleTheme ?? "gray", display.bubbleOpacity ?? 94);
				host.appendChild(summaryBubble);
				summaryBubbleRef.current = summaryBubble;
				const journal = document.createElement("div");
				journal.className = "codex-pet-journal";
				applyBubbleTheme(journal, display.bubbleTheme ?? "gray", Math.min(display.bubbleOpacity ?? 94, 92));
				host.appendChild(journal);
				journalRef.current = journal;
				function formatJournalTime(iso) {
					const t = new Date(iso).getTime();
					if (!Number.isFinite(t)) return "";
					const diff = Date.now() - t;
					if (diff < 6e4) return "刚刚";
					if (diff < 36e5) return Math.floor(diff / 6e4) + " 分钟前";
					if (diff < 864e5) return Math.floor(diff / 36e5) + " 小时前";
					if (diff < 1728e5) return "昨天 " + new Date(t).toTimeString().slice(0, 5);
					return new Date(t).toDateString().slice(5) + " " + new Date(t).toTimeString().slice(0, 5);
				}
				function renderJournal(items, loadError) {
					journal.textContent = "";
					if (loadError) {
						const error = document.createElement("div");
						error.className = "codex-pet-journal-empty";
						error.textContent = "总结记录加载失败：" + loadError;
						journal.appendChild(error);
						return;
					}
					if (!items || !items.length) {
						const empty = document.createElement("div");
						empty.className = "codex-pet-journal-empty";
						empty.textContent = "还没有总结记录 — 完成设定的模型请求数后，我会把进展汇报在这里";
						journal.appendChild(empty);
						return;
					}
					for (const rec of [...items].reverse()) {
						const item = document.createElement("div");
						item.className = "codex-pet-journal-item";
						const meta = document.createElement("div");
						meta.className = "codex-pet-journal-meta";
						const when = document.createElement("span");
						when.textContent = formatJournalTime(rec.createdAt);
						const range = document.createElement("span");
						range.textContent = typeof rec.requestCount === "number" ? rec.requestCount + " Requests" : "Turn " + rec.fromTurn + "–" + rec.toTurn;
						meta.appendChild(when);
						meta.appendChild(range);
						const body = document.createElement("div");
						body.textContent = rec.summary || "";
						item.appendChild(meta);
						item.appendChild(body);
						journal.appendChild(item);
					}
				}
				function openJournal() {
					if (summaryStateRef.current?.enabled !== true) return;
					clearTimeout(journalHideTimerRef.current);
					const sessionId = activeSessionRef.current;
					if (!sessionId) {
						renderJournal(null);
						return;
					}
					const now = Date.now();
					const cache = journalCacheRef.current;
					if (cache.sessionId !== sessionId || now - cache.at > 1e4 || !cache.items) fetch("/api/codex-pet/journal?session=" + encodeURIComponent(sessionId) + "&limit=30").then((r) => {
						if (!r.ok) throw new Error("HTTP " + r.status);
						return r.json();
					}).then((d) => {
						if (!d || !Array.isArray(d.records)) throw new Error("响应格式无效");
						if (activeSessionRef.current !== sessionId) return;
						journalCacheRef.current = {
							sessionId,
							at: Date.now(),
							items: d.records
						};
						renderJournal(journalCacheRef.current.items);
					}).catch((error) => {
						if (activeSessionRef.current !== sessionId) return;
						renderJournal(null, error && error.message || "网络错误");
					});
					else renderJournal(journalCacheRef.current.items);
					revealWhenPositioned(journal, 300, journalRevealTimerRef, () => {
						journal.classList.add("visible");
					});
					requestAnimationFrame(() => {
						journal.scrollTop = journal.scrollHeight;
					});
				}
				function closeJournal() {
					journal.classList.remove("visible");
				}
				const onContextMenu = (event) => {
					event.preventDefault();
					if (!rightClickHideRef.current) return;
					closeJournal();
					clearTimeout(hideTimerRef.current);
					hiddenUntilRef.current = Date.now() + RIGHT_CLICK_HIDE_MS;
					host.style.visibility = "hidden";
					hideTimerRef.current = setTimeout(() => {
						hiddenUntilRef.current = 0;
						if (ref.current) ref.current.style.visibility = "visible";
					}, RIGHT_CLICK_HIDE_MS);
				};
				controller.element.addEventListener("contextmenu", onContextMenu);
				function scheduleCloseJournal() {
					clearTimeout(journalHideTimerRef.current);
					journalHideTimerRef.current = setTimeout(closeJournal, 280);
				}
				const onPetEnter = () => {
					openJournal();
				};
				const onPetLeave = () => {
					scheduleCloseJournal();
				};
				const onJournalEnter = () => {
					clearTimeout(journalHideTimerRef.current);
				};
				const onJournalLeave = () => {
					scheduleCloseJournal();
				};
				const onJournalDragHide = (event) => {
					if (event.button === 0) closeJournal();
				};
				controller.element.addEventListener("pointerenter", onPetEnter);
				controller.element.addEventListener("pointerleave", onPetLeave);
				journal.addEventListener("pointerenter", onJournalEnter);
				journal.addEventListener("pointerleave", onJournalLeave);
				controller.element.addEventListener("pointerdown", onJournalDragHide);
				const look = (e) => {
					if (pet.spriteVersionNumber === 1) return;
					if (!mouseTrackRef.current) return;
					if (activityRef.current !== "idle") return;
					if (e.target === controller.element) return;
					const r = controller.element.getBoundingClientRect();
					const cx = r.left + r.width / 2;
					const cy = r.top + r.height / 2;
					controller.setLook({
						x: e.clientX - cx,
						y: e.clientY - cy
					}, 28);
				};
				window.addEventListener("pointermove", look);
				const onBubbleMove = () => {
					positionBubble();
					positionSummaryBubble();
					positionJournal();
				};
				window.addEventListener("pointermove", onBubbleMove);
				window.addEventListener("resize", onBubbleMove);
				let petDragging = false;
				const onDragDown = (event) => {
					if (event.button !== 0) return;
					petDragging = true;
				};
				const releaseSync = () => {
					if (!petDragging) return;
					petDragging = false;
					syncToActivity(activityRef.current, { wave: false });
					positionBubble();
				};
				controller.element.addEventListener("pointerdown", onDragDown);
				controller.element.addEventListener("pointerup", releaseSync);
				controller.element.addEventListener("pointercancel", releaseSync);
				const RESTORE_BY_ACTIVITY = {
					running: "running",
					review: "review",
					waiting: "waiting",
					idle: "idle"
				};
				const onDoubleClick = () => {
					const restore = RESTORE_BY_ACTIVITY[activityRef.current] || "idle";
					controller.clearLook();
					controller.play("jumping", { then: restore });
				};
				controller.element.addEventListener("dblclick", onDoubleClick);
				return () => {
					window.removeEventListener("pointermove", look);
					window.removeEventListener("pointermove", onBubbleMove);
					window.removeEventListener("resize", onBubbleMove);
					controller.element.removeEventListener("pointerdown", onDragDown);
					controller.element.removeEventListener("pointerup", releaseSync);
					controller.element.removeEventListener("pointercancel", releaseSync);
					controller.element.removeEventListener("dblclick", onDoubleClick);
					controller.element.removeEventListener("pointerenter", onPetEnter);
					controller.element.removeEventListener("pointerleave", onPetLeave);
					controller.element.removeEventListener("pointerdown", onJournalDragHide);
					controller.element.removeEventListener("contextmenu", onContextMenu);
					journal.removeEventListener("pointerenter", onJournalEnter);
					journal.removeEventListener("pointerleave", onJournalLeave);
					controller.dispose();
					petRef.current = null;
					if (bubble) bubble.remove();
					bubbleRef.current = null;
					if (summaryBubble) summaryBubble.remove();
					summaryBubbleRef.current = null;
					if (journal) journal.remove();
					journalRef.current = null;
					clearTimeout(summaryHideTimerRef.current);
					clearTimeout(journalHideTimerRef.current);
					clearTimeout(bubbleRevealTimerRef.current);
					clearTimeout(summaryRevealTimerRef.current);
					clearTimeout(journalRevealTimerRef.current);
				};
			}, [configKey]);
			const layoutRevRef = react.useRef(null);
			react.useEffect(() => {
				if (layoutRevNow === null) return;
				if (layoutRevRef.current === null) {
					layoutRevRef.current = layoutRevNow;
					return;
				}
				if (layoutRevRef.current === layoutRevNow) return;
				layoutRevRef.current = layoutRevNow;
				const pet = petRef.current;
				if (!pet) return;
				pet.clearPosition();
				if (displayNow && displayNow.pin) pet.setPin(displayNow.pin);
				positionBubble();
				positionSummaryBubble();
				positionJournal();
			}, [layoutRevNow]);
			const bubbleThemeNow = displayNow ? displayNow.bubbleTheme ?? "gray" : "gray";
			const bubbleOpacityNow = displayNow ? displayNow.bubbleOpacity ?? 94 : 94;
			react.useEffect(() => {
				mouseTrackRef.current = !displayNow || displayNow.mouseTracking !== false;
			}, [displayNow]);
			react.useEffect(() => {
				const b = bubbleRef.current;
				const s = summaryBubbleRef.current;
				if (!b && !s) return;
				if (b) applyBubbleTheme(b, bubbleThemeNow, bubbleOpacityNow);
				if (s) applyBubbleTheme(s, bubbleThemeNow, bubbleOpacityNow);
			}, [bubbleThemeNow, bubbleOpacityNow]);
			function playTrack(track, volume) {
				try {
					const audio = new Audio("/codex-pet-sound?track=" + encodeURIComponent(track) + "&t=" + Date.now());
					const removeAudio = () => {
						activeAudioRef.current.delete(audio);
					};
					audio.addEventListener("ended", removeAudio, { once: true });
					audio.addEventListener("error", removeAudio, { once: true });
					activeAudioRef.current.add(audio);
					audio.volume = typeof volume === "number" ? Math.min(1, Math.max(0, volume)) : .6;
					const played = audio.play();
					if (played && played.catch) played.catch((e) => {
						removeAudio();
						if (e && e.name === "NotAllowedError") console.warn("[dsh-codex-pet] " + track + " voice blocked by autoplay policy until first user gesture");
					});
				} catch (e) {
					console.warn("[dsh-codex-pet] " + track + " audio unavailable:", e);
				}
			}
			function stopActiveAudio() {
				for (const audio of activeAudioRef.current) try {
					audio.pause();
					audio.currentTime = 0;
				} catch (e) {}
				activeAudioRef.current.clear();
			}
			/** Play one scenario track at master × track volume, honoring switches. */
			function playScenarioTrack(kind) {
				const s = soundStateRef.current;
				if (!s || s.enabled === false) return;
				const t = s.tracks && s.tracks[kind] || {};
				if (t.enabled === false) return;
				playTrack(kind, s.volume * (typeof t.volume === "number" ? t.volume : 100) / 1e4);
			}
			function playDoneSound() {
				playScenarioTrack("done");
			}
			function showSummaryBubble(text) {
				const b = summaryBubbleRef.current;
				if (!b || !text) return;
				b.textContent = text;
				const seconds = Math.max(3, summaryStateRef.current && summaryStateRef.current.bubbleSeconds || 12);
				clearTimeout(summaryHideTimerRef.current);
				revealWhenPositioned(b, b.offsetWidth || 160, summaryRevealTimerRef, () => {
					b.classList.add("visible");
					clearTimeout(summaryHideTimerRef.current);
					summaryHideTimerRef.current = setTimeout(() => {
						b.classList.remove("visible");
					}, seconds * 1e3);
				});
			}
			react.useEffect(() => {
				if (!snap) return;
				const cfg = summaryStateRef.current;
				const wasSessionChange = trackerRef.current.sessionId !== snap.sessionId;
				if (!summaryRouteEnabled(cfg)) {
					if (wasSessionChange) {
						trackerRef.current = awaitingOpenAutoTracker(snap.sessionId);
						summarizingRef.current = false;
						clearTimeout(summaryRetryTimerRef.current);
					}
					return;
				}
				const interval = Math.max(1, cfg.intervalRequests || 5);
				const done = completedModelRequestsOf(snap);
				const selection = selectAutoSummaryBatch(trackerRef.current, snap.sessionId, snap.openState, done, interval, summarizingRef.current);
				trackerRef.current = selection.tracker;
				if (wasSessionChange) {
					summarizingRef.current = false;
					clearTimeout(summaryRetryTimerRef.current);
					return;
				}
				const tracker = selection.tracker;
				const batch = selection.batch;
				if (!batch) return;
				const nextStartRequestSeq = batch[batch.length - 1].startSeq + 1;
				const payload = buildSummaryPayload(snap.nodes, batch, snap.sessionId);
				summarizingRef.current = true;
				const requestSessionId = tracker.sessionId;
				let succeeded = false;
				fetch("/api/codex-pet/summarize", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(payload)
				}).then((r) => r.json()).then((d) => {
					if (d && d.ok === false) throw new Error(d.error || "summarize-failed");
					if (!isCurrentAutoTrackerSession(trackerRef.current, requestSessionId) || activeSessionRef.current !== requestSessionId) return;
					trackerRef.current = settleAutoTrackerAfterSummary(trackerRef.current, requestSessionId, nextStartRequestSeq, true);
					journalCacheRef.current = {
						sessionId: null,
						at: 0,
						items: null
					};
					showSummaryBubble(d && d.summary || "");
					succeeded = true;
				}).catch((e) => console.warn("[dsh-codex-pet] summarize failed:", e)).finally(() => {
					if (!isCurrentAutoTrackerSession(trackerRef.current, requestSessionId) || activeSessionRef.current !== requestSessionId) return;
					summarizingRef.current = false;
					if (!succeeded) trackerRef.current = settleAutoTrackerAfterSummary(trackerRef.current, requestSessionId, nextStartRequestSeq, false);
					const delay = succeeded ? 0 : Math.min(3e4, 1e3 * 2 ** Math.min(trackerRef.current.retryCount, 5));
					clearTimeout(summaryRetryTimerRef.current);
					summaryRetryTimerRef.current = setTimeout(() => setSummaryTick((value) => value + 1), delay);
				});
			}, [
				snap,
				state,
				summaryTick
			]);
			react.useEffect(() => {
				const onClick = (e) => {
					const target = e.target;
					if (!(target && target.closest ? target.closest("button[aria-label=\"停止生成\"], button[aria-label=\"Stop generating\"]") : null)) return;
					stopMuteUntilRef.current = Date.now() + 8e3;
					clearTimeout(doneTimerRef.current);
					playScenarioTrack("interrupt");
				};
				document.addEventListener("click", onClick, true);
				return () => document.removeEventListener("click", onClick, true);
			}, []);
			function syncToActivity(act, opts = {}) {
				const pet = petRef.current;
				if (!pet) return;
				if (act === "running") {
					clearTimeout(doneTimerRef.current);
					pet.clearLook();
					pet.setAnimation("running");
					prevWorking.current = true;
				} else if (act === "review") {
					clearTimeout(doneTimerRef.current);
					pet.clearLook();
					pet.setAnimation("review");
					prevWorking.current = true;
				} else if (act === "waiting") {
					clearTimeout(doneTimerRef.current);
					pet.clearLook();
					pet.setAnimation("waiting");
				} else {
					if (opts.wave !== false && prevWorking.current) {
						if (latestTurnInterrupted(snap) || Date.now() < stopMuteUntilRef.current) {
							pet.clearLook();
							pet.setAnimation("idle");
						} else if (latestTurnErrored(snap)) {
							pet.clearLook();
							pet.setAnimation("idle");
						} else {
							pet.clearLook();
							pet.setAnimation("idle");
							const sessionId = activeSessionRef.current;
							clearTimeout(doneTimerRef.current);
							doneTimerRef.current = setTimeout(() => {
								const current = snapshotRef.current;
								if (!shouldPlayDone(current, {
									activeSessionId: activeSessionRef.current,
									expectedSessionId: sessionId,
									activity: activityRef.current,
									muteUntil: stopMuteUntilRef.current,
									now: Date.now()
								})) return;
								const currentPet = petRef.current;
								if (!currentPet) return;
								currentPet.clearLook();
								currentPet.play("waving", { then: "idle" });
								playDoneSound();
							}, DONE_CONFIRM_DELAY_MS);
						}
					} else pet.setAnimation("idle");
					prevWorking.current = false;
				}
			}
			react.useEffect(() => {
				syncToActivity(activity, { wave: true });
			}, [activity]);
			react.useEffect(() => {
				const b = bubbleRef.current;
				if (!b) return;
				if (showBubble && bubbleText) {
					b.textContent = bubbleText;
					revealWhenPositioned(b, bubbleWidthRef.current || 120, bubbleRevealTimerRef, () => {
						b.style.display = "block";
						bubbleWidthRef.current = b.offsetWidth || 120;
						positionBubble();
					});
				} else {
					clearTimeout(bubbleRevealTimerRef.current);
					b.style.display = "none";
				}
			}, [showBubble, bubbleText]);
			const hostEl = react.createElement("div", {
				ref,
				className: "codex-pet-host",
				style: {
					position: "fixed",
					inset: "0",
					pointerEvents: "none",
					zIndex: 2147483e3
				}
			});
			return createPortal ? createPortal(hostEl, document.body) : hostEl;
		}
		const PINS = [
			"top-left",
			"top",
			"top-right",
			"left",
			"center",
			"right",
			"bottom-left",
			"bottom",
			"bottom-right"
		];
		const DEFAULT_PIN = "bottom-right";
		function pinPlacement(pin, pw, ph, w, h, margin) {
			switch (pin) {
				case "top-left": return {
					left: margin,
					top: margin
				};
				case "top": return {
					left: (pw - w) / 2,
					top: margin
				};
				case "top-right": return {
					left: pw - w - margin,
					top: margin
				};
				case "left": return {
					left: margin,
					top: (ph - h) / 2
				};
				case "center": return {
					left: (pw - w) / 2,
					top: (ph - h) / 2
				};
				case "right": return {
					left: pw - w - margin,
					top: (ph - h) / 2
				};
				case "bottom-left": return {
					left: margin,
					top: ph - h - margin
				};
				case "bottom": return {
					left: (pw - w) / 2,
					top: ph - h - margin
				};
				default: return {
					left: pw - w - margin,
					top: ph - h - margin
				};
			}
		}
		function bubblePlacement(box, bw, hostRect, viewportWidth, gap) {
			if (!box || !isFinite(box.left) || !isFinite(box.top) || !(box.width > 0) || !(box.height > 0)) return null;
			let left = box.left + (box.width - bw) / 2;
			const viewportLeft = hostRect.left + left;
			if (viewportLeft < gap) left = gap - hostRect.left;
			else if (viewportLeft + bw > viewportWidth - gap) left = viewportWidth - gap - bw - hostRect.left;
			return {
				left,
				bottom: hostRect.height - box.top + gap,
				tailX: box.left + box.width / 2 - left
			};
		}
		const REVEAL_RETRIES = 12;
		const REVEAL_RETRY_MS = 100;
		function field(label, control) {
			return react.createElement("label", { style: {
				display: "grid",
				gap: "4px",
				fontSize: "13px"
			} }, react.createElement("span", { style: { color: "#9aa0a6" } }, label), control);
		}
		function checkboxField(label, checked, onChange, disabled = false) {
			return react.createElement("label", { style: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				fontSize: "13px",
				cursor: disabled ? "default" : "pointer",
				opacity: disabled ? .55 : 1
			} }, react.createElement("input", {
				type: "checkbox",
				checked,
				onChange,
				disabled,
				style: { cursor: disabled ? "default" : "pointer" }
			}), react.createElement("span", null, label));
		}
		function NumberField({ value, disabled, min = 0, max = 512, onCommit }) {
			const [draft, setDraft] = react.useState(String(value));
			react.useEffect(() => {
				setDraft(String(value));
			}, [value]);
			return react.createElement("input", {
				type: "number",
				min,
				max,
				step: 1,
				value: draft,
				disabled,
				style: { padding: "6px 8px" },
				onChange: (e) => {
					const text = e.target.value;
					setDraft(text);
					const n = Number(text);
					if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
				},
				onBlur: () => {
					setDraft(String(value));
				}
			});
		}
		function ImportButton({ onImported }) {
			const inputRef = react.useRef(null);
			const [name, setName] = react.useState("");
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState("");
			const onFile = (e) => {
				const file = e.target.files && e.target.files[0];
				e.target.value = "";
				if (!file) return;
				const fileId = file.name.replace(/\.[^.]+$/, "").toLowerCase();
				const displayName = name.trim();
				let query = "id=" + encodeURIComponent(fileId);
				if (displayName) query += "&name=" + encodeURIComponent(displayName);
				setBusy(true);
				setError("");
				fetch("/api/codex-pet/import?" + query, {
					method: "POST",
					body: file
				}).then((r) => r.json()).then((d) => {
					if (d && d.ok === false) {
						setError(d.error || "导入失败");
						return;
					}
					setName("");
					onImported();
				}).catch(() => setError("导入失败（网络错误）")).finally(() => setBusy(false));
			};
			return react.createElement("div", { style: {
				display: "grid",
				gap: "8px"
			} }, field("宠物名 Pet name（可选，可中文）", react.createElement("input", {
				type: "text",
				value: name,
				placeholder: "留空则用文件名",
				style: { padding: "6px 8px" },
				onChange: (e) => setName(e.target.value)
			})), react.createElement("button", {
				type: "button",
				onClick: () => {
					if (inputRef.current) inputRef.current.click();
				},
				disabled: busy,
				style: {
					padding: "8px 12px",
					cursor: busy ? "default" : "pointer"
				}
			}, busy ? "导入中…" : "选择文件并导入（webp / png / gif）"), react.createElement("input", {
				ref: inputRef,
				type: "file",
				accept: ".webp,.png,.gif",
				style: { display: "none" },
				onChange: onFile
			}), error ? react.createElement("div", { style: {
				color: "#e5484d",
				fontSize: "12px"
			} }, error) : null);
		}
		function ResetControls({ reload }) {
			const [busy, setBusy] = react.useState("");
			const run = (path, confirmText) => {
				if (confirmText && !window.confirm(confirmText)) return;
				setBusy(path);
				fetch(path, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: "{}"
				}).then(() => reload()).catch(() => {}).finally(() => setBusy(""));
			};
			const button = (path, idle, busyText, confirmText) => react.createElement("button", {
				type: "button",
				onClick: () => run(path, confirmText),
				disabled: busy !== "",
				style: {
					padding: "8px 12px",
					cursor: busy !== "" ? "default" : "pointer"
				}
			}, busy === path ? busyText : idle);
			return react.createElement("div", { style: {
				display: "grid",
				gap: "8px"
			} }, button("/api/codex-pet/reset-position", "还原位置（把桌宠移回默认角落）", "还原中…"), button("/api/codex-pet/reset-all", "还原全部设定（恢复所有默认设置）", "还原中…", "将把所有设置恢复为默认值：位置、大小、显示、鼠标追踪、气泡、定期总结和提示音。宠物选择与已导入的宠物文件、自定义提示音会保留。继续吗？"));
		}
		function sectionTitle(text) {
			return react.createElement("div", { style: {
				fontWeight: 600,
				fontSize: "13px",
				marginTop: "4px",
				borderTop: "1px solid rgba(128,128,128,0.25)",
				paddingTop: "12px"
			} }, text);
		}
		const PET_SOURCE_TITLES = {
			user: "我的桌宠",
			codex: "Codex 桌宠",
			builtin: "内置桌宠"
		};
		const PET_SOURCE_ORDER = [
			"user",
			"codex",
			"builtin"
		];
		/** Group pets by source, dropping empty groups, in display order. */
		function groupPets(pets) {
			const list = Array.isArray(pets) ? pets : [];
			const groups = [];
			for (const source of PET_SOURCE_ORDER) {
				const items = list.filter((pet) => pet && (pet.source || "builtin") === source);
				if (items.length > 0) groups.push({
					source,
					title: PET_SOURCE_TITLES[source] || source,
					items
				});
			}
			return groups;
		}
		/**
		* One atlas cell drawn as a thumbnail (row 0 / column 0 is the idle
		* frame of every pet). A full atlas is 1536x(1872|2288) — roughly 14 MB
		* of decoded pixels each — so the image is attached only while the card
		* is near the viewport and detached again once it scrolls away.
		*/
		function AtlasThumb({ pet, width = 52, height = 56 }) {
			const ref = react.useRef(null);
			const [shown, setShown] = react.useState(false);
			react.useEffect(() => {
				const el = ref.current;
				if (!el || typeof IntersectionObserver === "undefined") {
					setShown(true);
					return;
				}
				const observer = new IntersectionObserver((entries) => {
					for (const entry of entries) setShown(entry.isIntersecting);
				}, { rootMargin: "300px" });
				observer.observe(el);
				return () => observer.disconnect();
			}, [pet.id, pet.atlasUrl]);
			const rows = pet.rows || (pet.spriteVersionNumber === 2 ? 11 : 9);
			const columns = pet.columns || 8;
			const url = shown && pet.atlasUrl ? "url(\"" + String(pet.atlasUrl).replace(/"/g, "\\\"") + "\")" : "none";
			return react.createElement("div", {
				ref,
				"aria-hidden": "true",
				style: {
					width,
					height,
					flex: "0 0 auto",
					borderRadius: "6px",
					background: "rgba(128,128,128,0.14)",
					backgroundImage: url,
					backgroundSize: columns * 100 + "% " + rows * 100 + "%",
					backgroundPosition: "0% 0%",
					backgroundRepeat: "no-repeat"
				}
			});
		}
		/** The pet picker: source switch, discovery hint, thumbnail cards. */
		function PetGallery({ pets, petId, codexPets, codexPetsDir, post }) {
			const list = Array.isArray(pets) ? pets : [];
			const groups = groupPets(list);
			const codexEnabled = !codexPets || codexPets.enabled !== false;
			const codexCount = list.filter((pet) => pet && pet.source === "codex").length;
			const dir = codexPetsDir ? String(codexPetsDir) : "";
			let hint;
			if (!codexEnabled) hint = "已关闭：只显示内置与「我的桌宠」里的图集。重新打开即可再次读取 Codex 的桌宠。";
			else if (codexCount > 0) hint = "已从 " + (dir || "Codex 桌宠目录") + " 读取到 " + codexCount + " 个桌宠（原地读取，不会复制文件）。";
			else hint = "没有在 " + (dir || "Codex 桌宠目录") + " 找到桌宠；装好 Codex 桌宠后重开本页面即可看到。";
			return react.createElement("div", { style: {
				display: "grid",
				gap: "10px"
			} }, checkboxField("读取本机 Codex 桌宠（默认开启）", codexEnabled, (e) => post("/api/codex-pet/set-config", { codexPets: { enabled: e.target.checked } })), react.createElement("div", { style: {
				fontSize: "12px",
				marginTop: "-4px",
				wordBreak: "break-all",
				color: codexEnabled ? "#9aa0a6" : "#e5a13b"
			} }, hint), groups.map((group) => react.createElement("div", {
				key: group.source,
				style: {
					display: "grid",
					gap: "6px"
				}
			}, react.createElement("div", { style: {
				fontSize: "12px",
				color: "#9aa0a6"
			} }, group.title + "（" + group.items.length + "）"), react.createElement("div", { style: {
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill,minmax(92px,1fr))",
				gap: "8px"
			} }, group.items.map((pet) => {
				const selected = pet.id === petId;
				const version = pet.spriteVersionNumber === 2 ? "v2" : "v1";
				return react.createElement("button", {
					key: pet.id,
					type: "button",
					title: (pet.description || pet.displayName || pet.id) + "（" + version + " 图集）",
					onClick: () => {
						if (!selected) post("/api/codex-pet/set-pet", { petId: pet.id });
					},
					style: {
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "4px",
						padding: "6px 4px",
						borderRadius: "8px",
						cursor: selected ? "default" : "pointer",
						border: selected ? "1px solid #4c8dff" : "1px solid rgba(128,128,128,0.28)",
						background: selected ? "rgba(76,141,255,0.14)" : "rgba(128,128,128,0.08)",
						color: "inherit",
						font: "inherit",
						textAlign: "center"
					}
				}, react.createElement(AtlasThumb, { pet }), react.createElement("span", { style: {
					fontSize: "12px",
					lineHeight: 1.25,
					maxWidth: "88px",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				} }, (selected ? "✓ " : "") + (pet.displayName || pet.id)), react.createElement("span", { style: {
					fontSize: "10px",
					lineHeight: 1.2,
					padding: "0 5px",
					borderRadius: "999px",
					color: version === "v2" ? "#8ab4ff" : "#9aa0a6",
					border: "1px solid " + (version === "v2" ? "rgba(138,180,255,0.5)" : "rgba(128,128,128,0.4)")
				} }, version));
			})))));
		}
		function SummaryControls({ summary, reload }) {
			const [providers, setProviders] = react.useState(null);
			const [error, setError] = react.useState("");
			react.useEffect(() => {
				let cancelled = false;
				fetch("/api/codex-pet/models").then((r) => {
					if (!r.ok) throw new Error(r.status === 404 ? "插件尚未重载：请重启一次 DSH Web 后再试" : "HTTP " + r.status);
					return r.json();
				}).then((d) => {
					if (cancelled) return;
					setProviders(d.providers || []);
				}).catch((e) => {
					if (!cancelled) setError("模型列表加载失败：" + (e && e.message || "网络错误"));
				});
				return () => {
					cancelled = true;
				};
			}, []);
			const post = (patch) => {
				setError("");
				fetch("/api/codex-pet/set-config", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ summary: patch })
				}).then((r) => {
					if (!r.ok) throw new Error("HTTP " + r.status);
					reload();
				}).catch((e) => setError("总结设置保存失败：" + (e && e.message || "网络错误")));
			};
			const s = summary || {};
			const providerOptions = providers || [];
			const selectedProvider = s.provider || "";
			const selectedModel = s.model || "";
			const routeConfigured = !!selectedProvider && !!selectedModel;
			const modelsOf = (pid) => {
				const entry = providerOptions.find((pr) => pr.id === pid);
				return entry ? entry.models : [];
			};
			return react.createElement("div", { style: {
				display: "grid",
				gap: "10px"
			} }, checkboxField("启用定期总结 Enabled", routeConfigured && s.enabled === true, (e) => post({ enabled: e.target.checked }), !routeConfigured), !routeConfigured ? react.createElement("div", { style: {
				color: "#e5a13b",
				fontSize: "12px",
				marginTop: "-6px"
			} }, "请先选择 Provider 和 Model / Select provider and model first.") : null, field("每 N 次模型请求总结一次 Interval (requests)", react.createElement(NumberField, {
				value: typeof s.intervalRequests === "number" ? s.intervalRequests : 5,
				min: 1,
				max: 50,
				onCommit: (n) => post({ intervalRequests: n })
			})), field("总结模型 Provider", react.createElement("select", {
				value: selectedProvider,
				disabled: !providers,
				style: { padding: "6px 8px" },
				onChange: (e) => post({
					provider: e.target.value,
					model: ""
				})
			}, react.createElement("option", { value: "" }, providers ? "请选择 Provider" : "加载中…"), providerOptions.map((pr) => react.createElement("option", {
				key: pr.id,
				value: pr.id
			}, pr.name || pr.id)))), field("总结模型 Model", react.createElement("select", {
				value: selectedModel,
				disabled: !selectedProvider || !providers,
				style: { padding: "6px 8px" },
				onChange: (e) => post({ model: e.target.value })
			}, react.createElement("option", { value: "" }, selectedProvider ? "请选择 Model" : "—"), modelsOf(selectedProvider).map((m) => react.createElement("option", {
				key: m.id,
				value: m.id
			}, m.name || m.id)))), field("总结气泡停留秒数 Bubble seconds", react.createElement(NumberField, {
				value: typeof s.bubbleSeconds === "number" ? s.bubbleSeconds : 12,
				min: 3,
				max: 120,
				onCommit: (n) => post({ bubbleSeconds: n })
			})), react.createElement("div", { style: {
				color: "#9aa0a6",
				fontSize: "12px"
			} }, "请先选择 Provider 和 Model，再自行开启。开启后会将有长度限制的用户、助手、工具和错误摘录发送给所选 LLM 生成总结，并产生该 Provider 的用量/费用；建议选择低成本模型。"), error ? react.createElement("div", { style: {
				color: "#e5a13b",
				fontSize: "12px"
			} }, error) : null);
		}
		function SoundControls({ sound, hasCustomSounds, reload }) {
			const inputRef = react.useRef(null);
			const uploadTrackRef = react.useRef("done");
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState("");
			const post = (patch) => {
				setError("");
				fetch("/api/codex-pet/set-config", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sound: patch })
				}).then((r) => {
					if (!r.ok) throw new Error("HTTP " + r.status);
					reload();
				}).catch((e) => setError("场景语音设置保存失败：" + (e && e.message || "网络错误")));
			};
			const previewTrack = (track) => {
				setError("");
				try {
					const audio = new Audio("/codex-pet-sound?track=" + track + "&t=" + Date.now());
					const tv = sound && sound.tracks && sound.tracks[track] && sound.tracks[track].volume;
					audio.volume = Math.max(0, Math.min(1, ((sound && sound.volume) ?? 60) * (typeof tv === "number" ? tv : 100) / 1e4));
					audio.play().catch((e) => {
						if (e && e.name === "NotAllowedError") setError("浏览器自动播放策略拦截：先在页面上任意点击一次再试");
						else setError(track + " 音加载失败（" + (e && e.name || "未知") + "）");
					});
				} catch {
					setError("音频播放失败");
				}
			};
			const onFile = (e) => {
				const file = e.target.files && e.target.files[0];
				e.target.value = "";
				if (!file) return;
				setBusy(true);
				setError("");
				fetch("/api/codex-pet/sound?track=" + encodeURIComponent(uploadTrackRef.current || "done"), {
					method: "POST",
					body: file
				}).then((r) => r.json()).then((d) => {
					if (d && d.ok === false) throw new Error(d.error || "上传失败");
					reload();
				}).catch((e2) => setError(e2 && e2.message ? String(e2.message) : "上传失败")).finally(() => setBusy(false));
			};
			const masterOn = !((sound && sound.enabled) === false);
			const tracksCfg = sound && sound.tracks || {};
			const customMap = hasCustomSounds || {};
			const volume = sound && typeof sound.volume === "number" ? sound.volume : 60;
			const dimmed = {
				opacity: masterOn ? 1 : .4,
				pointerEvents: masterOn ? "auto" : "none",
				transition: "opacity 0.25s ease"
			};
			const ghostButton = {
				background: "transparent",
				border: "1px solid rgba(255,255,255,0.14)",
				color: "#c9ccd4",
				padding: "3px 10px",
				borderRadius: "6px",
				fontSize: "12px",
				cursor: "pointer",
				whiteSpace: "nowrap"
			};
			const previewButton = Object.assign({}, ghostButton, {
				color: "#9ec1ff",
				borderColor: "rgba(158,193,255,0.35)"
			});
			const trackCfg = (id) => tracksCfg[id] || {};
			const trackVolume = (id) => {
				const v = trackCfg(id).volume;
				return typeof v === "number" ? v : 100;
			};
			const SCENARIOS = [
				{
					id: "done",
					label: "任务完成时"
				},
				{
					id: "error",
					label: "遇到错误时"
				},
				{
					id: "interrupt",
					label: "被中断时"
				}
			];
			const scenarioRow = (sc) => react.createElement("div", {
				key: sc.id,
				style: {
					display: "grid",
					gap: "7px",
					padding: "9px 11px",
					borderRadius: "8px",
					background: "rgba(255,255,255,0.025)"
				}
			}, react.createElement("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: "8px"
			} }, react.createElement("input", {
				type: "checkbox",
				checked: trackCfg(sc.id).enabled !== false,
				onChange: (e) => post({ tracks: Object.assign({}, tracksCfg, { [sc.id]: Object.assign({}, trackCfg(sc.id), { enabled: e.target.checked }) }) })
			}), react.createElement("span", { style: {
				fontSize: "13px",
				color: "#e2e2e2",
				whiteSpace: "nowrap"
			} }, sc.label), react.createElement("span", { style: { flex: 1 } }), react.createElement("button", {
				type: "button",
				onClick: () => previewTrack(sc.id),
				style: previewButton,
				title: "试听这条场景语音"
			}, "▶ 试听")), react.createElement("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				paddingLeft: "24px"
			} }, react.createElement("span", { style: {
				fontSize: "11px",
				color: "#8b8b8b",
				whiteSpace: "nowrap"
			} }, "音量"), react.createElement("input", {
				type: "range",
				min: 0,
				max: 100,
				step: 10,
				value: trackVolume(sc.id),
				title: "这条场景的相对音量（最终音量 = 总音量 × 此处）",
				style: {
					flex: 1,
					minWidth: 0,
					maxWidth: "170px",
					accentColor: "#9ec1ff"
				},
				onChange: (e) => post({ tracks: Object.assign({}, tracksCfg, { [sc.id]: Object.assign({}, trackCfg(sc.id), { volume: Number(e.target.value) }) }) })
			}), react.createElement("span", { style: {
				fontSize: "11px",
				color: "#9aa0a6",
				minWidth: "34px",
				textAlign: "right",
				whiteSpace: "nowrap"
			} }, trackVolume(sc.id) + "%"), react.createElement("button", {
				type: "button",
				onClick: () => {
					uploadTrackRef.current = sc.id;
					if (inputRef.current) inputRef.current.click();
				},
				disabled: busy,
				style: Object.assign({}, ghostButton, { marginLeft: "auto" }),
				title: "上传这条场景的自定义音频（wav / mp3 / ogg / m4a / flac / webm）"
			}, busy && uploadTrackRef.current === sc.id ? "上传中…" : "自定义音频"), customMap[sc.id] ? react.createElement("button", {
				type: "button",
				onClick: () => {
					setError("");
					fetch("/api/codex-pet/reset-sound?track=" + sc.id, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: "{}"
					}).then((r) => {
						if (!r.ok) throw new Error("HTTP " + r.status);
						reload();
					}).catch((e) => setError("恢复内置音频失败：" + (e && e.message || "网络错误")));
				},
				style: ghostButton,
				title: "移除自定义音频，回到内置"
			}, "内置") : null));
			return react.createElement("div", { style: {
				display: "grid",
				gap: "10px"
			} }, react.createElement("div", { style: {
				display: "grid",
				gap: "10px"
			} }, react.createElement("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between"
			} }, react.createElement("span", { style: {
				fontSize: "13px",
				color: "#e2e2e2"
			} }, "启用场景语音"), react.createElement("label", { style: {
				display: "flex",
				alignItems: "center",
				gap: "6px",
				cursor: "pointer"
			} }, react.createElement("input", {
				type: "checkbox",
				checked: masterOn,
				onChange: (e) => post({ enabled: e.target.checked })
			}), react.createElement("span", { style: {
				fontSize: "12px",
				color: "#9aa0a6"
			} }, masterOn ? "开" : "关"))), react.createElement("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: "8px"
			} }, react.createElement("span", { style: {
				fontSize: "11px",
				color: "#8b8b8b",
				whiteSpace: "nowrap"
			} }, "音量"), react.createElement("input", {
				type: "range",
				min: 0,
				max: 100,
				step: 5,
				value: volume,
				title: "总音量（最终音量 = 总音量 × 场景音量）",
				style: {
					flex: 1,
					minWidth: 0,
					maxWidth: "220px",
					accentColor: "#9ec1ff"
				},
				onChange: (e) => post({ volume: Number(e.target.value) })
			}), react.createElement("span", { style: {
				fontSize: "12px",
				color: "#9aa0a6",
				minWidth: "34px",
				textAlign: "right",
				whiteSpace: "nowrap"
			} }, volume + "%"))), customMap.done ? react.createElement("div", { style: {
				color: "#d08c3a",
				fontSize: "12px"
			} }, "任务完成音当前使用自定义音频 — 点该行『内置』可回到内置语音轮换。") : null, react.createElement("div", { style: Object.assign({
				display: "grid",
				gap: "8px"
			}, dimmed) }, react.createElement("div", { style: {
				fontSize: "11px",
				color: "#8b8b8b",
				letterSpacing: "0.04em"
			} }, "触发场景 TRIGGER EVENTS"), SCENARIOS.map(scenarioRow)), react.createElement("input", {
				ref: inputRef,
				type: "file",
				accept: ".wav,.mp3,.ogg,.m4a,.flac,.webm",
				style: { display: "none" },
				onChange: onFile
			}), error ? react.createElement("div", { style: {
				color: "#e5484d",
				fontSize: "12px"
			} }, error) : null);
		}
		function SettingsSection() {
			const [state, setState] = react.useState(null);
			const load = () => {
				fetch("/api/codex-pet/state").then((r) => r.json()).then((d) => setState(d)).catch(() => {});
			};
			react.useEffect(() => {
				load();
			}, []);
			if (!state || !state.display) return react.createElement("div", { style: {
				padding: "16px",
				color: "#888"
			} }, "加载中…");
			const v = state.display;
			const pets = state.pets || [];
			const selectedPetIsV2 = !!(state.pet && state.pet.spriteVersionNumber === 2);
			const post = (path, body) => {
				fetch(path, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				}).then(() => load()).catch(() => {});
			};
			return react.createElement("div", { style: {
				padding: "16px",
				display: "grid",
				gap: "14px",
				maxWidth: "440px"
			} }, field("宠物 Pet", react.createElement(PetGallery, {
				pets,
				petId: state.petId ?? "",
				codexPets: state.codexPets,
				codexPetsDir: state.codexPetsDir,
				post
			})), field("位置 Pin", react.createElement("select", {
				value: v.pin ?? "bottom-right",
				style: { padding: "6px 8px" },
				onChange: (e) => post("/api/codex-pet/set-config", { pin: e.target.value })
			}, PINS.map((p) => react.createElement("option", {
				key: p,
				value: p
			}, p)))), field("大小 Size", react.createElement(NumberField, {
				value: v.size ?? 120,
				min: 32,
				max: 512,
				onCommit: (n) => post("/api/codex-pet/set-config", { size: n })
			})), checkboxField("显示 Visible", !!v.visible, (e) => post("/api/codex-pet/set-visible", { visible: e.target.checked })), checkboxField("显示模型工作 Model work", v.showModelWork !== false, (e) => post("/api/codex-pet/set-config", { showModelWork: e.target.checked })), checkboxField("右键隐藏 10 秒", v.rightClickHide === true, (e) => post("/api/codex-pet/set-config", { rightClickHide: e.target.checked })), checkboxField("鼠标视觉追踪 Eye tracking（仅 v2 图集）", v.mouseTracking !== false, (e) => post("/api/codex-pet/set-config", { mouseTracking: e.target.checked })), react.createElement("div", { style: {
				color: selectedPetIsV2 ? "#9aa0a6" : "#e5a13b",
				fontSize: "12px",
				marginTop: "-6px"
			} }, selectedPetIsV2 ? "仅 v2 图集支持鼠标追踪：开启后，宠物视线会跟随鼠标。" : "仅 v2 图集支持鼠标追踪，当前所选宠物不是 v2 图集，此设置不会生效。"), field("气泡颜色 Bubble color", react.createElement("select", {
				value: v.bubbleTheme ?? "gray",
				style: { padding: "6px 8px" },
				onChange: (e) => post("/api/codex-pet/set-config", { bubbleTheme: e.target.value })
			}, react.createElement("option", { value: "gray" }, "深灰"), react.createElement("option", { value: "black" }, "黑色"), react.createElement("option", { value: "white" }, "白色"), react.createElement("option", { value: "blue" }, "蓝色"), react.createElement("option", { value: "green" }, "墨绿"), react.createElement("option", { value: "pink" }, "浅粉"), react.createElement("option", { value: "orange" }, "橙色"))), field("气泡透明度 Bubble opacity (%)", react.createElement(NumberField, {
				value: v.bubbleOpacity ?? 94,
				min: 0,
				max: 100,
				onCommit: (n) => post("/api/codex-pet/set-config", { bubbleOpacity: n })
			})), react.createElement(ImportButton, { onImported: load }), sectionTitle("还原 Reset"), react.createElement(ResetControls, { reload: load }), sectionTitle("定期总结 Turn Summary"), react.createElement(SummaryControls, {
				summary: state.summary,
				reload: load
			}), sectionTitle("完成提示音 Done Chime"), react.createElement(SoundControls, {
				sound: state.sound,
				hasCustomSounds: state.hasCustomSounds || {},
				reload: load
			}));
		}
		const inject = ["slots", "sessions"];
		function apply(ctx) {
			const sessions = ctx.sessions;
			const uiSessionSource = createServiceSource(ctx, "uiSession");
			ctx.effect(() => () => uiSessionSource.dispose(), "codex-pet: uiSession lookup");
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-codex-pet",
				order: 100,
				label: "Codex Pet"
			}, (props) => react.createElement(PetOverlay, {
				...props,
				sessions,
				uiSessionSource
			})));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "codex-pet",
				order: 130,
				label: "桌宠"
			}, () => react.createElement(SettingsSection)));
		}
		exports.__internals = {
			SoundControls,
			SummaryControls,
			SettingsSection,
			ResetControls,
			PetGallery,
			AtlasThumb,
			groupPets,
			latestTurnInterrupted,
			latestTurnErrored,
			shouldPlayDone,
			completedTurnsOf,
			completedModelRequestsOf,
			mergeConversationSnapshot,
			useConversationSnapshot,
			legacyProjectionOf,
			createServiceSource,
			buildSummaryPayload,
			baselineAutoTracker,
			isCurrentAutoTrackerSession,
			selectAutoSummaryBatch,
			settleAutoTrackerAfterSummary,
			summaryRouteEnabled,
			pinPlacement,
			bubblePlacement,
			clampPetPosition,
			bubbleContent,
			DEFAULT_PIN,
			REVEAL_RETRIES,
			REVEAL_RETRY_MS
		};
		exports.apply = apply;
		exports.deriveActivity = deriveActivity;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map