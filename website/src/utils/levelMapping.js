export function getMathLevelInfo(level) {
  const numericLevel = Number.isFinite(level) ? level : 0;

  const tiers = [
    { max: 100, title: 'Counting Caterpillar 🐛', description: 'learning numbers and basic counting' },
    { max: 200, title: 'Adding Ant 🐜', description: 'adding and subtracting' },
    { max: 300, title: 'Multiplying Monkey 🐒', description: 'multiplication and division' },
    { max: 400, title: 'Fraction Fox 🦊', description: 'fractions, decimals, percentages' },
    { max: 500, title: 'Algebra Astronaut 🚀', description: 'solving for X, exploring equations' },
    { max: 600, title: 'Geometry Giraffe 🦒', description: 'shapes, angles, space' },
    { max: 700, title: 'Calculus Cat 🐱', description: 'slopes, curves, rates of change' },
    { max: 800, title: 'Probability Penguin 🐧', description: 'chance, stats, data' },
    { max: 900, title: 'Logic Lion 🦁', description: 'proofs, reasoning, patterns' },
    { max: 1000, title: 'Math Wizard 🧙', description: 'mastery of school-level math' },
    { max: 1100, title: 'Number Ninja 🥷', description: 'advanced problem-solving skills' },
    { max: 1200, title: 'Formula Master 🏆', description: 'pre-university & olympiad level' },
    { max: 1300, title: 'Theorem Titan 🛡', description: 'advanced university math' },
    { max: 1400, title: 'Principia Professor 📚', description: 'master of all branches of mathematics' },
  ];

  const match = tiers.find(t => numericLevel < t.max);
  if (match) {
    return match;
  }

  return { title: 'Infinity Explorer ♾', description: 'pushing the boundaries of math discovery' };
} 