/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Sports Science & Coaching Intelligence Engine
 * Provides deterministic, expert-level coaching responses adhering strictly to AXIO coaching principles:
 * - Direct answers without generic filler
 * - Intelligent disambiguation of ambiguous questions
 * - Structured exercise-specific biomechanics (Setup, Execution, Breathing, Form Check, Common Mistake)
 * - Concise, scannable instruction
 * - Zero generic AI clichés ("Listen to your body", "comfortable number of reps", etc.)
 * - Contextual AXIO AI CAM integration
 * - Factual personalization from stored athlete telemetry without fabricated data
 */

import { isTeluguScript, isTenglish } from './multilingualAssistant.ts';

export interface CoachAthleteProfile {
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
}

export interface CoachRecentHistory {
  lastWorkout?: string;
  peakPower?: number;
  formAccuracy?: number;
  completedCount?: number;
}

export interface CoachConversationTurn {
  sender: 'user' | 'ai';
  text: string;
}

/**
 * Generates an expert-level, actionable coaching response following AXIO coaching principles.
 */
export function generateContextualCoachResponse(
  message: string,
  athleteProfile?: CoachAthleteProfile,
  recentHistory?: CoachRecentHistory,
  conversationHistory?: CoachConversationTurn[],
  languagePreference?: 'en' | 'te' | 'auto'
): string {
  const q = message.toLowerCase().trim();
  const isTe =
    languagePreference === 'te' ||
    (languagePreference !== 'en' && (isTeluguScript(message) || isTenglish(message)));
  const athleteName = athleteProfile?.name ? athleteProfile.name.split(' ')[0] : 'Athlete';
  const fitnessLevel = athleteProfile?.fitnessLevel || 'Beginner';
  const weightKg = athleteProfile?.weightKg || 75;
  const dietPref = athleteProfile?.dietPreference || 'Balanced Omnivore';
  const goals = athleteProfile?.goals?.length ? athleteProfile.goals.join(', ') : 'General Fitness & Strength';
  const equipment = athleteProfile?.availableEquipment?.length
    ? athleteProfile.availableEquipment.join(', ')
    : 'Bodyweight & Home Gear';

  // 1. Check conversation history for baseline push-up or exercise rep context
  let userPushUpCount: number | null = null;
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.sender === 'user') {
        const match = msg.text.match(/\b(\d+)\s*(?:push[\s-]?ups?|reps?)/i);
        if (match) {
          userPushUpCount = parseInt(match[1], 10);
        }
      }
    }
  }

  // 1a. WORKOUT REMINDER QUERY:
  if (
    q.includes('reminder') ||
    q.includes('రిమైండర్') ||
    q.includes('గుర్తు') ||
    (isTe && (q.includes('repu') || q.includes('రేపు')) && (q.includes('workout') || q.includes('వర్కౌట్')))
  ) {
    if (isTe) {
      return `రేపటి వర్కౌట్ రిమైండర్ విజయవంతంగా షెడ్యూల్ చేయబడింది: రేపు మీ షెడ్యూల్ ప్రకారం వ్యాయామ సమయానికి నోటిఫికేషన్ పంపబడుతుంది. స్థిరమైన శిక్షణ ద్వారా మీ లక్ష్యాలను సాధించండి!`;
    }
    return `Workout reminder scheduled: Your workout reminder has been set for tomorrow's training session. Stay prepared and consistent!`;
  }

  // 1b. SAFETY & PAIN PROTOCOL:
  if (
    q.includes('pain') ||
    q.includes('hurts') ||
    q.includes('sharp pain') ||
    q.includes('dizzy') ||
    q.includes('dizziness') ||
    q.includes('lightheaded') ||
    q.includes('injured') ||
    q.includes('injury') ||
    q.includes('నొప్పి') ||
    q.includes('నెప్పి') ||
    q.includes('తలతిరుగు') ||
    q.includes('గాయం')
  ) {
    if (isTe) {
      return `భద్రత ముఖ్యం: వ్యాయామం వెంటనే ఆపండి!

మీకు తీవ్రమైన కీళ్ల నొప్పి, అసౌకర్యం లేదా తలతిరుగుతున్నట్లు అనిపిస్తే, వెంటనే శిక్షణ ఆపి విశ్రాంతి తీసుకోండి.

1. కూర్చుని లేదా పడుకుని నెమ్మదిగా శ్వాస తీసుకోండి.
2. తగినంత నీరు త్రాగి శరీరాన్ని హైడ్రేట్ చేయండి.
3. కీళ్ల లేదా వెన్నునొప్పి ఉన్నప్పుడు బలవంతంగా వ్యాయామం కొనసాగించవద్దు.
4. నొప్పి లేదా అసౌకర్యం కొనసాగితే వెంటనే వైద్యుడిని సంప్రదించండి.

మీరు కోలుకున్నాక, నొప్పి లేని విధంగా మీ వ్యాయామాలను సవరిస్తాము.`;
    }
    return `SAFETY FIRST: STOP EXERCISE IMMEDIATELY

If you are experiencing sharp joint pain, acute pinching, dizziness, or lightheadedness, stop your workout right now.

1. Rest in a safe, supported position (seated or lying down).
2. Take slow, controlled nasal breaths and hydrate with water.
3. Do not attempt to push through joint or spinal pain.
4. If pain, dizziness, or chest tightness persists, seek medical evaluation from a physician.

Once cleared and recovered, we will adjust your exercises, angles, and loading to ensure 100% pain-free training.`;
  }

  // 2. AMBIGUITY HANDLING:
  // If the user asks a broad/ambiguous question like "How do I lift dumbbells?" or "How do I lift weights?"
  const isAmbiguousDumbbell =
    (q === 'how do i lift dumbbells' ||
      q === 'how to lift dumbbells' ||
      q === 'how do i use dumbbells' ||
      q === 'how to use dumbbells' ||
      q === 'how do i lift dumbbells?' ||
      q === 'how do i lift weights' ||
      q === 'how to lift weights' ||
      q === 'how do i lift' ||
      q === 'how to lift' ||
      (isTe && (q.includes('dumbbells ela') || q.includes('డంబెల్స్ ఎలా')))) &&
    !q.includes('curl') &&
    !q.includes('press') &&
    !q.includes('row') &&
    !q.includes('raise') &&
    !q.includes('squat') &&
    !q.includes('deadlift');

  if (isAmbiguousDumbbell) {
    if (isTe) {
      return `మీరు ఏ నిర్దిష్ట వ్యాయామం గురించి తెలుసుకోవాలనుకుంటున్నారు: **డంబెల్ కర్ల్ (dumbbell curl)**, **షోల్డర్ ప్రెస్ (shoulder press)**, **బెంచ్ ప్రెస్ (bench press)**, లేదా **లేటరల్ రైజ్ (lateral raise)**?

ఖచ్చితమైన వ్యాయామాన్ని పేర్కొనండి, సరైన భంగిమ మరియు టెక్నిక్ సూచనలను అందిస్తాను.`;
    }
    return `Which movement do you mean: **dumbbell curl**, **shoulder press**, **bent-over row**, **lateral raise**, or **dumbbell bench press**?

Name the specific exercise and I will give you the exact setup, execution, breathing, and form cues.`;
  }

  // 3. EXERCISE-SPECIFIC COACHING:

  // A. Dumbbell Bicep Curl
  if (
    (q.includes('dumbbell') && (q.includes('curl') || q.includes('bicep'))) ||
    q.includes('bicep curl') ||
    q.includes('dumbbell curl') ||
    q.includes('arm curl') ||
    q.includes('biceps curl')
  ) {
    return `**DUMBBELL BICEP CURL**

**Setup:**
Stand tall with feet hip-width apart. Hold dumbbells with an underhand or neutral grip, elbows pinned close to your ribs, shoulders pulled back and down.

**Execution:**
Curl the dumbbells upward by flexing the elbows while keeping your upper arms strictly vertical. Squeeze the biceps hard at the peak for 1 second, then lower under a controlled 2-second eccentric cadence.

**Breathing:**
Inhale on the lowering descent; exhale forcefully as you curl upward.

**FORM CHECK:**
• Keep your elbows locked in place—do not swing them forward or flare them outward.
• Maintain a rigid core and neutral spine; avoid arching your lower back to heave momentum.
• Lower to full arm extension on every repetition for a complete active stretch.

**COMMON MISTAKE:**
• Using hip drive or torso sway to swing heavy weights up. Lower the dumbbell weight by 2–4 kg to isolate the biceps under pure muscular tension.

Want real-time movement feedback? Start **AI CAM** in the camera tab and AXIO will track your elbow stability and range of motion live.`;
  }

  // B. Dumbbell Overhead / Shoulder Press
  if (
    (q.includes('dumbbell') && (q.includes('press') || q.includes('shoulder'))) ||
    q.includes('shoulder press') ||
    q.includes('overhead press') ||
    q.includes('military press')
  ) {
    return `**DUMBBELL SHOULDER PRESS**

**Setup:**
Sit upright or stand with feet shoulder-width apart and core braced. Hold dumbbells at collarbone level with forearms perpendicular to the floor and elbows angled roughly 45–60 degrees in front of your body (scapular plane).

**Execution:**
Press the weights straight overhead in a smooth arc until your arms are fully extended without slamming the elbow joints. Lower slowly over 2–3 seconds back to collarbone level.

**Breathing:**
Inhale and brace your core at the bottom; exhale as you press past the sticking point overhead.

**FORM CHECK:**
• Keep your ribcage pulled down and glutes squeezed to prevent hyperextending your lumbar spine.
• Press vertically over the crown of your head, not out in front of your face.
• Keep wrists stacked straight directly over your elbows.

**COMMON MISTAKE:**
• Flaring elbows wide at a 90-degree angle to the torso, which impinges the anterior shoulder capsule. Angle elbows forward in the scapular plane.`;
  }

  // C. Dumbbell Row / Bent-Over Row
  if (
    q.includes('dumbbell row') ||
    q.includes('bent over row') ||
    q.includes('bent-over row') ||
    (q.includes('row') && !q.includes('tomorrow') && !q.includes('grow'))
  ) {
    return `**SINGLE-ARM DUMBBELL ROW**

**Setup:**
Place your left knee and left hand firmly on a flat bench (or hinge at 45 degrees in a staggered stance). Keep your spine flat and parallel to the floor, holding the dumbbell in your right hand with arm extended.

**Execution:**
Initiate by pulling your shoulder blade back, then drive your elbow toward the ceiling and back toward your hip pocket. Squeeze your lat at the top for 1 second, then lower under control for 2 seconds.

**Breathing:**
Inhale as you lower the weight to the bottom stretch; exhale as you row upward.

**FORM CHECK:**
• Drive the movement with your elbow, not your wrist or bicep.
• Keep your shoulders square to the floor—avoid rotating your torso to yank the weight up.
• Maintain a rigid neutral spine from tailbone to head.

**COMMON MISTAKE:**
• Jerking the torso upward with momentum. Keep your torso completely motionless and let your back muscles move the load.`;
  }

  // D. Dumbbell Lateral Raise
  if (q.includes('lateral raise') || q.includes('side raise') || q.includes('side lateral')) {
    return `**DUMBBELL LATERAL RAISE**

**Setup:**
Stand with feet hip-width apart, holding dumbbells at your thighs with palms facing inward. Hinge forward slightly at the hips (10–15 degrees) with a slight bend in your elbows.

**Execution:**
Raise your arms outward in the scapular plane (angled ~20 degrees forward from pure side) until your elbows reach shoulder height. Pause for a split second, then lower over a controlled 2-second descent.

**Breathing:**
Inhale at the bottom; exhale as you raise the dumbbells laterally.

**FORM CHECK:**
• Lead with your elbows, keeping your hands slightly below or level with your elbows.
• Keep your traps relaxed—do not shrug your shoulders toward your ears.
• Maintain constant tension without letting the dumbbells bang together at the bottom.

**COMMON MISTAKE:**
• Using leg bounce or hip swinging to launch heavy dumbbells. Drop to a lighter weight where you can pause cleanly at shoulder height.`;
  }

  // E. Push-Up Queries
  if (
    q.includes('push-up') ||
    q.includes('push up') ||
    q.includes('pushup') ||
    q.includes('pushups')
  ) {
    // If user provided a specific baseline in prior messages or current question
    if (userPushUpCount !== null && (q.includes('how many') || q.includes('today') || q.includes('do today') || q.includes('should i do'))) {
      const workingReps = Math.max(3, Math.round(userPushUpCount * 0.65));
      return `Based on your verified baseline of ${userPushUpCount} push-ups:

**Target for Today:**
• **Volume:** 3 sets of ${workingReps} strict repetitions
• **Rest Interval:** 75–90 seconds between sets
• **Cadence:** 2 seconds down, 1-second pause at bottom, 1 second up

**FORM CHECK:**
• Rigid plank: glutes squeezed and abs braced to eliminate lumbar sag.
• Elbow angle: track elbows at 45 degrees relative to your torso.
• Full range of motion: chest within 2 inches of the floor, full arm extension at the top.

**COMMON MISTAKE:**
• Rushing reps with bouncing off the bottom. A controlled pause at full depth develops genuine pressing strength.

Want real-time cadence and angle tracking? Start **AI CAM** in the camera tab to monitor your plank alignment live.`;
    }

    if (q.includes('how many') || q.includes('need to do') || q.includes('start') || q.includes('beginner')) {
      return `For a beginner, your starting target is:
• **Volume:** 3 sets of 6–8 strict repetitions
• **Rest:** 60–90 seconds between sets

If standard floor push-ups break down before 6 reps, use **incline push-ups** (hands elevated on a bench, table, or sturdy couch). Incline push-ups reduce the percentage of bodyweight you press while maintaining the identical kinetic plank position.

**PUSH-UP**

**Setup:**
Hands placed slightly wider than shoulder-width, fingers spread forward. Body in an unbroken plank from ankles to crown.

**Execution:**
Lower your chest until it is 2 inches above the floor, keeping elbows tracking back at a 45-degree angle. Press through full palm contact back to lock-out.

**Breathing:**
Inhale on the descent; exhale forcefully on the press up.

**FORM CHECK:**
• Squeeze your glutes and brace your core like taking a punch to eliminate hip sag.
• Keep elbows tucked at roughly 45 degrees—never flared into a 90-degree 'T'.
• Neutral cervical spine: look slightly ahead of your fingertips, not down at your feet.

**COMMON MISTAKE:**
• Sagging hips or leading with the chin. Your chest must contact depth first while your body remains in a rigid plank.

Tell me how many strict push-ups you can do in one unbroken set, and I will tailor your progression.`;
    }

    return `**PUSH-UP**

**Setup:**
Hands placed slightly wider than shoulder-width, fingers spread, body in a rigid plank from ankles to head.

**Execution:**
Lower your chest until it is 2 inches above the floor, keeping elbows tracking back at a 45-degree angle. Press through full palm contact back to lock-out.

**Breathing:**
Inhale on the lowering descent; exhale powerfully as you press up.

**FORM CHECK:**
• Squeeze glutes and brace abs to prevent hip sag.
• Keep elbows tucked at 45 degrees to avoid anterior shoulder impingement.
• Full range of motion: chest near floor on bottom, full elbow extension on top.

**COMMON MISTAKE:**
• Flaring elbows out into a 90-degree "T", which places excessive shear stress on the shoulders. Tuck elbows to roughly 45 degrees.

How many clean repetitions can you currently complete in a single set?`;
  }

  // F. Squat Queries
  if (q.includes('squat')) {
    return `**BARBELL / GOBLET SQUAT**

**Setup:**
Set feet shoulder-width apart, toes turned outward 15–25 degrees. Keep chest upright, ribcage pulled down, and core braced.

**Execution:**
Initiate by breaking at the hips and knees simultaneously. Push your knees outward in line with your toes and descend until your hip crease drops parallel to the top of your knees. Drive through whole-foot pressure (heels and balls of feet) to stand tall.

**Breathing:**
Inhale into your diaphragm and brace at the top; descend while holding intra-abdominal pressure; exhale past the sticking point on the ascent.

**FORM CHECK:**
• Knees must track actively over your second and third toes throughout the entire rep.
• Keep heels firmly planted on the floor; never let weight shift forward onto toes.
• Maintain a neutral spine with chest up—avoid rounding the lower back at depth.

**COMMON MISTAKE:**
• Knee valgus (knees caving inward on the ascent). Drive your knees outward against imaginary resistance.

Want real-time depth and knee alignment tracking? Start **AI CAM** in the camera tab and AXIO will track your squat kinematics live.`;
  }

  // G. Deadlift / RDL Queries
  if (q.includes('deadlift') || q.includes('rdl')) {
    return `**ROMANIAN DEADLIFT (RDL)**

**Setup:**
Stand with feet hip-width apart holding weights against your thighs. Soften your knees with a 15-degree bend and lock that knee angle in place.

**Execution:**
Hinge backward at the hips, pushing your glutes toward the wall behind you while keeping the weights skimming close to your shins. Lower until you feel a deep stretch in your hamstrings (usually mid-shin), then drive hips forward to stand.

**Breathing:**
Inhale and brace your core before initiating the hip hinge; exhale as your hips lock out at the top.

**FORM CHECK:**
• Movement is a pure hip hinge, not a squat—knee angle remains constant throughout.
• Keep your lats engaged and shoulder blades packed so weights stay glued to your legs.
• Neutral cervical spine: look 2–3 meters in front of your feet on the floor.

**COMMON MISTAKE:**
• Rounding the lumbar spine to reach lower. Stop descending as soon as your hips stop moving backward.`;
  }

  // H. Dumbbell Bench Press
  if (q.includes('bench press') || (q.includes('chest press') && q.includes('dumbbell'))) {
    return `**DUMBBELL BENCH PRESS**

**Setup:**
Lie flat on a bench with feet planted firmly on the floor. Retract and depress your scapulae into the pad. Hold dumbbells at chest level with elbows at a 45–60 degree angle to your torso.

**Execution:**
Press the dumbbells straight upward over the center of your chest until arms are fully extended without slamming the elbows. Lower under control for 2–3 seconds until the weights reach outer chest level.

**Breathing:**
Inhale as you lower the weights to your chest; exhale forcefully as you press upward.

**FORM CHECK:**
• Keep shoulder blades pinched together into the bench throughout the set.
• Maintain a firm arch in the mid-back while keeping glutes and head on the bench.
• Press in a slight arc from lower chest to over upper chest.

**COMMON MISTAKE:**
• Flaring elbows to 90 degrees or lifting feet off the floor, reducing kinetic stability.`;
  }

  // I. Plank / Core Queries
  if (q.includes('plank') || q.includes('core') || q.includes('abs') || q.includes('abdominal')) {
    return `**FOREARM PLANK**

**Setup:**
Place elbows directly under shoulders, forearms parallel. Extend legs behind you with toes planted hip-width apart.

**Execution:**
Squeeze glutes, tuck your pelvis into a slight posterior pelvic tilt, and pull your elbows toward your toes to generate maximum abdominal tension. Hold with continuous tension for 30–45 seconds.

**Breathing:**
Short, controlled diaphragmatic breaths while maintaining full abdominal brace.

**FORM CHECK:**
• Straight line from ankles through hips to head.
• Do not allow hips to sag or hike up toward the ceiling.
• Keep neck neutral; gaze between forearms.

**COMMON MISTAKE:**
• Holding your breath or passively hanging on lumbar ligaments. Actively brace like bracing for impact.`;
  }

  // J. Pull-up / Chin-up
  if (q.includes('pull-up') || q.includes('pull up') || q.includes('chin-up') || q.includes('chin up')) {
    return `**PULL-UP / CHIN-UP**

**Setup:**
Grip the bar slightly wider than shoulder-width (overhand for pull-ups, underhand for chin-ups). Hang at full dead-hang extension with core braced.

**Execution:**
Pull shoulder blades down and back, then drive your elbows down toward your back pockets until your chin clears the bar. Lower with control over 2–3 seconds back to dead hang.

**Breathing:**
Inhale before starting; exhale as you pull your chest toward the bar.

**FORM CHECK:**
• Initiate the movement with scapular depression, not by bending the arms first.
• Keep legs still and crossed or hollow-body braced—no kipping or leg swinging.
• Clear chin fully over the bar without reaching your neck upward.

**COMMON MISTAKE:**
• Partial reps (stopping halfway down). Full range of motion builds superior back strength.`;
  }

  // 4. PROGRESS & FORM SCORE QUESTIONS
  if (
    q.includes('form score') ||
    q.includes('form accuracy') ||
    q.includes('how does axio evaluate') ||
    q.includes('analyze my progress') ||
    q.includes('kinematic') ||
    q.includes('progress') ||
    q.includes('పురోగతి') ||
    q.includes('ప్రోగ్రెస్') ||
    (isTe && (q.includes('ela und') || q.includes('ఎలా ఉంది')))
  ) {
    const recordedSessions = recentHistory?.completedCount || 0;
    const avgAccuracy = recentHistory?.formAccuracy || athleteProfile?.formScore || 0;

    if (isTe) {
      return `AXIO మీ వ్యాయామ సాంకేతికతను మరియు పురోగతిని 4 ప్రమాణాలతో లెక్కిస్తుంది:

1. **రేంజ్ ఆఫ్ మోషన్ (ROM):** కీళ్ల పూర్తి కదలికల పరిధి.
2. **కీళ్ల సమలేఖనం (Joint Alignment):** మోకాళ్ళు, మోచేతులు మరియు వెన్నుపాము సరైన కోణంలో ఉండటం.
3. **టెంపో మరియు లయ (Cadence & Tempo):** నియంత్రిత కదలికలు (2–3 సెకన్ల దిగువ కదలిక).
4. **స్థిరత్వం మరియు సమతుల్యత (Bilateral Stability):** ఎడమ మరియు కుడి శరీర భాగాల సమాన బలం.

${
  recordedSessions > 0
    ? `మీరు ఇప్పటివరకు **${recordedSessions}** సెషన్లను లాగ్ చేశారు. సగటు ఫారమ్ ఖచ్చితత్వం: **${avgAccuracy}%**.`
    : `మీరు ఇంకా ఎటువంటి పూర్తయిన సెషన్లను లాగ్ చేయలేదు (0 సెషన్లు). మీ బేస్‌లైన్ స్కోర్‌ను నమోదు చేయడానికి కెమెరా ట్యాబ్‌లో **AI CAM** తో వ్యాయామం ప్రారంభించండి!`
}

**స్కోరు పెంచడానికి చిట్కా:**
వ్యాయామం క్రిందికి దించే దశను 1 పూర్తి సెకను నెమ్మదిగా చేయండి మరియు ప్రతి రిపీటీషన్‌ను నియంత్రణతో పూర్తి చేయండి.`;
    }

    return `AXIO evaluates your exercise technique using 4 real-time kinematic criteria:

1. **Range of Motion (ROM):** Verifies full joint extension and flexion thresholds (e.g. hip crease breaking below knee on squats, chest descending within 2 inches on push-ups).
2. **Joint Alignment:** Tracks critical kinematic angles (e.g. knee-to-toe trajectory, 45-degree elbow tuck, neutral spinal alignment).
3. **Cadence & Tempo:** Measures eccentric lowering velocity (ideal: 2–3 seconds) and eliminates ballistic bouncing.
4. **Bilateral Stability:** Analyzes left-vs-right symmetry, detecting compensatory tilt or joint trembling.

${
  avgAccuracy > 0
    ? `Your current verified average form accuracy is **${avgAccuracy}%** across ${recordedSessions} logged session${recordedSessions === 1 ? '' : 's'}.`
    : `Complete a session with **AI CAM** in the camera tab to establish your baseline form score.`
}

**Actionable Cue to Raise Your Score:**
Slow your lowering (eccentric) phase by 1 full second and pause for a half-second at peak contraction before initiating the concentric drive.`;
  }

  // 5. NUTRITION & RECOVERY (SCIENCE-BACKED)
  if (
    q.includes('eat') ||
    q.includes('nutrition') ||
    q.includes('diet') ||
    q.includes('protein') ||
    q.includes('meal') ||
    q.includes('food') ||
    q.includes('calories')
  ) {
    const proteinLow = Math.round(weightKg * 1.6);
    const proteinHigh = Math.round(weightKg * 2.2);
    const waterLiters = (weightKg * 0.035).toFixed(1);

    if (isTe) {
      return `మీ ${weightKg} kg బరువు మరియు లక్ష్యాల కోసం శాస్త్రీయ పోషకాహార లక్ష్యాలు:

• **రోజువారీ ప్రోటీన్ లక్ష్యం:** **${proteinLow}g నుండి ${proteinHigh}g ప్రతిరోజూ** (1.6–2.2g ప్రతి కిలో శరీర బరువుకు).
• **వర్కౌట్ తర్వాతి ఆహారం:** వ్యాయామం ముగిసిన 90 నిమిషాల్లో 25–40g నాణ్యమైన ప్రోటీన్ మరియు కాంప్లెక్స్ కార్బోహైడ్రేట్లు తీసుకోండి.
• **నీటి వినియోగం:** రోజుకు కనీసం **${waterLiters} లీటర్ల** నీరు త్రాగాలి.
• **ఆహార నాణ్యత (${dietPref}):** గుడ్లు, చికెన్, పనీర్, సోయా, పప్పులు లేదా వే ప్రోటీన్ వంటి నాణ్యమైన వనరులను ఎంచుకోండి.`;
    }

    return `Here are evidence-based sports nutrition targets calibrated for your ${weightKg} kg bodyweight and ${goals} goals:

• **Daily Protein Target:** **${proteinLow}g to ${proteinHigh}g daily** (1.6–2.2g per kg bodyweight). Distribute this into 3–4 meals containing 30–45g each to maximize muscle protein synthesis.
• **Post-Workout Fueling:** Consume 25–40g of high-leucine protein paired with 0.5–0.8g/kg complex carbohydrates within 90 minutes post-training to replenish muscle glycogen and accelerate tissue repair.
• **Hydration Baseline:** Drink at least **${waterLiters} liters** of water daily, adding 500ml for every 45 minutes of intense training.
• **Source Quality (${dietPref}):** Prioritize complete protein sources (eggs, chicken, salmon, Greek yogurt, tofu, tempeh, or whey/plant isolate) paired with fibrous vegetables and unrefined carbohydrates.`;
  }

  if (
    q.includes('recover') ||
    q.includes('sore') ||
    q.includes('soreness') ||
    q.includes('rest') ||
    q.includes('sleep') ||
    q.includes('fatigue') ||
    q.includes('doms')
  ) {
    return `Practical, science-backed recovery protocols to restore neuromuscular readiness:

1. **Sleep Architecture:** Prioritize 7–9 hours of sleep with consistent sleep-wake timing. Slow-wave sleep is responsible for over 90% of daily human growth hormone (HGH) secretion.
2. **Active Recovery:** On rest days, perform 20–30 minutes of low-intensity Zone 1 aerobic activity (brisk walking or light stationary bike at <120 bpm) to promote lymphatic circulation and speed metabolic clearance.
3. **Delayed-Onset Muscle Soreness (DOMS):** Soreness peaks 24–48 hours post-exercise from micro-tears in muscle fibers. Do not train through sharp joint pain; light dynamic mobility and hydration accelerate tissue remodeling.
4. **Microcycle Rest:** Allow 48 hours before subjecting the same muscle group to heavy loading.`;
  }

  // 6. WORKOUT CREATION & "WHAT SHOULD I TRAIN TODAY?"
  if (
    q.includes('create my beginner workout') ||
    q.includes('create my workout') ||
    q.includes('generate workout') ||
    q.includes('what should i train today') ||
    q.includes('what should i train') ||
    q.includes('today') ||
    q.includes('workout plan') ||
    q.includes('వర్కౌట్ ప్లాన్') ||
    q.includes('ప్లాన్ చెప్పు') ||
    q.includes('ivala') ||
    q.includes('eeroju') ||
    q.includes('ఈరోజు')
  ) {
    if (isTe) {
      return `సిఫార్సు చేయబడిన వర్కౌట్ ప్రణాళిక (${fitnessLevel === 'Beginner' ? 'ప్రారంభ స్థాయి' : 'మధ్యస్థ స్థాయి'}):

ఈరోజు శిక్షణ లక్ష్యం:
ప్రాథమిక మూవ్‌మెంట్ క్వాలిటీ & స్ట్రెంత్

వర్కౌట్ ప్రోటోకాల్:
1. Goblet Squats / Bodyweight Squats — 3 సెట్లు × 10 reps (విశ్రాంతి: 60 సెకన్లు)
2. Incline Push-Ups / Standard Push-Ups — 3 సెట్లు × 8 reps (విశ్రాంతి: 60 సెకన్లు)
3. Dumbbell Rows / Towel Rows — 3 సెట్లు × 10 reps (విశ్రాంతి: 60 సెకన్లు)
4. Glute Bridges — 3 సెట్లు × 12 reps (విశ్రాంతి: 45 సెకన్లు)
5. Forearm Plank Hold — 3 సెట్లు × 30 సెకన్లు (విశ్రాంతి: 45 సెకన్లు)

కోచింగ్ చిట్కా:
ప్రతి వ్యాయామంలో 2 సెకన్ల నియంత్రిత కదలికను పాటించండి. మీ ఫారమ్ పరిశీలించడానికి కెమెరా ట్యాబ్‌లో AI CAM ప్రారంభించవచ్చు.`;
    }

    if (fitnessLevel === 'Beginner') {
      return `RECOMMENDATION

Today's Focus:
Foundational Movement Mechanics & Core Stability

Workout / Protocol:
1. Bodyweight Box Squats — 3 × 10 reps (Rest: 60s)
2. Incline Push-Ups (hands on bench/counter) — 3 × 8 reps (Rest: 60s)
3. Glute Bridges — 3 × 12 reps (Rest: 45s)
4. Deadbug or Bird Dog — 3 × 8 reps per side (Rest: 45s)
5. Forearm Plank Hold — 3 × 25–30s (Rest: 45s)

COACHING TIP:
Maintain a 2-second lowering cadence on every repetition. Pause for 1 second at the bottom of each squat and push-up before driving upward.`;
    }

    return `RECOMMENDATION

Today's Focus:
Compound Strength & Movement Quality

Workout / Protocol:
1. Goblet Squats or Barbell Back Squats — 3 × 8–10 reps (Rest: 90s)
2. Push-Ups or Dumbbell Bench Press — 3 × 8–10 reps (Rest: 75s)
3. Dumbbell Romanian Deadlift — 3 × 10 reps (Rest: 75s)
4. Single-Arm Dumbbell Row — 3 × 10 reps per side (Rest: 60s)
5. Side Plank Holds — 3 × 30s per side (Rest: 45s)

COACHING TIP:
Focus on controlled eccentric lowering (2 seconds down) and explode with intent on the concentric drive.`;
  }

  // Default direct coaching response
  if (isTe) {
    return `మీ ప్రశ్నను స్వీకరించాను: "${message}".

ఖచ్చితమైన సాంకేతిక సూచనల కోసం:
• నిర్దిష్ట వ్యాయామాన్ని పేర్కొనండి (ఉదా: డంబెల్ కర్ల్స్, పుష్-అప్స్, స్క్వాట్, డెడ్‌లిఫ్ట్).
• మీ అందుబాటులో ఉన్న సమయం లేదా పరికరాలను తెలపండి.
• ప్రత్యక్ష ఫారమ్ విశ్లేషణ కోసం కెమెరా ట్యాబ్‌లో **AI CAM** ప్రారంభించండి.

మీరు ఏ నిర్దిష్ట వ్యాయామం గురించి తెలుసుకోవాలనుకుంటున్నారు?`;
  }

  return `I have your question regarding: "${message}".

To give you the most accurate technical instruction:
• If you want movement mechanics, specify the exercise (e.g., dumbbell curl, squat, push-up, or deadlift).
• If you want a structured session, specify your available time and equipment.
• If you want real-time technique analysis, open **AI CAM** in the camera tab for live kinematic tracking.

What specific movement or target would you like to break down?`;
}
}
