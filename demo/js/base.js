import * as THREE from "https://esm.sh/three@0.170.0";

const windowEl = document.getElementById("deed-window");
const imageEl = document.getElementById("deed-image");
const titleEl = document.getElementById("deed-title");
const linkEl = document.getElementById("deed-link");
const boardEl = document.querySelector(".network-board");
const blurbEl = document.getElementById("example-blurb");
const addressesEl = document.getElementById("addresses");
let accounts = [];
let activeAddress = "";
let historyGraph = null;

const bubbleEl = document.getElementById("clip-bubble");
const bubbleImg = document.getElementById("clip-bubble-image");
const bubbleTitle = document.getElementById("clip-bubble-title");
const bubbleKind = document.getElementById("clip-bubble-kind");
const bubbleStory = document.getElementById("clip-bubble-story");
const bubbleTransportEl = document.getElementById("bubble-transport");
let bubbleClip = null;

function hideClipBubble() {
    if (playback) {
        return;
    }
    bubbleClip = null;
    bubbleEl.hidden = true;
    bubbleTransportEl.hidden = true;
    document.body.classList.remove("timeline-focus");
    document
        .querySelectorAll(".time-scene.is-active")
        .forEach(function (scene) {
            scene.classList.remove("is-active");
        });
}

function placeClipBubble(clip) {
    const rect = clip.getBoundingClientRect();
    const gap = 12;
    const width = bubbleEl.offsetWidth;
    const height = bubbleEl.offsetHeight;
    const center = rect.left + rect.width / 2;
    let left = center - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const fitsAbove = rect.top > height + gap + 8;
    bubbleEl.classList.toggle("below", !fitsAbove);
    const top = fitsAbove ? rect.top - height - gap : rect.bottom + gap;
    bubbleEl.style.left = left + "px";
    bubbleEl.style.top = top + "px";
    bubbleEl.style.setProperty("--tail-x", center - left + "px");
}

function showClipBubble(clip) {
    bubbleClip = clip;
    document.body.classList.add("timeline-focus");
    const scene = clip.closest(".time-scene");
    document.querySelectorAll(".time-scene.is-active").forEach(function (el) {
        el.classList.remove("is-active");
    });
    if (scene) {
        scene.classList.add("is-active");
    }
    bubbleTitle.textContent = clip.dataset.title;
    bubbleKind.textContent = clip.dataset.kind || "";
    bubbleKind.hidden = !clip.dataset.kind;
    bubbleStory.textContent = clip.dataset.story;
    if (clip.dataset.img) {
        bubbleImg.hidden = false;
        bubbleImg.src = clip.dataset.img;
        bubbleImg.alt = clip.dataset.alt || "";
    } else {
        bubbleImg.hidden = true;
        bubbleImg.removeAttribute("src");
    }
    bubbleEl.hidden = false;
    bubbleTransportEl.hidden = false;
    placeClipBubble(clip);
}

bubbleImg.addEventListener("load", function () {
    if (bubbleClip) {
        placeClipBubble(bubbleClip);
    }
});

function openDeed(data) {
    data = data || {};
    titleEl.textContent = data.title || "";
    if (data.link) {
        linkEl.hidden = false;
        linkEl.href = data.link;
        linkEl.textContent = data.link;
    } else {
        linkEl.hidden = true;
        linkEl.removeAttribute("href");
        linkEl.textContent = "";
    }
    imageEl.hidden = !data.img;
    if (data.img) {
        imageEl.src = data.img;
        imageEl.alt = data.alt || "";
    } else {
        imageEl.removeAttribute("src");
        imageEl.alt = "";
    }
    const scrollY = window.scrollY;
    windowEl.showModal();
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
}

function unlockScroll() {
    const top = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, Math.abs(parseInt(top || "0", 10)));
}

function shortAddress(address) {
    if (!address) {
        return "";
    }
    if (address.length < 12) {
        return address;
    }
    return address.slice(0, 6) + "…" + address.slice(-4);
}

