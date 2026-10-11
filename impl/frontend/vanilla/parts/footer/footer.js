import { chain } from "impl/common/js/config.js";
import { api } from "../../common/js/api.js";
import { lang } from "../../common/js/lang.js";

export function bindFooter() {
    renderLatestAnchor();
}

async function renderLatestAnchor() {
    const linkEl = document.getElementById("anchor-latest");
    const textEl = document.getElementById("anchor-latest-text");
    if (!linkEl || !textEl) {
        return;
    }
    let data;
    try {
        data = await api("/anchors/list", { auth: false });
    } catch {
        return;
    }
    const latest = data.anchors.at(-1);
    if (!latest) {
        return;
    }
    linkEl.href = chain.explorerUrl + "/tx/" + latest.txHash;
    textEl.textContent =
        lang.ANCHOR_LATEST +
        " " +
        new Date(latest.timestamp).toLocaleString("en-US", {
            timeZoneName: "short",
        });
    linkEl.hidden = false;
}
