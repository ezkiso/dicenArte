import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CheckoutForm from "@/components/CheckoutForm";

// RF-07/08/09: checkout requiere sesión iniciada (para asociar la orden y el
// log de consentimiento a un usuario).
export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
