import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import StudyTypes "../types/study";
import QuestTypes "../types/quests";
import MembershipTypes "../types/membership";
import AchievementTypes "../types/achievements";
import ProfilesLib "profiles";
import StudyLib "study";
import MembershipLib "membership";
import AchievementsLib "achievements";

module {
  /// Credit XP to a student's profile, applying the active membership
  /// multiplier, and keep the derived level in sync. Returns the awarded XP.
  public func creditXp(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
    caller : Common.UserId,
    baseXp : Common.Xp,
    now : Common.Timestamp,
  ) : Common.Xp {
    let multiplier = MembershipLib.activeMultiplier(subscriptions, caller, now);
    let awarded = baseXp * multiplier;
    switch (profiles.get(caller)) {
      case (?profile) {
        let newXp = profile.xp + awarded;
        profiles.add(caller, {
          profile with
          xp = newXp;
          level = ProfilesLib.levelForXp(newXp);
          updatedAt = now;
        });
      };
      case null {};
    };
    awarded;
  };

  /// Update the caller's streak from a verified study day.
  /// A study day is consecutive when it directly follows the last study day.
  public func updateStreak(
    goals : Map.Map<Common.UserId, ProfileTypes.StudyGoal>,
    caller : Common.UserId,
    dayKey : Common.DayKey,
  ) : () {
    let existing = goals.get(caller) ?? {
      dailyGoalMinutes = 120;
      currentStreakDays = 0;
      longestStreakDays = 0;
      lastStudyDay = null;
    };
    switch (existing.lastStudyDay) {
      case (?last) {
        if (last == dayKey) {
          return;
        };
        let yesterday = StudyLib.addDays(dayKey, -1);
        let current = if (last == yesterday) { existing.currentStreakDays + 1 } else { 1 };
        let longest = Nat.max(existing.longestStreakDays, current);
        goals.add(caller, {
          existing with
          currentStreakDays = current;
          longestStreakDays = longest;
          lastStudyDay = ?dayKey;
        });
      };
      case null {
        goals.add(caller, {
          existing with
          currentStreakDays = 1;
          longestStreakDays = Nat.max(existing.longestStreakDays, 1);
          lastStudyDay = ?dayKey;
        });
      };
    };
  };

  /// Count the caller's claimed quest rewards.
  public func claimedQuestCount(
    questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
    caller : Common.UserId,
  ) : Nat {
    var count = 0;
    for (p in questProgress.values()) {
      if (p.owner == caller and p.claimed) { count += 1 };
    };
    count;
  };

  /// Evaluate and award any newly earned achievements for the caller,
  /// crediting each achievement's XP reward exactly once.
  public func evaluateAchievements(
    earned : Map.Map<Text, AchievementTypes.EarnedAchievement>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
    sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
    questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
    goals : Map.Map<Common.UserId, ProfileTypes.StudyGoal>,
    caller : Common.UserId,
    now : Common.Timestamp,
  ) : [AchievementTypes.AchievementKey] {
    let totalMinutes = StudyLib.totalMinutes(sessions, caller);
    let streak = switch (goals.get(caller)) {
      case (?g) { g.currentStreakDays };
      case null { 0 };
    };
    let claimed = claimedQuestCount(questProgress, caller);
    let totalXp = switch (profiles.get(caller)) {
      case (?p) { p.xp };
      case null { 0 };
    };
    let newly = AchievementsLib.evaluate(earned, caller, totalMinutes, streak, claimed, totalXp, now);
    for (key in newly.values()) {
      let reward = AchievementsLib.rewardFor(key);
      ignore creditXp(profiles, subscriptions, caller, reward, now);
    };
    newly;
  };

  /// XP a student earned from finished sessions within a day-key range
  /// [start, end) plus claimed quest rewards in the same range.
  public func xpInRange(
    sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
    quests : Map.Map<Common.Id, QuestTypes.Quest>,
    questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
    caller : Common.UserId,
    start : Common.DayKey,
    end : Common.DayKey,
  ) : Common.Xp {
    var total = 0;
    for (s in sessions.values()) {
      if (s.owner == caller and s.status == #finished and s.dayKey >= start and s.dayKey < end) {
        total += s.rewardedXp ?? 0;
      };
    };
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
};
