import Map "mo:core/Map";
import Text "mo:core/Text";
import Common "../types/common";
import Types "../types/achievements";

module {
  /// The full achievement catalogue.
  public func catalogue() : [Types.Achievement] {
    [
      {
        key = #firstStudySession;
        title = "First Study Session";
        description = "Complete your very first study session.";
        xpReward = 25;
      },
      {
        key = #fiveHourLearner;
        title = "5-Hour Learner";
        description = "Accumulate 5 hours (300 minutes) of verified study time.";
        xpReward = 100;
      },
      {
        key = #sevenDayStreak;
        title = "7-Day Streak";
        description = "Study on 7 consecutive days.";
        xpReward = 150;
      },
      {
        key = #thirtyDayStreak;
        title = "30-Day Streak";
        description = "Study on 30 consecutive days.";
        xpReward = 500;
      },
      {
        key = #questMaster;
        title = "Quest Master";
        description = "Claim 10 daily quest rewards.";
        xpReward = 200;
      },
      {
        key = #xpChampion;
        title = "XP Champion";
        description = "Reach 1000 total XP.";
        xpReward = 250;
      },
    ];
  };

  /// The XP reward for an achievement key.
  public func rewardFor(key : Types.AchievementKey) : Common.Xp {
    switch (key) {
      case (#firstStudySession) { 25 };
      case (#fiveHourLearner) { 100 };
      case (#sevenDayStreak) { 150 };
      case (#thirtyDayStreak) { 500 };
      case (#questMaster) { 200 };
      case (#xpChampion) { 250 };
    };
  };

  /// Stable text key for one student's achievement record.
  public func keyText(key : Types.AchievementKey) : Text {
    switch (key) {
      case (#firstStudySession) { "firstStudySession" };
      case (#fiveHourLearner) { "fiveHourLearner" };
      case (#sevenDayStreak) { "sevenDayStreak" };
      case (#thirtyDayStreak) { "thirtyDayStreak" };
      case (#questMaster) { "questMaster" };
      case (#xpChampion) { "xpChampion" };
    };
  };

  func recordKey(owner : Common.UserId, key : Types.AchievementKey) : Text {
    owner.toText() # ":" # keyText(key);
  };

  /// List the catalogue with the caller's earned state.
  public func listForCaller(
    earned : Map.Map<Text, Types.EarnedAchievement>,
    caller : Common.UserId,
  ) : [Types.AchievementView] {
    catalogue().map(func(achievement) {
      let record = earned.get(recordKey(caller, achievement.key));
      {
        achievement;
        earned = switch (record) { case (?_) { true }; case null { false } };
        earnedAt = switch (record) { case (?r) { ?r.earnedAt }; case null { null } };
      };
    });
  };

  /// Evaluate and award any newly earned achievements for the caller.
  public func evaluate(
    earned : Map.Map<Text, Types.EarnedAchievement>,
    caller : Common.UserId,
    totalStudyMinutes : Nat,
    currentStreakDays : Nat,
    questsClaimed : Nat,
    totalXp : Common.Xp,
    now : Common.Timestamp,
  ) : [Types.AchievementKey] {
    let newlyEarned = catalogue().filter(func(achievement) {
      let already = switch (earned.get(recordKey(caller, achievement.key))) {
        case (?_) { true };
        case null { false };
      };
      if (already) { return false };
      switch (achievement.key) {
        case (#firstStudySession) { totalStudyMinutes > 0 };
        case (#fiveHourLearner) { totalStudyMinutes >= 300 };
        case (#sevenDayStreak) { currentStreakDays >= 7 };
        case (#thirtyDayStreak) { currentStreakDays >= 30 };
        case (#questMaster) { questsClaimed >= 10 };
        case (#xpChampion) { totalXp >= 1000 };
      };
    });
    newlyEarned.map(func(achievement) {
      earned.add(recordKey(caller, achievement.key), {
        key = achievement.key;
        owner = caller;
        earnedAt = now;
      });
      achievement.key;
    });
  };
};
