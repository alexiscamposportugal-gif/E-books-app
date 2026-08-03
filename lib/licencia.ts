import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

/**
 * Genera un token único y firmado para un comprador de un libro específico.
 * Este token es lo que va dentro del enlace que reciben por correo.
 * Al estar firmado, nadie puede fabricar uno falso sin conocer JWT_SECRET.
 */
export function generarToken(params: { licenseId: string; bookId: string; email: string }) {
  return jwt.sign(
    { licenseId: params.licenseId, bookId: params.bookId, email: params.email },
    SECRET,
    { expiresIn: "3650d" } // la expiración real la controla la fila "licenses" en la BD
  );
}

/**
 * Verifica que el token sea válido y no haya sido alterado.
 * Devuelve el contenido si es válido, o null si es inválido/expirado.
 */
export function verificarToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { licenseId: string; bookId: string; email: string };
  } catch {
    return null;
  }
}
