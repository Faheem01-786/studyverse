import OQL "mo:caffeineai-oql";
import Types "../types/achievements";

module {
  public func _toRow(self : Types.AchievementKey) : OQL.Value {
    #text(switch self {
      case (#firstStudySession) { "firstStudySession" };
      case (#fiveHourLearner) { "fiveHourLearner" };
      case (#sevenDayStreak) { "sevenDayStreak" };
      case (#thirtyDayStreak) { "thirtyDayStreak" };
      case (#questMaster) { "questMaster" };
      case (#xpChampion) { "xpChampion" };
    });
  };
};