function pairsFromNodes(nodes) {
    const seen = {};
    const pairs = [];
    (nodes || []).forEach(function (node) {
        (node.nodeIds || []).forEach(function (otherId) {
            if (!otherId || otherId === node.id) {
                return;
            }
            const a = node.id;
            const b = otherId;
            const key = a < b ? a + "|" + b : b + "|" + a;
            if (!seen[key]) {
                seen[key] = true;
                pairs.push([a, b]);
            }
        });
    });
    return pairs;
}

function graphDataFromHistory(history) {
    const sourceNodes = (history && history.nodes) || [];
    const nodes = sourceNodes.map(function (node) {
        const data = node.data || {};
        const item = {
            id: node.id,
            name: data.title || node.id,
            data: data,
        };
        const pos = node.position;
        if (
            pos &&
            typeof pos.x === "number" &&
            typeof pos.y === "number" &&
            typeof pos.z === "number" &&
            isFinite(pos.x) &&
            isFinite(pos.y) &&
            isFinite(pos.z)
        ) {
            item.fx = pos.x;
            item.fy = pos.y;
            item.fz = pos.z;
        }
        return item;
    });
    const links = pairsFromNodes(sourceNodes).map(function (pair) {
        return { source: pair[0], target: pair[1] };
    });
    return { nodes: nodes, links: links };
}

function historyTheme() {
    const styles = getComputedStyle(document.documentElement);
    return {
        bg: styles.getPropertyValue("--bg").trim(),
        ink: styles.getPropertyValue("--ink").trim(),
        line: styles.getPropertyValue("--line").trim(),
        card: styles.getPropertyValue("--card").trim(),
    };
}

function sizeHistoryGraph() {
    if (!historyGraph) {
        return;
    }
    const width = boardEl.clientWidth;
    const height = boardEl.clientHeight;
    if (width < 8 || height < 8) {
        return;
    }
    historyGraph.width(width).height(height);
}

let fitTimer = 0;

function fitHistoryGraph() {
    if (!historyGraph) {
        return;
    }
    const camera = historyGraph.camera();
    if (camera && camera.up) {
        camera.up.set(0, 1, 0);
    }
    const controls = historyGraph.controls();
    if (controls && controls.target) {
        controls.target.set(0, 0, 0);
    }
    historyGraph.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 0);
    historyGraph.zoomToFit(0, 28);
    const cam = historyGraph.cameraPosition();
    if (!cam) {
        return;
    }
    historyGraph.cameraPosition(
        {
            x: cam.x * 0.8,
            y: cam.y * 0.8,
            z: cam.z * 0.8,
        },
        { x: 0, y: 0, z: 0 },
        400,
    );
}

function scheduleFitHistoryGraph() {
    window.clearTimeout(fitTimer);
    fitTimer = window.setTimeout(fitHistoryGraph, 300);
}

function paintHistoryGraph() {
    if (!historyGraph) {
        return;
    }
    historyGraph.backgroundColor(historyTheme().bg);
    historyGraph.refresh();
}

