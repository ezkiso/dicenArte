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
    include: { items: { include: { product: true } } },
  });
  if (!order) return;

  const salesEmail = process.env.SALES_NOTIFICATION_EMAIL?.trim() || "info@dicenarte.cl";

  if (!apiKey || !from) {
    console.error(
      "No se enviaron los emails de la orden: faltan RESEND_API_KEY o RESEND_FROM_EMAIL."
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
  const customerSubject = `Compra confirmada #${orderNumber} - DicenArte`;
  const customerText = [
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
  const customerHtml = `
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
  const customerEmail = order.customerEmail.trim();
  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: salesEmail,
      subject: `Nueva venta #${orderNumber} - DicenArte`,
      text: [
        `Nueva venta confirmada: orden #${orderNumber}`,
        `Cliente: ${customerName}`,
        `Correo: ${order.customerEmail}`,
        "",
        ...itemLines,
        "",
        `Total: ${formatClp(order.totalClp)}`,
        `Dirección de despacho: ${order.shippingAddress}`,
      ].join("\n"),
      html: `
        <h1>Nueva venta confirmada</h1>
        <p>Orden <strong>#${orderNumber}</strong></p>
        <p><strong>Cliente:</strong> ${escapeHtml(customerName)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(order.customerEmail)}</p>
        <h2>Detalle de la compra</h2>
        <ul>${itemHtml}</ul>
        <p><strong>Total: ${escapeHtml(formatClp(order.totalClp))}</strong></p>
        <p><strong>Dirección de despacho:</strong> ${escapeHtml(order.shippingAddress)}</p>
      `,
    }),
    resend.emails.send({
      from,
      to: customerEmail,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    }),
  ]);

  const failures = results.flatMap((result, index) => {
    const recipient = index === 0 ? salesEmail : customerEmail;
    if (result.status === "rejected") {
      return [`${recipient}: ${result.reason instanceof Error ? result.reason.message : "falló el envío"}`];
    }
    return result.value.error ? [`${recipient}: ${result.value.error.message}`] : [];
  });
  if (failures.length > 0) {
    throw new Error(`No se pudieron enviar todos los comprobantes: ${failures.join("; ")}`);
  }

  console.info(
    `Comprobantes de la orden ${orderNumber} enviados a ${salesEmail} y ${customerEmail}.`
  );
}
