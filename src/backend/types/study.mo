import Common "common";

module {
  /// Lifecycle state of a study session.
  public type SessionStatus = {
    #running;
    #paused;
    #finished;
  };

  /// A server-tracked study session.
  public type StudySession = {
    id : Common.Id;
    owner : Common.UserId;
    subject : Text;
    status : SessionStatus;
    startedAt : Common.Timestamp;
    lastResumedAt : ?Common.Timestamp;
    accumulatedSeconds : Nat;
    finishedAt : ?Common.Timestamp;
    rewardedXp : ?Common.Xp;
    dayKey : Common.DayKey;
  };

  /// A shared projection of a study session.
  public type StudySessionView = {
    id : Common.Id;
    subject : Text;
    status : SessionStatus;
    startedAt : Common.Timestamp;
    accumulatedSeconds : Nat;
    finishedAt : ?Common.Timestamp;
    rewardedXp : ?Common.Xp;
  };

  /// Aggregated study totals for a period.
  public type StudyReport = {
    totalMinutes : Nat;
    sessionCount : Nat;
    totalXp : Common.Xp;
    bySubject : [(Text, Nat)];
  };

  /// A single day's study total.
  public type DailyStudyTotal = {
    dayKey : Common.DayKey;
    minutes : Nat;
    xp : Common.Xp;
  };
};
