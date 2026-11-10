import Common "common";

module {
  /// Platform-wide analytics for the admin dashboard.
  public type PlatformAnalytics = {
    totalStudents : Nat;
    activeStudentsToday : Nat;
    totalStudyMinutes : Nat;
    totalXpAwarded : Common.Xp;
    totalPurchases : Nat;
    activeMemberships : Nat;
    totalResources : Nat;
    totalQuests : Nat;
  };

  /// A student row for admin management.
  public type StudentSummary = {
    id : Common.UserId;
    username : Text;
    displayName : Text;
    xp : Common.Xp;
    level : Common.Level;
    membershipTier : ?Text;
    createdAt : Common.Timestamp;
  };

  /// An admin action on a leaderboard entry.
  public type ModerationAction = {
    #flag : Common.UserId;
    #clear : Common.UserId;
  };
};
