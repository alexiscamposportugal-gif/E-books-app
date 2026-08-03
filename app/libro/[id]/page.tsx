"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Capitulo = {
  titulo: string;
  resumen: string;
  contenido: string;
  preguntas: { pregunta: string; opciones: string[]; respuestaCorrecta: number }[];
};

function obtenerIdDispositivo(): string {
  const clave = "device_id_ebooks";
  let id = localStorage.getItem(clave);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(clave, id);
  }
  return id;
}

export default function LibroPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [estado, setEstado] = useState<"cargando" | "denegado" | "ok">("cargando");
  const [motivoDenegado, setMotivoDenegado] = useState("");
  const [libro, setLibro] = useState<{ title: string; interactive_content: { titulo: string; capitulos: Capitulo[] } } | null>(null);
  const [capituloActual, setCapituloActual] = useState(0);
  const [respuestasElegidas, setRespuestasElegidas] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!token) {
      setEstado("denegado");
      setMotivoDenegado("Falta el enlace de acceso");
      return;
    }
    const deviceId = obtenerIdDispositivo();

    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, deviceId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valido) {
          setLibro(data.libro);
          setEstado("ok");
        } else {
          setMotivoDenegado(data.motivo || "Acceso denegado");
          setEstado("denegado");
        }
      });
  }, [token]);

  if (estado === "cargando") {
    return <CentroTexto>Verificando tu acceso...</CentroTexto>;
  }

  if (estado === "denegado") {
    return <CentroTexto>🔒 {motivoDenegado}</CentroTexto>;
  }

  const capitulos = libro!.interactive_content.capitulos;
  const capitulo = capitulos[capituloActual];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ color: "#94a3b8", fontSize: 14 }}>{libro!.title}</h2>
      <h1 style={{ fontSize: 28 }}>{capitulo.titulo}</h1>
      <p style={{ color: "#94a3b8" }}>{capitulo.resumen}</p>
      <div style={{ marginTop: 24, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{capitulo.contenido}</div>

      {capitulo.preguntas.length > 0 && (
        <section style={{ marginTop: 40, background: "#1e293b", padding: 20, borderRadius: 12 }}>
          <h3>🧠 Pon a prueba lo que aprendiste</h3>
          {capitulo.preguntas.map((p, i) => (
            <div key={i} style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600 }}>{p.pregunta}</p>
              {p.opciones.map((opcion, j) => {
                const elegida = respuestasElegidas[i];
                const esCorrecta = j === p.respuestaCorrecta;
                let color = "#334155";
                if (elegida !== undefined) {
                  if (j === elegida && esCorrecta) color = "#16a34a";
                  else if (j === elegida && !esCorrecta) color = "#dc2626";
                  else if (esCorrecta) color = "#16a34a55";
                }
                return (
                  <button
                    key={j}
                    onClick={() => setRespuestasElegidas((prev) => ({ ...prev, [i]: j }))}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      margin: "6px 0",
                      padding: 10,
                      borderRadius: 8,
                      border: "none",
                      background: color,
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {opcion}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      )}

      <nav style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button
          onClick={() => setCapituloActual((c) => Math.max(0, c - 1))}
          disabled={capituloActual === 0}
          style={estiloBoton}
        >
          ← Anterior
        </button>
        <span style={{ color: "#94a3b8" }}>
          Capítulo {capituloActual + 1} de {capitulos.length}
        </span>
        <button
          onClick={() => setCapituloActual((c) => Math.min(capitulos.length - 1, c + 1))}
          disabled={capituloActual === capitulos.length - 1}
          style={estiloBoton}
        >
          Siguiente →
        </button>
      </nav>
    </main>
  );
}

function CentroTexto({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ fontSize: 18 }}>{children}</p>
    </main>
  );
}

const estiloBoton: React.CSSProperties = {
  background: "#6366f1",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
};
