/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Full-Stack Server Entry Point
 * Implements server-side Gemini API proxy for AXIO AI Coach with Vite middleware integration.
 */

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContextualCoachResponse } from './src/utils/aiCoachEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI strictly on the server with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatRequestPayload {
  message: string;
  languagePreference?: 'en' | 'te' | 'auto';
  conversationHistory?: Array<{ sender: 'user' | 'ai'; text: string }>;
  athleteProfile?: {
    name?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    discipline?: string;
    tier?: string;
    fitnessLevel?: string;
    activityLevel?: string;
    trainingExperience?: string;
    goals?: string[];
    workoutLocation?: string;
    availableEquipment?: string[];
    workoutDaysPerWeek?: number;
    workoutDurationMinutes?: number;
    dietPreference?: string;
    performanceScore?: number;
    formScore?: number;
    streakDays?: number;
  };
  recentHistory?: {
    lastWorkout?: string;
    peakPower?: number;
    formAccuracy?: number;
    completedCount?: number;
  };
}

/**
 * Intelligent contextual fallback response generator when API is unreachable.
 * Adheres strictly to AXIO coaching principles via sports science engine.
 */
function generateContextualCoachFallback(
  message: string,
  athleteProfile?: ChatRequestPayload['athleteProfile'],
  recentHistory?: ChatRequestPayload['recentHistory'],
  conversationHistory?: ChatRequestPayload['conversationHistory'],
  languagePreference?: 'en' | 'te' | 'auto'
): string {
  return generateContextualCoachResponse(
    message,
    athleteProfile,
    recentHistory,
    conversationHistory,
    languagePreference
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`API request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * POST /api/coach/chat
 * Context-aware AI Coach proxy with multi-model resilience and conversation memory
 */
app.post('/api/coach/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, languagePreference, conversationHistory, athleteProfile, recentHistory } = req.body as ChatRequestPayload;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A valid message string is required.' });
      return;
    }

    const trimmedMsg = message.trim();
    const athleteName = athleteProfile?.name || 'Athlete';
    const fitnessLevel = athleteProfile?.fitnessLevel || 'Beginner';
    const trainingExp = athleteProfile?.trainingExperience || 'Under 1 year';
    const goalsList = athleteProfile?.goals?.length ? athleteProfile.goals.join(', ') : 'General Fitness, Health';
    const equipment = athleteProfile?.availableEquipment?.length ? athleteProfile.availableEquipment.join(', ') : 'Bodyweight & Home Gear';
    const dietPref = athleteProfile?.dietPreference || 'Balanced Omnivore';
    const weightKg = athleteProfile?.weightKg || 75;
    const age = athleteProfile?.age || 28;

    // Build true factual history without inventing fake data
    let historyContext = 'No prior completed workout sessions logged yet. The athlete is starting their journey.';
    if (recentHistory?.lastWorkout) {
      historyContext = `Last logged session: ${recentHistory.lastWorkout}` +
        (recentHistory.formAccuracy ? ` (Form accuracy: ${recentHistory.formAccuracy}%)` : '') +
        (recentHistory.peakPower ? ` (Peak power: ${recentHistory.peakPower}W)` : '');
    }

    const systemInstruction = `You are the AXIO AI Coach for the AXIO Universal Fitness Platform. You act as an elite sports scientist and pragmatic, knowledgeable fitness coach.

ATHLETE PROFILE (USE ACCURATELY - NEVER INVENT METRICS):
- Name: ${athleteName}
- Age: ${age} years | Bodyweight: ${weightKg} kg
- Fitness Level: ${fitnessLevel}
- Experience: ${trainingExp}
- Stated Goals: ${goalsList}
- Equipment: ${equipment}
- Nutrition Profile: ${dietPref}
- Telemetry & History: ${historyContext}

CORE COACHING PRINCIPLES (STRICT MANDATES):

1. DIRECTLY ANSWER THE USER'S QUESTION:
- Begin immediately with the direct technical answer. Never start with conversational filler or generic preambles like "As your coach...", "Certainly!", or "It is great that you're asking...".
- When asked about a specific movement (e.g. "How do I do a dumbbell curl?"), explain the actual movement mechanics immediately.

2. HANDLE AMBIGUOUS QUESTIONS INTELLIGENTLY:
- If a question is ambiguous or could apply to multiple distinct exercises (e.g. "How do I lift dumbbells?", "How do I use dumbbells?", "How do I lift weights?"):
  Immediately clarify: "Which movement do you mean: dumbbell curl, shoulder press, row, lateral raise, or another exercise?"
- If the user provides enough context (e.g. "How do I do dumbbell curls?"), answer immediately without asking unnecessary questions.

3. EXERCISE-SPECIFIC COACHING STRUCTURE:
When explaining any exercise or movement technique, follow this concise, practical format:
**[EXERCISE NAME]**
**Setup:** Exact body positioning, stance, and grip.
**Execution:** Concentric and eccentric movement path, joint angles, and controlled tempo.
**Breathing:** Exact inhale/exhale timing (e.g., inhale on lowering eccentric phase, exhale on concentric drive).
**FORM CHECK:**
• 2 to 4 practical, actionable bullet cues.
**COMMON MISTAKE:**
• 1 or 2 specific technique faults and how to correct them immediately.

4. KEEP ANSWERS CONCISE & READABLE:
- Do not produce huge essays or walls of text.
- Use short sections and bullet points so the athlete can read and apply the instruction in 30 seconds while setting up their weights.

5. BAN GENERIC AI LANGUAGE & CLICHÉS:
- NEVER use generic fluff: "Listen to your body", "Protect your joints", "Stay consistent", "Start with a comfortable number of repetitions", "Embark on your fitness journey", "Fitness is a marathon".
- Provide concrete numbers, specific cues, and biomechanical facts instead (e.g., "3 sets of 8–10 reps at RPE 7", "2-second eccentric lowering").

6. USE AXIO'S UNIQUE FEATURES CONTEXTUALLY:
- When the user asks about real-time form checks, posture errors, rep tracking, or joint stability:
  Mention: "Want real-time form feedback? Start AI CAM in the camera tab and AXIO will track your joint angles and rep cadence live."
- Only mention AI CAM when genuinely relevant. Never mention it in every single response.

7. STRICT PERSONALIZATION WITHOUT FABRICATED DATA:
- Calibrate exercise selections, loads, and volume to the athlete's actual fitness level (${fitnessLevel}) and available equipment (${equipment}).
- Never invent fake streaks, non-existent sessions, or imaginary power numbers.

8. WORKOUT CREATION REQUESTS:
- When asked to create a workout, provide a concrete, realistic protocol:
  RECOMMENDATION
  Today's Focus: [Primary Training Stimulus]
  Workout / Protocol:
  1. [Exercise Name] — [Sets] × [Reps or Time] (Rest: [Seconds])
  2. [Exercise Name] — [Sets] × [Reps or Time] (Rest: [Seconds])
  ...
  COACHING TIP: [1–2 concise sentences on eccentric tempo, intent, or breathing].

9. PROGRESS & FORM SCORE INQUIRIES:
- Explain AXIO's kinematic evaluation metrics: Range of Motion (ROM), joint alignment/tracking (e.g. knees over toes, neutral spine), tempo consistency, and bilateral stability. Provide 1–2 actionable cues to immediately increase their score.

10. SCIENCE-BACKED NUTRITION & RECOVERY:
- Provide exact evidence-based targets: daily protein (1.6–2.2g per kg bodyweight; for ${weightKg}kg that is ${Math.round(weightKg * 1.6)}–${Math.round(weightKg * 2.2)}g), post-workout fueling (25–40g protein + complex carbs within 90 mins), sleep (7–9 hrs), and active recovery (Zone 1 aerobic or light mobility).

11. VOICE-FIRST COACHING & SAFETY PROTOCOLS:
- Responses are delivered through the interactive AXIO Voice Coach as well as text chat. Keep explanations crisp, direct, and pleasant for audio listening.
- General fitness safety: If the user reports acute joint pain, sharp pinching, or dizziness, immediately instruct them to stop the exercise and rest.
- Grounded telemetry: Never claim that the camera detected a movement, counted a repetition, or measured a metric unless the existing AXIO AI CAM system actually detected it.

12. MULTILINGUAL FOUNDATION & TELUGU / TENGLISH UNDERSTANDING:
- SUPPORTED LANGUAGES: English, Telugu in Telugu script (తెలుగు), Tenglish (Telugu transcribed using English Roman letters), and mixed Telugu-English code-switched sentences.
- UNDERSTAND TELUGU & TENGLISH NATURALLY:
  • Understand Telugu script, Tenglish, and mixed sentences naturally, including common conversational phrasing, idioms, and spelling variations.
  • Common variations to recognize effortlessly:
    - Today: "eeroju", "eroju", "ivala", "ivvala", "ఈరోజు", "ఇవాళ"
    - Tell/say: "cheppu", "cheppandi", "cheppuko", "చెప్పు", "చెప్పండి"
    - Show: "chupinchu", "chup", "choopandi", "చూపించు", "చూపించండి"
    - How is it: "ela undi", "ela undhi", "elaga undi", "ఎలా ఉంది"
    - Want/need: "kavali", "kaavali", "కావాలి"
    - To me/my: "naaku", "naku", "naa", "na", "నాకు", "నా"
    - Completed/finished: "chesa", "chesanu", "ayindi", "aypoindi", "పూర్తయింది", "చేశాను"
    - Tomorrow: "repu", "రేపు"
- RESPONSE LANGUAGE MATCHING MANDATE:
  • If the user's preferred language is explicitly set to 'te', reply in Telugu.
  • If the user's preferred language is explicitly set to 'en', reply in English.
  • If the user's preferred language is 'auto' (or unspecified):
    - If user wrote in Telugu script, reply in natural, fluent Telugu script.
    - If user wrote in Tenglish (Telugu in Roman alphabet), reply in natural, conversational Tenglish or Telugu, preserving English fitness terms so the user reads and hears it comfortably.
    - If user wrote in English, reply in English.
    - If user wrote a mixed Telugu-English sentence, reply using natural Telugu-English code-switching.
- PRESERVE FITNESS TERMINOLOGY & TECHNICAL DATA:
  • Always preserve standard exercise names (e.g., "Dumbbell Bicep Curl", "Push-ups", "Barbell Squats", "Romanian Deadlift", "Plank"), measurements (e.g., "75 kg", "3 sets of 10 reps", "120g protein"), and dates. Do not invent obscure or confusing translations for widely accepted fitness terminology.
- NEVER TRANSLATE EVERY MESSAGE INTO ENGLISH BEFORE ANSWERING if doing so loses meaning, colloquial nuance, or conversational context.
- ACCURATE TELEMETRY & ZERO FABRICATION:
  • Never fabricate workout history, streaks, or completed sessions. If the athlete has 0 logged sessions, state that accurately.
  • For workout reminder requests (e.g., “నాకు రేపు workout reminder కావాలి” or "Set workout reminder for tomorrow"), confirm that tomorrow's workout reminder is scheduled for their session without inventing non-existent prior workouts.

COACHING TONE: Direct, professional, motivating without being cheesy, clear and actionable, high-performance sports coach mindset.`;

    // Prepare multi-turn conversation contents for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (conversationHistory && conversationHistory.length > 0) {
      // Filter and format conversation turns. Must start with a user turn.
      for (const turn of conversationHistory) {
        if (!turn.text) continue;
        const role = turn.sender === 'user' ? 'user' : 'model';
        // Avoid starting conversation with model role
        if (contents.length === 0 && role === 'model') continue;
        // Avoid duplicate consecutive roles
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${turn.text}`;
        } else {
          contents.push({ role, parts: [{ text: turn.text }] });
        }
      }
    }

    // Add current user prompt
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${trimmedMsg}`;
    } else {
      contents.push({ role: 'user', parts: [{ text: trimmedMsg }] });
    }

    // Attempt Gemini call with multi-model resilience:
    // First try gemini-3.8-flash; if rate-limited (429) or high-demand (503), fall back to gemini-3.1-flash-lite
    let aiResponseText = '';
    let usedModel = 'gemini-3.8-flash';

    if (apiKey) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              topP: 0.9,
            },
          }),
          6000
        );
        aiResponseText = response.text || '';
        usedModel = 'gemini-3.8-flash';
      } catch (primaryErr: any) {
        console.warn('Gemini 3.8 Flash unavailable, attempting gemini-3.1-flash-lite:', primaryErr?.message || primaryErr);
        try {
          const fallbackRes = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents,
              config: {
                systemInstruction,
                temperature: 0.7,
                topP: 0.9,
              },
            }),
            4000
          );
          aiResponseText = fallbackRes.text || '';
          usedModel = 'gemini-3.1-flash-lite';
        } catch (secondaryErr: any) {
          console.warn('Gemini API fallback also failed. Using intelligent contextual sports science engine.', secondaryErr?.message || secondaryErr);
          aiResponseText = generateContextualCoachFallback(trimmedMsg, athleteProfile, recentHistory, conversationHistory, languagePreference);
          usedModel = 'axio-sports-science-engine';
        }
      }
    } else {
      aiResponseText = generateContextualCoachFallback(trimmedMsg, athleteProfile, recentHistory, conversationHistory, languagePreference);
      usedModel = 'axio-sports-science-engine';
    }

    if (!aiResponseText.trim()) {
      aiResponseText = generateContextualCoachFallback(trimmedMsg, athleteProfile, recentHistory, conversationHistory, languagePreference);
    }

    res.json({
      text: aiResponseText,
      model: usedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini API Coach Error:', error);
    // Graceful intelligent recovery so the user is never stranded
    const fallbackText = generateContextualCoachFallback(
      req.body?.message || '',
      req.body?.athleteProfile,
      req.body?.recentHistory,
      req.body?.conversationHistory,
      req.body?.languagePreference
    );
    res.json({
      text: fallbackText,
      model: 'axio-resilience-fallback',
      timestamp: new Date().toISOString(),
    });
  }
});

interface GenerateWorkoutRequest {
  athleteProfile: {
    name?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    fitnessLevel?: string;
    activityLevel?: string;
    trainingExperience?: string;
    goals?: string[];
    workoutLocation?: string;
    availableEquipment?: string[];
    workoutDaysPerWeek?: number;
    workoutDurationMinutes?: number;
    dietPreference?: string;
    discipline?: string;
    tier?: string;
  };
  selectedGoal?: string;
  selectedDuration?: number;
  selectedLevel?: string;
  selectedEquipment?: string[];
  workoutSplit?: string;
  previousWorkoutHistory?: Array<{
    title: string;
    durationMinutes: number;
    date: string;
    peakPower?: number;
    totalVolumeKg?: number;
  }>;
}

/**
 * Intelligent sports science workout generator tailored to experience level
 */
function buildFallbackWorkout(params: GenerateWorkoutRequest) {
  const goal = params.selectedGoal || params.athleteProfile?.goals?.[0] || 'Strength';
  const level = params.selectedLevel || params.athleteProfile?.fitnessLevel || 'Beginner';
  const duration = params.selectedDuration || params.athleteProfile?.workoutDurationMinutes || 45;
  const equipment = (params.selectedEquipment && params.selectedEquipment.length > 0)
    ? params.selectedEquipment
    : params.athleteProfile?.availableEquipment || ['Bodyweight & Calisthenics'];

  const hasBarbell = equipment.some((e) => e.toLowerCase().includes('barbell'));
  const hasDumbbell = equipment.some((e) => e.toLowerCase().includes('dumbbell') || e.toLowerCase().includes('free weight'));

  let title = `${goal} Foundations Protocol`;
  let category = 'Movement Quality & Strength';
  let difficulty = level === 'Elite Athlete' ? 'Maximum Force' : level === 'Advanced' ? 'High Intensity' : level === 'Intermediate' ? 'Challenging' : 'Beginner Friendly';
  let estimatedLoadAu = Math.round(duration * (level === 'Advanced' ? 7.5 : level === 'Intermediate' ? 6.0 : 4.5));
  let coachingNotes = 'Focus on quality movement, proper joint alignment, and stopping each set with 1–2 reps in reserve.';

  let exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    restTime: string;
    difficulty: string;
    targetMuscles: string;
    instructions: string;
    techniqueTips: string;
    targetWeight?: string;
    velocityTarget?: string;
  }> = [];

  if (level === 'Beginner') {
    title = `${goal} Starter Routine`;
    category = 'Movement Fundamentals & Mobility';
    exercises = [
      {
        name: hasDumbbell ? 'Goblet Squat' : 'Bodyweight Air Squats',
        sets: 3,
        reps: '8–10 reps',
        restTime: '60 seconds',
        difficulty: 'Beginner',
        targetMuscles: 'Quadriceps, Glutes, Core',
        instructions: 'Stand with feet shoulder-width apart. Keep chest tall, sit hips back and down to comfortable parallel depth, then stand tall.',
        techniqueTips: 'Keep your whole foot flat on the floor. Track knees over toes.',
        targetWeight: hasDumbbell ? '6–10 kg' : 'Bodyweight',
      },
      {
        name: 'Incline Push-Ups (or Kneeling Push-Ups)',
        sets: 3,
        reps: '6–8 reps',
        restTime: '60 seconds',
        difficulty: 'Beginner',
        targetMuscles: 'Chest, Shoulders, Triceps, Core',
        instructions: 'Place hands on a sturdy elevated surface or bench. Keep body in a straight line from heels to head. Lower chest slowly and push back up.',
        techniqueTips: 'Do not let your hips sag. Keep elbows tracking at 45 degrees.',
        targetWeight: 'Bodyweight',
      },
      {
        name: hasDumbbell ? 'Supported Dumbbell Row' : 'Doorframe or Towel Rows',
        sets: 3,
        reps: '10 reps',
        restTime: '60 seconds',
        difficulty: 'Beginner',
        targetMuscles: 'Upper Back, Lats, Biceps',
        instructions: 'Hinge forward with neutral spine. Pull elbow back toward your hip, squeezing shoulder blade at the top.',
        techniqueTips: 'Avoid twisting your torso. Lead with your elbow.',
        targetWeight: hasDumbbell ? '6–8 kg' : 'Bodyweight',
      },
      {
        name: 'Glute Bridges',
        sets: 3,
        reps: '12 reps',
        restTime: '45 seconds',
        difficulty: 'Beginner',
        targetMuscles: 'Gluteus Maximus, Hamstrings',
        instructions: 'Lie on your back with knees bent and feet flat. Squeeze glutes and press hips upward until thighs align with torso.',
        techniqueTips: 'Pause for 1 second at the top contraction. Avoid arching your lower back.',
        targetWeight: 'Bodyweight',
      },
      {
        name: 'Plank Hold (Forearms or Knees)',
        sets: 3,
        reps: '20–30 seconds',
        restTime: '45 seconds',
        difficulty: 'Beginner',
        targetMuscles: 'Core, Abdominals',
        instructions: 'Hold a firm straight plank position, breathing rhythmically into your abdomen.',
        techniqueTips: 'Keep neck neutral and squeeze glutes tight.',
        targetWeight: 'Bodyweight',
      },
    ];
  } else if (goal.toLowerCase().includes('loss') || goal.toLowerCase().includes('endurance')) {
    title = 'Metabolic Resistance & Conditioning';
    category = 'Cardiovascular & Muscular Endurance';
    exercises = [
      {
        name: hasBarbell ? 'Barbell Front Squat to Push Press' : hasDumbbell ? 'Dumbbell Thrusters' : 'Jump Squats with Pause',
        sets: 3,
        reps: '10–12 reps',
        restTime: '60 seconds',
        difficulty: 'Challenging',
        targetMuscles: 'Quadriceps, Deltoids, Glutes, Core',
        instructions: 'Descend into full squat, then drive up smoothly pressing overhead.',
        techniqueTips: 'Keep elbows high in the squat bottom to prevent spinal flexion.',
        targetWeight: hasBarbell ? '40–50 kg' : hasDumbbell ? '10–14 kg/hand' : 'Bodyweight',
      },
      {
        name: hasBarbell ? 'Barbell Romanian Deadlift' : hasDumbbell ? 'Dumbbell Romanian Deadlift' : 'Single-Leg Hip Thrusts',
        sets: 3,
        reps: '12 reps',
        restTime: '60 seconds',
        difficulty: 'Moderate',
        targetMuscles: 'Hamstrings, Gluteus Maximus, Lower Back',
        instructions: 'Hinge back at the hips with soft knees until tension builds in hamstrings.',
        techniqueTips: 'Maintain a flat, neutral spine throughout the hinge.',
        targetWeight: hasBarbell ? '60–70 kg' : hasDumbbell ? '14–18 kg/hand' : 'Bodyweight',
      },
      {
        name: hasDumbbell ? 'Renegade Rows with Push-Up' : 'Strict Push-Ups with Shoulder Taps',
        sets: 3,
        reps: '8–10 reps',
        restTime: '60 seconds',
        difficulty: 'Challenging',
        targetMuscles: 'Chest, Lats, Anti-Rotation Core',
        instructions: 'Perform a push-up, then row weight or tap opposite shoulder while keeping hips level.',
        techniqueTips: 'Keep feet slightly wider for enhanced pelvis stability.',
        targetWeight: hasDumbbell ? '10–14 kg' : 'Bodyweight',
      },
    ];
  } else {
    // Strength / Hypertrophy / Universal
    title = `${goal} Progressive Protocol`;
    category = 'Strength & Muscle Balance';
    exercises = [
      {
        name: hasBarbell ? 'Barbell Back Squat' : hasDumbbell ? 'Goblet Squat with Tempo' : 'Bulgarian Split Squats',
        sets: 4,
        reps: '8 reps',
        restTime: '90 seconds',
        difficulty: 'Moderate-High',
        targetMuscles: 'Quadriceps, Glutes',
        instructions: 'Descend with control until thighs reach parallel, then drive upward through mid-foot.',
        techniqueTips: 'Keep torso braced and spread knees out over toes.',
        targetWeight: hasBarbell ? '60–80 kg' : hasDumbbell ? '18–24 kg' : 'Bodyweight',
      },
      {
        name: hasBarbell ? 'Barbell Bench Press' : hasDumbbell ? 'Dumbbell Chest Press' : 'Full Push-Ups with 2s Pause',
        sets: 3,
        reps: '8–10 reps',
        restTime: '90 seconds',
        difficulty: 'Moderate',
        targetMuscles: 'Pectorals, Anterior Deltoids, Triceps',
        instructions: 'Lower weight under control to mid-chest, then press back to full arm extension.',
        techniqueTips: 'Retract shoulder blades into bench to protect shoulder joints.',
        targetWeight: hasBarbell ? '50–70 kg' : hasDumbbell ? '16–22 kg/hand' : 'Bodyweight',
      },
      {
        name: hasBarbell ? 'Barbell Romanian Deadlift' : hasDumbbell ? 'Dumbbell Romanian Deadlift' : 'Nordic Hamstring Curl Eccentrics',
        sets: 3,
        reps: '10 reps',
        restTime: '75 seconds',
        difficulty: 'Moderate',
        targetMuscles: 'Hamstrings, Gluteus Maximus',
        instructions: 'Hinge hips backwards while keeping weight close to legs.',
        techniqueTips: 'Feel the stretch in the hamstrings before driving hips forward.',
        targetWeight: hasBarbell ? '60–85 kg' : hasDumbbell ? '16–20 kg/hand' : 'Bodyweight',
      },
      {
        name: hasDumbbell ? 'Dumbbell Bent-Over Row' : hasBarbell ? 'Barbell Row' : 'Inverted Table/Bar Rows',
        sets: 3,
        reps: '10 reps',
        restTime: '60 seconds',
        difficulty: 'Moderate',
        targetMuscles: 'Lats, Rhomboids, Biceps',
        instructions: 'Pull weights to lower ribcage, pausing for a split second at peak contraction.',
        techniqueTips: 'Keep shoulders away from your ears.',
        targetWeight: hasDumbbell ? '14–18 kg/hand' : hasBarbell ? '45–60 kg' : 'Bodyweight',
      },
    ];
  }

  if (duration <= 35 && exercises.length > 3) {
    exercises = exercises.slice(0, 3);
  } else if (duration <= 45 && exercises.length > 4) {
    exercises = exercises.slice(0, 4);
  }

  return {
    id: `WO-GEN-${Date.now()}`,
    title,
    category,
    targetGoal: goal,
    fitnessLevel: level,
    durationMinutes: duration,
    estimatedLoadAu,
    difficulty,
    targetMusclesSummary: [
      ...new Set(exercises.map((e) => e.targetMuscles.split(',')[0].trim())),
    ],
    coachingNotes,
    exercises,
    createdAt: new Date().toISOString(),
  };
}

/**
 * POST /api/workout/generate
 * Server-side route generating personalized workout with multi-model resilience
 */
app.post('/api/workout/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as GenerateWorkoutRequest;
    const {
      athleteProfile,
      selectedGoal,
      selectedDuration,
      selectedLevel,
      selectedEquipment,
      workoutSplit,
    } = payload;

    const goal = selectedGoal || athleteProfile?.goals?.[0] || 'Strength';
    const duration = selectedDuration || athleteProfile?.workoutDurationMinutes || 45;
    const level = selectedLevel || athleteProfile?.fitnessLevel || 'Beginner';
    const equipment = (selectedEquipment && selectedEquipment.length > 0)
      ? selectedEquipment.join(', ')
      : athleteProfile?.availableEquipment?.join(', ') || 'Bodyweight & Basic Equipment';

    if (!apiKey) {
      const fallback = buildFallbackWorkout(payload);
      res.json({
        workout: fallback,
        source: 'sports-science-engine-default',
        note: 'Generated using AXIO Sports Science Periodization Engine.',
      });
      return;
    }

    const systemInstruction = `You are the AXIO Workout Generator for the AXIO Fitness Platform.
