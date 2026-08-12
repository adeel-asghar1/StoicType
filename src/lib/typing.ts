export const PASSAGES = [
  "You cannot control every event, but you can control the quality of your response. Someone will misunderstand you, plans will change, and your perfectly organized afternoon will somehow disappear into a two-hour conversation about absolutely nothing. Stay calm anyway.",
  "Marcus Aurelius had an impressive ability to remind himself that life is temporary, while most of us need three alarms to remember that we have an appointment at ten. The point is not to become serious about everything. It is to remember what deserves your attention.",
  "The obstacle is often less powerful than the story we tell ourselves about it. A difficult task becomes impossible when we keep repeating that it is impossible. Start smaller. Do the first useful thing. Then do the next one. Progress rarely announces itself.",
  "A calm person is not someone who has nothing to worry about. A calm person has simply learned that worrying about something twice does not make it twice as solvable. Think carefully, act where you can, and then allow yourself to breathe.",
  "There is a strange freedom in realizing that not everyone needs to like you. You can be polite without performing for approval, helpful without expecting applause, and confident without announcing it. Spend less energy managing other people's opinions.",
  "Seneca wrote about the value of time because people have always been surprisingly good at wasting it. The tools have changed, but the habit has not. We now have faster computers, faster internet, and faster ways to watch unrelated videos before realizing half an hour has vanished.",
  "Discipline is not always dramatic. Sometimes it means studying when you would rather scroll, finishing the boring task before starting the exciting one, or going to sleep instead of convincing yourself that tomorrow's version of you will somehow have unlimited energy.",
  "You do not need to win every argument. Sometimes the strongest response is simply to understand that an argument has become a competition between two people who both want to be right. Wisdom is knowing when to speak, when to listen, and when to let someone else have the final word.",
  "The mind has a curious habit of turning small problems into enormous disasters. A missed message becomes rejection, a bad day becomes a bad life, and one mistake becomes evidence that you are terrible at everything. Slow down. Facts are usually much less dramatic than imagination.",
  "If you want to improve at something, accept being bad at it for a while. Nobody becomes skilled by waiting for the embarrassing part to disappear. The first attempts may be slow, awkward, and slightly painful to remember. That is normal. Excellence is experience that survived its awkward beginning.",
  "A good life does not require every day to be exciting. Some of the best days are quiet: decent food, useful work, a conversation that makes you think, and enough time to sit without needing entertainment every thirty seconds. Peace can feel boring when your mind is addicted to noise.",
  "Control your effort, your choices, your attention, and your character. You cannot control the weather, other people's moods, traffic, or whether your internet decides to become philosophical at the exact moment you need it. Spend your energy where it can actually matter.",
  "Failure is rarely as permanent as it feels in the moment. Most mistakes become stories you tell later, usually with a little embarrassment and a surprising amount of laughter. Make the correction, learn what you can, and continue. There is no requirement to remain ashamed.",
  "The ancient Stoics recommended examining your thoughts, and that advice remains useful. Not every thought deserves a meeting, a committee, and a five-year strategic plan. Sometimes a thought is simply a thought. Notice it, question it, and decide whether it deserves your attention.",
  "Patience is not doing nothing while waiting for life to improve. Patience is continuing to do the right things without demanding immediate evidence that they are working. A tree does not become taller because you stare at it impatiently. Some progress happens quietly.",
  "There is no shortage of advice on how to become successful. Wake up early, work harder, optimize everything, drink something green, and apparently become a completely different person before breakfast. Useful habits matter, but perfection is unnecessary. Build a life you can maintain.",
  "Your reputation is partly outside your control, but your character is not. Someone may describe you unfairly, misunderstand your intentions, or remember your worst moment more clearly than your best ones. You cannot edit every person's version of you.",
  "Sometimes the most productive thing you can do is stop. Close the laptop, take a walk, drink some water, and let your brain remember that it belongs to a human being rather than a server running an endless background process. Rest is part of sustainable progress.",
  "We often imagine confidence as the absence of doubt, but real confidence is usually quieter. It is being willing to act while knowing you might fail. You do not need certainty before taking the next step. You need enough courage to take it.",
  "Remember that your attention is one of the few things you can spend only once. Give it deliberately. Read something difficult, listen when someone speaks, work without checking your phone every four minutes, and occasionally sit with your own thoughts.",
];

export type TestPreset = { id: string; label: string; kind: "time" | "words" | "daily" | "escape" | "overdrive"; value?: number };

export const TEST_PRESETS: TestPreset[] = [
  { id: "15s", label: "15s", kind: "time", value: 15 },
  { id: "30s", label: "30s", kind: "time", value: 30 },
  { id: "60s", label: "60s", kind: "time", value: 60 },
  { id: "25w", label: "25 words", kind: "words", value: 25 },
  { id: "50w", label: "50 words", kind: "words", value: 50 },
  { id: "daily", label: "Daily", kind: "daily" },
  { id: "escape", label: "Escape the Scorpion", kind: "escape" },
  { id: "overdrive", label: "Overdrive", kind: "overdrive" },
];
export function dailyPassage() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0).getTime();
  const day = Math.floor((today.getTime() - start) / 86400000);

  return PASSAGES[day % PASSAGES.length];
}

function shuffledPassages() {
  return [...PASSAGES].sort(() => Math.random() - 0.5);
}

export function passageForWords(words: number) {
  const shuffled = shuffledPassages();

  let result = "";

  for (const passage of shuffled) {
    result += `${passage} `;

    const currentWordCount = result
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    if (currentWordCount >= words) {
      break;
    }
  }

  return result
    .trim()
    .split(/\s+/)
    .slice(0, words)
    .join(" ");
}

export function longPassage() {
  return shuffledPassages().join(" ");
}