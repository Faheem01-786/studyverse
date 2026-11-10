import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/quests";

module {
  /// The caller's study activity for one day, used to derive quest progress.
  public type StudyContext = {
    minutesToday : Nat;
    finishedSessionsToday : Nat;
    dailyGoalMinutes : Nat;
  };

  /// The numeric target a quest goal requires.
  public func targetFor(goal : Types.QuestGoal) : Nat {
    switch (goal) {
      case (#studyMinutes(m)) { m };
      case (#completeChapter) { 1 };
      case (#solveQuestions(n)) { n };
      case (#finishSession) { 1 };
      case (#reachDailyGoal) { 1 };
    };
  };

  /// The progress a quest goal has reached from real study activity.
  /// Returns null for goals that have no study data source and rely on
  /// explicitly recorded progress.
  public func derivedProgress(goal : Types.QuestGoal, ctx : StudyContext) : ?Nat {
    switch (goal) {
      case (#studyMinutes(_)) { ?ctx.minutesToday };
      case (#finishSession) { ?ctx.finishedSessionsToday };
      case (#reachDailyGoal) {
        if (ctx.dailyGoalMinutes > 0 and ctx.minutesToday >= ctx.dailyGoalMinutes) {
          ?1;
        } else {
          ?0;
        };
      };
      case (#completeChapter) { null };
      case (#solveQuestions(_)) { null };
    };
  };

  /// The composite key for one student's progress on one quest for one day.
  func progressKey(caller : Common.UserId, questId : Common.Id, dayKey : Common.DayKey) : Text {
    caller.toText() # ":" # questId.toText() # ":" # dayKey;
  };

  /// List active quests with the caller's progress for today.
  public func listQuests(
    quests : Map.Map<Common.Id, Types.Quest>,
    progress : Map.Map<Text, Types.QuestProgress>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
    ctx : StudyContext,
  ) : [Types.QuestView] {
    let views = quests.values().filter(func(q) = q.active).map(
      func(q) {
        let target = targetFor(q.goal);
        let stored = progress.get(progressKey(caller, q.id, dayKey));
        let storedProgress = switch (stored) {
          case (?p) { p.progress };
          case null { 0 };
        };
        let claimed = switch (stored) {
          case (?p) { p.claimed };
          case null { false };
        };
        let derived = derivedProgress(q.goal, ctx);
        let effective = switch (derived) {
          case (?d) { Nat.max(d, storedProgress) };
          case null { storedProgress };
        };
        {
          quest = q;
          progress = effective;
          target;
          completed = effective >= target;
          claimed;
        };
      }
    ).toArray();
    views.sort(func(a, b) = Nat.compare(a.quest.id, b.quest.id));
  };

  /// Record progress toward a quest for the caller today.
  public func recordProgress(
    quests : Map.Map<Common.Id, Types.Quest>,
    progress : Map.Map<Text, Types.QuestProgress>,
    caller : Common.UserId,
    questId : Common.Id,
    amount : Nat,
    dayKey : Common.DayKey,
  ) : Types.QuestProgress {
    let quest = quests.get(questId) ?? return ({
      questId;
      owner = caller;
      dayKey;
      progress = 0;
      target = 0;
      completed = false;
      claimed = false;
    });
    let target = targetFor(quest.goal);
    let key = progressKey(caller, questId, dayKey);
    let existing = progress.get(key);
    let current = switch (existing) {
      case (?p) { p.progress };
      case null { 0 };
    };
    let next = current + amount;
    let completed = next >= target;
    let claimed = switch (existing) {
      case (?p) { p.claimed };
      case null { false };
    };
    let updated : Types.QuestProgress = {
      questId;
      owner = caller;
      dayKey;
      progress = next;
      target;
      completed;
      claimed;
    };
    progress.add(key, updated);
    updated;
  };

  /// Set a quest's progress for the caller today to an absolute value,
  /// never lowering it below the stored value.
  public func setProgress(
    quests : Map.Map<Common.Id, Types.Quest>,
    progress : Map.Map<Text, Types.QuestProgress>,
    caller : Common.UserId,
    questId : Common.Id,
    value : Nat,
    dayKey : Common.DayKey,
  ) : Types.QuestProgress {
    let quest = quests.get(questId) ?? return ({
      questId;
      owner = caller;
      dayKey;
      progress = 0;
      target = 0;
      completed = false;
      claimed = false;
    });
    let target = targetFor(quest.goal);
    let key = progressKey(caller, questId, dayKey);
    let existing = progress.get(key);
    let current = switch (existing) {
      case (?p) { p.progress };
      case null { 0 };
    };
    let next = Nat.max(current, value);
    let completed = next >= target;
    let claimed = switch (existing) {
      case (?p) { p.claimed };
      case null { false };
    };
    let updated : Types.QuestProgress = {
      questId;
      owner = caller;
      dayKey;
      progress = next;
      target;
      completed;
      claimed;
    };
    progress.add(key, updated);
    updated;
  };

  /// Claim a completed quest's XP reward exactly once.
  public func claimQuest(
    quests : Map.Map<Common.Id, Types.Quest>,
    progress : Map.Map<Text, Types.QuestProgress>,
    caller : Common.UserId,
    questId : Common.Id,
    dayKey : Common.DayKey,
    ctx : StudyContext,
  ) : Common.Xp {
    let quest = quests.get(questId) ?? return 0;
    let target = targetFor(quest.goal);
    let key = progressKey(caller, questId, dayKey);
    let stored = progress.get(key);
    let storedProgress = switch (stored) {
      case (?p) { p.progress };
      case null { 0 };
    };
    let claimed = switch (stored) {
      case (?p) { p.claimed };
      case null { false };
    };
    if (claimed) {
      return 0;
    };
    let derived = derivedProgress(quest.goal, ctx);
    let effective = switch (derived) {
      case (?d) { Nat.max(d, storedProgress) };
      case null { storedProgress };
    };
    if (effective < target) {
      return 0;
    };
    let updated : Types.QuestProgress = {
      questId;
      owner = caller;
      dayKey;
      progress = effective;
      target;
      completed = true;
      claimed = true;
    };
    progress.add(key, updated);
    quest.xpReward;
  };

  /// Create a quest (admin).
  public func createQuest(
    quests : Map.Map<Common.Id, Types.Quest>,
    state : { var nextQuestId : Nat },
    title : Text,
    description : Text,
    goal : Types.QuestGoal,
    xpReward : Common.Xp,
    now : Common.Timestamp,
  ) : Types.Quest {
    let id = state.nextQuestId;
    state.nextQuestId := id + 1;
    let quest : Types.Quest = {
      id;
      title;
      description;
      goal;
      xpReward;
      active = true;
      createdAt = now;
    };
    quests.add(id, quest);
    quest;
  };

  /// Update a quest (admin).
  public func updateQuest(
    quests : Map.Map<Common.Id, Types.Quest>,
    questId : Common.Id,
    title : Text,
    description : Text,
    goal : Types.QuestGoal,
    xpReward : Common.Xp,
    active : Bool,
  ) : Types.Quest {
    let existing = quests.get(questId) ?? return ({
      id = questId;
      title;
      description;
      goal;
      xpReward;
      active;
      createdAt = 0;
    });
    let updated : Types.Quest = {
      existing with
      title;
      description;
      goal;
      xpReward;
      active;
    };
    quests.add(questId, updated);
    updated;
  };

  /// Delete a quest (admin).
  public func deleteQuest(
    quests : Map.Map<Common.Id, Types.Quest>,
    questId : Common.Id,
  ) : () {
    quests.remove(questId);
  };
};
