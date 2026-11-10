import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/profiles";
import StudyTypes "../types/study";
import QuestTypes "../types/quests";
import ProfilesLib "../lib/profiles";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, Types.Profile>,
  goals : Map.Map<Common.UserId, Types.StudyGoal>,
  sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  quests : Map.Map<Common.Id, QuestTypes.Quest>,
  questProgress : Map.Map<Text, QuestTypes.QuestProgress>,
) {
  /// Create the caller's profile on first sign-in.
  public shared ({ caller }) func createProfile(username : Text, displayName : Text) : async Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to create a profile");
    };
    switch (profiles.get(caller)) {
      case (?existing) { existing };
      case null {
        ProfilesLib.createProfile(profiles, goals, caller, username, displayName, Time.now());
      };
    };
  };

  /// Fetch the caller's own profile.
  public query ({ caller }) func getCallerProfile() : async ?Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your profile");
    };
    ProfilesLib.getProfile(profiles, caller);
  };

  /// Fetch any student's public profile.
  public query ({ caller }) func getProfile(student : Common.UserId) : async ?Types.ProfileView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view profiles");
    };
    switch (ProfilesLib.getProfile(profiles, student)) {
      case (?profile) { ?ProfilesLib.toView(profile) };
      case null { null };
    };
  };

  /// Update the caller's profile.
  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text) : async Types.Profile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to update your profile");
    };
    ProfilesLib.updateProfile(profiles, caller, displayName, bio, Time.now());
  };

  /// Set the caller's daily study goal in minutes.
  public shared ({ caller }) func setDailyGoal(dailyGoalMinutes : Nat) : async Types.StudyGoal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to set your study goal");
    };
    ProfilesLib.setDailyGoal(goals, caller, dailyGoalMinutes);
  };

  /// Read the caller's goal and streak state.
  public query ({ caller }) func getGoal() : async Types.StudyGoal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your study goal");
    };
    ProfilesLib.getGoal(goals, caller);
  };

  /// Read the caller's dashboard summary.
  public query ({ caller }) func getDashboard() : async Types.Dashboard {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to view your dashboard");
    };
    ProfilesLib.getDashboard(profiles, goals, sessions, quests, questProgress, caller);
  };
};
