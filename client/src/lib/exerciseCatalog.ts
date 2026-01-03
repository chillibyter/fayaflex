import squatImg from "@assets/generated_images/squat_exercise_illustration.png";
import lungeImg from "@assets/generated_images/lunge_exercise_illustration.png";
import pushupImg from "@assets/generated_images/push-up_exercise_illustration.png";
import plankImg from "@assets/generated_images/plank_exercise_illustration.png";
import rowImg from "@assets/generated_images/dumbbell_row_illustration.png";
import bicepCurlImg from "@assets/generated_images/bicep_curl_illustration.png";
import hamstringStretchImg from "@assets/generated_images/hamstring_stretch_illustration.png";
import hipFlexorStretchImg from "@assets/generated_images/hip_flexor_stretch_illustration.png";
import shoulderStretchImg from "@assets/generated_images/shoulder_stretch_illustration.png";
import calfStretchImg from "@assets/generated_images/calf_stretch_illustration.png";
import warriorIIImg from "@assets/generated_images/warrior_ii_yoga_pose.png";
import downwardDogImg from "@assets/generated_images/downward_dog_yoga_pose.png";
import childsPoseImg from "@assets/generated_images/child's_pose_yoga_illustration.png";
import treePoseImg from "@assets/generated_images/tree_pose_yoga_illustration.png";

export type ExerciseKey = 
  | "squat" | "lunge" | "pushup" | "plank" | "row" | "bicep_curl"
  | "hamstring_stretch" | "hip_flexor_stretch" | "shoulder_stretch" | "calf_stretch"
  | "warrior_ii" | "downward_dog" | "childs_pose" | "tree_pose";

export type ExerciseCategory = "strength" | "stretch" | "yoga";

export interface Exercise {
  key: ExerciseKey;
  name: string;
  category: ExerciseCategory;
  image: string;
  cues: string;
  muscleGroups: string[];
}

export const exerciseCatalog: Record<ExerciseKey, Exercise> = {
  squat: {
    key: "squat",
    name: "Squats",
    category: "strength",
    image: squatImg,
    cues: "Feet shoulder-width apart, push hips back, keep chest up",
    muscleGroups: ["quads", "glutes", "core"],
  },
  lunge: {
    key: "lunge",
    name: "Lunges",
    category: "strength",
    image: lungeImg,
    cues: "Step forward, lower back knee toward ground, keep front knee over ankle",
    muscleGroups: ["quads", "glutes", "hamstrings"],
  },
  pushup: {
    key: "pushup",
    name: "Push-ups",
    category: "strength",
    image: pushupImg,
    cues: "Hands under shoulders, body straight, lower chest to ground",
    muscleGroups: ["chest", "triceps", "shoulders", "core"],
  },
  plank: {
    key: "plank",
    name: "Plank",
    category: "strength",
    image: plankImg,
    cues: "Forearms on ground, body straight from head to heels, engage core",
    muscleGroups: ["core", "shoulders", "back"],
  },
  row: {
    key: "row",
    name: "Dumbbell Row",
    category: "strength",
    image: rowImg,
    cues: "Hinge at hips, pull weight to ribs, squeeze shoulder blade",
    muscleGroups: ["back", "biceps", "shoulders"],
  },
  bicep_curl: {
    key: "bicep_curl",
    name: "Bicep Curls",
    category: "strength",
    image: bicepCurlImg,
    cues: "Keep elbows at sides, curl weight up, control the descent",
    muscleGroups: ["biceps", "forearms"],
  },
  hamstring_stretch: {
    key: "hamstring_stretch",
    name: "Hamstring Stretch",
    category: "stretch",
    image: hamstringStretchImg,
    cues: "Sit with legs extended, reach toward toes, keep back straight",
    muscleGroups: ["hamstrings", "lower back"],
  },
  hip_flexor_stretch: {
    key: "hip_flexor_stretch",
    name: "Hip Flexor Stretch",
    category: "stretch",
    image: hipFlexorStretchImg,
    cues: "Kneel with one leg forward, push hips forward gently",
    muscleGroups: ["hip flexors", "quads"],
  },
  shoulder_stretch: {
    key: "shoulder_stretch",
    name: "Shoulder Stretch",
    category: "stretch",
    image: shoulderStretchImg,
    cues: "Pull arm across body, hold at elbow, keep shoulders down",
    muscleGroups: ["shoulders", "upper back"],
  },
  calf_stretch: {
    key: "calf_stretch",
    name: "Calf Stretch",
    category: "stretch",
    image: calfStretchImg,
    cues: "Lean against wall, back leg straight, heel on ground",
    muscleGroups: ["calves", "achilles"],
  },
  warrior_ii: {
    key: "warrior_ii",
    name: "Warrior II",
    category: "yoga",
    image: warriorIIImg,
    cues: "Wide stance, front knee bent, arms extended, gaze over front hand",
    muscleGroups: ["legs", "hips", "core"],
  },
  downward_dog: {
    key: "downward_dog",
    name: "Downward Dog",
    category: "yoga",
    image: downwardDogImg,
    cues: "Hands and feet on ground, hips high, form inverted V shape",
    muscleGroups: ["shoulders", "hamstrings", "calves", "back"],
  },
  childs_pose: {
    key: "childs_pose",
    name: "Child's Pose",
    category: "yoga",
    image: childsPoseImg,
    cues: "Kneel and sit back on heels, fold forward, arms extended or by sides",
    muscleGroups: ["back", "hips", "shoulders"],
  },
  tree_pose: {
    key: "tree_pose",
    name: "Tree Pose",
    category: "yoga",
    image: treePoseImg,
    cues: "Stand on one leg, other foot on inner thigh, hands in prayer or overhead",
    muscleGroups: ["legs", "core", "balance"],
  },
};

export const exerciseKeys = Object.keys(exerciseCatalog) as ExerciseKey[];

export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return Object.values(exerciseCatalog).filter(e => e.category === category);
}

export function getExercise(key: ExerciseKey): Exercise | undefined {
  return exerciseCatalog[key];
}
