"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function GraciasPage() {
  return (
    <Suspense fallback={<CentroCarga />}>
      <GraciasContenido />
    </Suspense>
  );
}

function CentroCarga() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <p style={{ color: "#94a3b8" }}>Cargando...</p>
    </main>
  );
}

function GraciasContenido() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [estado, setEstado] = useState<"cargando" | "listo" | "pendiente" | "error">("cargando");
  const [enlace, setEnlace] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setEstado("error");
      return;
    }

    // Reintenta unas cuantas veces por si el webhook de Stripe todavía
    // no terminó de crear la licencia (normalmente tarda 1-3 segundos).
    let intentos = 0;
    const intervalo = setInterval(async () => {
      intentos++;
      try {
        const res = await fetch(`/api/licencia-por-sesion?session_id=${sessionId}`);
        const data = await res.json();
        if (data.enlace) {
          setEnlace(data.enlace);
          setEstado("listo");
          clearInterval(intervalo);
        } else if (intentos >= 8) {
          setEstado("pendiente");
          clearInterval(intervalo);
        }
      } catch {
        if (intentos >= 8) {
          setEstado("pendiente");
          clearInterval(intervalo);
        }
      }
    }, 1500);

    return () => clearInterval(intervalo);
  }, [sessionId]);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28 }}>🎉 ¡Gracias por tu compra!</h1>

      {estado === "cargando" && <p style={{ color: "#94a3b8" }}>Preparando tu acceso...</p>}

      {estado === "listo" && enlace && (
        <>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>
            Este es tu enlace de acceso único y personal. Guárdalo, también te lo enviamos por correo.
          </p>
          <a
            href={enlace}
            style={{
              display: "inline-block",
              background: "#22c55e",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              wordBreak: "break-all",
            }}
          >
            Abrir mi libro interactivo →
          </a>
        </>
      )}

      {estado === "pendiente" && (
        <p style={{ color: "#94a3b8" }}>
          Tu pago se registró correctamente. Tu enlace de acceso está por confirmarse — revisa tu correo
          en unos minutos, o contáctanos si no llega.
        </p>
      )}

      {estado === "error" && <p style={{ color: "#94a3b8" }}>No se encontró información de la compra.</p>}
    </main>
  );
}
