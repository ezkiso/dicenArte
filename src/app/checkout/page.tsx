import CheckoutForm from "@/components/CheckoutForm";

// El checkout ahora admite compra de invitado: ya no exige sesión iniciada.
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}