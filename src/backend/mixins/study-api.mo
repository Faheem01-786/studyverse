import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/study";
import ProfileTypes "../types/profiles";
import QuestTypes "../types/quests";
import MembershipTypes "../types/membership";
import AchievementTypes "../types/achievements";
import StudyLib "../lib/study";
import QuestsLib "../lib/quests";
import ActivityLib "../lib/activity";

mixin (
  accessControlState : AccessControl.AccessControlState,
  sessions : Map.Map<Common.Id, Types.StudySession>,
  sessionState : { var nextSessionId : Nat },
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  goals : Map.Map<Common.UserId, ProfileTypes.StudyGoal>,
  quests : Map.Map<Common.Id, QuestTypes.Quest>,
  questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
  subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
  earnedAchievements : Map.Map<Text, AchievementTypes.EarnedAchievement>,
) {
  /// Fetch a session the caller owns, or trap.
  func requireOwned(
    store : Map.Map<Common.Id, Types.StudySession>,
    caller : Common.UserId,
    sessionId : Common.Id,
  ) : Types.StudySession {
    let session = store.get(sessionId) ?? Runtime.trap("Study session not found");
    if (session.owner != caller) {
      Runtime.trap("Unauthorized: not your study session");
    };
    session;
  };

  /// The caller's study activity for a day, used to derive quest progress.
  func studyContext(caller : Common.UserId, dayKey : Common.DayKey) : QuestsLib.StudyContext {
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

  /// Start a new study session.
  public shared ({ caller }) func startStudySession(subject : Text) : async Types.StudySessionView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to start a study session");
    };
    let session = StudyLib.startSession(sessions, sessionState, caller, subject, Time.now());
    StudyLib.toView(session);
  };

  /// Pause a running session.
  public shared ({ caller }) func pauseStudySession(sessionId : Common.Id) : async Types.StudySessionView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to pause a study session");
    };
    let session = requireOwned(sessions, caller, sessionId);
    if (session.status != #running) {
      Runtime.trap("Session is not running");
    };
    StudyLib.toView(StudyLib.pauseSession(sessions, caller, sessionId, Time.now()));
  };

  /// Resume a paused session.
  public shared ({ caller }) func resumeStudySession(sessionId : Common.Id) : async Types.StudySessionView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to resume a study session");
    };
    let session = requireOwned(sessions, caller, sessionId);
    if (session.status != #paused) {
      Runtime.trap("Session is not paused");
    };
    StudyLib.toView(StudyLib.resumeSession(sessions, caller, sessionId, Time.now()));
  };

  /// Finish a session; XP is derived from server-measured elapsed time,
  /// credited to the profile with the active membership multiplier, and
  /// reflected in the streak, quest progress and achievements.
  public shared ({ caller }) func finishStudySession(sessionId : Common.Id) : async Types.StudySessionView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to finish a study session");
    };
    let session = requireOwned(sessions, caller, sessionId);
    if (session.status == #finished) {
      Runtime.trap("Session already finished");
    };
    let now = Time.now();
    let (finished, minutes) = StudyLib.finishSession(sessions, caller, sessionId, now);
    // Award XP exactly once, derived from server-measured duration only.
    let baseXp = StudyLib.xpForMinutes(minutes);
    let awarded = ActivityLib.creditXp(profiles, subscriptions, caller, baseXp, now);
    let rewarded : Types.StudySession = {
      finished with
      rewardedXp = ?awarded;
    };
    sessions.add(sessionId, rewarded);
    // Streak and daily totals follow the verified study day.
    ActivityLib.updateStreak(goals, caller, rewarded.dayKey);
    // Quest progress derives from real study activity.
    let ctx = studyContext(caller, rewarded.dayKey);
    for (quest in quests.values()) {
      if (quest.active) {
        switch (QuestsLib.derivedProgress(quest.goal, ctx)) {
          case (?progress) {
            if (progress > 0) {
              ignore QuestsLib.setProgress(quests, questProgress, caller, quest.id, progress, rewarded.dayKey);
            };
          };
          case null {};
        };
      };
    };
    // Achievements are evaluated from the updated activity.
    ignore ActivityLib.evaluateAchievements(
      earnedAchievements, profiles, subscriptions, sessions, questProgress, goals, caller, now,
    );
    StudyLib.toView(rewarded);
  };

  /// List the caller's study sessions.
  public query ({ caller }) func listStudySessions() : async [Types.StudySessionView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your sessions");
    };
    StudyLib.listSessions(sessions, caller);
  };

  /// The caller's study report for a day.
  public query ({ caller }) func getDailyReport(dayKey : Common.DayKey) : async Types.StudyReport {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your report");
    };
    StudyLib.dailyReport(sessions, caller, dayKey);
  };

  /// The caller's study report for a week.
  public query ({ caller }) func getWeeklyReport(weekKey : Common.WeekKey) : async Types.StudyReport {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your report");
    };
    StudyLib.weeklyReport(sessions, caller, weekKey);
  };

  /// The caller's per-day totals for a week.
  public query ({ caller }) func getWeekDailyTotals(weekKey : Common.WeekKey) : async [Types.DailyStudyTotal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your report");
    };
    StudyLib.weekDailyTotals(sessions, caller, weekKey);
  };
};
