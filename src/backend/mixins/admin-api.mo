import Int "mo:core/Int";
import Map "mo:core/Map";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import Types "../types/admin";
import ProfileTypes "../types/profiles";
import StudyTypes "../types/study";
import StoreTypes "../types/store";
import MembershipTypes "../types/membership";
import LibraryTypes "../types/library";
import QuestTypes "../types/quests";
import AdminLib "../lib/admin";

mixin (
  accessControlState : AccessControl.AccessControlState,
  students : Map.Map<Common.UserId, Types.StudentSummary>,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  sessions : Map.Map<Common.Id, StudyTypes.StudySession>,
  purchases : Map.Map<Common.Id, StoreTypes.Purchase>,
  subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
  resources : Map.Map<Common.Id, LibraryTypes.Resource>,
  quests : Map.Map<Common.Id, QuestTypes.Quest>,
) {
  /// Reject any caller who is not an authorized administrator.
  func requireAdmin(caller : Common.UserId) : () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  /// Platform analytics (admin).
  public query ({ caller }) func adminGetAnalytics() : async Types.PlatformAnalytics {
    requireAdmin(caller);
    let now = Time.now();
    let today = AdminLib.dayKeyOf(now);
    AdminLib.analytics(
      profiles.size(),
      AdminLib.totalStudyMinutes(sessions),
      AdminLib.totalXpAwarded(sessions),
      purchases.size(),
      AdminLib.activeMemberships(subscriptions, now),
      resources.size(),
      quests.size(),
      AdminLib.activeStudentsToday(profiles, today),
    );
  };

  /// List all students (admin).
  public query ({ caller }) func adminListStudents() : async [Types.StudentSummary] {
    requireAdmin(caller);
    let now = Time.now();
    let all = profiles.values().toArray();
    let summaries = all.map(
      func (profile) = AdminLib.toStudentSummary(
        profile,
        AdminLib.activeTierLabel(subscriptions.get(profile.id), now),
      )
    );
    summaries.sort(func (a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  /// Remove a student (admin).
  public shared ({ caller }) func adminRemoveStudent(student : Common.UserId) : async () {
    requireAdmin(caller);
    AdminLib.removeStudent(students, student);
    profiles.remove(student);
    subscriptions.remove(student);
  };
};
