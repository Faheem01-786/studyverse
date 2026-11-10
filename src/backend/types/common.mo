import Principal "mo:core/Principal";

module {
  /// Signed-in student identity.
  public type UserId = Principal;

  /// Nanoseconds since the Unix epoch (Time.now()).
  public type Timestamp = Int;

  /// A calendar day key in UTC, formatted YYYY-MM-DD.
  public type DayKey = Text;

  /// A calendar month key in UTC, formatted YYYY-MM.
  public type MonthKey = Text;

  /// A calendar week key in UTC, formatted YYYY-Www.
  public type WeekKey = Text;

  /// Identifier for a stored entity.
  public type Id = Nat;

  /// A student's progression state.
  public type Level = Nat;

  /// A non-negative XP amount.
  public type Xp = Nat;

  /// A monetary amount in whole Indian rupees.
  public type Rupees = Nat;

  /// A generic operation outcome.
  public type Outcome = {
    #ok;
    #err : Text;
  };
};
