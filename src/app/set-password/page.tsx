"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    if (!token) {
        return (
        <p className="text-sm text-red-700">
            Este link no es válido. Pide que te reenvíen la invitación.
        </p>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
        }
        if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
        }

        setLoading(true);
        try {
        const res = await fetch("/api/set-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "No se pudo crear la contraseña.");
        }

        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        } finally {
        setLoading(false);
        }
    }

    if (done) {
        return (
        <p className="text-sm text-base-gray-700">
            Contraseña creada. Redirigiendo al login…
        </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Nueva contraseña
            </label>
            <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-base-gray-300 p-3 text-sm"
            />
        </div>
        <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
            Confirmar contraseña
            </label>
            <input
            id="confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-base-gray-300 p-3 text-sm"
            />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
            type="submit"
            disabled={loading}
            className="w-full bg-base-black px-6 py-3 text-sm font-semibold text-base-white disabled:opacity-50"
        >
            {loading ? "Guardando…" : "Crear contraseña"}
        </button>
        </form>
    );
}

export default function SetPasswordPage() {
    return (
        <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-6 text-xl font-semibold">Crea tu contraseña</h1>
        <Suspense fallback={<p className="text-sm text-base-gray-500">Cargando…</p>}>
            <SetPasswordForm />
        </Suspense>
        </main>
    );
}