function wrapTitle(ctx, text, maxWidth) {
    const words = String(text || "")
        .split(/\s+/)
        .filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(function (word) {
        const next = line ? line + " " + word : word;
        if (line && ctx.measureText(next).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    });
    if (line) {
        lines.push(line);
    }
    return lines.slice(0, 3);
}

function drawCover(ctx, image, x, y, w, h) {
    const ir = image.width / Math.max(image.height, 1);
    const r = w / h;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;
    if (ir > r) {
        sw = image.height * r;
        sx = (image.width - sw) / 2;
    } else {
        sh = image.width / r;
        sy = (image.height - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function paintCard(ctx, canvas, data, theme, image) {
    const w = canvas.width;
    const titleH = 96;
    const imgH = canvas.height - titleH;
    ctx.fillStyle = theme.card;
    ctx.fillRect(0, 0, w, canvas.height);
    if (image && image.width) {
        drawCover(ctx, image, 0, 0, w, imgH);
    } else {
        ctx.fillStyle = theme.line;
        ctx.fillRect(0, 0, w, imgH);
    }
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, canvas.height - 4);
    ctx.fillStyle = theme.ink;
    ctx.font = '600 28px Georgia, "Times New Roman", serif';
    ctx.textBaseline = "top";
    const pad = 22;
    const lines = wrapTitle(ctx, data.title || "", w - pad * 2);
    let ty = imgH + 22;
    lines.forEach(function (line) {
        ctx.fillText(line, pad, ty);
        ty += 34;
    });
}

const CARD_W = 16;
const CARD_H = CARD_W * (384 / 512);
const CARD_D = 0.55;
const CARD_HX = CARD_W / 2;
const CARD_HY = CARD_H / 2;
const CARD_HZ = CARD_D / 2;
const CARD_DEPTH = {
    depthTest: true,
    depthWrite: true,
    transparent: false,
    opacity: 1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
};

function paintCardOpaque(obj) {
    const mats = obj && obj.material;
    const list = Array.isArray(mats) ? mats : mats ? [mats] : [];
    list.forEach(function (mat) {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthTest = true;
        mat.depthWrite = true;
    });
}

function nodeThreeObject(node) {
    const data = node.data || {};
    const theme = historyTheme();
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    paintCard(ctx, canvas, data, theme, null);
    if (data.img) {
        const image = new Image();
        image.onload = function () {
            paintCard(ctx, canvas, data, theme, image);
            tex.needsUpdate = true;
        };
        image.src = data.img;
    }
    const front = new THREE.MeshBasicMaterial(
        Object.assign({ map: tex, transparent: false, opacity: 1 }, CARD_DEPTH),
    );
    const back = new THREE.MeshBasicMaterial(
        Object.assign(
            { color: theme.card, transparent: false, opacity: 1 },
            CARD_DEPTH,
        ),
    );
    const edge = new THREE.MeshBasicMaterial(
        Object.assign(
            { color: theme.line, transparent: false, opacity: 1 },
            CARD_DEPTH,
        ),
    );
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D),
        [edge, edge, edge, edge, front, back],
    );
    mesh.renderOrder = 1;
    paintCardOpaque(mesh);
    return mesh;
}

function boxExitT(from, toward, hx, hy, hz) {
    const dx = toward.x - from.x;
    const dy = toward.y - from.y;
    const dz = toward.z - from.z;
    let t = Infinity;
    if (dx !== 0) {
        t = Math.min(t, hx / Math.abs(dx));
    }
    if (dy !== 0) {
        t = Math.min(t, hy / Math.abs(dy));
    }
    if (dz !== 0) {
        t = Math.min(t, hz / Math.abs(dz));
    }
    if (!isFinite(t) || t <= 0) {
        return 0;
    }
    return t;
}

function along(from, toward, t) {
    return {
        x: from.x + (toward.x - from.x) * t,
        y: from.y + (toward.y - from.y) * t,
        z: from.z + (toward.z - from.z) * t,
    };
}

function makeLinkObject() {
    const pos = new THREE.BufferAttribute(new Float32Array(6), 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", pos);
    const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
            color: 0x000000,
            depthTest: true,
            depthWrite: false,
        }),
    );
    line.frustumCulled = false;
    return line;
}

function setLineEnds(line, start, end) {
    const geom = line && line.geometry;
    if (!geom) {
        return;
    }
    let pos = geom.getAttribute("position");
    if (!pos || !pos.array || pos.array.length !== 6) {
        pos = new THREE.BufferAttribute(new Float32Array(6), 3);
        pos.setUsage(THREE.DynamicDrawUsage);
        geom.setAttribute("position", pos);
    }
    pos.setXYZ(0, start.x, start.y || 0, start.z || 0);
    pos.setXYZ(1, end.x, end.y || 0, end.z || 0);
    pos.needsUpdate = true;
    if (typeof geom.computeBoundingSphere === "function") {
        geom.computeBoundingSphere();
    }
}

