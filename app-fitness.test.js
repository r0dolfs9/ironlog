const assert = require('assert');

const fitness = require('./app-fitness.js');

const workouts = [
  {
    id: 'old-bench',
    exId: 'bench',
    cat: 'chest',
    name: 'Bench Press',
    date: '2026-05-20',
    splitId: 'push',
    sets: [{ reps: '5', weight: '80' }]
  },
  {
    id: 'bench-pr',
    exId: 'bench',
    cat: 'chest',
    name: 'Bench Press',
    date: '2026-06-01',
    splitId: 'push',
    sets: [{ reps: '5', weight: '82,5' }, { reps: '4', weight: '82.5' }]
  },
  {
    id: 'squat',
    exId: 'squat',
    cat: 'legs',
    name: 'Squat',
    date: '2026-06-01',
    splitId: 'legs',
    sets: [{ reps: '3', weight: '120' }]
  },
  {
    id: 'bike',
    cat: 'cardio',
    name: 'Cardio',
    date: '2026-06-01',
    splitId: 'legs',
    sets: []
  },
  {
    id: 'prior-squat',
    exId: 'squat',
    cat: 'legs',
    name: 'Squat',
    date: '2026-05-25',
    splitId: 'legs',
    sets: [{ reps: '2', weight: '130' }]
  }
];
const splits = [
  {
    id: 'push',
    name: 'Push Day',
    color: '--chest',
    sections: [{ type: 'muscle', group: 'chest' }]
  },
  {
    id: 'legs',
    name: 'Leg Day',
    color: '--legs',
    sections: [{ type: 'exercises', group: 'legs', list: ['Squat'] }]
  }
];
const exercises = {
  chest: [{ id: 'bench', name: 'Bench Press' }],
  legs: [{ id: 'squat', name: 'Squat' }, { id: 'lunge', name: 'Lunge' }]
};

assert.strictEqual(fitness.parseTrainingNumber('82,5'), 82.5);
assert.strictEqual(fitness.parseTrainingNumber(''), 0);
assert.strictEqual(fitness.setVolume([{ reps: '5', weight: '82,5' }, { reps: '4', weight: '82.5' }]), 742.5);
assert.strictEqual(fitness.maxSetWeight([{ reps: '5', weight: '82,5' }, { reps: '4', weight: '82.5' }]), 82.5);

assert.deepStrictEqual(fitness.trainingStats(workouts, '2026-06-01', '2026-06-01'), {
  sessions: 1,
  volume: 1102.5,
  sets: 3,
  workouts: workouts.slice(1, 4)
});

assert.strictEqual(fitness.personalRecordCount(workouts, '2026-06-01', '2026-06-01'), 1);
assert.deepStrictEqual(fitness.muscleFrequency(workouts, '2026-06-01', '2026-06-01'), {
  chest: 1,
  legs: 1
});

assert.deepStrictEqual(fitness.weeklyVolumeSummary(workouts, '2026-06-01'), {
  days: ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31', '2026-06-01'],
  previousDays: ['2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25'],
  weekVolume: 1102.5,
  previousVolume: 660,
  dayVolumes: [0, 0, 0, 0, 0, 0, 1102.5],
  deltaPercent: 67.04545454545455
});

const suggestion = fitness.leastRecentSplitSuggestion(splits, exercises, workouts, '2026-06-01');
assert.strictEqual(suggestion.sp.id, 'push');
assert.strictEqual(suggestion.daysSince, 0);
assert.strictEqual(suggestion.exList[0].name, 'Bench Press');
assert.strictEqual(suggestion.exList[0].last.id, 'bench-pr');

assert.deepStrictEqual(fitness.bodyWeightSnapshot([
  { id: 'latest', date: '2026-06-01', weight: '83.5' },
  { id: 'old', date: '2026-05-01', weight: '84,2' },
  { id: 'mid', date: '2026-05-20', weight: '83.8' }
], '2026-06-01'), {
  latest: { id: 'latest', date: '2026-06-01', weight: '83.5' },
  compare: { id: 'old', date: '2026-05-01', weight: '84,2' },
  delta: -0.7000000000000028,
  points: [
    { id: 'old', date: '2026-05-01', weight: '84,2' },
    { id: 'mid', date: '2026-05-20', weight: '83.8' },
    { id: 'latest', date: '2026-06-01', weight: '83.5' }
  ]
});

const longLost = fitness.longLostExercises(
  { chest: [{ id: 'old-bench-only', name: 'Old Bench' }], legs: [{ id: 'squat', name: 'Squat' }] },
  [{ exId: 'old-bench-only', date: '2026-05-10', sets: [{ reps: 1, weight: 1 }] }, ...workouts],
  '2026-06-01',
  7,
  3
);
assert.deepStrictEqual(longLost, [{ id: 'old-bench-only', name: 'Old Bench', date: '2026-05-10', ds: 22 }]);

assert.deepStrictEqual(fitness.sessionSummary(workouts, 'legs', '2026-06-01'), {
  workouts: workouts.slice(2, 4),
  nonCardio: [workouts[2]],
  totalVolume: 360,
  totalSets: 1,
  muscles: ['legs'],
  prs: [],
  exercises: [{
    exId: 'squat',
    name: 'Squat',
    cat: 'legs',
    sets: [{ reps: '3', weight: '120' }],
    notes: undefined,
    id: 'squat',
    todayVolume: 360,
    lastVolume: 260
  }],
  durationMinutes: null
});

const timedWorkouts = [
  { ...workouts[2], sessionStart: 1000, savedAt: 61000 },
  { ...workouts[3], sessionStart: 1000, savedAt: 121000 }
];
assert.strictEqual(fitness.sessionSummary(timedWorkouts, 'legs', '2026-06-01').durationMinutes, 2);

const exportData = fitness.markdownExportData(workouts, '2026-06-01');
assert.deepStrictEqual(exportData.summary, { totalSessions: 3, totalVolume: 1762.5, totalSets: 5 });
assert.deepStrictEqual(exportData.personalRecords.map(pr => ({ name: pr.name, weight: pr.weight, date: pr.date })), [
  { name: 'Squat', weight: 130, date: '2026-05-25' },
  { name: 'Bench Press', weight: 82.5, date: '2026-06-01' }
]);
assert.deepStrictEqual(exportData.volumeByCategory, { legs: 620, chest: 1142.5 });
assert.strictEqual(exportData.recentSessions.length, 3);
assert.deepStrictEqual(exportData.recentSessions[0], {
  date: '2026-06-01',
  workouts: workouts.slice(1, 4),
  categories: ['chest', 'legs', 'cardio'],
  volume: 1102.5
});

console.log('app-fitness tests passed');
