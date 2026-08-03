import { GoogleGenerativeAI } from "@google/generative-ai";

function obtenerGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

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

  const modelo = obtenerGemini().getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: PROMPT_SISTEMA,
  });

  const resultado = await modelo.generateContent(textoRecortado);
  const textoRespuesta = resultado.response.text();

  const limpio = textoRespuesta.replace(/```json|```/g, "").trim();
  return JSON.parse(limpio) as LibroInteractivo;
}