function rimPoint(from, to) {
    const t = boxExitT(from, to, CARD_HX, CARD_HY, Infinity);
    const point = along(from, to, t);
    point.z = from.z + CARD_HZ;
    return point;
}

function clipLinkToCards(linkObject, coords) {
    if (!linkObject) {
        return true;
    }
    const start = rimPoint(coords.start, coords.end);
    const end = rimPoint(coords.end, coords.start);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    if (dx * dx + dy * dy + dz * dz < 1e-6) {
        linkObject.visible = false;
        return true;
    }
    linkObject.visible = true;
    setLineEnds(linkObject, start, end);
    return true;
}

function bindHistoryControls(graph) {
    const controls = graph.controls();
    if (!controls || !controls.mouseButtons) {
        return;
    }
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    if (controls.touches && THREE.TOUCH) {
        controls.touches.ONE = THREE.TOUCH.PAN;
        controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    }
    if ("screenSpacePanning" in controls) {
        controls.screenSpacePanning = true;
    }
}

function ensureHistoryGraph() {
    if (historyGraph) {
        return historyGraph;
    }
    const ForceGraph3D = window.ForceGraph3D;
    if (typeof ForceGraph3D !== "function") {
        blurbEl.hidden = false;
        blurbEl.textContent =
            "Could not load the 3D graph. Check the network and reload.";
        return null;
    }
    historyGraph = new ForceGraph3D(boardEl, { controlType: "orbit" })
        .showNavInfo(false)
        .enableNodeDrag(false)
        .nodeOpacity(1)
        .linkOpacity(1)
        .linkWidth(0)
        .linkThreeObjectExtend(false)
        .linkThreeObject(makeLinkObject)
        .warmupTicks(80)
        .linkPositionUpdate(clipLinkToCards)
        .nodeThreeObject(nodeThreeObject)
        .nodePositionUpdate(function (obj) {
            paintCardOpaque(obj);
        })
        .nodeLabel(function () {
            return "";
        })
        .onNodeClick(function (node) {
            openDeed(node.data || {});
        });
    bindHistoryControls(historyGraph);
    paintHistoryGraph();
    sizeHistoryGraph();
    return historyGraph;
}

function renderHistory(account) {
    const history = (account && account.history) || {};
    const label = shortAddress(account.address) || "Unknown";
    boardEl.setAttribute(
        "aria-label",
        label + ". Click a deed to open details.",
    );
    const graph = ensureHistoryGraph();
    if (!graph) {
        return;
    }
    graph.graphData(graphDataFromHistory(history));
    sizeHistoryGraph();
    scheduleFitHistoryGraph();
}

function showHistory(address) {
    const account =
        accounts.find(function (item) {
            return item.address === address;
        }) || accounts[0];
    if (!account) {
        return;
    }
    activeAddress = account.address || "";
    addressesEl.querySelectorAll("button").forEach(function (button) {
        button.setAttribute(
            "aria-pressed",
            button.dataset.address === activeAddress ? "true" : "false",
        );
    });
    renderHistory(account);
}

function renderAddresses(list) {
    addressesEl.replaceChildren();
    list.forEach(function (account) {
        const address = account.address || "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = address ? "address" : "";
        button.dataset.address = address;
        button.textContent = shortAddress(address) || "Unknown";
        if (address) {
            button.title = address;
        }
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
            showHistory(address);
        });
        addressesEl.appendChild(button);
    });
}

