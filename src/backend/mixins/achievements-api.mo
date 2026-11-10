import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/achievements";
import AchievementsLib "../lib/achievements";

mixin (
  accessControlState : AccessControl.AccessControlState,
  earned : Map.Map<Text, Types.EarnedAchievement>,
) {
  /// List the achievement catalogue with the caller's earned state.
  public query ({ caller }) func listAchievements() : async [Types.AchievementView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view achievements");
    };
    AchievementsLib.listForCaller(earned, caller);
  };
};
