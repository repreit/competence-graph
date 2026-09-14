export function bindMessage(address, publicKey) {
    if (typeof address !== "string" || publicKey == null) {
        throw new TypeError("attest");
    }
    const key = JSON.stringify(publicKey);
    return `Bind key for ${address}\n${key}`;
}

export function bindContent(publicKey) {
    return JSON.stringify({ type: "bind", publicKey });
}

export function unbindMessage(address, bindingId, publicKey) {
    if (typeof address !== "string" || !Number.isSafeInteger(bindingId)) {
        throw new TypeError("attest");
    }
    if (bindingId < 1 || publicKey == null) {
        throw new TypeError("attest");
    }
    const key = JSON.stringify(publicKey);
    return `Unbind key for ${address}\nBinding: ${bindingId}\n${key}`;
}

export function unbindContent(bindingId, publicKey) {
    return JSON.stringify({
        type: "unbind",
        bindingId,
        publicKey,
    });
}

export function parseBindContent(content) {
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch {
        return null;
    }
    if (parsed?.type !== "bind" || parsed.publicKey == null) {
        return null;
    }
    if (typeof parsed.publicKey !== "object") {
        return null;
    }
    return parsed.publicKey;
}
