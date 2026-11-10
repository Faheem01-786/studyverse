import Common "common";

module {
  /// A dashboard theme definition.
  public type Theme = {
    id : Common.Id;
    name : Text;
    description : Text;
    premium : Bool;
    cssVariables : Text;
    createdAt : Common.Timestamp;
  };

  /// A theme plus whether the caller may apply it.
  public type ThemeView = {
    theme : Theme;
    unlocked : Bool;
    applied : Bool;
  };
};
