export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 40, marginBottom: 12 }}>📚 eBooks Interactivos</h1>
      <p style={{ fontSize: 18, color: "#94a3b8", marginBottom: 32 }}>
        Convierte cualquier PDF en una experiencia de aprendizaje interactiva y véndela
        con acceso único por comprador.
      </p>
      <a
        href="/admin"
        style={{
          background: "#6366f1",
          color: "white",
          padding: "12px 24px",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Ir al panel de administración →
      </a>
    </main>
  );
}
