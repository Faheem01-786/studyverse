import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/themes";
import ProfileTypes "../types/profiles";
import MembershipTypes "../types/membership";
import ThemesLib "../lib/themes";
import MembershipLib "../lib/membership";

mixin (
  accessControlState : AccessControl.AccessControlState,
  themes : Map.Map<Common.Id, Types.Theme>,
  themeState : { var nextThemeId : Nat },
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  subscriptions : Map.Map<Common.UserId, MembershipTypes.Subscription>,
) {
  /// Whether the caller has an active ULTIMATE membership.
  func isUltimate(caller : Common.UserId, now : Common.Timestamp) : Bool {
    let membership = MembershipLib.getMembership(subscriptions, caller, now);
    switch (membership.tier) {
      case (?tier) { membership.active and tier == #ultimate };
      case null { false };
    };
  };

  /// List themes with the caller's unlock and applied state.
  public query ({ caller }) func listThemes() : async [Types.ThemeView] {
    let now = Time.now();
    let appliedThemeId = switch (profiles.get(caller)) {
      case (?profile) { profile.appliedThemeId };
      case null { 0 };
    };
    ThemesLib.listThemes(themes, caller, appliedThemeId, isUltimate(caller, now));
  };

  /// Apply a theme the caller may use.
  public shared ({ caller }) func applyTheme(themeId : Common.Id) : async Types.Theme {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to apply a theme");
    };
    let theme = themes.get(themeId) ?? Runtime.trap("Theme not found");
    if (theme.premium and not isUltimate(caller, Time.now())) {
      Runtime.trap("This premium theme requires an active Ultimate membership");
    };
    ThemesLib.applyTheme(themes, profiles, caller, themeId, true);
  };

  /// Create a theme (admin).
  public shared ({ caller }) func adminCreateTheme(name : Text, description : Text, premium : Bool, cssVariables : Text) : async Types.Theme {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create themes");
    };
    ThemesLib.createTheme(themes, themeState, name, description, premium, cssVariables, Time.now());
  };

  /// Update a theme (admin).
  public shared ({ caller }) func adminUpdateTheme(themeId : Common.Id, name : Text, description : Text, premium : Bool, cssVariables : Text) : async Types.Theme {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update themes");
    };
    ThemesLib.updateTheme(themes, themeId, name, description, premium, cssVariables);
  };

  /// Delete a theme (admin).
  public shared ({ caller }) func adminDeleteTheme(themeId : Common.Id) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete themes");
    };
    ThemesLib.deleteTheme(themes, themeId);
  };
};
