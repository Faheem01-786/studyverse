import Common "common";

module {
  /// A student's public and private profile.
  public type Profile = {
    id : Common.UserId;
    username : Text;
    displayName : Text;
    bio : Text;
    avatarItemId : ?Common.Id;
    frameItemId : ?Common.Id;
    appliedThemeId : Common.Id;
    xp : Common.Xp;
    level : Common.Level;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// A student's daily study goal and streak state.
  public type StudyGoal = {
    dailyGoalMinutes : Nat;
    currentStreakDays : Nat;
    longestStreakDays : Nat;
    lastStudyDay : ?Common.DayKey;
  };

  /// A public projection of a student for leaderboards and profiles.
  public type ProfileView = {
    id : Common.UserId;
    username : Text;
    displayName : Text;
    avatarItemId : ?Common.Id;
    frameItemId : ?Common.Id;
    xp : Common.Xp;
    level : Common.Level;
  };

  /// A student's own dashboard summary.
  public type Dashboard = {
    profile : Profile;
    goal : StudyGoal;
    studyMinutesToday : Nat;
    studyMinutesThisWeek : Nat;
    xpToday : Common.Xp;
    xpThisWeek : Common.Xp;
    xpToNextLevel : Common.Xp;
    levelProgressPercent : Nat;
  };
};
