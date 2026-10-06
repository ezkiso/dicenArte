import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// RNF-06: límite de intentos por IP en rutas sensibles, para prevenir DoS
// y fuerza bruta.

// Intentos de login: máximo 5 por minuto por IP.
export const loginRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:login",
});

// Set-password: máximo 10 por hora por IP (protege contra spam de tokens).
export const setPasswordRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "ratelimit:set-password",
});

// Checkout: máximo 10 órdenes cada 10 minutos por IP (protege el stock
// reservado contra abuso).
export const checkoutRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "ratelimit:checkout",
});

// Limita verificaciones de direcciones para proteger la cuota de Geocoding API.
export const shippingQuoteRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "10 m"),
    prefix: "ratelimit:shipping-quote",
});