"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function ComprarPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);

  async function comprar() {
    setCargando(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      alert(data.error || "Error al iniciar el pago");
      setCargando(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 26 }}>Obtén acceso a este libro interactivo</h1>
      <input
        type="email"
        placeholder="Tu correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#1e293b",
          color: "white",
          margin: "20px 0",
        }}
      />
      <button
        onClick={comprar}
        disabled={!email || cargando}
        style={{
          background: "#22c55e",
          color: "white",
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          width: "100%",
        }}
      >
        {cargando ? "Redirigiendo a pago seguro..." : "Comprar acceso"}
      </button>
      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>
        Recibirás tu enlace de acceso único por correo tras confirmarse el pago.
      </p>
    </main>
  );
}
