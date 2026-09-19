import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatClp } from "@/lib/utils";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendOrderConfirmationEmails(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });
  if (!order) return;

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || admin?.email;

  if (!apiKey || !from || !adminEmail) {
    console.error(
      "No se enviaron los emails de la orden: faltan RESEND_API_KEY, RESEND_FROM_EMAIL o ADMIN_EMAIL."
    );
    return;
  }

  const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim();
  const itemLines = order.items.map(
    (item) =>
      `${item.product.name} x${item.quantity}: ${formatClp(item.unitPriceClp * item.quantity)}`
  );
  const itemHtml = order.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.product.name)} x${item.quantity}: ${escapeHtml(
          formatClp(item.unitPriceClp * item.quantity)
        )}</li>`
    )
    .join("");
  const orderNumber = order.id.slice(-8).toUpperCase();
  const subject = `Compra confirmada #${orderNumber} - DicenArte`;
  const text = [
    `Hola ${customerName},`,
    "",
    `Tu compra fue confirmada. Orden #${orderNumber}`,
    "",
    ...itemLines,
    "",
    `Total: ${formatClp(order.totalClp)}`,
    `Dirección de despacho: ${order.shippingAddress}`,
    "",
    "Gracias por comprar en DicenArte.",
  ].join("\n");
  const html = `
    <h1>Compra confirmada</h1>
    <p>Hola ${escapeHtml(customerName)},</p>
    <p>Tu compra fue confirmada. Orden <strong>#${orderNumber}</strong>.</p>
    <h2>Detalle de la compra</h2>
    <ul>${itemHtml}</ul>
    <p><strong>Total: ${escapeHtml(formatClp(order.totalClp))}</strong></p>
    <p><strong>Dirección de despacho:</strong> ${escapeHtml(order.shippingAddress)}</p>
    <p>Gracias por comprar en DicenArte.</p>
  `;

  const resend = new Resend(apiKey);
  const recipients = [...new Set([order.customerEmail.trim(), adminEmail])];
  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend rechazó el email: ${error.message}`);
  }

  console.info(`Email de confirmación enviado para ${orderNumber}: ${data?.id ?? "sin-id"}`);
}
