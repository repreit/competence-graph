import * as THREE from "three";

export function historyTheme() {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(
        ["bg", "ink", "line", "surface"].map(function (key) {
            return [key, styles.getPropertyValue("--" + key).trim()];
        }),
    );
}

export function colorFromCss(value) {
    const color = new THREE.Color();
    if (value) {
        color.setStyle(value);
    }
    return color;
}

function forEachHistoryObject(scene, listener) {
    if (!scene || typeof scene.traverse !== "function") {
        return;
    }
    scene.traverse(function (obj) {
        const data = obj.userData;
        if (data && (data.historyCard || data.historyLink)) {
            listener(obj, data);
        }
    });
}

function paintCardMesh(mesh, theme) {
    const card = mesh?.userData?.historyCard;
    if (!card) {
        return;
    }
    paintCardTexture(card.ctx, card.data, theme, card.image, card.hovered);
    card.tex.needsUpdate = true;
    const mats = mesh.material;
    if (Array.isArray(mats) && mats.length >= 6) {
        mats[0].color.copy(colorFromCss(card.hovered ? theme.ink : theme.line));
        mats[5].color.copy(colorFromCss(theme.surface));
    }
}

export function setOpaque(obj) {
    const mats = obj?.material;
    const list = Array.isArray(mats) ? mats : mats ? [mats] : [];
    list.forEach(function (mat) {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthTest = true;
        mat.depthWrite = true;
    });
}

export function paintCardHover(graph, hoveredNodeId) {
    if (!graph) {
        return;
    }
    const theme = historyTheme();
    forEachHistoryObject(graph.scene(), function (obj, data) {
        const card = data.historyCard;
        if (!card) {
            return;
        }
        const hovered = data.nodeId === hoveredNodeId;
        if (card.hovered === hovered) {
            return;
        }
        card.hovered = hovered;
        paintCardMesh(obj, theme);
    });
}

export function paintLinkHover(graph, hoveredLinkKey) {
    if (!graph) {
        return;
    }
    const theme = historyTheme();
    forEachHistoryObject(graph.scene(), function (obj, data) {
        if (!data.historyLink) {
            return;
        }
        const dim = hoveredLinkKey !== "" && data.linkKey !== hoveredLinkKey;
        obj.material.color.copy(colorFromCss(dim ? theme.line : theme.ink));
    });
}

export function paintHistoryGraph(graph) {
    if (!graph) {
        return;
    }
    const theme = historyTheme();
    const ink = colorFromCss(theme.ink);
    graph.backgroundColor(theme.bg);
    forEachHistoryObject(graph.scene(), function (obj, data) {
        if (data.historyCard) {
            paintCardMesh(obj, theme);
        }
        if (data.historyLink) {
            obj.material.color.copy(ink);
        }
    });
}

export function disposeGraphGpu(graph) {
    if (!graph) {
        return;
    }
    const objects = [];
    forEachHistoryObject(graph.scene(), function (obj) {
        objects.push(obj);
    });
    objects.forEach(disposeObject3D);
}

function disposeMaterial(mat) {
    if (!mat) {
        return;
    }
    if (mat.map) {
        mat.map.dispose();
        mat.map = null;
    }
    mat.dispose();
}

function disposeObject3D(object3D) {
    if (!object3D) {
        return;
    }
    const seen = [];
    object3D.traverse(function (obj) {
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        const mats = obj.material;
        const list = Array.isArray(mats) ? mats : mats ? [mats] : [];
        list.forEach(function (mat) {
            if (mat && seen.indexOf(mat) === -1) {
                seen.push(mat);
                disposeMaterial(mat);
            }
        });
    });
}

function wrapTitle(ctx, text, maxWidth) {
    const words = String(text ?? "")
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
    return lines.slice(0, 2);
}

function paintCover(ctx, image, x, y, w, h) {
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

export function paintCardTexture(ctx, data, theme, image, hovered) {
    const canvas = ctx.canvas;
    const w = canvas.width;
    const titleH = 96;
    const imgH = canvas.height - titleH;
    ctx.fillStyle = theme.surface;
    ctx.fillRect(0, 0, w, canvas.height);
    if (image?.width) {
        paintCover(ctx, image, 0, 0, w, imgH);
    } else {
        ctx.fillStyle = theme.line;
        ctx.fillRect(0, 0, w, imgH);
    }
    ctx.strokeStyle = hovered ? theme.ink : theme.line;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, canvas.height - 4);
    ctx.fillStyle = theme.ink;
    ctx.font = '600 28px Georgia, "Times New Roman", serif';
    ctx.textBaseline = "top";
    const pad = 22;
    const lines = wrapTitle(ctx, data.title ?? "", w - pad * 2);
    let ty = imgH + 16;
    lines.forEach(function (line) {
        ctx.fillText(line, pad, ty);
        ty += 34;
    });
}
