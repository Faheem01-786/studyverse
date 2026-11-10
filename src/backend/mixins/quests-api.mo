import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/quests";
import ProfileTypes "../types/profiles";
import StudyTypes "../types/study";
import MembershipTypes "../types/membership";
import AchievementTypes "../types/achievements";
import QuestsLib "../lib/quests";
import StudyLib "../lib/study";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  quests : Map.Map<Common.Id, Types.Quest>,
  questProgress : Map.Map<Text, Types.QuestProgress>,
  questState : { var nextQuestId : Nat },
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  goals : Map.Map<Common.UserId, ProfileTypes.StudyGoal>,
  sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
  earnedAchievements : Map.Map<Text, AchievementTypes.EarnedAchievement>,
) {
  /// The caller's study activity for a day, used to derive quest progress.
  func questStudyContext(caller : Common.UserId, dayKey : Common.DayKey) : QuestsLib.StudyContext {
    let minutesToday = StudyLib.minutesOnDay(sessions, caller, dayKey);
    let finishedSessionsToday = sessions.values().filter(
      func(s) = s.owner == caller and s.status == #finished and s.dayKey == dayKey
    ).size();
    let dailyGoalMinutes = switch (goals.get(caller)) {
      case (?g) { g.dailyGoalMinutes };
      case null { 0 };
    };
    { minutesToday; finishedSessionsToday; dailyGoalMinutes };
  };

  /// List today's quests with the caller's progress.
  public query ({ caller }) func listDailyQuests() : async [Types.QuestView] {
    let dayKey = StudyLib.dayKeyOf(Time.now());
    QuestsLib.listQuests(quests, questProgress, caller, dayKey, questStudyContext(caller, dayKey));
  };

  /// Claim a completed quest's XP reward.
  public shared ({ caller }) func claimQuestReward(questId : Common.Id) : async Common.Xp {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return 0;
    };
    let now = Time.now();
    let dayKey = StudyLib.dayKeyOf(now);
    let baseXp = QuestsLib.claimQuest(quests, questProgress, caller, questId, dayKey, questStudyContext(caller, dayKey));
    if (baseXp == 0) {
      return 0;
    };
    let awarded = ActivityLib.creditXp(profiles, subscriptions, caller, baseXp, now);
    ignore ActivityLib.evaluateAchievements(
      earnedAchievements, profiles, subscriptions, sessions, questProgress, goals, caller, now,
    );
    awarded;
  };

  /// Create a quest (admin).
  public shared ({ caller }) func adminCreateQuest(title : Text, description : Text, goal : Types.QuestGoal, xpReward : Common.Xp) : async Types.Quest {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return { id = 0; title = ""; description = ""; goal; xpReward = 0; active = false; createdAt = 0 };
    };
    QuestsLib.createQuest(quests, questState, title, description, goal, xpReward, Time.now());
  };

  /// Update a quest (admin).
  public shared ({ caller }) func adminUpdateQuest(questId : Common.Id, title : Text, description : Text, goal : Types.QuestGoal, xpReward : Common.Xp, active : Bool) : async Types.Quest {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return { id = 0; title = ""; description = ""; goal; xpReward = 0; active = false; createdAt = 0 };
    };
    QuestsLib.updateQuest(quests, questId, title, description, goal, xpReward, active);
  };

  /// Delete a quest (admin).
  public shared ({ caller }) func adminDeleteQuest(questId : Common.Id) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return;
    };
    QuestsLib.deleteQuest(quests, questId);
  };
};
