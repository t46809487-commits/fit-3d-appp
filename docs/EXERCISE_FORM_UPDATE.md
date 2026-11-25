# Update notes

1. Exercise form (7 exercises) - mountain climber, burpee, tricep dips, glute bridge, superman, high knees, jumping jacks.
2. Equipment - new types `Bench` and `Pull-Up Bar`; 3D props (dumbbells in hands, resistance band + anchor, pull-up bar + posts, bench under the back);
   new motions pull_up, chest_press_bench, chest_fly_bench, band_row; equipment tags updated; Explore filter chips added.
3. New exercises - Bird Dog, Donkey Kick, Flutter Kicks, Chin-Up.
4. Boxing - guard stance, planted feet, hip + shoulder rotation, uppercut dip (src/components/3d/exercisePoses.ts, box_* motions).
   If boxing looks wrong, delete the "Boxing" block at the end of exercisePoses.ts to restore the old boxing animation.
5. AI Coach + music - src/services/coach.ts, music.ts, src/components/coach/CoachPanel.tsx; wired into WorkoutPlayer.
   4 coaches (2 male, 2 female), coach on/off, built-in beats, Spotify embed, music on/off.
Engine additions: `mid`, `midPitch`, `ignoreContact`, `bar`, `bench` in MotionDef.
