(function(root){
  'use strict';

  function parseTrainingNumber(value){
    return parseFloat(String(value || '').replace(',', '.').trim()) || 0;
  }

  function setVolume(sets){
    return (sets || []).reduce((total, set) => {
      return total + parseTrainingNumber(set.reps) * parseTrainingNumber(set.weight);
    }, 0);
  }

  function maxSetWeight(sets){
    return Math.max(0, ...(sets || []).map(set => parseTrainingNumber(set.weight)));
  }

  function inDateRange(workout, startDate, endDate){
    return workout.date >= startDate && workout.date <= endDate;
  }

  function nonCardio(workout){
    return workout.cat !== 'cardio';
  }

  function trainingStats(workouts, startDate, endDate){
    const range = (workouts || []).filter(workout => inDateRange(workout, startDate, endDate));
    const lifting = range.filter(nonCardio);
    return {
      sessions: new Set(range.map(workout => workout.date)).size,
      volume: lifting.reduce((total, workout) => total + setVolume(workout.sets), 0),
      sets: lifting.reduce((total, workout) => total + (workout.sets || []).length, 0),
      workouts: range
    };
  }

  function previousBest(workouts, workout){
    return Math.max(0, ...(workouts || [])
      .filter(item => item.exId === workout.exId && new Date(item.date) < new Date(workout.date))
      .map(item => maxSetWeight(item.sets)));
  }

  function personalRecordCount(workouts, startDate, endDate){
    return (workouts || [])
      .filter(workout => inDateRange(workout, startDate, endDate))
      .filter(workout => workout.cat !== 'cardio' && workout.exId)
      .filter(workout => {
        const current = maxSetWeight(workout.sets);
        return current > 0 && current > previousBest(workouts, workout);
      }).length;
  }

  function muscleFrequency(workouts, startDate, endDate){
    const result = {};
    (workouts || [])
      .filter(workout => inDateRange(workout, startDate, endDate))
      .filter(nonCardio)
      .forEach(workout => {
        result[workout.cat] = (result[workout.cat] || 0) + 1;
      });
    return result;
  }

  function dateDays(endDate, count, offset){
    const end = new Date(endDate);
    return Array.from({ length: count }, (_, index) => {
      const day = new Date(end);
      day.setDate(end.getDate() - (count - 1 - index) - (offset || 0));
      return day.toISOString().slice(0, 10);
    });
  }

  function volumeForDate(workouts, date){
    return (workouts || [])
      .filter(workout => workout.date === date)
      .reduce((total, workout) => total + setVolume(workout.sets), 0);
  }

  function weeklyVolumeSummary(workouts, endDate){
    const days = dateDays(endDate, 7, 0);
    const previousDays = dateDays(endDate, 7, 7);
    const dayVolumes = days.map(date => volumeForDate(workouts, date));
    const weekVolume = dayVolumes.reduce((total, value) => total + value, 0);
    const previousVolume = previousDays.reduce((total, date) => total + volumeForDate(workouts, date), 0);
    return {
      days,
      previousDays,
      weekVolume,
      previousVolume,
      dayVolumes,
      deltaPercent: previousVolume > 0 ? ((weekVolume - previousVolume) / previousVolume * 100) : null
    };
  }

  function latestWorkoutForExercise(workouts, exerciseId){
    return (workouts || [])
      .filter(workout => workout.exId === exerciseId)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function splitExercises(split, exercisesByGroup){
    const result = [];
    (split.sections || []).forEach(section => {
      if(section.type !== 'muscle' && section.type !== 'exercises')return;
      const groupExercises = (exercisesByGroup || {})[section.group] || [];
      const selected = section.type === 'muscle'
        ? groupExercises
        : groupExercises.filter(exercise => (section.list || []).includes(exercise.name));
      selected.slice(0, 4).forEach(exercise => result.push(exercise));
    });
    return result;
  }

  function leastRecentSplitSuggestion(splits, exercisesByGroup, workouts, todayDate){
    if(!(splits || []).length)return null;
    let picked = null;
    let minDate = '9999-99-99';
    (splits || []).forEach(split => {
      const last = (workouts || [])
        .filter(workout => workout.splitId === split.id)
        .map(workout => workout.date)
        .sort()
        .pop() || '1970-01-01';
      if(last < minDate){
        minDate = last;
        picked = split;
      }
    });
    if(!picked)return null;
    const exList = splitExercises(picked, exercisesByGroup)
      .map(exercise => ({ name: exercise.name, last: latestWorkoutForExercise(workouts, exercise.id) }))
      .slice(0, 4);
    return {
      sp: picked,
      exList,
      daysSince: minDate === '1970-01-01' ? null : Math.floor((new Date(todayDate) - new Date(minDate)) / 86400000)
    };
  }

  function bodyWeightSnapshot(bodyWeights, todayDate){
    const sorted = [...(bodyWeights || [])].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0] || null;
    const month30 = new Date(todayDate);
    month30.setDate(month30.getDate() - 30);
    const compareDate = month30.toISOString().slice(0, 10);
    const compare = sorted.find(entry => entry.date <= compareDate) || null;
    return {
      latest,
      compare,
      delta: latest && compare ? parseTrainingNumber(latest.weight) - parseTrainingNumber(compare.weight) : null,
      points: sorted.slice(0, 30).reverse()
    };
  }

  function longLostExercises(exercisesByGroup, workouts, todayDate, minDays, limit){
    const dayMs = 86400000;
    const threshold = minDays == null ? 7 : minDays;
    const maxItems = limit == null ? 3 : limit;
    const items = [];
    Object.values(exercisesByGroup || {}).flat().forEach(exercise => {
      const last = latestWorkoutForExercise(workouts, exercise.id);
      if(!last)return;
      const ds = Math.floor((new Date(todayDate) - new Date(last.date)) / dayMs);
      if(ds >= threshold)items.push({ id: exercise.id, name: exercise.name, date: last.date, ds });
    });
    return items.sort((a, b) => b.ds - a.ds).slice(0, maxItems);
  }

  function sessionSummary(workouts, splitId, date){
    const todayAll = (workouts || []).filter(workout => workout.date === date && (workout.splitId === splitId || workout.splitId === null));
    const lifting = todayAll.filter(nonCardio);
    const previousSameSplit = (workouts || []).filter(workout => workout.splitId === splitId && workout.date < date);
    const lastDate = [...new Set(previousSameSplit.map(workout => workout.date))].sort().reverse()[0];
    const lastAll = lastDate ? (workouts || []).filter(workout => workout.splitId === splitId && workout.date === lastDate) : [];
    const lastVolumeByExercise = new Map();
    lastAll.filter(nonCardio).forEach(workout => {
      lastVolumeByExercise.set(workout.exId, (lastVolumeByExercise.get(workout.exId) || 0) + setVolume(workout.sets));
    });
    const exerciseMap = new Map();
    lifting.forEach(workout => {
      if(!exerciseMap.has(workout.exId)){
        exerciseMap.set(workout.exId, {
          exId: workout.exId,
          name: workout.name,
          cat: workout.cat,
          sets: workout.sets,
          notes: workout.notes,
          id: workout.id,
          todayVolume: 0,
          lastVolume: 0
        });
      }
      const item = exerciseMap.get(workout.exId);
      item.todayVolume += setVolume(workout.sets);
      item.lastVolume = lastVolumeByExercise.get(workout.exId) || 0;
    });
    const prs = lifting.filter(workout => {
      const prevBest = Math.max(0, ...(workouts || [])
        .filter(item => item.exId === workout.exId && item.id !== workout.id && new Date(item.date) < new Date(date))
        .map(item => maxSetWeight(item.sets)));
      const current = maxSetWeight(workout.sets);
      return current > 0 && current > prevBest;
    });
    const timed = todayAll.filter(workout => workout.sessionStart && workout.savedAt);
    let durationMinutes = null;
    if(timed.length){
      const start = Math.min(...timed.map(workout => workout.sessionStart));
      const end = Math.max(...timed.map(workout => workout.savedAt || workout.sessionStart));
      durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    }
    return {
      workouts: todayAll,
      nonCardio: lifting,
      totalVolume: lifting.reduce((total, workout) => total + setVolume(workout.sets), 0),
      totalSets: lifting.reduce((total, workout) => total + (workout.sets || []).length, 0),
      muscles: [...new Set(lifting.map(workout => workout.cat))],
      prs,
      exercises: [...exerciseMap.values()],
      durationMinutes
    };
  }

  function personalRecords(workouts){
    const byExercise = new Map();
    (workouts || []).filter(workout => workout.cat !== 'cardio' && workout.exId).forEach(workout => {
      const weight = maxSetWeight(workout.sets);
      if(!weight)return;
      const current = byExercise.get(workout.exId);
      if(!current || weight > current.weight){
        byExercise.set(workout.exId, {
          exId: workout.exId,
          name: workout.name,
          cat: workout.cat,
          weight,
          date: workout.date,
          sets: workout.sets
        });
      }
    });
    return [...byExercise.values()].sort((a, b) => b.weight - a.weight);
  }

  function volumeByCategorySince(workouts, startDate){
    const result = {};
    (workouts || [])
      .filter(workout => workout.cat !== 'cardio' && workout.date >= startDate)
      .forEach(workout => {
        result[workout.cat] = (result[workout.cat] || 0) + setVolume(workout.sets);
      });
    return result;
  }

  function recentSessions(workouts, limit){
    const sessions = {};
    (workouts || []).forEach(workout => {
      (sessions[workout.date] = sessions[workout.date] || []).push(workout);
    });
    return Object.keys(sessions)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit == null ? 20 : limit)
      .map(date => {
        const dayWorkouts = sessions[date];
        return {
          date,
          workouts: dayWorkouts,
          categories: [...new Set(dayWorkouts.map(workout => workout.cat))],
          volume: dayWorkouts.filter(nonCardio).reduce((total, workout) => total + setVolume(workout.sets), 0)
        };
      });
  }

  function markdownExportData(workouts, todayDate){
    const lifting = (workouts || []).filter(nonCardio);
    const eightWeeksAgo = new Date(todayDate);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    return {
      summary: {
        totalSessions: new Set(lifting.map(workout => workout.date)).size,
        totalVolume: lifting.reduce((total, workout) => total + setVolume(workout.sets), 0),
        totalSets: lifting.reduce((total, workout) => total + (workout.sets || []).length, 0)
      },
      personalRecords: personalRecords(workouts),
      volumeByCategory: volumeByCategorySince(workouts, eightWeeksAgo.toISOString().slice(0, 10)),
      recentSessions: recentSessions(workouts, 20)
    };
  }

  const api = {
    parseTrainingNumber,
    setVolume,
    maxSetWeight,
    trainingStats,
    personalRecordCount,
    muscleFrequency,
    weeklyVolumeSummary,
    leastRecentSplitSuggestion,
    bodyWeightSnapshot,
    longLostExercises,
    sessionSummary,
    personalRecords,
    volumeByCategorySince,
    recentSessions,
    markdownExportData
  };
  root.IronLogFitness = api;
  if(typeof module !== 'undefined' && module.exports)module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
