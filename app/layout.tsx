export const metadata = {
  title: "Mis eBooks Interactivos",
  description: "Convierte tus libros en experiencias de aprendizaje interactivas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
          background: "#121319",
          color: "#f2f0ea",
        }}
      >
        {children}
      </body>
    </html>
  );
}