fetch("accounts/index.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("accounts/index.json");
        }
        return response.json();
    })
    .then(function (ids) {
        const list = Array.isArray(ids) ? ids : [];
        return Promise.all(
            list.map(function (id) {
                return fetch("accounts/" + id + ".json").then(
                    function (response) {
                        if (!response.ok) {
                            throw new Error("accounts/" + id + ".json");
                        }
                        return response.json().then(function (data) {
                            return {
                                address: id,
                                history: data.history || { nodes: [] },
                            };
                        });
                    },
                );
            }),
        );
    })
    .then(function (list) {
        accounts = list;
        renderAddresses(accounts);
        showHistory(accounts[0] && accounts[0].address);
    })
    .catch(function () {
        blurbEl.hidden = false;
        blurbEl.textContent =
            "Could not load this example. Serve this folder with a local server, or open the GitHub Pages demo.";
    });

if (window.ResizeObserver) {
    new ResizeObserver(function () {
        sizeHistoryGraph();
    }).observe(boardEl);
}

if (window.matchMedia) {
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", paintHistoryGraph);
}

document.querySelectorAll(".clip").forEach(function (clip) {
    clip.addEventListener("click", function (event) {
        if (playbackLocksClip(clip)) {
            event.preventDefault();
            return;
        }
        showClipBubble(clip);
    });
});

const MIN_DWELL_MS = 5500;
const MAX_DWELL_MS = 12000;
const MS_PER_WORD = 420;
const RECUT_MS = 900;
let playback = null;

function playbackLocksClip(clip) {
    return playback && playback.edit === clip.closest(".time-edit");
}

function dwellForClip(clip) {
    const text = [clip.dataset.title, clip.dataset.kind, clip.dataset.story]
        .filter(Boolean)
        .join(" ");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(MAX_DWELL_MS, Math.max(MIN_DWELL_MS, words * MS_PER_WORD));
}

function clipQueue(clipsEl) {
    const lane = clipsEl.getBoundingClientRect();
    return Array.prototype.map.call(
        clipsEl.querySelectorAll(".clip"),
        function (clip) {
            const rect = clip.getBoundingClientRect();
            return {
                clip: clip,
                start: (rect.left - lane.left) / lane.width,
                end: (rect.right - lane.left) / lane.width,
                dwell: dwellForClip(clip),
            };
        },
    );
}

function setPlayheadAt(edit, playhead, clipsEl, progress) {
    const editRect = edit.getBoundingClientRect();
    const laneRect = clipsEl.getBoundingClientRect();
    playhead.style.left =
        laneRect.left - editRect.left + progress * laneRect.width + "px";
}

function isPlaybackUi(node) {
    if (!node || !node.closest) {
        return false;
    }
    if (node.closest(".clip-bubble, .time-edit .transport")) {
        return true;
    }
    if (!playback) {
        return false;
    }
    const scene = playback.edit.closest(".time-scene");
    return Boolean(scene && scene.contains(node));
}

function setTransportPlaying(playing) {
    const label = playing ? "Pause" : "Play this timeline";
    const buttons = [];
    if (playback && playback.button) {
        buttons.push(playback.button);
    }
    buttons.push(bubbleTransportEl);
    buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", playing ? "true" : "false");
        button.setAttribute("aria-label", label);
    });
    bubbleTransportEl.hidden = bubbleEl.hidden;
    bubbleEl.classList.toggle(
        "is-playing",
        Boolean(playback) && !playback.paused,
    );
}

function stopPlayback() {
    if (!playback) {
        return;
    }
    cancelAnimationFrame(playback.raf);
    playback.edit.classList.remove("is-playing", "is-recut");
    playback.edit.querySelectorAll(".is-live, .is-on").forEach(function (el) {
        el.classList.remove("is-live", "is-on");
    });
    playback.playhead.hidden = true;
    const button = playback.button;
    playback = null;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Play this timeline");
    bubbleTransportEl.hidden = bubbleEl.hidden;
    bubbleTransportEl.setAttribute("aria-pressed", "false");
    bubbleTransportEl.setAttribute("aria-label", "Play this timeline");
    bubbleEl.classList.remove("is-playing");
}

