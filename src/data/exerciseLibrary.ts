/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Comprehensive Biomechanical Exercise Library
 * Reusable exercise data across Exercise Library, Workout Builder, and AI CAM.
 */

export type ExerciseCategory =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Full Body'
  | 'Mobility';

export type ExerciseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

export type ExerciseEquipment =
  | 'Barbell'
  | 'Dumbbells'
  | 'Bodyweight'
  | 'Cables'
  | 'Machines'
  | 'Kettlebell'
  | 'Resistance Band'
  | 'Mat / Bodyweight';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  targetMuscles: {
    primary: string[];
    secondary: string[];
  };
  equipment: ExerciseEquipment;
  instructions: string[];
  commonMistakes: string[];
  techniqueTips: string[];
  tempo?: string;
  aiCamSupported?: boolean;
  aiCamExerciseKey?: 'squat' | 'pushup' | 'curl' | 'lunge';
}

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Full Body',
  'Mobility',
];

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // =========================================================================
  // 1. CHEST
  // =========================================================================
  {
    id: 'chest-01',
    name: 'Barbell Flat Bench Press',
    category: 'Chest',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Pectoralis Major (Sternal & Clavicular Head)'],
      secondary: ['Anterior Deltoids', 'Triceps Brachii', 'Serratus Anterior'],
    },
    equipment: 'Barbell',
    instructions: [
      'Lie supine on the bench with eyes positioned directly beneath the racked barbell.',
      'Grip the bar slightly wider than shoulder-width; retract and depress your scapulae into the bench pad.',
      'Plant both feet firmly on the platform, establishing a stable lumbar arch and thoracic drive.',
      'Unrack the bar and stabilize it directly over the sternum with straight, locked wrists.',
      'Inhale and lower the bar under eccentric control until it lightly contacts the mid-lower sternum.',
      'Drive upward through the floor and chest, locking out over the mid-chest line.',
    ],
    commonMistakes: [
      'Flaring elbows out at a 90° angle, placing excessive shear stress on the anterior glenohumeral joint.',
      'Bouncing the barbell forcefully off the ribs or sternum.',
      'Lifting glutes off the bench to compensate during the concentric push phase.',
      'Losing scapular retraction at lockout, leading to protracted, vulnerable shoulders.',
    ],
    techniqueTips: [
      'Tuck elbows at roughly a 45° to 60° angle to maximize pec fiber line-of-pull.',
      'Actively attempt to "bend the bar" in half to engage lats and lock the upper back.',
      'Maintain continuous leg drive pushing horizontally back into the bench.',
    ],
    tempo: '3-0-1-0',
  },
  {
    id: 'chest-02',
    name: 'Incline Dumbbell Bench Press',
    category: 'Chest',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Clavicular Head of Pectoralis Major (Upper Chest)'],
      secondary: ['Anterior Deltoids', 'Triceps Brachii'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Set an adjustable bench to an incline angle between 30° and 45°.',
      'Sit back with dumbbells resting vertically on your knees; kick them up smoothly to shoulder height.',
      'Retract your scapulae, keep your chest high, and hold dumbbells with a 45° semi-pronated grip.',
      'Lower the dumbbells eccentrically down toward the outer upper chest line until a mild pec stretch is achieved.',
      'Press smoothly upward and slightly inward along a natural convergent arc without clacking the weights together.',
    ],
    commonMistakes: [
      'Setting the bench incline steeper than 45°, shifting recruitment heavily onto the front deltoids.',
      'Dropping elbows too deep below bench plane, straining the rotator cuff anterior capsule.',
      'Clashing dumbbells loudly at top lockout, losing tension in the pectoralis fibers.',
    ],
    techniqueTips: [
      'A 30° bench angle is optimal for maximizing upper chest EMG activity over front delts.',
      'Focus on driving the inner biceps toward each other at peak contraction.',
    ],
    tempo: '3-1-1-0',
  },
  {
    id: 'chest-03',
    name: 'Push-Up (Kinematic Alignment)',
    category: 'Chest',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Pectoralis Major'],
      secondary: ['Anterior Deltoids', 'Triceps Brachii', 'Rectus Abdominis', 'Serratus Anterior'],
    },
    equipment: 'Bodyweight',
    instructions: [
      'Place palms flat on the floor slightly wider than shoulder-width, fingers slightly spread.',
      'Extend legs straight back, toes planted, squeezing glutes and bracing core to form a rigid plank.',
      'Lower your entire body in unison by bending elbows until chest hovers 2 to 3 cm off the floor.',
      'Maintain an unbroken line from ankles through hips to the crown of your head.',
      'Press through full palms to return to full extension, actively protracting scapulae at the apex.',
    ],
    commonMistakes: [
      'Sagging hips or hyperextending lumbar spine due to unbraced core musculature.',
      'Flaring elbows outward like a "T" instead of an athletic arrow shape.',
      'Craning the neck forward to reach the floor early without full depth.',
    ],
    techniqueTips: [
      'Screw your hands into the floor counter-clockwise (left) and clockwise (right) to engage lats.',
      'Can be evaluated live in AXIO AI CAM for real-time kinematic elbow angle tracking.',
    ],
    tempo: '2-1-1-0',
    aiCamSupported: true,
    aiCamExerciseKey: 'pushup',
  },
  {
    id: 'chest-04',
    name: 'Standing Mid-Pulley Cable Flye',
    category: 'Chest',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Pectoralis Major (Sternal & Inner Fibers)'],
      secondary: ['Anterior Deltoids', 'Biceps Brachii (Short Head)'],
    },
    equipment: 'Cables',
    instructions: [
      'Position pulleys at chest height with single handles attached.',
      'Grasp handles and step forward into a staggered stance with a slight forward torso lean.',
      'Maintain a slight 15° soft bend in both elbows throughout the movement arc.',
      'Exhale and bring both handles together along a wide hugging arc across the center of your chest.',
      'Squeeze the inner chest hard for 1 full second at peak horizontal adduction.',
      'Control the cables back slowly under high tension until you feel a comfortable chest stretch.',
    ],
    commonMistakes: [
      'Turning the flye into a pressing motion by bending and straightening elbows excessively.',
      'Using momentum or swinging the torso forward and backward to move the load.',
    ],
    techniqueTips: [
      'Imagine hugging a large tree trunk; keep the elbow bend angle completely frozen.',
      'Cross hands slightly at peak contraction on alternating reps for heightened peak activation.',
    ],
    tempo: '2-1-1-1',
  },

  // =========================================================================
  // 2. BACK
  // =========================================================================
  {
    id: 'back-01',
    name: 'Barbell Bent-Over Row',
    category: 'Back',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Latissimus Dorsi', 'Rhomboids', 'Middle & Lower Trapezius'],
      secondary: ['Posterior Deltoids', 'Biceps Brachii', 'Erector Spinae'],
    },
    equipment: 'Barbell',
    instructions: [
      'Stand hip-width apart holding a barbell with a double overhand grip just outside the shins.',
      'Hinge forward at the hips, unlocking knees, until torso is roughly 30° to 45° above parallel.',
      'Keep lats engaged, spine neutral, and bar hanging vertically beneath your shoulders.',
      'Pull the barbell smoothly toward your lower sternum/umbilicus, driving your elbows back and up.',
      'Retract scapulae firmly at the peak and hold for a split second.',
      'Lower the barbell with control, maintaining spinal neutral without letting shoulders round.',
    ],
    commonMistakes: [
      'Jerking the torso upward with hip extension to generate false momentum.',
      'Rounding the lower spine, placing lumbar discs under high shear strain.',
      'Pulling too high toward the neck, shifting tension to the upper traps.',
    ],
    techniqueTips: [
      'Think of pulling with your elbows rather than curling with your hands.',
      'Brace your abdominal wall firmly as if preparing to take a punch.',
    ],
    tempo: '2-0-1-1',
  },
  {
    id: 'back-02',
    name: 'Dead-Hang Chest-to-Bar Pull-Up',
    category: 'Back',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Latissimus Dorsi', 'Teres Major'],
      secondary: ['Biceps Brachii', 'Brachialis', 'Rhomboids', 'Lower Trapezius'],
    },
    equipment: 'Bodyweight',
    instructions: [
      'Grasp the pull-up bar with an overhand grip slightly wider than shoulder-width.',
      'Hang with full arm extension in an active scapular depression hang (not completely lax).',
      'Inhale, retract your shoulder blades down and back, and drive your elbows down toward your ribs.',
      'Pull until your collarbones or upper chest approach the bar level.',
      'Hold the peak contraction briefly before lowering with strict eccentric control to a dead hang.',
    ],
    commonMistakes: [
      'Kicking the legs or swinging hips (kipping) instead of maintaining pure strict vertical pull.',
      'Cutting the bottom range of motion short and bouncing out of partial extension.',
      'Shrugging shoulders into the neck at the top.',
    ],
    techniqueTips: [
      'Squeeze an imaginary pencil between your shoulder blades at the top of the rep.',
      'Cross your ankles and squeeze glutes to keep your kinetic chain rigid.',
    ],
    tempo: '3-0-1-1',
  },
  {
    id: 'back-03',
    name: 'Conventional Barbell Deadlift',
    category: 'Back',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Erector Spinae', 'Gluteus Maximus', 'Hamstrings', 'Latissimus Dorsi'],
      secondary: ['Quadriceps', 'Trapezius', 'Forearm Flexors', 'Abdominal Wall'],
    },
    equipment: 'Barbell',
    instructions: [
      'Position feet hip-width apart with the barbell over the mid-foot (1 inch from shins).',
      'Hinge at hips, bending knees slightly, and grasp bar with a double-overhand or mixed grip.',
      'Pull slack out of the barbell until you hear a "click", squeezing chest proud and engaging lats.',
      'Drive your feet through the floor, extending knees and hips simultaneously in one unified movement.',
      'Lock out with hips tall and shoulders back without hyperextending the lower back.',
      'Return bar to floor by hinging hips back before unlocking knees.',
    ],
    commonMistakes: [
      'Letting the bar drift forward away from the shins, drastically multiplying lumbar moment arm.',
      'Rounding the lumbar spine under heavy loads.',
      'Jerking the bar off the floor before taking out the mechanical slack.',
    ],
    techniqueTips: [
      'Push the floor away like a leg press rather than trying to yank the weight upward.',
      'Keep lats clamped down like holding oranges in your armpits.',
    ],
    tempo: '2-1-X-0',
  },
  {
    id: 'back-04',
    name: 'Seated Cable Row (Close-Grip V-Bar)',
    category: 'Back',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Rhomboids', 'Middle Trapezius', 'Latissimus Dorsi'],
      secondary: ['Biceps Brachii', 'Brachioradialis', 'Erectors'],
    },
    equipment: 'Cables',
    instructions: [
      'Sit on the bench with feet on footplates and knees softly unlocked.',
      'Reach forward to grasp the V-bar handle with a neutral grip; push back to vertical posture.',
      'Keep chest elevated and spine neutral with shoulders relaxed down.',
      'Pull handle smoothly to your upper abdomen, driving elbows tight along the rib cage.',
      'Pause for a full second, squeezing mid-back muscles firmly.',
      'Extend arms forward with control, allowing scapulae to naturally spread around the rib cage.',
    ],
    commonMistakes: [
      'Swinging the torso back and forth excessively past 15° from vertical.',
      'Shrugging shoulders upward toward the ears at the end of the pull.',
    ],
    techniqueTips: [
      'Initiate the movement with scapular retraction before bending the elbows.',
      'Maintain continuous tension by avoiding slamming the weight stack down between reps.',
    ],
    tempo: '2-1-1-1',
  },

  // =========================================================================
  // 3. LEGS
  // =========================================================================
  {
    id: 'legs-01',
    name: 'Barbell High-Bar Back Squat',
    category: 'Legs',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Quadriceps (Rectus Femoris, Vasty)', 'Gluteus Maximus'],
      secondary: ['Adductor Magnus', 'Soleus', 'Hamstrings', 'Erector Spinae', 'Core'],
    },
    equipment: 'Barbell',
    instructions: [
      'Step under the bar, resting it across the upper trapezius muscle shelf.',
      'Grip the bar firmly, pull elbows down, unrack with a solid breath, and take two clean steps back.',
      'Set feet shoulder-width apart, toes flared roughly 15° to 30° outward.',
      'Inhale deeply into your abdomen, brace core 360°, and initiate descent by breaking at hips and knees.',
      'Squat down until hip crease is below the top of the patella (full parallel or deeper).',
      'Drive powerfully up through the mid-foot and heels, keeping chest proud and knees tracking over toes.',
    ],
    commonMistakes: [
      'Knee valgus collapse (knees caving inward) during ascent.',
      'Cutting depth short above parallel, limiting quadriceps hypertrophy and hip power.',
      'Excessive forward torso tilt turning the squat into a "good morning".',
      'Weight shifting onto toes, lifting heels off the floor.',
    ],
    techniqueTips: [
      'Track real-time hip, knee, and torso angles in AXIO AI CAM for live depth and valgus verification.',
      'Spread the floor apart with your feet to actively engage the gluteus medius.',
      'Keep gaze fixed forward at a spot 2 meters ahead on the floor.',
    ],
    tempo: '3-1-X-0',
    aiCamSupported: true,
    aiCamExerciseKey: 'squat',
  },
  {
    id: 'legs-02',
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Hamstrings (Biceps Femoris, Semitendinosus)', 'Gluteus Maximus'],
      secondary: ['Erector Spinae', 'Adductor Magnus', 'Trapezius'],
    },
    equipment: 'Barbell',
    instructions: [
      'Stand upright holding a barbell with an overhand grip, feet hip-width apart.',
      'Unlock knees slightly (15° bend) and freeze that knee angle for the duration of the movement.',
      'Push your hips backward as if trying to touch a wall behind you with your tailbone.',
      'Trace the barbell down close to the thighs and shins until you feel a deep hamstring stretch.',
      'Stop when hips can no longer travel backward (typically just below knee caps).',
      'Drive hips forward forcefully to return to standing, squeezing glutes hard at the top.',
    ],
    commonMistakes: [
      'Bending the knees into a squat, removing tension from the hamstrings.',
      'Rounding the lower back in an attempt to reach the floor with the barbell.',
      'Allowing the barbell to drift away from the legs.',
    ],
    techniqueTips: [
      'The RDL is a horizontal hip displacement movement, not a vertical floor reach.',
      'Keep neck in neutral alignment; do not crank your head up to look in the mirror.',
    ],
    tempo: '3-1-1-0',
  },
  {
    id: 'legs-03',
    name: 'Walking Dumbbell Lunge',
    category: 'Legs',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Quadriceps', 'Gluteus Maximus'],
      secondary: ['Hamstrings', 'Calves', 'Core Stabilizers'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Stand tall holding a pair of dumbbells at your sides with arms straight.',
      'Take a controlled, exaggerated step forward with one leg.',
      'Lower your hips straight down until both front and back knees reach roughly 90° angles.',
      'Keep front knee tracking in line with the second toe and rear knee hovering just above the floor.',
      'Drive through the front heel to step smoothly forward into the next repetition.',
    ],
    commonMistakes: [
      'Taking strides that are too short, causing excessive knee shear past the toes.',
      'Letting the front knee wobble inward toward the midline.',
      'Banging the back knee hard against the floor.',
    ],
    techniqueTips: [
      'Supported in AXIO AI CAM for real-time bilateral knee angle tracking.',
      'Lean the torso slightly forward (10°) to shift recruitment onto the glutes.',
    ],
    tempo: '2-0-1-0',
    aiCamSupported: true,
    aiCamExerciseKey: 'lunge',
  },
  {
    id: 'legs-04',
    name: 'Bulgarian Split Squat (Rear Foot Elevated)',
    category: 'Legs',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Quadriceps', 'Gluteus Maximus'],
      secondary: ['Adductor Magnus', 'Hamstrings', 'Core'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Place the top of your rear foot on a bench roughly knee height behind you.',
      'Step forward with the working leg into an athletic split stance holding dumbbells at your sides.',
      'Descend under control by bending the front knee and hip, lowering until front thigh is parallel to ground.',
      'Maintain an upright or slightly forward-leaning torso with core braced.',
      'Drive directly through the front mid-foot and heel to return to the starting position.',
    ],
    commonMistakes: [
      'Positioning the front foot too close to the bench, jamming the patellofemoral joint.',
      'Pushing off the rear toe rather than using the front leg for 90% of the force production.',
    ],
    techniqueTips: [
      'To bias the glute max, lean torso forward at 20°; to bias the quad, stay strictly upright.',
    ],
    tempo: '3-1-1-0',
  },

  // =========================================================================
  // 4. SHOULDERS
  // =========================================================================
  {
    id: 'shoulders-01',
    name: 'Standing Barbell Overhead Press (OHP)',
    category: 'Shoulders',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Anterior & Lateral Deltoids'],
      secondary: ['Triceps Brachii', 'Upper Trapezius', 'Serratus Anterior', 'Core'],
    },
    equipment: 'Barbell',
    instructions: [
      'Rest the bar across your front deltoids with hands gripping just outside shoulder-width.',
      'Tuck elbows slightly forward beneath the bar; squeeze glutes and brace your core completely.',
      'Pull your chin slightly back and press the barbell vertically overhead in a straight path.',
      'Once the bar clears your forehead, move your head back forward through the "window" of your arms.',
      'Lock out the bar directly over the crown of your head and shoulder joints.',
      'Lower with control back to the collarbone shelf.',
    ],
    commonMistakes: [
      'Hyperextending the lumbar spine to push the weight up like an incline press.',
      'Pressing the bar in a wide looping arc forward around the face.',
      'Relaxing the glutes, compromising spinal stability.',
    ],
    techniqueTips: [
      'Squeeze the glutes as hard as possible throughout the movement to protect the lower back.',
      'Actively shrug shoulders up at peak lockout to promote natural upward scapular rotation.',
    ],
    tempo: '2-0-1-1',
  },
  {
    id: 'shoulders-02',
    name: 'Dumbbell Lateral Raise (Scaption Plane)',
    category: 'Shoulders',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Lateral Deltoid (Mid Delt)'],
      secondary: ['Anterior Deltoid', 'Supraspinatus', 'Upper Trapezius'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Stand tall holding light to moderate dumbbells at your sides, knees soft.',
      'Tilt torso forward roughly 10° and bring dumbbells slightly in front of hips.',
      'Raise the dumbbells upward and outward in the scapular plane (roughly 30° forward of pure side).',
      'Lead with your elbows and maintain a soft, frozen bend in the elbow joint.',
      'Stop when dumbbells reach shoulder height.',
      'Lower slowly under eccentric tension for 3 seconds back to hip level.',
    ],
    commonMistakes: [
      'Using excessive body momentum or swinging the hips to heave the weights up.',
      'Shrugging the upper traps into the neck during the raise.',
      'Rotating hands thumb-up, which biases the front delt instead of the side delt.',
    ],
    techniqueTips: [
      'Imagine pouring a pitcher of water at the peak, keeping pinkies slightly elevated or level.',
      'Keep the weights in the scapular plane to eliminate rotator cuff impingement risk.',
    ],
    tempo: '3-0-1-1',
  },
  {
    id: 'shoulders-03',
    name: 'Cable Face Pull (with Rope)',
    category: 'Shoulders',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Posterior Deltoids', 'Infraspinatus & Teres Minor (External Rotators)'],
      secondary: ['Rhomboids', 'Middle Trapezius'],
    },
    equipment: 'Cables',
    instructions: [
      'Set cable pulley to eye level and attach a double-rope handle.',
      'Grasp ends with a neutral or thumbs-back overhand grip, stepping back to create cable tension.',
      'Retract your shoulder blades and pull the center of the rope directly toward your bridge of nose.',
      'As you pull, externally rotate your shoulders, separating the rope ends so hands end beside ears.',
      'Hold the contraction firmly for 2 seconds, feeling the rear delts and rotator cuffs contract.',
      'Extend arms slowly under resistance to return to starting position.',
    ],
    commonMistakes: [
      'Pulling too low toward the chest, turning it into a lat row.',
      'Failing to externally rotate at the finish (elbows dropping below wrists).',
      'Leaning the torso backward to use bodyweight as leverage.',
    ],
    techniqueTips: [
      'This is an essential postural exercise; prioritize high reps (15-20) and clean form over heavy weight.',
    ],
    tempo: '2-1-1-2',
  },

  // =========================================================================
  // 5. ARMS
  // =========================================================================
  {
    id: 'arms-01',
    name: 'Standing Barbell Bicep Curl',
    category: 'Arms',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Biceps Brachii (Short & Long Heads)'],
      secondary: ['Brachialis', 'Brachioradialis', 'Forearm Flexors'],
    },
    equipment: 'Barbell',
    instructions: [
      'Stand upright with feet shoulder-width apart, holding a barbell with an underhand grip.',
      'Pin your elbows tight to your sides with chest tall and core braced.',
      'Exhale and curl the bar upward by flexing the elbows, keeping upper arms motionless.',
      'Contract the biceps hard at the top without allowing elbows to swing forward.',
      'Inhale and lower the barbell slowly under full muscular resistance back to full elbow extension.',
    ],
    commonMistakes: [
      'Swinging the torso and leaning backward to heave the weight up.',
      'Allowing elbows to flare outward or drift 10 cm forward.',
      'Stopping short of full extension at the bottom of the rep.',
    ],
    techniqueTips: [
      'Supported in AXIO AI CAM for real-time elbow flexion angle measurement.',
      'Squeeze the barbell handles firmly to recruit forearms and maximize neural drive.',
    ],
    tempo: '3-0-1-1',
    aiCamSupported: true,
    aiCamExerciseKey: 'curl',
  },
  {
    id: 'arms-02',
    name: 'Cable Triceps Rope Pushdown',
    category: 'Arms',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Triceps Brachii (Lateral & Medial Heads)'],
      secondary: ['Triceps Brachii (Long Head)', 'Anconeus'],
    },
    equipment: 'Cables',
    instructions: [
      'Attach a rope to a high pulley; grasp the handles with a neutral grip.',
      'Step back slightly, lean torso forward 15°, and pin your elbows into your ribs.',
      'Extend your elbows downward in an arc, pushing the rope down toward your thighs.',
      'At the bottom of the movement, spread the ends of the rope outward to achieve peak contraction.',
      'Hold the peak lockout for 1 second, flexing the triceps intensely.',
      'Allow the rope to rise under control until forearms reach parallel to the floor.',
    ],
    commonMistakes: [
      'Letting elbows drift forward and upward on the eccentric, turning it into a shoulder motion.',
      'Rounding the upper back and hunching shoulders over the rope.',
    ],
    techniqueTips: [
      'Think of your upper arm as a bolted hinge; only the forearm should move.',
      'Spreading the rope at the bottom increases lateral head recruitment significantly.',
    ],
    tempo: '2-1-1-1',
  },
  {
    id: 'arms-03',
    name: 'Incline Dumbbell Bicep Curl',
    category: 'Arms',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Biceps Brachii (Long Head / Outer Peak)'],
      secondary: ['Brachialis', 'Brachioradialis'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Set an adjustable bench to roughly a 60° incline angle.',
      'Sit back against the bench, allowing arms to hang fully straight down behind the torso line.',
      'Hold dumbbells with palms facing each other (neutral) or supinated.',
      'Curl dumbbells upward while supinating wrists so palms face shoulders at the top.',
      'Keep upper arms perpendicular to the floor throughout the entire movement.',
      'Lower the dumbbells slowly until you feel a deep stretch in the biceps tendons.',
    ],
    commonMistakes: [
      'Bringing elbows forward off the vertical line, removing stretch from the long head.',
      'Setting bench too flat (<45°), straining the anterior shoulder capsule.',
    ],
    techniqueTips: [
      'The stretch position on an incline bench provides the highest mechanical tension on the bicep long head.',
    ],
    tempo: '3-1-1-0',
  },

  // =========================================================================
  // 6. CORE
  // =========================================================================
  {
    id: 'core-01',
    name: 'Hanging Leg / Knee Raise',
    category: 'Core',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Rectus Abdominis (Lower Region)', 'Iliopsoas (Hip Flexors)'],
      secondary: ['Obliques', 'Forearm Grip', 'Serratus Anterior'],
    },
    equipment: 'Bodyweight',
    instructions: [
      'Hang from a pull-up bar with an overhand grip, shoulders engaged in active depression.',
      'Posteriorly tilt your pelvis by pulling belly button into spine.',
      'Raise legs smoothly up until thighs are perpendicular or toes touch the bar, flexing the lumbar spine.',
      'Avoid swinging or using hip momentum.',
      'Lower legs slowly under eccentric control back to dead hang before starting the next rep.',
    ],
    commonMistakes: [
      'Swinging body back and forth to generate momentum.',
      'Only flexing the hip flexors without actually curling the pelvis upward.',
    ],
    techniqueTips: [
      'To genuinely recruit rectus abdominis, the pelvis must curl upward toward the sternum.',
    ],
    tempo: '2-1-1-1',
  },
  {
    id: 'core-02',
    name: 'Pallof Press (Anti-Rotation Cable)',
    category: 'Core',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Internal & External Obliques', 'Transverse Abdominis'],
      secondary: ['Rectus Abdominis', 'Gluteus Medius', 'Quadratus Lumborum'],
    },
    equipment: 'Cables',
    instructions: [
      'Set a cable pulley to chest height with a single D-handle attached.',
      'Stand perpendicular to the cable machine holding handle with both hands at center of chest.',
      'Step out to establish tension, setting feet shoulder-width apart in an athletic quarter squat.',
      'Press both hands straight forward, resisting the cable’s rotational pull on your torso.',
      'Hold hands locked out in front of chest for 2 to 3 seconds, keeping core rock solid.',
      'Pull hands back slowly to center of chest under control.',
    ],
    commonMistakes: [
      'Allowing hips or shoulders to twist toward the machine.',
      'Setting feet too narrow, losing balance foundation.',
    ],
    techniqueTips: [
      'This is an anti-rotation exercise; the goal is zero visible movement in the spine.',
    ],
    tempo: '1-3-1-0',
  },
  {
    id: 'core-03',
    name: 'Ab Wheel Rollout',
    category: 'Core',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Rectus Abdominis (Anti-Extension)', 'Transverse Abdominis'],
      secondary: ['Latissimus Dorsi', 'Pectoralis Major', 'Hip Flexors'],
    },
    equipment: 'Bodyweight',
    instructions: [
      'Kneel on a soft mat holding the ab wheel handles directly beneath your shoulders.',
      'Tuck pelvis into a posterior pelvic tilt, rounding the lower back slightly and squeezing glutes.',
      'Roll the wheel slowly forward, extending arms and lowering your body toward the floor.',
      'Descend as far as you can while maintaining a rigid, non-sagging lumbar spine.',
      'Pull with your lats and contract abs forcefully to roll back to the starting position.',
    ],
    commonMistakes: [
      'Allowing lower back to hyperextend or sag downward, risking lumbar spine impingement.',
      'Initiating the return by sitting hips back rather than pulling with the core and lats.',
    ],
    techniqueTips: [
      'Start with partial rollouts toward a wall stop before attempting full floor extensions.',
    ],
    tempo: '3-1-1-0',
  },

  // =========================================================================
  // 7. FULL BODY
  // =========================================================================
  {
    id: 'full-01',
    name: 'Hang Power Clean',
    category: 'Full Body',
    difficulty: 'Elite',
    targetMuscles: {
      primary: ['Posterior Kinetic Chain', 'Gluteus Maximus', 'Hamstrings', 'Trapezius'],
      secondary: ['Quadriceps', 'Deltoids', 'Forearms', 'Core'],
    },
    equipment: 'Barbell',
    instructions: [
      'Deadlift bar up to mid-thigh hang position, shoulders slightly over the bar.',
      'Dip knees and hips slightly while keeping torso upright and chest proud.',
      'Explosively extend hips, knees, and ankles (triple extension) while shrugging shoulders violently.',
      'Allow the bar to travel upward close to the torso; pull yourself rapidly under the bar.',
      'Receive the bar across the anterior deltoids in a quarter squat, snapping elbows forward.',
      'Stand up tall to complete the repetition.',
    ],
    commonMistakes: [
      'Bicep curling the bar instead of using explosive hip drive.',
      'Allowing bar to loop far away from the body.',
      'Failing to snap elbows forward into the rack position.',
    ],
    techniqueTips: [
      'Barbell velocity should exceed 1.5 m/s; think of jumping through the ceiling with the barbell.',
    ],
    tempo: '1-0-X-0',
  },
  {
    id: 'full-02',
    name: 'Russian Kettlebell Swing (Hardstyle)',
    category: 'Full Body',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Gluteus Maximus', 'Hamstrings', 'Posterior Chain'],
      secondary: ['Latissimus Dorsi', 'Core Stabilizers', 'Forearms'],
    },
    equipment: 'Kettlebell',
    instructions: [
      'Set kettlebell on floor 1 foot ahead; stand with feet slightly wider than shoulder-width.',
      'Hinge at hips, grasp handle with both hands, and tilt bell back toward you.',
      'Hike kettlebell vigorously back between your thighs high near the groin.',
      'Snap hips forward with maximum power, standing tall and locking knees and glutes.',
      'Allow kettlebell to float up to chest level purely on hip momentum (arms act as ropes).',
      'Guide bell back into the hip hinge cleanly and repeat.',
    ],
    commonMistakes: [
      'Squatting the weight rather than hinging at the hips.',
      'Using arms and shoulders to lift the bell instead of pure hip snap.',
      'Leaning backward at the top of the swing.',
    ],
    techniqueTips: [
      'Glutes and abs should contract like a standing plank at the top of every swing.',
    ],
    tempo: '1-0-X-0',
  },
  {
    id: 'full-03',
    name: 'Dumbbell Thruster',
    category: 'Full Body',
    difficulty: 'Advanced',
    targetMuscles: {
      primary: ['Quadriceps', 'Deltoids', 'Gluteus Maximus'],
      secondary: ['Triceps Brachii', 'Core', 'Cardiovascular System'],
    },
    equipment: 'Dumbbells',
    instructions: [
      'Hold dumbbells at shoulder height with palms facing inward, elbows slightly raised.',
      'Descend into a full parallel squat under control.',
      'Drive aggressively upward out of the hole, transferring momentum from hips into the dumbbells.',
      'Press dumbbells overhead seamlessly as you reach full standing extension.',
      'Lower weights back to shoulders under control as you initiate the subsequent squat descent.',
    ],
    commonMistakes: [
      'Pausing between the squat and the press; it should be one continuous kinetic flow.',
      'Collapsing chest forward during the bottom of the squat.',
    ],
    techniqueTips: [
      'Use the powerful upward rebound from the squat to launch the dumbbells overhead.',
    ],
    tempo: '2-0-X-0',
  },

  // =========================================================================
  // 8. MOBILITY
  // =========================================================================
  {
    id: 'mob-01',
    name: "World's Greatest Stretch",
    category: 'Mobility',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Thoracic Spine', 'Hip Flexors', 'Hamstrings', 'Adductors'],
      secondary: ['Glutes', 'Ankles', 'Shoulders'],
    },
    equipment: 'Mat / Bodyweight',
    instructions: [
      'Step forward into a deep runner’s lunge with right foot outside your right hand.',
      'Keep rear left leg extended with knee off or lightly touching the mat.',
      'Drop your right elbow down toward the inside of your right ankle for a 2-second adductor stretch.',
      'Rotate your torso to the right, extending your right arm vertically toward the ceiling.',
      'Gaze up at your fingertips, breathing deeply into thoracic rotation.',
      'Return hand to mat, shift hips backward, and straighten front leg for a brief hamstring floss.',
    ],
    commonMistakes: [
      'Rounding the lower back rather than rotating from the mid-back (thoracic spine).',
      'Rushing through the positions without taking full diaphragmatic breaths.',
    ],
    techniqueTips: [
      'Perform 5 smooth dynamic cycles per side as part of every athletic pre-workout protocol.',
    ],
    tempo: 'Smooth Flow',
  },
  {
    id: 'mob-02',
    name: '90/90 Hip Mobility Flow',
    category: 'Mobility',
    difficulty: 'Beginner',
    targetMuscles: {
      primary: ['Hip Internal Rotators', 'Hip External Rotators', 'Gluteus Medius'],
      secondary: ['Piriformis', 'Joint Capsule'],
    },
    equipment: 'Mat / Bodyweight',
    instructions: [
      'Sit on the floor with both knees bent at 90° angles: front leg in external rotation, back leg in internal rotation.',
      'Sit tall with an elongated spine; avoid slouching or excessive lateral leaning.',
      'Hinge forward over the front shin, keeping chest proud for a 5-second glute stretch.',
      'Return to vertical; rotate knees smoothly across the center to reverse positions without using hands.',
      'Repeat the hinge on the opposite side.',
    ],
    commonMistakes: [
      'Rounding the spine rather than hinging strictly from the hip socket.',
      'Lifting glutes too early when pivoting across.',
    ],
    techniqueTips: [
      'Unlocks deep hip capsule mobility critical for reaching squat depth without lumbar compensations.',
    ],
    tempo: 'Controlled Flow',
  },
  {
    id: 'mob-03',
    name: 'Deep Overhead Goblet Squat Hold',
    category: 'Mobility',
    difficulty: 'Intermediate',
    targetMuscles: {
      primary: ['Ankle Dorsiflexion', 'Hip Joint Capsule', 'Thoracic Spine'],
      secondary: ['Adductors', 'Erectors'],
    },
    equipment: 'Kettlebell',
    instructions: [
      'Hold a light kettlebell or dumbbell at your chest as a counterbalance.',
      'Descend into your deepest possible squat, keeping heels flat on the floor.',
      'Use elbows to gently press knees outward while driving chest upward.',
      'Breathe deeply into your pelvis and diaphragm, holding the bottom position for 30 to 45 seconds.',
      'Gently shift weight from left ankle to right ankle to mobilize the talocrural joint.',
    ],
    commonMistakes: [
      'Allowing heels to lift off the ground.',
      'Slumping upper back and letting chest drop.',
    ],
    techniqueTips: [
      'Essential daily drill for establishing stable parallel and sub-parallel squat motor patterns.',
    ],
    tempo: 'Isometric Hold',
  },
];
