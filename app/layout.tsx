export const metadata = {
  title: "Mis eBooks Interactivos",
  description: "Convierte tus libros en experiencias de aprendizaje interactivas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  );
}
