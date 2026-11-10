import Common "common";

module {
  /// The scope of a leaderboard query.
  public type LeaderboardScope = {
    #global;
    #weekly;
    #monthly;
    #friends;
  };

  /// One ranked leaderboard row.
  public type LeaderboardEntry = {
    rank : Nat;
    student : Common.UserId;
    username : Text;
    displayName : Text;
    avatarItemId : ?Common.Id;
    frameItemId : ?Common.Id;
    level : Common.Level;
    xp : Common.Xp;
  };
};
