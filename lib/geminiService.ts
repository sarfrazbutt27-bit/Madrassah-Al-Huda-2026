
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

export const generateQuizFromResource = async (
  title: string, 
  contentUrl: string, 
  fileType: string,
  count: number = 20,
  term: 'Halbjahr' | 'Abschluss' = 'Halbjahr',
  difficulty: 'easy' | 'normal' = 'normal',
  language?: 'arabic' | 'german' | 'mixed'
): Promise<QuizQuestion[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env['GOOGLE_API_KEY'] || '';
  if (!apiKey) {
    console.error("Gemini API Key is missing!");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  console.log(`Generating quiz for: ${title}`, { contentUrl, fileType, count });
  
  const prompt = `Erstelle ein Quiz basierend auf dieser Quelle: ${contentUrl}
  Titel: ${title}
  Ziel: ${count} Fragen
  
  Arbeitsanweisung:
  1. Analysiere den Inhalt der Quelle (URL oder Bild).
  2. Erstelle Multiple-Choice-Fragen mit jeweils 4 Optionen. Versuche EXAKT ${count} Fragen zu erreichen.
  3. Die Fragen müssen auf den Informationen der Quelle basieren.
  4. Falls die Quelle nicht für ${count} Fragen ausreicht, erstelle so viele wie möglich (mindestens 1-2).
  5. WICHTIG: Falls du die URL nicht direkt lesen kannst (z.B. weil es ein PDF-Download-Link ist), nutze deine integrierten Tools (Google Search, URL Context), um Informationen über diesen Titel "${title}" und das Thema zu finden, um ein fachlich korrektes Quiz zu erstellen.
  
  ${language ? (
    language === 'arabic' ? 'SPRACHE: Das Quiz MUSS VOLLSTÄNDIG auf ARABISCH erstellt werden.' :
    language === 'german' ? 'SPRACHE: Das Quiz MUSS VOLLSTÄNDIG auf DEUTSCH erstellt werden.' :
    'SPRACHE: Das Quiz MUSS GEMISCHT (Deutsch und Arabisch) erstellt werden.'
  ) : 'SPRACHE: Nutze die Sprache der Quelle.'}
  
  KONTEXT: ${term === 'Halbjahr' ? 'Erste Hälfte des Stoffes' : 'Gesamter Stoff'}.
  SCHWIERIGKEIT: ${difficulty === 'easy' ? 'Einfach' : 'Normal'}.`;

  let contents: string | { parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] } = prompt;
  let tools: { urlContext?: Record<string, never>; googleSearch?: Record<string, never> }[] = [];
  
  if (fileType === 'image' && contentUrl.startsWith('data:image')) {
    const base64Data = contentUrl.split(',')[1];
    const mimeType = contentUrl.split(';')[0].split(':')[1];
    contents = {
      parts: [
        { text: prompt + " Analysiere dieses Bild und erstelle die Fragen STRENG basierend auf dem Inhalt des Bildes." },
        { inlineData: { data: base64Data, mimeType } }
      ]
    };
  } else if (contentUrl.startsWith('http')) {
    tools = [{ urlContext: {} }, { googleSearch: {} }];
    contents = prompt;
  }

  const generatePromise = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: "Du bist ein präziser Quiz-Generator. Deine Hauptquelle ist das bereitgestellte Material. Falls die Quelle nicht direkt lesbar ist, nutze Google Search, um Informationen über das Thema zu finden. Antworte ausschließlich im JSON-Format gemäß dem Schema.",
      tools: tools,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Genau 4 Antwortmöglichkeiten"
            },
            correctAnswerIndex: { 
              type: Type.INTEGER,
              description: "Index der richtigen Antwort (0-3)"
            },
            explanation: { type: Type.STRING, description: "Kurze Erklärung mit Bezug zur Quelle" }
          },
          required: ["question", "options", "correctAnswerIndex"]
        }
      }
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Die KI-Generierung dauert zu lange (über 120 Sekunden). Bitte versuchen Sie es mit einem kleineren Seitenbereich oder prüfen Sie die Buch-URL.")), 120000)
  );

  try {
    const response = await Promise.race([generatePromise, timeoutPromise]);

    const quiz = JSON.parse(response.text || '[]');
    return quiz.map((q: QuizQuestion, index: number) => ({
      ...q,
      id: `q-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const scanGradesFromImage = async (
  base64Image: string,
  mimeType: string,
  subjects: string[]
): Promise<{ subject: string; score: number }[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env['GOOGLE_API_KEY'] || '';
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Du bist ein Experte für OCR und Datenextraktion. Deine Aufgabe ist es, Noten aus einem Bild (Zeugnis oder Notenliste einer Madrassah) präzise zu extrahieren.

ERWARTETE FÄCHER:
${subjects.map(s => `- ${s}`).join('\n')}

ANWEISUNGEN:
1. Identifiziere jedes Fach im Bild und ordne ihm die entsprechende Punktzahl zu.
2. Das Punktesystem geht von 0 bis 20.
3. Falls im Bild Schulnoten (1 bis 6) statt Punkten stehen, konvertiere sie wie folgt:
   - Note 1 (Sehr gut) -> 20 Punkte
   - Note 2 (Gut) -> 16 Punkte
   - Note 3 (Befriedigend) -> 12 Punkte
   - Note 4 (Ausreichend) -> 8 Punkte
   - Note 5 (Mangelhaft) -> 4 Punkte
   - Note 6 (Ungenügend) -> 0 Punkte
4. Achte besonders auf handschriftliche Zahlen. Eine '7' kann wie eine '1' aussehen, eine '0' wie eine '6'. Prüfe den Kontext.
5. Wenn ein Wert unleserlich ist, überspringe dieses Fach lieber, statt zu raten.
6. Gib NUR die Fächer zurück, die du im Bild eindeutig identifizieren konntest.

AUSGABEFORMAT:
Gib ein JSON-Array von Objekten zurück: [{"subject": "Name des Fachs", "score": Punktzahl}].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { 
                type: Type.STRING, 
                description: "Der exakte oder am besten passende Name des Fachs aus der Liste." 
              },
              score: { 
                type: Type.NUMBER, 
                description: "Die extrahierte oder konvertierte Punktzahl (0-20)." 
              }
            },
            required: ["subject", "score"]
          }
        },
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error scanning grades:", error);
    throw error;
  }
};

export const scanClassGradesFromImage = async (
  base64Image: string,
  mimeType: string,
  subjects: string[],
  studentNames: string[]
): Promise<{ studentName: string; subject: string; score: number }[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env['GOOGLE_API_KEY'] || '';
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Aufgabe:
Lies die hochgeladene Punkte-Tabelle und extrahiere jede Tabellenzeile einzeln.

WICHTIG:
- Jede Schülerzeile muss separat gelesen werden.
- Werte dürfen NICHT für mehrere Schüler kopiert oder wiederholt werden.
- Lies jede Zeile unabhängig.
- Wenn ein Wert nicht lesbar ist, schreibe null.
- Ignoriere Unterschrift, Datum und leere Zeilen.

BEKANNTE SCHÜLER (Nutze diese Liste für besseres Matching der Namen):
${studentNames.map(n => `- ${n}`).join('\n')}

Gib das Ergebnis NUR als gültiges JSON zurück.
Kein zusätzlicher Text.

Format:
{
  "class": "Klasse falls sichtbar, sonst null",
  "students": [
    {
      "name": "Vollständiger Name",
      "quran": Zahl oder null,
      "tajweed": Zahl oder null,
      "hifz": Zahl oder null,
      "fiqh": Zahl oder null,
      "sierah": Zahl oder null,
      "akhlaq": Zahl oder null,
      "gesamt": Zahl oder null
    }
  ]
}

Regeln:
- Die Reihenfolge der Schüler muss der Tabelle entsprechen.
- Keine gleichen Werte für alle Schüler.
- Jede Tabellenzeile = ein Student.
- Zahlen ohne Zusatzzeichen zurückgeben.
- Wenn eine Zelle leer ist → null.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            class: { type: Type.STRING },
            students: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quran: { type: Type.NUMBER },
                  tajweed: { type: Type.NUMBER },
                  hifz: { type: Type.NUMBER },
                  fiqh: { type: Type.NUMBER },
                  sierah: { type: Type.NUMBER },
                  akhlaq: { type: Type.NUMBER },
                  gesamt: { type: Type.NUMBER }
                },
                required: ["name"]
              }
            }
          }
        },
        temperature: 0.1
      }
    });

    const raw = JSON.parse(response.text || '{"students": []}');
    const results: { studentName: string; subject: string; score: number }[] = [];
    
    if (raw.students && Array.isArray(raw.students)) {
      raw.students.forEach((s: { name: string; quran?: number; tajweed?: number; hifz?: number; fiqh?: number; sierah?: number; akhlaq?: number }) => {
        const subjectsMap: Record<string, number | null | undefined> = {
          'Quran': s.quran,
          'Tajweed': s.tajweed,
          'Hifz': s.hifz,
          'Fiqh': s.fiqh,
          'Sierah': s.sierah,
          'Akhlaq': s.akhlaq
        };
        
        Object.entries(subjectsMap).forEach(([subj, score]) => {
          if (score !== null && score !== undefined) {
            results.push({
              studentName: s.name,
              subject: subj,
              score: score
            });
          }
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error scanning class grades:", error);
    throw error;
  }
};

export const generateHomeworkQuiz = async (
  bookUrl: string,
  pagesFrom: number,
  pagesTo: number,
  subject: string,
  language?: 'arabic' | 'german' | 'mixed',
  fileType?: string
): Promise<Partial<QuizQuestion>[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env['GOOGLE_API_KEY'] || '';
  const ai = new GoogleGenAI({ apiKey });
  
  console.log(`Generating homework quiz for subject: ${subject}`, { bookUrl, pagesFrom, pagesTo });

  const prompt = `Erstelle ein Hausaufgaben-Quiz basierend auf dieser Quelle: ${bookUrl}
  Seitenbereich: ${pagesFrom} bis ${pagesTo}
  Fach: ${subject}
  Ziel: 10 Fragen
  
  Arbeitsanweisung:
  1. Analysiere den Inhalt der Quelle (URL oder Bild).
  2. Erstelle Multiple-Choice-Fragen (Optionen A, B, C). Versuche EXAKT 10 Fragen zu erreichen.
  3. Die Fragen sollten sich auf den Seitenbereich ${pagesFrom}-${pagesTo} beziehen. Falls im Text keine Seitenzahlen erkennbar sind, nutze den gesamten verfügbaren Text der URL.
  4. Falls du die URL nicht direkt lesen kannst, nutze Google Search und URL Context, um Informationen über dieses Buch/Thema zu finden.
  5. Erstelle so viele Fragen wie möglich (mindestens 2).
  6. Gib für jede Frage eine kurze Begründung (explanation) und die Fundstelle (sourceHint) an.
  
  ${language ? (
    language === 'arabic' ? 'SPRACHE: Das Quiz MUSS VOLLSTÄNDIG auf ARABISCH erstellt werden.' :
    language === 'german' ? 'SPRACHE: Das Quiz MUSS VOLLSTÄNDIG auf DEUTSCH erstellt werden.' :
    'SPRACHE: Das Quiz MUSS GEMISCHT (Deutsch und Arabisch) erstellt werden.'
  ) : 'SPRACHE: Nutze die Sprache der Quelle.'}`;

  let contents: { parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] }[] = [{ parts: [{ text: prompt }] }];
  let tools: { urlContext?: Record<string, never>; googleSearch?: Record<string, never> }[] = [];

  if (fileType === 'image' && bookUrl.startsWith('data:image')) {
    const base64Data = bookUrl.split(',')[1];
    const mimeType = bookUrl.split(';')[0].split(':')[1];
    contents = [{
      parts: [
        { text: prompt + " Analysiere dieses Bild und erstelle die Fragen STRENG basierend auf dem Inhalt des Bildes." },
        { inlineData: { data: base64Data, mimeType } }
      ]
    }];
  } else if (bookUrl.startsWith('http')) {
    tools = [{ urlContext: {} }, { googleSearch: {} }];
    contents = [{ parts: [{ text: prompt }] }];
  }

  const generatePromise = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: "Du bist ein präziser Quiz-Generator für Hausaufgaben. Deine Hauptquelle ist die bereitgestellte URL. Falls diese nicht lesbar ist, nutze Google Search als Fallback. Versuche immer, Fragen zu generieren, solange Informationen vorhanden sind. Antworte ausschließlich im JSON-Format.",
      tools: tools,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionText: { type: Type.STRING },
            optionA: { type: Type.STRING },
            optionB: { type: Type.STRING },
            optionC: { type: Type.STRING },
            correctOption: { 
              type: Type.STRING,
              description: "Muss 'A', 'B' oder 'C' sein."
            },
            explanation: { type: Type.STRING, description: "Begründung mit Bezug zur Quelle" },
            sourceHint: { type: Type.STRING, description: "Fundstelle im Text (z.B. Seitenzahl oder Absatz)" }
          },
          required: ["questionText", "optionA", "optionB", "optionC", "correctOption"]
        }
      }
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Timeout: Die KI-Generierung dauert zu lange (über 120 Sekunden). Bitte versuchen Sie es mit einem kleineren Seitenbereich oder prüfen Sie die Buch-URL.")), 120000)
  );

  try {
    const response = await Promise.race([generatePromise, timeoutPromise]);
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating homework quiz:", error);
    throw error;
  }
};
