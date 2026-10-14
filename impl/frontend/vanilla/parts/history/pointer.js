import { hoveredLink, hoveredNode } from "./graph.js";
import { handleDeedClick, handleGraphLinkClick } from "./history.js";
import { idFrom } from "./link.js";

let press = null;
const hoverWaitMs = 50;

export function bindGraphPointer(el) {
    let viewportEl = el;
    if (viewportEl) {
        viewportEl.addEventListener("pointerdown", function (ev) {
            if (ev.button !== 0) {
                press = null;
                return;
            }
            press = { x: ev.clientX, y: ev.clientY };
        });
        viewportEl.addEventListener("pointerup", function (ev) {
            if (!press || ev.button !== 0) {
                press = null;
                return;
            }
            const dx = ev.clientX - press.x;
            const dy = ev.clientY - press.y;
            press = null;
            if (dx * dx + dy * dy >= 100) {
                return;
            }
            window.setTimeout(function () {
                if (hoveredNode) {
                    handleDeedClick(hoveredNode);
                    return;
                }
                if (hoveredLink) {
                    handleGraphLinkClick(
                        idFrom(hoveredLink.source),
                        idFrom(hoveredLink.target),
                    );
                }
            }, hoverWaitMs);
        });
    }
}
