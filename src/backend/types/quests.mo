import Common "common";

module {
  /// The measurable condition a quest tracks.
  public type QuestGoal = {
    #studyMinutes : Nat;
    #completeChapter;
    #solveQuestions : Nat;
    #finishSession;
    #reachDailyGoal;
  };

  /// A daily quest definition.
  public type Quest = {
    id : Common.Id;
    title : Text;
    description : Text;
    goal : QuestGoal;
    xpReward : Common.Xp;
    active : Bool;
    createdAt : Common.Timestamp;
  };

  /// A student's progress against one quest for one day.
  public type QuestProgress = {
    questId : Common.Id;
    owner : Common.UserId;
    dayKey : Common.DayKey;
    progress : Nat;
    target : Nat;
    completed : Bool;
    claimed : Bool;
  };

  /// A quest plus the caller's progress for today.
  public type QuestView = {
    quest : Quest;
    progress : Nat;
    target : Nat;
    completed : Bool;
    claimed : Bool;
  };
};
