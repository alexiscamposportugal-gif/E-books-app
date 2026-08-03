"use client";

import { useState } from "react";

export default function AdminPage() {
  const [claveAdmin, setClaveAdmin] = useState(
    typeof window !== "undefined" ? sessionStorage.getItem("clave_admin") || "" : ""
  );
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setCargando(true);
    setResultado(null);

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("titulo", titulo);
    formData.append("precioCents", String(Math.round(parseFloat(precio || "0") * 100)));

    sessionStorage.setItem("clave_admin", claveAdmin);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-secret": claveAdmin },
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setResultado("❌ Error: " + data.error);
      } else {
        setResultado(`✅ Listo. ID del libro: ${data.bookId}. Enlace de venta: /comprar/${data.bookId}`);
      }
    } catch (err: any) {
      setResultado("❌ Error: " + err.message);
    } finally {
      setCargando(false);
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
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            style={estiloInput}
          />
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
          {cargando ? "Procesando (puede tardar 1-2 min)..." : "Generar mini-app interactiva"}
        </button>
      </form>
      {resultado && <p style={{ marginTop: 20 }}>{resultado}</p>}
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
