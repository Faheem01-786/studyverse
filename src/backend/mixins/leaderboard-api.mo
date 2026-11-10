import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/leaderboard";
import ProfileTypes "../types/profiles";
import StudyTypes "../types/study";
import QuestTypes "../types/quests";
import LeaderboardLib "../lib/leaderboard";
import StudyLib "../lib/study";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  friends : Map.Map<Common.UserId, Set.Set<Common.UserId>>,
  flagged : Set.Set<Common.UserId>,
  sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  quests : Map.Map<Common.Id, QuestTypes.Quest>,
  questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
) {
  /// Fetch a ranked leaderboard for the requested scope.
  /// Global ranks by total XP; weekly and monthly rank by XP earned in the
  /// current week or month from real session and quest data.
  public query ({ caller }) func getLeaderboard(scope : Types.LeaderboardScope, limit : Nat) : async [Types.LeaderboardEntry] {
    let now = Time.now();
    let today = StudyLib.dayKeyOf(now);
    let weekStart = StudyLib.weekStartDayKey(now);
    let weekEnd = StudyLib.addDays(weekStart, 7);
    let monthStart = do {
      let parts = today.split(#char '-').toArray();
      if (parts.size() == 3) { parts[0] # "-" # parts[1] # "-01" } else { today };
    };
    let monthEnd = StudyLib.addDays(monthStart, 31);
    let xpOf = func (student : Common.UserId) : Common.Xp {
      switch (scope) {
        case (#global) {
          switch (profiles.get(student)) {
            case (?p) { p.xp };
            case null { 0 };
          };
        };
        case (#weekly) {
          ActivityLib.xpInRange(sessions, quests, questProgress, student, weekStart, weekEnd);
        };
        case (#monthly) {
          ActivityLib.xpInRange(sessions, quests, questProgress, student, monthStart, monthEnd);
        };
        case (#friends) {
          switch (profiles.get(student)) {
            case (?p) { p.xp };
            case null { 0 };
          };
        };
      };
    };
    let visible = Map.empty<Common.UserId, LeaderboardLib.ProfileRow>();
    for ((id, profile) in profiles.entries()) {
      if (not flagged.contains(id)) {
        visible.add(id, {
          id = profile.id;
          username = profile.username;
          displayName = profile.displayName;
          avatarItemId = profile.avatarItemId;
          frameItemId = profile.frameItemId;
          xp = profile.xp;
          level = profile.level;
        });
      };
    };
    LeaderboardLib.getLeaderboardByXp(visible, friends, caller, scope, limit, xpOf);
  };

  /// Add a friend for the caller.
  public shared ({ caller }) func addFriend(friend : Common.UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can manage friends");
    };
    LeaderboardLib.addFriend(friends, caller, friend);
  };

  /// Remove a friend for the caller.
  public shared ({ caller }) func removeFriend(friend : Common.UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can manage friends");
    };
    LeaderboardLib.removeFriend(friends, caller, friend);
  };

  /// Flag a student's leaderboard entry (admin).
  public shared ({ caller }) func adminFlagStudent(student : Common.UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can moderate the leaderboard");
    };
    LeaderboardLib.flagStudent(flagged, student);
  };

  /// Clear a student's leaderboard flag (admin).
  public shared ({ caller }) func adminClearStudentFlag(student : Common.UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can moderate the leaderboard");
    };
    LeaderboardLib.clearFlag(flagged, student);
  };
};
