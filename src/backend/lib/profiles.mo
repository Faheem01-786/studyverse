import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/profiles";
import StudyTypes "../types/study";
import QuestTypes "../types/quests";
import StudyLib "study";

module {
  /// XP required to advance from `level` to `level + 1`.
  /// A simple, deterministic curve: level 0 -> 1 costs 100 XP, and each
  /// subsequent level costs 50 XP more than the previous one.
  public func xpForLevel(level : Common.Level) : Common.Xp {
    100 + (level * 50);
  };

  /// Derive the level for a total XP amount by walking the curve.
  public func levelForXp(xp : Common.Xp) : Common.Level {
    var level = 0;
    var remaining = xp;
    var cost = xpForLevel(0);
    while (remaining >= cost) {
      remaining -= cost;
      level += 1;
      cost := xpForLevel(level);
    };
    level;
  };

  /// XP remaining until the next level.
  public func xpToNextLevel(xp : Common.Xp) : Common.Xp {
    var level = 0;
    var remaining = xp;
    var cost = xpForLevel(0);
    while (remaining >= cost) {
      remaining -= cost;
      level += 1;
      cost := xpForLevel(level);
    };
    cost - remaining;
  };

  /// Create a new profile for a student.
  public func createProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    goals : Map.Map<Common.UserId, Types.StudyGoal>,
    caller : Common.UserId,
    username : Text,
    displayName : Text,
    now : Common.Timestamp,
  ) : Types.Profile {
    let profile : Types.Profile = {
      id = caller;
      username;
      displayName;
      bio = "";
      avatarItemId = null;
      frameItemId = null;
      appliedThemeId = 0;
      xp = 0;
      level = 0;
      createdAt = now;
      updatedAt = now;
    };
    profiles.add(caller, profile);
    if (not goals.containsKey(caller)) {
      goals.add(caller, {
        dailyGoalMinutes = 120;
        currentStreakDays = 0;
        longestStreakDays = 0;
        lastStudyDay = null;
      });
    };
    profile;
  };

  /// Fetch a profile.
  public func getProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    caller : Common.UserId,
  ) : ?Types.Profile {
    profiles.get(caller);
  };

  /// Update mutable profile fields.
  public func updateProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    caller : Common.UserId,
    displayName : Text,
    bio : Text,
    now : Common.Timestamp,
  ) : Types.Profile {
    let existing = profiles.get(caller) ?? {
      id = caller;
      username = "";
      displayName = "";
      bio = "";
      avatarItemId = null;
      frameItemId = null;
      appliedThemeId = 0;
      xp = 0;
      level = 0;
      createdAt = now;
      updatedAt = now;
    };
    let updated : Types.Profile = {
      existing with
      displayName;
      bio;
      updatedAt = now;
    };
    profiles.add(caller, updated);
    updated;
  };

  /// Set the caller's daily study goal in minutes.
  public func setDailyGoal(
    goals : Map.Map<Common.UserId, Types.StudyGoal>,
    caller : Common.UserId,
    dailyGoalMinutes : Nat,
  ) : Types.StudyGoal {
    let existing = goals.get(caller) ?? {
      dailyGoalMinutes = 120;
      currentStreakDays = 0;
      longestStreakDays = 0;
      lastStudyDay = null;
    };
    let updated : Types.StudyGoal = {
      existing with
      dailyGoalMinutes;
    };
    goals.add(caller, updated);
    updated;
  };

  /// Read the caller's goal and streak state.
  public func getGoal(
    goals : Map.Map<Common.UserId, Types.StudyGoal>,
    caller : Common.UserId,
  ) : Types.StudyGoal {
    goals.get(caller) ?? {
      dailyGoalMinutes = 120;
      currentStreakDays = 0;
      longestStreakDays = 0;
      lastStudyDay = null;
    };
  };

  /// Build the caller's dashboard summary from real study data.
  public func getDashboard(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    goals : Map.Map<Common.UserId, Types.StudyGoal>,
    sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
    quests : Map.Map<Common.Id, QuestTypes.Quest>,
    questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
    caller : Common.UserId,
  ) : Types.Dashboard {
    let now = Time.now();
    let profile = profiles.get(caller) ?? {
      id = caller;
      username = "";
      displayName = "";
      bio = "";
      avatarItemId = null;
      frameItemId = null;
      appliedThemeId = 0;
      xp = 0;
      level = 0;
      createdAt = now;
      updatedAt = now;
    };
    let goal = getGoal(goals, caller);
    let level = levelForXp(profile.xp);
    let nextLevelXp = xpToNextLevel(profile.xp);
    let levelCost = xpForLevel(level);
    let earnedThisLevel = levelCost - nextLevelXp;
    let percent = if (levelCost == 0) { 100 } else {
      (earnedThisLevel * 100) / levelCost;
    };
    let today = StudyLib.dayKeyOf(now);
    let weekStart = StudyLib.weekStartDayKey(now);
    let weekEnd = StudyLib.addDays(weekStart, 7);
    let syncedProfile : Types.Profile = { profile with level };
    {
      profile = syncedProfile;
      goal;
      studyMinutesToday = StudyLib.minutesOnDay(sessions, caller, today);
      studyMinutesThisWeek = StudyLib.minutesForWeek(sessions, caller, weekStart);
      xpToday = StudyLib.sessionXpInRange(sessions, caller, today, StudyLib.addDays(today, 1))
        + questXpInRange(quests, questProgress, caller, today, StudyLib.addDays(today, 1));
      xpThisWeek = StudyLib.sessionXpInRange(sessions, caller, weekStart, weekEnd)
        + questXpInRange(quests, questProgress, caller, weekStart, weekEnd);
      xpToNextLevel = nextLevelXp;
      levelProgressPercent = percent;
    };
  };

  /// XP from claimed quest rewards within a day-key range [start, end).
  func questXpInRange(
    quests : Map.Map<Common.Id, QuestTypes.Quest>,
    questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
    caller : Common.UserId,
    start : Common.DayKey,
    end : Common.DayKey,
  ) : Common.Xp {
    var total = 0;
    for (p in questProgress.values()) {
      if (p.owner == caller and p.claimed and p.dayKey >= start and p.dayKey < end) {
        switch (quests.get(p.questId)) {
          case (?q) { total += q.xpReward };
          case null {};
        };
      };
    };
    total;
  };

  /// Project a profile for public display.
  public func toView(profile : Types.Profile) : Types.ProfileView {
    {
      id = profile.id;
      username = profile.username;
      displayName = profile.displayName;
      avatarItemId = profile.avatarItemId;
      frameItemId = profile.frameItemId;
      xp = profile.xp;
      level = profile.level;
    };
  };
};
