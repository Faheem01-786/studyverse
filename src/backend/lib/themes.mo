import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import Types "../types/themes";

module {
  /// List themes with the caller's unlock and applied state.
  public func listThemes(
    themes : Map.Map<Common.Id, Types.Theme>,
    caller : Common.UserId,
    appliedThemeId : Common.Id,
    isUltimate : Bool,
  ) : [Types.ThemeView] {
    ignore caller;
    let views = themes.values().map(
      func(t) {
        {
          theme = t;
          unlocked = (not t.premium) or isUltimate;
          applied = t.id == appliedThemeId;
        };
      }
    ).toArray();
    views.sort(func(a, b) = Nat.compare(a.theme.id, b.theme.id));
  };

  /// Apply a theme the caller is allowed to use.
  public func applyTheme(
    themes : Map.Map<Common.Id, Types.Theme>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    caller : Common.UserId,
    themeId : Common.Id,
    isUltimate : Bool,
  ) : Types.Theme {
    let theme = themes.get(themeId) ?? return ({
      id = 0;
      name = "";
      description = "";
      premium = false;
      cssVariables = "";
      createdAt = 0;
    });
    if (theme.premium and not isUltimate) {
      return { theme with id = 0 };
    };
    switch (profiles.get(caller)) {
      case (?profile) {
        profiles.add(caller, { profile with appliedThemeId = themeId });
      };
      case null {};
    };
    theme;
  };

  /// Create a theme (admin).
  public func createTheme(
    themes : Map.Map<Common.Id, Types.Theme>,
    state : { var nextThemeId : Nat },
    name : Text,
    description : Text,
    premium : Bool,
    cssVariables : Text,
    now : Common.Timestamp,
  ) : Types.Theme {
    let id = state.nextThemeId;
    state.nextThemeId := id + 1;
    let theme : Types.Theme = {
      id;
      name;
      description;
      premium;
      cssVariables;
      createdAt = now;
    };
    themes.add(id, theme);
    theme;
  };

  /// Update a theme (admin).
  public func updateTheme(
    themes : Map.Map<Common.Id, Types.Theme>,
    themeId : Common.Id,
    name : Text,
    description : Text,
    premium : Bool,
    cssVariables : Text,
  ) : Types.Theme {
    let existing = themes.get(themeId) ?? return ({
      id = themeId;
      name;
      description;
      premium;
      cssVariables;
      createdAt = 0;
    });
    let updated : Types.Theme = {
      existing with
      name;
      description;
      premium;
      cssVariables;
    };
    themes.add(themeId, updated);
    updated;
  };

  /// Delete a theme (admin).
  public func deleteTheme(
    themes : Map.Map<Common.Id, Types.Theme>,
    themeId : Common.Id,
  ) : () {
    themes.remove(themeId);
  };
};
