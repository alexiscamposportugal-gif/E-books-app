"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [claveAdmin, setClaveAdmin] = useState(
    typeof window !== "undefined" ? sessionStorage.getItem("clave_admin") || "" : ""
  );
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [portada, setPortada] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [etapa, setEtapa] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [bookIdListo, setBookIdListo] = useState<string | null>(null);

  // Sube un archivo directo a Supabase Storage (sin pasar por Vercel),
  // usando una URL de subida firmada que solo se entrega si la clave de
  // administrador es correcta.
  async function subirArchivoDirecto(archivoASubir: File, carpeta: "pdf" | "portada") {
    const resSolicitud = await fetch("/api/solicitar-subida", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": claveAdmin },
      body: JSON.stringify({ nombreArchivo: archivoASubir.name, carpeta }),
    });
    const solicitud = await resSolicitud.json();
    if (solicitud.error) throw new Error(solicitud.error);

    const { error: errorSubida } = await supabase.storage
      .from(solicitud.bucket)
      .uploadToSignedUrl(solicitud.ruta, solicitud.token, archivoASubir);

    if (errorSubida) throw new Error("Subiendo " + carpeta + ": " + errorSubida.message);

    return solicitud.ruta as string;
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setCargando(true);
    setResultado(null);
    setBookIdListo(null);
    sessionStorage.setItem("clave_admin", claveAdmin);

    try {
      setEtapa("Subiendo el PDF...");
      const rutaPdf = await subirArchivoDirecto(archivo, "pdf");

      let rutaPortada: string | null = null;
      if (portada) {
        setEtapa("Subiendo la portada...");
        rutaPortada = await subirArchivoDirecto(portada, "portada");
      }

      setEtapa("Generando el contenido interactivo con IA (puede tardar 1-3 min)...");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": claveAdmin },
        body: JSON.stringify({
          rutaPdf,
          rutaPortada,
          titulo,
          nombreOriginal: archivo.name,
          precioCents: Math.round(parseFloat(precio || "0") * 100),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResultado("❌ Error: " + data.error);
      } else {
        setResultado(`✅ Listo. ID del libro: ${data.bookId}`);
        setBookIdListo(data.bookId);
      }
    } catch (err: any) {
      setResultado("❌ Error: " + err.message);
    } finally {
      setCargando(false);
      setEtapa("");
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Subir nuevo libro</h1>
      <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Clave de administrador
          <input
            type="password"
            value={claveAdmin}
            onChange={(e) => setClaveAdmin(e.target.value)}
            required
            style={estiloInput}
          />
        </label>
        <label>
          Título del libro
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required style={estiloInput} />
        </label>
        <label>
          Precio de venta (USD)
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            style={estiloInput}
          />
        </label>
        <label>
          Archivo PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            required
            style={estiloInput}
          />
        </label>
        <label>
          Portada del libro (imagen, opcional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPortada(e.target.files?.[0] || null)}
            style={estiloInput}
          />
        </label>
        <button
          type="submit"
          disabled={cargando}
          style={{
            background: "#6366f1",
            color: "white",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {cargando ? etapa || "Procesando..." : "Generar mini-app interactiva"}
        </button>
      </form>
      {resultado && <p style={{ marginTop: 20 }}>{resultado}</p>}

      {bookIdListo && (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href={`/libro/${bookIdListo}?preview=1`}
            target="_blank"
            style={{
              background: "#e8a33d",
              color: "#121319",
              padding: "10px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            🔍 Ver vista previa
          </a>
          <a
            href={`/comprar/${bookIdListo}`}
            target="_blank"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 13.5,
            }}
          >
            🔗 Enlace de venta
          </a>
        </div>
      )}
    </main>
  );
}

const estiloInput: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "white",
};
