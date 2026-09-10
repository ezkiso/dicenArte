import crypto from "crypto";

export function generateSetupToken() {
    const raw = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return { raw, hash };
}

export function hashToken(raw: string) {
    return crypto.createHash("sha256").update(raw).digest("hex");
}