function pausePlayback() {
    if (!playback || playback.paused) {
        return;
    }
    cancelAnimationFrame(playback.raf);
    playback.paused = true;
    playback.elapsed = performance.now() - playback.started;
    setTransportPlaying(false);
}

function resumePlayback() {
    if (!playback || !playback.paused) {
        return;
    }
    playback.paused = false;
    playback.started = performance.now() - playback.elapsed;
    setTransportPlaying(true);
    playback.raf = requestAnimationFrame(tickPlayback);
}

function tickPlayback(now) {
    if (!playback) {
        return;
    }
    if (playback.phase === "recut") {
        const nowClips = playback.tracks[1].querySelector(".clips");
        setPlayheadAt(playback.edit, playback.playhead, nowClips, 0);
        if (now - playback.started >= RECUT_MS) {
            playback.phase = "play";
            playback.pass = 1;
            playback.started = now;
            playback.lastClip = null;
            playback.edit.classList.remove("is-recut");
            playback.raf = requestAnimationFrame(tickPlayback);
            return;
        }
        playback.raf = requestAnimationFrame(tickPlayback);
        return;
    }
    const track = playback.tracks[playback.pass];
    playback.tracks.forEach(function (el, index) {
        el.classList.toggle("is-live", index === playback.pass);
    });
    const clipsEl = track.querySelector(".clips");
    const queue = clipQueue(clipsEl);
    const elapsed = now - playback.started;
    let acc = 0;
    let current = queue[queue.length - 1];
    let local = 1;
    let done = true;
    for (let i = 0; i < queue.length; i += 1) {
        if (elapsed < acc + queue[i].dwell) {
            current = queue[i];
            local = (elapsed - acc) / queue[i].dwell;
            done = false;
            break;
        }
        acc += queue[i].dwell;
    }
    const at = current.start + (current.end - current.start) * local;
    setPlayheadAt(playback.edit, playback.playhead, clipsEl, at);
    clipsEl.querySelectorAll(".clip").forEach(function (clip) {
        clip.classList.toggle("is-on", clip === current.clip);
    });
    if (current.clip !== playback.lastClip) {
        playback.lastClip = current.clip;
        showClipBubble(current.clip);
    } else {
        placeClipBubble(current.clip);
    }
    if (done) {
        if (playback.pass === 0) {
            playback.phase = "recut";
            playback.started = now;
            playback.lastClip = null;
            playback.tracks[0].classList.remove("is-live");
            playback.tracks[0]
                .querySelectorAll(".is-on")
                .forEach(function (clip) {
                    clip.classList.remove("is-on");
                });
            playback.tracks[1].classList.add("is-live");
            playback.edit.classList.add("is-recut");
            setPlayheadAt(
                playback.edit,
                playback.playhead,
                playback.tracks[1].querySelector(".clips"),
                0,
            );
            bubbleEl.hidden = true;
            playback.raf = requestAnimationFrame(tickPlayback);
            return;
        }
        stopPlayback();
        return;
    }
    playback.raf = requestAnimationFrame(tickPlayback);
}

function elapsedBeforeClip(clipsEl, startClip) {
    const queue = clipQueue(clipsEl);
    let acc = 0;
    for (let i = 0; i < queue.length; i += 1) {
        if (queue[i].clip === startClip) {
            return acc;
        }
        acc += queue[i].dwell;
    }
    return 0;
}

function startPlayback(edit, fromClip) {
    const button = edit.querySelector(".transport");
    const playhead = edit.querySelector(".playhead");
    const tracks = edit.querySelectorAll(".track");
    let pass = 0;
    let elapsed = 0;
    if (fromClip && tracks[1] && tracks[1].contains(fromClip)) {
        pass = 1;
        elapsed = elapsedBeforeClip(
            tracks[1].querySelector(".clips"),
            fromClip,
        );
    } else if (fromClip && tracks[0] && tracks[0].contains(fromClip)) {
        elapsed = elapsedBeforeClip(
            tracks[0].querySelector(".clips"),
            fromClip,
        );
    }
    playback = {
        edit: edit,
        button: button,
        playhead: playhead,
        tracks: tracks,
        pass: pass,
        phase: "play",
        started: performance.now() - elapsed,
        elapsed: elapsed,
        paused: false,
        lastClip: null,
        raf: 0,
    };
    edit.classList.add("is-playing");
    playhead.hidden = false;
    setTransportPlaying(true);
    playback.raf = requestAnimationFrame(tickPlayback);
}

