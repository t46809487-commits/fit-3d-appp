import { Exercise } from '../types';

// Short description + safety tips for each exercise (shown on the exercise details page).
// Exercises added later can also carry `description` / `safetyTips` directly in the data.
export interface ExerciseInfo { description: string; safetyTips: string[] }

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // ---------------- Chest ----------------
  EX001: { description: 'The classic bodyweight press that builds chest, shoulders and triceps while the core holds your body in a straight line.', safetyTips: ['Keep your body in one straight line from head to heels.', 'Stop the set if you feel pain in the shoulders or wrists.'] },
  EX002: { description: 'A push-up with your hands raised on a bench, which lowers the load so beginners can build chest and arm strength.', safetyTips: ['Make sure the bench is stable and cannot slide.', 'Do not let the hips sag toward the bench.'] },
  EX020: { description: 'A push-up with the hands set wider than your shoulders to put more emphasis on the outer chest.', safetyTips: ['Do not place the hands so wide that the shoulders feel strained.', 'Lower under control and keep the elbows at about 45 degrees.'] },
  EX021: { description: 'A push-up with your feet raised so more of your body weight shifts onto the upper chest and shoulders.', safetyTips: ['Keep the core braced so the lower back does not arch.', 'Use a stable surface for your feet.'] },
  EX003: { description: 'A dumbbell press lying on a bench that trains each arm independently and builds balanced chest strength.', safetyTips: ['Pick a weight you can control through the full range.', 'Keep your feet on the floor and your back flat on the bench.'] },
  EX022: { description: 'A press on an inclined bench that targets the upper chest and front of the shoulders.', safetyTips: ['Keep the bench angle moderate (about 30 degrees).', 'Do not bounce the dumbbells at the bottom.'] },
  EX023: { description: 'An arc-shaped dumbbell movement that stretches and squeezes the chest through a wide range of motion.', safetyTips: ['Keep a slight bend in the elbows throughout.', 'Use light to moderate weights to protect the shoulders.'] },
  EX024: { description: 'The foundational barbell press for building chest, shoulder and triceps strength with heavy loads.', safetyTips: ['Use a spotter or safety arms for heavy sets.', 'Keep your feet planted and do not bounce the bar off your chest.'] },
  EX025: { description: 'A cable movement that brings the hands together in front of the chest for a strong peak contraction.', safetyTips: ['Keep a soft bend in the elbows and a stable stance.', 'Control the return so the weight stack does not pull you forward.'] },
  // ---------------- Back ----------------
  EX010: { description: 'A bodyweight pull that lifts your chin over a bar and builds the lats, upper back and biceps.', safetyTips: ['Start from a full hang with controlled shoulders.', 'Avoid swinging; stop if you feel pain in the elbows or shoulders.'] },
  EX078: { description: 'A pull-up with an underhand grip that brings the biceps in more while still training the lats.', safetyTips: ['Fully extend the arms without dropping into the shoulders.', 'Do not kick or swing to get the chin over the bar.'] },
  EX011: { description: 'A prone hold that strengthens the lower back, glutes and upper back muscles that keep the spine upright.', safetyTips: ['Lift only as high as is comfortable and keep the neck neutral.', 'Do not hold your breath.'] },
  EX026: { description: 'A seated pulling movement with a resistance band that trains the mid-back and rear shoulders.', safetyTips: ['Check the band for tears before every set.', 'Keep the shoulders down and away from the ears.'] },
  EX027: { description: 'A bodyweight row under a sturdy table or bar that builds the back and arms without weights.', safetyTips: ['Use a very stable table or bar that can hold your weight.', 'Keep the body straight and the hips from sagging.'] },
  EX030: { description: 'A cable pull-down that builds the lats and is a great stepping stone toward pull-ups.', safetyTips: ['Pull the bar to the upper chest rather than behind the neck.', 'Do not lean back far or use momentum.'] },
  EX031: { description: 'A seated cable row that trains the mid-back, lats and biceps with a controlled, steady pull.', safetyTips: ['Keep the chest tall and the lower back neutral.', 'Avoid rocking your torso to move the weight.'] },
  EX028: { description: 'A hip-hinged dumbbell row that builds the upper back, lats and the muscles that support the spine.', safetyTips: ['Keep the back flat and the neck in line with the spine.', 'Choose a weight that does not force your back to round.'] },
  EX029: { description: 'A single-arm row supported on a bench that lets you focus on one side of the back at a time.', safetyTips: ['Keep the hips and shoulders square instead of twisting.', 'Support yourself firmly on the bench.'] },
  EX034: { description: 'A cable pull toward the face that strengthens the rear shoulders and upper back for better posture.', safetyTips: ['Use a light weight and slow control.', 'Keep the elbows high and avoid leaning back.'] },
  EX032: { description: 'A heavy barbell row that builds the whole back and requires a strong, stable hip hinge.', safetyTips: ['Keep the spine neutral for the whole set.', 'Lower the weight if your back starts to round.'] },
  EX033: { description: 'A full-body lift from the floor that builds the glutes, hamstrings, back and grip.', safetyTips: ['Keep the bar close to your legs and your back flat.', 'Start light and learn the hip hinge before adding weight.'] },
  // ---------------- Arms ----------------
  EX004: { description: 'A basic dumbbell curl that builds the biceps with a simple, easy-to-learn movement.', safetyTips: ['Keep the elbows close to your sides.', 'Do not swing the body to lift the weights.'] },
  EX042: { description: 'A curl with palms facing each other that trains the biceps and the forearm muscles.', safetyTips: ['Keep the wrists straight and neutral.', 'Lower the weights slowly.'] },
  EX043: { description: 'A seated one-arm curl braced against the thigh for a strict biceps contraction.', safetyTips: ['Rest the upper arm firmly against the inner thigh.', 'Use a lighter weight and avoid leaning back.'] },
  EX046: { description: 'A barbell curl that lets you load the biceps heavily with both arms at once.', safetyTips: ['Keep your back upright and avoid swinging the bar.', 'Do not fully lock the elbows at the bottom with heavy weight.'] },
  EX044: { description: 'A dumbbell held overhead and lowered behind the head to train the long head of the triceps.', safetyTips: ['Keep the elbows pointing forward, not flaring wide.', 'Use a controlled weight and a braced core.'] },
  EX045: { description: 'A bent-over arm extension that isolates the triceps at the back of the arms.', safetyTips: ['Keep the upper arm still and the back flat.', 'Use light weights; the movement is small and strict.'] },
  EX047: { description: 'A cable push-down that builds the triceps with constant tension.', safetyTips: ['Keep the elbows pinned to your sides.', 'Do not lean over the bar to push the weight.'] },
  EX005: { description: 'A push-up with the hands close together under the chest to shift the work to the triceps.', safetyTips: ['Make the diamond with the hands, but ease the position if the wrists hurt.', 'Keep the elbows tucked and the body straight.'] },
  EX006: { description: 'A bench dip that trains the triceps using your own body weight.', safetyTips: ['Do not sink too deep if the shoulders feel strained.', 'Keep your back close to the bench.'] },
  // ---------------- Shoulders ----------------
  EX013: { description: 'A side raise that builds the middle part of the shoulders and gives them width.', safetyTips: ['Lift only to shoulder height.', 'Use light weights and avoid shrugging.'] },
  EX035: { description: 'A raise to the front that trains the front of the shoulders with a simple movement.', safetyTips: ['Do not swing the body to lift the weights.', 'Raise only to about shoulder height.'] },
  EX012: { description: 'A standing or seated dumbbell press that builds strong, rounded shoulders.', safetyTips: ['Keep the ribs down and avoid arching the lower back.', 'Do not press with a weight you cannot control.'] },
  EX036: { description: 'A rotating dumbbell press that works all three parts of the shoulder through a long range.', safetyTips: ['Rotate smoothly and avoid twisting the lower back.', 'Start with a lighter weight than a regular press.'] },
  EX037: { description: 'A push-up with the hips high that shifts the load onto the shoulders.', safetyTips: ['Keep your neck relaxed and your head moving between the arms.', 'Do not let the head hit the floor.'] },
  EX038: { description: 'A bent-over fly that builds the rear shoulders and upper back.', safetyTips: ['Keep the back flat and the arms slightly bent.', 'Use light weights and avoid swinging.'] },
  EX040: { description: 'A pull of the weight up along the body that trains the shoulders and upper traps.', safetyTips: ['Keep the elbows below shoulder height if the shoulders pinch.', 'Keep the weight close to the body.'] },
  EX041: { description: 'A side raise on a cable that keeps constant tension on the middle shoulder.', safetyTips: ['Do not lean away to move the handle.', 'Lift only to shoulder height and lower slowly.'] },
  EX039: { description: 'A strict barbell press from the shoulders to overhead that builds pressing strength.', safetyTips: ['Squeeze the glutes and brace the core to protect the lower back.', 'Use safety pins or a rack and press the bar in a straight line.'] },
  // ---------------- Abs ----------------
  EX014: { description: 'A small curl of the upper body that targets the upper abs.', safetyTips: ['Do not pull on your neck with your hands.', 'Lift the shoulder blades only a short way off the floor.'] },
  EX015: { description: 'A curl that lifts the hips off the floor to target the lower abs.', safetyTips: ['Move slowly and avoid swinging the legs.', 'Do not roll onto your neck.'] },
  EX016: { description: 'A static hold that strengthens the whole core and teaches full-body tension.', safetyTips: ['Keep the hips level with the shoulders.', 'Stop when the lower back starts to sag.'] },
  EX048: { description: 'An alternating twist and knee-drive movement that works the abs and obliques.', safetyTips: ['Do not pull on the neck.', 'Move slowly with control instead of rushing.'] },
  EX052: { description: 'An opposite arm-and-leg lowering movement that trains deep core control.', safetyTips: ['Keep the lower back pressed to the floor.', 'Move only as far as you can with a flat back.'] },
  EX075: { description: 'A hands-and-knees balance movement that builds core stability and a strong back.', safetyTips: ['Keep the hips level and avoid twisting.', 'Move slowly and keep the neck neutral.'] },
  EX049: { description: 'A lying movement that lifts the straight legs to train the lower abs.', safetyTips: ['Keep the lower back pressed into the floor.', 'Bend the knees if the back starts to arch.'] },
  EX050: { description: 'A seated twisting movement that trains the obliques and builds rotational strength.', safetyTips: ['Keep the chest up and the spine long.', 'Rotate from the torso rather than just moving the arms.'] },
  EX051: { description: 'A side-lying hold that strengthens the obliques and the muscles that stabilize the spine.', safetyTips: ['Stack the shoulders and hips in one line.', 'Place the elbow directly under the shoulder.'] },
  EX053: { description: 'A kneeling cable crunch that lets you add resistance to the abs.', safetyTips: ['Curl the spine, do not just bend at the hips.', 'Use a moderate weight and move slowly.'] },
  EX077: { description: 'Small alternating leg kicks that work the lower abs and hip flexors.', safetyTips: ['Keep the lower back on the floor.', 'Bend the knees slightly if the back lifts.'] },
  // ---------------- Legs ----------------
  EX007: { description: 'The basic squat that builds the legs and glutes and teaches the squat pattern.', safetyTips: ['Keep the knees tracking over the toes and the heels on the floor.', 'Keep the chest up and do not let the back round.'] },
  EX054: { description: 'A squat holding one dumbbell at the chest that helps you keep an upright torso.', safetyTips: ['Keep the weight close to your chest.', 'Do not let the knees cave inward.'] },
  EX057: { description: 'A barbell squat with the bar on the back for building maximum leg strength.', safetyTips: ['Use a squat rack with safety bars.', 'Brace the core and keep the back flat throughout.'] },
  EX058: { description: 'A machine press that trains the legs and glutes with the back fully supported.', safetyTips: ['Do not lock the knees at the top.', 'Keep the lower back pressed into the seat.'] },
  EX059: { description: 'A heel raise that builds the calf muscles.', safetyTips: ['Hold something stable for balance if needed.', 'Lower slowly and avoid bouncing.'] },
  EX009: { description: 'A hip lift from the floor that trains the glutes and hamstrings.', safetyTips: ['Do not over-arch the lower back at the top.', 'Drive through the heels and keep the knees from caving.'] },
  EX076: { description: 'A quadruped kick that isolates the glutes.', safetyTips: ['Keep the hips square and the core braced.', 'Do not arch the lower back to lift the leg higher.'] },
  EX008: { description: 'A lunge that steps forward with each rep, training the legs, glutes and balance.', safetyTips: ['Keep the front knee over the ankle.', 'Take long enough steps so the front knee does not collapse inward.'] },
  EX055: { description: 'A hip hinge with dumbbells that trains the hamstrings, glutes and lower back.', safetyTips: ['Keep the back flat and the weights close to the legs.', 'Soften the knees but do not turn it into a squat.'] },
  EX056: { description: 'A single-leg squat with the rear foot elevated on a bench that builds strong, balanced legs.', safetyTips: ['Use a stable bench and keep the front knee in line with the toes.', 'Start with bodyweight to find your balance.'] },
  // ---------------- Full Body ----------------
  EX017: { description: 'A fast plank-position knee drive that raises your heart rate while training the core.', safetyTips: ['Keep the shoulders over the wrists and the hips level.', 'Slow down if the lower back sags.'] },
  EX018: { description: 'A classic cardio warm-up that raises the heart rate and warms the whole body.', safetyTips: ['Land softly on the balls of your feet.', 'Slow down or step side to side if the joints are sore.'] },
  EX019: { description: 'A running-in-place movement with high knee lifts that boosts cardio and leg power.', safetyTips: ['Land softly and keep the core braced.', 'Reduce the speed if you feel impact in the knees.'] },
  EX063: { description: 'A walk while holding heavy dumbbells that builds grip, posture and total-body strength.', safetyTips: ['Stand tall with the shoulders back and level.', 'Use a weight you can carry without leaning.'] },
  EX060: { description: 'A full-body conditioning move that combines a squat, a plank and a jump.', safetyTips: ['Keep the core tight in the plank so the back does not sag.', 'Step instead of jump if you are new to the movement.'] },
  EX061: { description: 'A squat into an overhead press that works the legs, shoulders and core together.', safetyTips: ['Use a moderate weight and keep the core braced.', 'Drive from the legs and avoid arching the lower back.'] },
  EX064: { description: 'A crawl on hands and feet with the knees hovering that works the shoulders, core and legs.', safetyTips: ['Keep the hips low and level.', 'Move slowly and keep the wrists stacked under the shoulders.'] },
  EX065: { description: 'A squat followed by an explosive jump that builds leg power.', safetyTips: ['Land softly with bent knees.', 'Avoid the jump if your knees or ankles hurt.'] },
  EX062: { description: 'A barbell press that uses a small leg dip to drive heavy weight overhead.', safetyTips: ['Keep the bar close to the face and the core braced.', 'Use a rack or safe spot to place the bar after each set.'] },
  // ---------------- Mobility ----------------
  EX066: { description: 'A gentle spine movement on hands and knees that warms up the back.', safetyTips: ['Move slowly within a comfortable range.', 'Stop if you feel sharp pain.'] },
  EX067: { description: 'A resting stretch that lengthens the back and hips.', safetyTips: ['Do not force the hips down if the knees feel tight.', 'Breathe slowly and relax into the pose.'] },
  EX068: { description: 'A flowing stretch that opens the hips, hamstrings and spine in one movement.', safetyTips: ['Move into the stretch gradually.', 'Keep the back foot grounded and the core engaged.'] },
  EX069: { description: 'A kneeling stretch for the front of the hip that eases tightness from sitting.', safetyTips: ['Use a cushion under the knee.', 'Keep the ribs down and avoid arching the lower back.'] },
  EX070: { description: 'A standing stretch that lengthens the hamstrings.', safetyTips: ['Keep a slight bend in the knee if it feels tight.', 'Stretch only until you feel a gentle pull.'] },
  EX071: { description: 'Controlled arm circles that warm up the shoulder joints.', safetyTips: ['Start small and make the circles bigger gradually.', 'Keep the neck and shoulders relaxed.'] },
  EX072: { description: 'A rotation of the upper back that improves the mobility of the spine.', safetyTips: ['Turn from the upper back rather than the lower back.', 'Move slowly and stay in a pain-free range.'] },
  EX073: { description: 'A gentle back-bending stretch that opens the chest and abdomen.', safetyTips: ['Keep the hips on the floor and do not push up too high.', 'Stop if you feel pinching in the lower back.'] },
  EX074: { description: 'A seated stretch that opens the inner thighs and hips.', safetyTips: ['Do not push the knees down with force.', 'Keep the spine long and breathe slowly.'] },
  // ---------------- Boxing ----------------
  BX001: { description: 'A quick straight punch with the lead hand that sets up other strikes and keeps the distance.', safetyTips: ['Do not lock the elbow at full extension.', 'Keep the other hand up to guard the chin.'] },
  BX002: { description: 'A powerful straight punch from the rear hand driven by the hips and back foot.', safetyTips: ['Rotate the hips and rear foot rather than just throwing the arm.', 'Return to the guard immediately after the punch.'] },
  BX003: { description: 'A hooking punch with the lead hand that swings around to the side of the target.', safetyTips: ['Keep the elbow bent and the wrist straight.', 'Turn the body with the punch to protect the shoulder.'] },
  BX004: { description: 'A rising punch with the rear hand that travels up the middle of the target.', safetyTips: ['Bend the knees slightly and drive up with the legs.', 'Keep the other hand up to protect the chin.'] },
};