Generate a safe, realistic, structured workout protocol strictly tailored to:
- User: ${athleteProfile?.name || 'Athlete'}, ${athleteProfile?.weightKg || 75}kg, Fitness Level: ${level}
- Goal: ${goal}
- Duration: ${duration} minutes
- Available Equipment: ${equipment}
- Preferred Split: ${workoutSplit || 'Full Body Balance'}

SAFETY & SUITABILITY RULES:
1. If the level is Beginner, DO NOT prescribe heavy barbells, explosive Olympic lifts, or high-risk movements. Use bodyweight or light dumbbells.
2. Every exercise MUST have: name, sets (integer 2-4), reps (e.g. "8-10 reps" or "30s"), restTime, difficulty, targetMuscles, instructions, techniqueTips, and targetWeight (if applicable).
3. Total exercises must match duration: 30m = 3 exercises, 45m = 4 exercises, 60m = 5 exercises.
4. Return strictly valid JSON adhering to the provided schema.`;

    const userPrompt = `Generate a personalized ${goal} workout session lasting ${duration} minutes for a ${level} trainee with access to ${equipment}.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        category: { type: Type.STRING },
        targetGoal: { type: Type.STRING },
        fitnessLevel: { type: Type.STRING },
        durationMinutes: { type: Type.INTEGER },
        estimatedLoadAu: { type: Type.INTEGER },
        difficulty: { type: Type.STRING },
        targetMusclesSummary: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        coachingNotes: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.INTEGER },
              reps: { type: Type.STRING },
              restTime: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              targetMuscles: { type: Type.STRING },
              instructions: { type: Type.STRING },
              techniqueTips: { type: Type.STRING },
              targetWeight: { type: Type.STRING },
              velocityTarget: { type: Type.STRING },
            },
            required: [
              'name',
              'sets',
              'reps',
              'restTime',
              'difficulty',
              'targetMuscles',
              'instructions',
              'techniqueTips',
            ],
          },
        },
      },
      required: [
        'title',
        'category',
        'durationMinutes',
        'difficulty',
        'exercises',
        'coachingNotes',
      ],
    };

    let text = '';
    let sourceModel = 'gemini-3.8-flash';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.6,
          topP: 0.9,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      text = response.text || '';
    } catch (ePrimary) {
      console.warn('Gemini 3.8 Flash workout generator unavailable, trying gemini-3.1-flash-lite:', ePrimary);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.6,
          topP: 0.9,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      text = response.text || '';
      sourceModel = 'gemini-3.1-flash-lite';
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    if (!parsedData || !Array.isArray(parsedData.exercises) || parsedData.exercises.length === 0) {
      throw new Error('Gemini response did not contain expected exercises array.');
    }

    const workoutPlan = {
      id: `WO-GEN-${Date.now()}`,
      title: parsedData.title || `${goal} Training Protocol`,
      category: parsedData.category || 'Personalized Protocol',
      targetGoal: parsedData.targetGoal || goal,
      fitnessLevel: parsedData.fitnessLevel || level,
      durationMinutes: parsedData.durationMinutes || duration,
      estimatedLoadAu: parsedData.estimatedLoadAu || Math.round(duration * 5.5),
      difficulty: parsedData.difficulty || 'Appropriate',
      targetMusclesSummary: parsedData.targetMusclesSummary || [],
      coachingNotes: parsedData.coachingNotes || 'Follow controlled tempo and log each set accurately.',
      exercises: parsedData.exercises,
      createdAt: new Date().toISOString(),
    };

    res.json({
      workout: workoutPlan,
      source: sourceModel,
    });
  } catch (error: any) {
    console.warn('Workout Generation fallen back to periodization engine:', error?.message);
    const fallback = buildFallbackWorkout(req.body);
    res.json({
      workout: fallback,
      source: 'sports-science-fallback',
      warning: 'Personalized protocol created using AXIO Sports Science engine.',
    });
  }
});

// Mount Vite or static server
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AXIO Platform listening on http://0.0.0.0:${PORT}`);
});
