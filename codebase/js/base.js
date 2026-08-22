const windowEl = document.getElementById("deed-window");
const imageEl = document.getElementById("deed-image");
const titleEl = document.getElementById("deed-title");
const storyEl = document.getElementById("deed-story");
const proofEl = document.getElementById("deed-proof");
const boardEl = document.querySelector(".network-board");
const blurbEl = document.getElementById("example-blurb");
const addressesEl = document.getElementById("addresses");
let histories = [];
let activeAddress = "";
let historyEdges = [];

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
    document.querySelectorAll(".time-scene.is-active").forEach(function (scene) {
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
    const top = fitsAbove
        ? rect.top - height - gap
        : rect.bottom + gap;
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

function openDeed(node) {
    titleEl.textContent = node.dataset.title;
    storyEl.textContent = node.dataset.story;
    proofEl.textContent = node.dataset.proof
        ? "Inspectable: " + node.dataset.proof
        : "";
    proofEl.hidden = !node.dataset.proof;
    imageEl.hidden = !node.dataset.img;
    if (node.dataset.img) {
        imageEl.src = node.dataset.img;
        imageEl.alt = node.dataset.alt || "";
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

function renderHistory(history) {
    const label = shortAddress(history.address) || "Unknown";
    boardEl.setAttribute(
        "aria-label",
        label + ". Click a deed to open details."
    );
    boardEl.querySelectorAll(".node").forEach(function (node) {
        node.remove();
    });

    (history.nodes || []).forEach(function (node) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "node";
        button.dataset.nodeId = node.id;
        button.dataset.title = node.title;
        button.dataset.proof = node.proof || "";
        button.dataset.story = node.story;
        button.dataset.img = node.img;
        button.dataset.alt = node.alt;

        const img = document.createElement("img");
        img.src = node.img;
        img.alt = node.alt;

        const heading = document.createElement("h3");
        heading.textContent = node.title;

        button.appendChild(img);
        button.appendChild(heading);
        button.addEventListener("click", function () {
            openDeed(button);
        });
        boardEl.appendChild(button);
    });
    historyEdges = history.edges || [];
    boardEl.querySelectorAll(".node img").forEach(function (img) {
        img.addEventListener("load", layoutNetwork);
    });
    layoutNetwork();
}

function showHistory(address) {
    const history = histories.find(function (item) {
        return item.address === address;
    }) || histories[0];
    if (!history) {
        return;
    }
    activeAddress = history.address || "";
    addressesEl.querySelectorAll("button").forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.address === activeAddress ? "true" : "false");
    });
    renderHistory(history);
}