const CATEGORY_SAFETY: Record<string, string> = {
  Chest: 'Warm up your shoulders and wrists first and stop if you feel sharp joint pain.',
  Back: 'Keep your spine neutral and stop if you feel sharp pain in the lower back.',
  Arms: 'Use controlled reps and avoid locking the elbows hard at the end of the movement.',
  Shoulders: 'Warm up the shoulders first and never push through pinching pain.',
  Abs: 'Keep the lower back safe and the neck relaxed; breathe throughout.',
  Legs: 'Keep the knees in line with the toes and the back flat.',
  'Full Body': 'Warm up first and slow down if you feel dizzy or very out of breath.',
  Boxing: 'Keep the wrists straight and the guard up; do not lock the elbows when punching.',
  Mobility: 'Stretch gently into mild tension only, never into pain.',
};

/** Description and safety tips for an exercise (authored text, with a safe fallback). */
export function getExerciseInfo(ex: Exercise): ExerciseInfo {
  const own = EXERCISE_INFO[ex.id];
  const description = ex.description ?? own?.description ?? `${ex.name} trains your ${ex.primaryMuscles
    .map((m) => m.replace(/_(l|r)$/, '').replace(/_/g, ' '))
    .filter((m, i, a) => a.indexOf(m) === i)
    .join(', ')}.`;
  const safetyTips = ex.safetyTips ?? own?.safetyTips ?? [];
  const extra = CATEGORY_SAFETY[ex.category];
  const tips = [...safetyTips];
  if (extra && !tips.includes(extra)) tips.push(extra);
  return { description, safetyTips: tips };
}
