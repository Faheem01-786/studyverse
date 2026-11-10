import Common "common";

module {
  /// The achievement catalogue key.
  public type AchievementKey = {
    #firstStudySession;
    #fiveHourLearner;
    #sevenDayStreak;
    #thirtyDayStreak;
    #questMaster;
    #xpChampion;
  };

  /// An achievement definition.
  public type Achievement = {
    key : AchievementKey;
    title : Text;
    description : Text;
    xpReward : Common.Xp;
  };

  /// A student's earned achievement.
  public type EarnedAchievement = {
    key : AchievementKey;
    owner : Common.UserId;
    earnedAt : Common.Timestamp;
  };

  /// An achievement plus whether the caller has earned it.
  public type AchievementView = {
    achievement : Achievement;
    earned : Bool;
    earnedAt : ?Common.Timestamp;
  };
};