function renderAddresses(list) {
    addressesEl.replaceChildren();
    list.forEach(function (history) {
        const address = history.address || "";
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

let layoutWidth = 0;

function layoutNetwork() {
    const nodes = Array.prototype.slice.call(boardEl.querySelectorAll(".node"));
    nodes.forEach(function (node) {
        node.classList.remove("is-hub");
    });
    if (!nodes.length) {
        boardEl.style.height = "";
        layoutWidth = boardEl.clientWidth;
        drawNetworkLines();
        return;
    }

    const degree = {};
    nodes.forEach(function (node, index) {
        degree[node.dataset.nodeId] = 0;
        node.dataset.order = String(index);
    });
    historyEdges.forEach(function (edge) {
        const ends = edge.ends || [];
        if (Object.prototype.hasOwnProperty.call(degree, ends[0])) {
            degree[ends[0]] += 1;
        }
        if (Object.prototype.hasOwnProperty.call(degree, ends[1])) {
            degree[ends[1]] += 1;
        }
    });
    nodes.sort(function (a, b) {
        const byDeg = degree[b.dataset.nodeId] - degree[a.dataset.nodeId];
        if (byDeg !== 0) {
            return byDeg;
        }
        return Number(a.dataset.order) - Number(b.dataset.order);
    });

    const width = boardEl.clientWidth;
    const hub = nodes[0];
    const rest = nodes.slice(1);
    const hubW = Math.min(240, Math.max(176, width * 0.3));
    const nodeW = Math.min(200, Math.max(148, width * 0.24));
    hub.classList.add("is-hub");
    hub.style.position = "absolute";
    hub.style.width = hubW + "px";
    rest.forEach(function (node) {
        node.style.position = "absolute";
        node.style.width = nodeW + "px";
    });

    const hubH = hub.offsetHeight;
    let maxRest = 0;
    rest.forEach(function (node) {
        maxRest = Math.max(maxRest, node.offsetHeight);
    });
    const radius = Math.max(hubW, hubH) / 2 + Math.max(nodeW, maxRest) / 2 + 40;
    const boardH = Math.max(hubH, radius * 2 + maxRest) + 32;
    boardEl.style.height = boardH + "px";
    layoutWidth = width;

    const cx = width / 2;
    const cy = boardH / 2;
    hub.style.left = cx - hubW / 2 + "px";
    hub.style.top = cy - hubH / 2 + "px";
    rest.forEach(function (node, index) {
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / rest.length;
        const w = nodeW;
        const h = node.offsetHeight;
        const x = cx + Math.cos(angle) * radius - w / 2;
        const y = cy + Math.sin(angle) * radius - h / 2;
        node.style.left = Math.max(0, Math.min(x, width - w)) + "px";
        node.style.top = Math.max(0, Math.min(y, boardH - h)) + "px";
    });
    drawNetworkLines();
}

function boxOf(el, boardRect) {
    const r = el.getBoundingClientRect();
    return {
        left: r.left - boardRect.left,
        top: r.top - boardRect.top,
        right: r.right - boardRect.left,
        bottom: r.bottom - boardRect.top,
        cx: (r.left + r.right) / 2 - boardRect.left,
        cy: (r.top + r.bottom) / 2 - boardRect.top
    };
}

function exitPoint(rect, towardX, towardY) {
    const dx = towardX - rect.cx;
    const dy = towardY - rect.cy;
    const hw = (rect.right - rect.left) / 2;
    const hh = (rect.bottom - rect.top) / 2;
    const tx = Math.abs(dx) < 0.01 ? Infinity : hw / Math.abs(dx);
    const ty = Math.abs(dy) < 0.01 ? Infinity : hh / Math.abs(dy);
    const t = Math.min(tx, ty);
    return { x: rect.cx + dx * t, y: rect.cy + dy * t };
}

function drawNetworkLines() {
    const svg = boardEl.querySelector(".network-lines");
    if (!svg) {
        return;
    }
    const boardRect = boardEl.getBoundingClientRect();
    const w = boardRect.width;
    const h = boardRect.height;
    if (w < 8 || h < 8) {
        return;
    }
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    const ns = "http://www.w3.org/2000/svg";
    svg.replaceChildren();

    historyEdges.forEach(function (edge) {
        const ends = edge.ends || [];
        const aNode = boardEl.querySelector('.node[data-node-id="' + ends[0] + '"]');
        const bNode = boardEl.querySelector('.node[data-node-id="' + ends[1] + '"]');
        if (!aNode || !bNode) {
            return;
        }
        const a = boxOf(aNode, boardRect);
        const b = boxOf(bNode, boardRect);
        const start = exitPoint(a, b.cx, b.cy);
        const end = exitPoint(b, a.cx, a.cy);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy);
        if (len < 2) {
            return;
        }
        const pad = Math.min(4, Math.max(0, len / 2 - 1));
        const ux = dx / len;
        const uy = dy / len;
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", start.x + ux * pad);
        line.setAttribute("y1", start.y + uy * pad);
        line.setAttribute("x2", end.x - ux * pad);
        line.setAttribute("y2", end.y - uy * pad);
        line.setAttribute("stroke", "currentColor");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-linecap", "round");
        svg.appendChild(line);
    });
}

fetch("history.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("history.json");
        }
        return response.json();
    })
    .then(function (data) {
        histories = data.histories || [];
        renderAddresses(histories);
        showHistory(histories[0] && histories[0].address);
    })
    .catch(function () {
        blurbEl.hidden = false;
        blurbEl.textContent =
            "Could not load this example. Serve this folder with a local server, or open the GitHub Pages demo.";
    });

if (window.ResizeObserver) {
    new ResizeObserver(function () {
        if (boardEl.clientWidth !== layoutWidth) {
            layoutNetwork();
        } else {
            drawNetworkLines();
        }
    }).observe(boardEl);
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
    return Array.prototype.map.call(clipsEl.querySelectorAll(".clip"), function (clip) {
        const rect = clip.getBoundingClientRect();
        return {
            clip: clip,
            start: (rect.left - lane.left) / lane.width,
            end: (rect.right - lane.left) / lane.width,
            dwell: dwellForClip(clip)
        };
    });
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
    bubbleEl.classList.toggle("is-playing", Boolean(playback) && !playback.paused);
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
            playback.tracks[0].querySelectorAll(".is-on").forEach(function (clip) {
                clip.classList.remove("is-on");
            });
            playback.tracks[1].classList.add("is-live");
            playback.edit.classList.add("is-recut");
            setPlayheadAt(
                playback.edit,
                playback.playhead,
                playback.tracks[1].querySelector(".clips"),
                0
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
        elapsed = elapsedBeforeClip(tracks[1].querySelector(".clips"), fromClip);
    } else if (fromClip && tracks[0] && tracks[0].contains(fromClip)) {
        elapsed = elapsedBeforeClip(tracks[0].querySelector(".clips"), fromClip);
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

window.addEventListener("scroll", function () {
    if (bubbleClip) {
        placeClipBubble(bubbleClip);
    }
}, { passive: true });

window.addEventListener("resize", function () {
    layoutNetwork();
    if (bubbleClip) {
        placeClipBubble(bubbleClip);
    }
});

windowEl.querySelector(".close").addEventListener("click", function () {
    windowEl.close();
});

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
    "https://api.github.com/repos/repreit/competence-graph/commits?per_page=1"
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
