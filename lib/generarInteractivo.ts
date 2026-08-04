import { GoogleGenerativeAI } from "@google/generative-ai";

function obtenerGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export type TerminoClave = { termino: string; definicion: string };

export type Pregunta = {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
};

export type Capitulo = {
  titulo: string;
  resumen: string;
  contenido: string;
  puntosClave: string[];
  terminosClave: TerminoClave[];
  preguntas: Pregunta[];
  actividad: string;
};

export type LibroInteractivo = {
  titulo: string;
  descripcion: string;
  colorAcento: string;
  capitulos: Capitulo[];
};

const PROMPT_SISTEMA = `Eres un diseñador instruccional experto en convertir libros en experiencias
de aprendizaje interactivas, al estilo de las mejores apps educativas (tipo Duolingo o Brilliant,
pero para libros de no ficción o texto). Recibirás el texto crudo de un libro y debes transformarlo
en una estructura JSON completa para una mini-app interactiva. NO es un resumen para leer: es
material para una app con la que el usuario interactúa activamente.

Reglas estrictas:
- Divide el contenido en capítulos o secciones lógicas (entre 3 y 12).
- "descripcion": una frase (máx 20 palabras) que venda la promesa del libro, para mostrarla en
  la portada de la mini-app.
- "colorAcento": elige UN color hexadecimal (ej. "#e8a33d") que combine con la temática del libro
  (cálido para libros de desarrollo personal, azul/verde para técnicos, etc.) — se usará como acento
  visual en toda la mini-app.
- Para cada capítulo:
  - "titulo": corto y claro
  - "resumen": 1-2 frases que enganchen, no que resuman de forma aburrida
  - "contenido": el contenido reescrito de forma clara, pedagógica, en 3-6 párrafos cortos
    (no copies el texto original extenso, sintetiza y explica con tus palabras)
  - "puntosClave": 3-5 ideas accionables o memorables del capítulo, cada una en una frase corta
    (se muestran como tarjetas destacadas, deben ser afirmaciones fuertes, no genéricas)
  - "terminosClave": 2-5 términos o conceptos importantes del capítulo con su definición breve
    (se muestran como tarjetas tipo flashcard que el usuario voltea para aprender)
  - "preguntas": 2-4 preguntas de opción múltiple con 4 opciones, el índice (0-3) de la respuesta
    correcta, y una "explicacion" breve de por qué es correcta (se muestra después de responder)
  - "actividad": una pregunta abierta de reflexión o aplicación práctica relacionada al capítulo,
    para que el usuario escriba su propia respuesta (no se evalúa, es para su propio aprendizaje)

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, siguiendo exactamente:
{
  "titulo": "string",
  "descripcion": "string",
  "colorAcento": "#rrggbb",
  "capitulos": [
    {
      "titulo": "string",
      "resumen": "string",
      "contenido": "string",
      "puntosClave": ["string"],
      "terminosClave": [{ "termino": "string", "definicion": "string" }],
      "preguntas": [
        {
          "pregunta": "string",
          "opciones": ["string","string","string","string"],
          "respuestaCorrecta": 0,
          "explicacion": "string"
        }
      ],
      "actividad": "string"
    }
  ]
}`;

export async function generarContenidoInteractivo(textoLibro: string): Promise<LibroInteractivo> {
  // Los libros largos se recortan para no exceder límites de contexto.
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
