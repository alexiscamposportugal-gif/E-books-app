import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Capitulo = {
  titulo: string;
  resumen: string;
  contenido: string;
  preguntas: { pregunta: string; opciones: string[]; respuestaCorrecta: number }[];
};

export type LibroInteractivo = {
  titulo: string;
  capitulos: Capitulo[];
};

const PROMPT_SISTEMA = `Eres un diseñador instruccional experto. Recibirás el texto crudo de un libro
y debes transformarlo en una estructura JSON de aprendizaje interactivo.

Reglas estrictas:
- Divide el contenido en capítulos o secciones lógicas (entre 3 y 12).
- Para cada capítulo escribe: título, un resumen breve (2-3 frases),
  el contenido reescrito de forma clara y pedagógica (no copies el texto
  literal extenso, sintetiza y explica), y 2-4 preguntas de opción múltiple
  que evalúen comprensión real del capítulo.
- Cada pregunta debe tener 4 opciones y un índice (0-3) de la respuesta correcta.
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown,
  siguiendo exactamente esta forma:
{
  "titulo": "string",
  "capitulos": [
    {
      "titulo": "string",
      "resumen": "string",
      "contenido": "string",
      "preguntas": [
        { "pregunta": "string", "opciones": ["string","string","string","string"], "respuestaCorrecta": 0 }
      ]
    }
  ]
}`;

export async function generarContenidoInteractivo(textoLibro: string): Promise<LibroInteractivo> {
  // Los libros largos se recortan para no exceder límites de contexto.
  // (En una versión avanzada, se procesaría por bloques y se uniría el resultado.)
  const textoRecortado = textoLibro.slice(0, 100000);

  const respuesta = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: PROMPT_SISTEMA,
    messages: [{ role: "user", content: textoRecortado }],
  });

  const bloqueTexto = respuesta.content.find((b) => b.type === "text");
  if (!bloqueTexto || bloqueTexto.type !== "text") {
    throw new Error("La IA no devolvió contenido de texto");
  }

  const limpio = bloqueTexto.text.replace(/```json|```/g, "").trim();
  return JSON.parse(limpio) as LibroInteractivo;
}
