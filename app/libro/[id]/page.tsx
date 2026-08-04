"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type TerminoClave = { termino: string; definicion: string };
type Pregunta = {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
};
type Capitulo = {
  titulo: string;
  resumen: string;
  contenido: string;
  puntosClave: string[];
  terminosClave: TerminoClave[];
  preguntas: Pregunta[];
  actividad: string;
};
type LibroInteractivo = {
  titulo: string;
  descripcion: string;
  colorAcento: string;
  capitulos: Capitulo[];
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
  const params = useParams();
  const bookId = params.id as string;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const esVistaPrevia = searchParams.get("preview") === "1";

  const [estado, setEstado] = useState<"cargando" | "denegado" | "ok" | "pedir-clave">(
    esVistaPrevia ? "pedir-clave" : "cargando"
  );
  const [motivoDenegado, setMotivoDenegado] = useState("");
  const [libro, setLibro] = useState<LibroInteractivo | null>(null);
  const [vista, setVista] = useState<"portada" | number>("portada");
  const [completados, setCompletados] = useState<Set<number>>(new Set());
  const [claveAdmin, setClaveAdmin] = useState("");

  const claveProgreso = `progreso_${token}`;

  async function verificarVistaPrevia() {
    setEstado("cargando");
    const res = await fetch("/api/preview-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, claveAdmin }),
    });
    const data = await res.json();
    if (data.valido) {
      setLibro(data.libro.interactive_content);
      setEstado("ok");
    } else {
      setMotivoDenegado(data.motivo || "Acceso denegado");
      setEstado("pedir-clave");
    }
  }

  useEffect(() => {
    if (esVistaPrevia) return; // en modo vista previa se espera a que el admin escriba su clave
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
          setLibro(data.libro.interactive_content);
          setEstado("ok");
          try {
            const guardado = localStorage.getItem(`progreso_${token}`);
            if (guardado) setCompletados(new Set(JSON.parse(guardado)));
          } catch {}
        } else {
          setMotivoDenegado(data.motivo || "Acceso denegado");
          setEstado("denegado");
        }
      });
  }, [token]);

  function marcarCompletado(indice: number) {
    setCompletados((prev) => {
      const nuevo = new Set(prev).add(indice);
      try {
        localStorage.setItem(claveProgreso, JSON.stringify(Array.from(nuevo)));
      } catch {}
      return nuevo;
    });
  }

  if (estado === "cargando") return <CentroTexto>Verificando tu acceso...</CentroTexto>;
  if (estado === "denegado") return <CentroTexto>🔒 {motivoDenegado}</CentroTexto>;
  if (estado === "pedir-clave") {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ width: 320, textAlign: "center" }}>
          <p style={{ fontSize: 15, marginBottom: 14 }}>🔍 Modo vista previa</p>
          <input
            type="password"
            placeholder="Clave de administrador"
            value={claveAdmin}
            onChange={(e) => setClaveAdmin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verificarVistaPrevia()}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "#f2f0ea",
              marginBottom: 10,
            }}
          />
          <button
            onClick={verificarVistaPrevia}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "none",
              background: "#e8a33d",
              color: "#121319",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ver vista previa
          </button>
          {motivoDenegado && <p style={{ color: "#f08080", fontSize: 13, marginTop: 10 }}>{motivoDenegado}</p>}
        </div>
      </main>
    );
  }
  if (!libro) return <CentroTexto>Cargando libro...</CentroTexto>;

  const acento = libro.colorAcento || "#e8a33d";
  const pct = Math.round((completados.size / libro.capitulos.length) * 100);

  return (
    <div className="layout-libro" style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        @keyframes aparecer { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
        .fadein { animation: aparecer .35s ease both; }
        .term-card { cursor:pointer; transition: transform .25s ease; }
        .term-card:hover { transform: translateY(-3px); }
        .opcion-btn:hover { filter: brightness(1.12); }
        .cap-item:hover { background: rgba(255,255,255,0.06) !important; }
        ::selection { background: ${acento}55; }
        @media (max-width: 760px) {
          .layout-libro { flex-direction: column; }
          .barra-lateral { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 18px 16px !important; }
          .barra-lateral .lista-capitulos { flex-direction: row !important; overflow-x: auto; gap: 8px !important; }
          .barra-lateral .lista-capitulos button span:last-child { display: none; }
          main { padding: 28px 18px !important; }
        }
      `}</style>

      {/* Barra lateral */}
      <aside
        className="barra-lateral"
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ cursor: "pointer" }} onClick={() => setVista("portada")}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#8b8c99", textTransform: "uppercase" }}>
            Tu progreso
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <AnilloProgreso porcentaje={pct} color={acento} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{pct}%</div>
              <div style={{ fontSize: 12, color: "#8b8c99" }}>
                {completados.size} de {libro.capitulos.length}
              </div>
            </div>
          </div>
        </div>

        <div className="lista-capitulos" style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {libro.capitulos.map((cap, i) => (
            <button
              key={i}
              onClick={() => setVista(i)}
              className="cap-item"
              style={{
                textAlign: "left",
                background: vista === i ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                borderRadius: 8,
                padding: "10px 10px",
                color: vista === i ? "#fff" : "#c7c8d1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  background: completados.has(i) ? acento : "rgba(255,255,255,0.1)",
                  color: completados.has(i) ? "#121319" : "#8b8c99",
                }}
              >
                {completados.has(i) ? "✓" : i + 1}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cap.titulo}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ flex: 1, padding: "48px 40px", maxWidth: 760 }}>
        {esVistaPrevia && (
          <div
            style={{
              background: "#e8a33d22",
              border: "1px solid #e8a33d55",
              color: "#e8a33d",
              fontSize: 12.5,
              padding: "6px 12px",
              borderRadius: 8,
              display: "inline-block",
              marginBottom: 20,
            }}
          >
            🔍 Estás viendo el modo vista previa (no cuenta como una compra)
          </div>
        )}
        {vista === "portada" ? (
          <Portada libro={libro} acento={acento} onComenzar={() => setVista(0)} completados={completados} />
        ) : (
          <VistaCapitulo
            key={vista}
            capitulo={libro.capitulos[vista]}
            indice={vista}
            total={libro.capitulos.length}
            acento={acento}
            onCompletar={() => marcarCompletado(vista)}
            onIrA={(i) => setVista(i)}
          />
        )}
      </main>
    </div>
  );
}

function Portada({
  libro,
  acento,
  onComenzar,
  completados,
}: {
  libro: LibroInteractivo;
  acento: string;
  onComenzar: () => void;
  completados: Set<number>;
}) {
  return (
    <div className="fadein" style={{ paddingTop: 40 }}>
      <div
        style={{
          display: "inline-block",
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: acento,
          marginBottom: 14,
        }}
      >
        Libro interactivo
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 42, lineHeight: 1.1, margin: 0 }}>
        {libro.titulo}
      </h1>
      <p style={{ color: "#c7c8d1", fontSize: 17, marginTop: 16, maxWidth: 560 }}>{libro.descripcion}</p>

      <button
        onClick={onComenzar}
        style={{
          marginTop: 28,
          background: acento,
          color: "#121319",
          border: "none",
          padding: "13px 26px",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {completados.size > 0 ? "Continuar donde quedaste →" : "Comenzar →"}
      </button>

      <div style={{ marginTop: 48, display: "grid", gap: 10 }}>
        {libro.capitulos.map((cap, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background: completados.has(i) ? acento : "rgba(255,255,255,0.08)",
                color: completados.has(i) ? "#121319" : "#8b8c99",
              }}
            >
              {completados.has(i) ? "✓" : i + 1}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>{cap.titulo}</div>
              <div style={{ color: "#8b8c99", fontSize: 13.5, marginTop: 3 }}>{cap.resumen}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VistaCapitulo({
  capitulo,
  indice,
  total,
  acento,
  onCompletar,
  onIrA,
}: {
  capitulo: Capitulo;
  indice: number;
  total: number;
  acento: string;
  onCompletar: () => void;
  onIrA: (i: number) => void;
}) {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [terminosVolteados, setTerminosVolteados] = useState<Set<number>>(new Set());
  const [respuestaAbierta, setRespuestaAbierta] = useState("");

  const todasRespondidas = capitulo.preguntas.length > 0 && Object.keys(respuestas).length === capitulo.preguntas.length;

  useEffect(() => {
    if (todasRespondidas) onCompletar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todasRespondidas]);

  function voltear(i: number) {
    setTerminosVolteados((prev) => {
      const nuevo = new Set(prev);
      nuevo.has(i) ? nuevo.delete(i) : nuevo.add(i);
      return nuevo;
    });
  }

  return (
    <div className="fadein">
      <div style={{ fontSize: 12, color: "#8b8c99", marginBottom: 6 }}>
        Capítulo {indice + 1} de {total}
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, margin: "0 0 8px" }}>{capitulo.titulo}</h1>
      <p style={{ color: "#c7c8d1", fontSize: 16 }}>{capitulo.resumen}</p>

      <div style={{ marginTop: 24, lineHeight: 1.8, color: "#e4e3de", fontSize: 15.5 }}>
        {capitulo.contenido.split("\n").filter(Boolean).map((parrafo, i) => (
          <p key={i} style={{ marginBottom: 14 }}>
            {parrafo}
          </p>
        ))}
      </div>

      {/* Puntos clave */}
      {capitulo.puntosClave?.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <Etiqueta acento={acento}>Ideas para quedarte</Etiqueta>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {capitulo.puntosClave.map((punto, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `3px solid ${acento}`,
                  background: "rgba(255,255,255,0.03)",
                  padding: "10px 14px",
                  borderRadius: "0 8px 8px 0",
                  fontSize: 14.5,
                }}
              >
                {punto}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Términos clave (flashcards) */}
      {capitulo.terminosClave?.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <Etiqueta acento={acento}>Términos clave · toca para revelar</Etiqueta>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            {capitulo.terminosClave.map((t, i) => {
              const volteado = terminosVolteados.has(i);
              return (
                <div
                  key={i}
                  className="term-card"
                  onClick={() => voltear(i)}
                  style={{
                    minHeight: 100,
                    borderRadius: 12,
                    padding: 16,
                    background: volteado ? acento : "rgba(255,255,255,0.05)",
                    color: volteado ? "#121319" : "#f2f0ea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    fontSize: volteado ? 13 : 15,
                    fontWeight: volteado ? 400 : 700,
                  }}
                >
                  {volteado ? t.definicion : t.termino}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quiz */}
      {capitulo.preguntas?.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <Etiqueta acento={acento}>Pon a prueba lo que aprendiste</Etiqueta>
          <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
            {capitulo.preguntas.map((p, i) => (
              <div
                key={i}
                style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}
              >
                <p style={{ fontWeight: 600, marginTop: 0, fontSize: 14.5 }}>{p.pregunta}</p>
                {p.opciones.map((opcion, j) => {
                  const elegida = respuestas[i];
                  const esCorrecta = j === p.respuestaCorrecta;
                  let bg = "rgba(255,255,255,0.06)";
                  if (elegida !== undefined) {
                    if (j === elegida && esCorrecta) bg = "#2fae7e";
                    else if (j === elegida && !esCorrecta) bg = "#c65b5b";
                    else if (esCorrecta) bg = "#2fae7e55";
                  }
                  return (
                    <button
                      key={j}
                      className="opcion-btn"
                      disabled={elegida !== undefined}
                      onClick={() => setRespuestas((prev) => ({ ...prev, [i]: j }))}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        margin: "6px 0",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: bg,
                        color: "#f2f0ea",
                        cursor: elegida === undefined ? "pointer" : "default",
                        fontSize: 13.5,
                      }}
                    >
                      {opcion}
                    </button>
                  );
                })}
                {respuestas[i] !== undefined && (
                  <p style={{ fontSize: 12.5, color: "#8b8c99", marginTop: 8, marginBottom: 0 }}>
                    💡 {p.explicacion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actividad de reflexión */}
      {capitulo.actividad && (
        <section style={{ marginTop: 32 }}>
          <Etiqueta acento={acento}>Para ti · no se califica</Etiqueta>
          <p style={{ fontSize: 14.5, color: "#c7c8d1", marginTop: 8 }}>{capitulo.actividad}</p>
          <textarea
            value={respuestaAbierta}
            onChange={(e) => setRespuestaAbierta(e.target.value)}
            placeholder="Escribe tu respuesta aquí (solo para ti, no se guarda ni se envía a nadie)..."
            style={{
              width: "100%",
              minHeight: 90,
              marginTop: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: 12,
              color: "#f2f0ea",
              fontFamily: "inherit",
              fontSize: 13.5,
              resize: "vertical",
            }}
          />
        </section>
      )}

      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button
          onClick={() => onIrA(Math.max(0, indice - 1))}
          disabled={indice === 0}
          style={estiloBoton(indice === 0)}
        >
          ← Anterior
        </button>
        <button
          onClick={() => onIrA(Math.min(total - 1, indice + 1))}
          disabled={indice === total - 1}
          style={estiloBoton(indice === total - 1)}
        >
          Siguiente →
        </button>
      </nav>
    </div>
  );
}

function Etiqueta({ children, acento }: { children: React.ReactNode; acento: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: acento }}>
      {children}
    </div>
  );
}

function AnilloProgreso({ porcentaje, color }: { porcentaje: number; color: string }) {
  const radio = 18;
  const circunferencia = 2 * Math.PI * radio;
  const desplazamiento = circunferencia - (porcentaje / 100) * circunferencia;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radio} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={radio}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circunferencia}
        strokeDashoffset={desplazamiento}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset .4s ease" }}
      />
    </svg>
  );
}

function estiloBoton(deshabilitado: boolean): React.CSSProperties {
  return {
    background: deshabilitado ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
    color: deshabilitado ? "#54555f" : "#f2f0ea",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: deshabilitado ? "default" : "pointer",
    fontSize: 13.5,
  };
}

function CentroTexto({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <p style={{ fontSize: 16, color: "#c7c8d1" }}>{children}</p>
    </main>
  );
}