function togglePlayback(edit) {
    if (playback && playback.edit === edit) {
        if (playback.paused) {
            resumePlayback();
        } else {
            pausePlayback();
        }
        return;
    }
    if (playback) {
        stopPlayback();
    }
    const fromClip =
        bubbleClip && edit.contains(bubbleClip) ? bubbleClip : null;
    startPlayback(edit, fromClip);
}

document.querySelectorAll(".time-edit").forEach(function (edit) {
    const gutter = edit.querySelector(".ruler-gutter");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "transport";
    button.setAttribute("aria-label", "Play this timeline");
    button.innerHTML =
        '<span class="play-shape" aria-hidden="true"></span>' +
        '<span class="pause-shape" aria-hidden="true"></span>';
    gutter.appendChild(button);

    const playhead = document.createElement("div");
    playhead.className = "playhead";
    playhead.hidden = true;
    edit.appendChild(playhead);

    button.addEventListener("click", function (event) {
        event.stopPropagation();
        togglePlayback(edit);
    });

    edit.addEventListener("focusout", function (event) {
        if (!playback || playback.edit !== edit) {
            return;
        }
        if (isPlaybackUi(event.relatedTarget)) {
            return;
        }
        if (!event.relatedTarget) {
            return;
        }
        stopPlayback();
        hideClipBubble();
    });
});

bubbleTransportEl.addEventListener("click", function (event) {
    event.stopPropagation();
    if (playback) {
        togglePlayback(playback.edit);
        return;
    }
    const clip = bubbleClip;
    const edit = clip && clip.closest(".time-edit");
    if (edit) {
        startPlayback(edit, clip);
    }
});

document.addEventListener("pointerdown", function (event) {
    if (isPlaybackUi(event.target)) {
        return;
    }
    if (playback) {
        stopPlayback();
        hideClipBubble();
        return;
    }
    if (!event.target.closest(".clip")) {
        hideClipBubble();
    }
});

window.addEventListener(
    "scroll",
    function () {
        if (bubbleClip) {
            placeClipBubble(bubbleClip);
        }
    },
    { passive: true },
);

window.addEventListener("resize", function () {
    sizeHistoryGraph();
    if (bubbleClip) {
        placeClipBubble(bubbleClip);
    }
});

windowEl.querySelector(".close").addEventListener("click", function () {
    windowEl.close();
});

const resetViewEl = document.querySelector(".graph-reset");
if (resetViewEl) {
    resetViewEl.addEventListener("click", function () {
        fitHistoryGraph();
    });
}

windowEl.addEventListener("click", function (event) {
    if (event.target === windowEl) {
        windowEl.close();
    }
});

windowEl.addEventListener("close", unlockScroll);

const timeEl = document.getElementById("last-modified");

function showModified(date) {
    timeEl.dateTime = date.toISOString();
    timeEl.textContent = date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

function showModifiedError() {
    timeEl.removeAttribute("datetime");
    timeEl.textContent = "could not load from GitHub";
}

fetch(
    "https://api.github.com/repos/repreit/competence-graph/commits?per_page=1",
)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("github");
        }
        return response.json();
    })
    .then(function (commits) {
        if (
            !Array.isArray(commits) ||
            !commits[0] ||
            !commits[0].commit ||
            !commits[0].commit.committer
        ) {
            throw new Error("github");
        }
        showModified(new Date(commits[0].commit.committer.date));
    })
    .catch(function () {
        showModifiedError();
    });
