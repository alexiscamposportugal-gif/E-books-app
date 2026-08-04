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

export type BloqueContenido = {
  tipo: "concepto" | "ejemplo" | "dato" | "cita" | "pasoapaso" | "advertencia";
  titulo: string;
  texto: string;
  pasos?: string[];
};

export type Capitulo = {
  titulo: string;
  resumen: string;
  bloques: BloqueContenido[];
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

const PROMPT_SISTEMA = `Eres un diseñador instruccional experto en convertir libros completos en productos
digitales interactivos de alto valor — al nivel de apps como Brilliant, Blinkist Premium o un curso online
premium. Recibirás el texto de un libro y debes transformarlo en una mini-app rica, profunda y explorable.

REGLA MÁS IMPORTANTE: esto NO es un resumen. El usuario está pagando por esta mini-app en vez de leer el
libro, así que el contenido de cada capítulo debe cubrir el material real del libro con profundidad,
manteniendo todos los argumentos, ejemplos, datos y matices importantes — simplemente reorganizado de forma
interactiva y más fácil de digerir que un bloque de texto plano. Sé exhaustivo, no breve.

Estructura por capítulo — en vez de un solo bloque de texto, divide el contenido en 5 a 10 "bloques"
explorables (el usuario los verá como tarjetas que puede abrir en cualquier orden, no necesariamente
lineal). Cada bloque tiene un "tipo":
- "concepto": explica una idea o argumento central a fondo (150-250 palabras)
- "ejemplo": un caso, historia o aplicación práctica concreta que ilustra un concepto
- "dato": una cifra, estudio o dato curioso relevante, con contexto
- "cita": una idea atribuible al autor/libro parafraseada (NUNCA cites literalmente el texto original,
  siempre parafrasea con tus propias palabras)
- "pasoapaso": si el capítulo describe un proceso o método, conviértelo en una lista de "pasos" concretos
- "advertencia": un error común o malentendido que el libro señala

Usa una mezcla de tipos por capítulo (no todos "concepto"), para que se sienta como explorar contenido
variado, no leer un texto seguido.

Reglas adicionales:
- Divide el libro completo en entre 4 y 16 capítulos, según su extensión real — cubre TODO el libro,
  no te detengas a la mitad.
- "descripcion": una frase (máx 20 palabras) que venda la promesa del libro, para la portada de la app.
- "colorAcento": UN color hexadecimal que combine con la temática del libro.
- "puntosClave": 3-5 ideas accionables o memorables del capítulo.
- "terminosClave": 3-6 términos importantes con definición breve (para un diccionario interactivo).
- "preguntas": 2-4 preguntas de opción múltiple con explicación de la respuesta correcta.
- "actividad": una pregunta abierta de reflexión o aplicación práctica.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, siguiendo exactamente:
{
  "titulo": "string",
  "descripcion": "string",
  "colorAcento": "#rrggbb",
  "capitulos": [
    {
      "titulo": "string",
      "resumen": "string",
      "bloques": [
        { "tipo": "concepto", "titulo": "string", "texto": "string" },
        { "tipo": "pasoapaso", "titulo": "string", "texto": "string", "pasos": ["string"] }
      ],
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
  // Se recorta a un límite generoso (~300,000 caracteres, unas 250-300 páginas)
  // para cubrir la gran mayoría de libros completos sin exceder el contexto del modelo.
  const textoRecortado = textoLibro.slice(0, 300000);

  const modelo = obtenerGemini().getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: PROMPT_SISTEMA,
    generationConfig: { maxOutputTokens: 32768 },
  });

  const resultado = await modelo.generateContent(textoRecortado);
  const textoRespuesta = resultado.response.text();

  const limpio = textoRespuesta.replace(/```json|```/g, "").trim();
  return JSON.parse(limpio) as LibroInteractivo;
}
