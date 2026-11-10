import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Common "../types/common";
import ProfileTypes "../types/profiles";
import Types "../types/store";
import ProfilesLib "profiles";

module {
  /// Whether the caller owns an item.
  public func ownsItem(
    purchases : Map.Map<Common.Id, Types.Purchase>,
    caller : Common.UserId,
    itemId : Common.Id,
  ) : Bool {
    purchases.values().any(func(p) = p.owner == caller and p.itemId == itemId);
  };

  /// List active store items with the caller's ownership.
  public func listItems(
    items : Map.Map<Common.Id, Types.StoreItem>,
    purchases : Map.Map<Common.Id, Types.Purchase>,
    caller : Common.UserId,
  ) : [Types.StoreItemView] {
    let views = items.values().filter(func(i) = i.active).map(
      func(i) {
        { item = i; owned = ownsItem(purchases, caller, i.id) };
      }
    ).toArray();
    views.sort(func(a, b) = Nat.compare(a.item.id, b.item.id));
  };

  /// Purchase an item, deducting XP and rejecting duplicates or overdrafts.
  public func purchaseItem(
    items : Map.Map<Common.Id, Types.StoreItem>,
    purchases : Map.Map<Common.Id, Types.Purchase>,
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    state : { var nextPurchaseId : Nat },
    caller : Common.UserId,
    itemId : Common.Id,
    now : Common.Timestamp,
  ) : Types.Purchase {
    let item = items.get(itemId) ?? return ({
      id = 0;
      owner = caller;
      itemId;
      xpSpent = 0;
      purchasedAt = now;
    });
    if (not item.active) {
      return { id = 0; owner = caller; itemId; xpSpent = 0; purchasedAt = now };
    };
    if (ownsItem(purchases, caller, itemId)) {
      return { id = 0; owner = caller; itemId; xpSpent = 0; purchasedAt = now };
    };
    let profile = profiles.get(caller) ?? return ({
      id = 0;
      owner = caller;
      itemId;
      xpSpent = 0;
      purchasedAt = now;
    });
    if (profile.xp < item.xpPrice) {
      return { id = 0; owner = caller; itemId; xpSpent = 0; purchasedAt = now };
    };
    let id = state.nextPurchaseId;
    state.nextPurchaseId := id + 1;
    let purchase : Types.Purchase = {
      id;
      owner = caller;
      itemId;
      xpSpent = item.xpPrice;
      purchasedAt = now;
    };
    purchases.add(id, purchase);
    let newXp = profile.xp - item.xpPrice;
    profiles.add(caller, {
      profile with
      xp = newXp;
      level = ProfilesLib.levelForXp(newXp);
    });
    purchase;
  };

  /// The caller's purchase history, newest first.
  public func purchaseHistory(
    purchases : Map.Map<Common.Id, Types.Purchase>,
    caller : Common.UserId,
  ) : [Types.Purchase] {
    let mine = purchases.values().filter(func(p) = p.owner == caller).toArray();
    mine.sort(func(a, b) = Nat.compare(b.id, a.id));
  };

  /// Create a store item (admin).
  public func createItem(
    items : Map.Map<Common.Id, Types.StoreItem>,
    state : { var nextItemId : Nat },
    name : Text,
    description : Text,
    kind : Types.StoreItemKind,
    xpPrice : Common.Xp,
    now : Common.Timestamp,
  ) : Types.StoreItem {
    let id = state.nextItemId;
    state.nextItemId := id + 1;
    let item : Types.StoreItem = {
      id;
      name;
      description;
      kind;
      xpPrice;
      active = true;
      createdAt = now;
    };
    items.add(id, item);
    item;
  };

  /// Update a store item (admin).
  public func updateItem(
    items : Map.Map<Common.Id, Types.StoreItem>,
    itemId : Common.Id,
    name : Text,
    description : Text,
    kind : Types.StoreItemKind,
    xpPrice : Common.Xp,
    active : Bool,
  ) : Types.StoreItem {
    let existing = items.get(itemId) ?? return ({
      id = itemId;
      name;
      description;
      kind;
      xpPrice;
      active;
      createdAt = 0;
    });
    let updated : Types.StoreItem = {
      existing with
      name;
      description;
      kind;
      xpPrice;
      active;
    };
    items.add(itemId, updated);
    updated;
  };

  /// Delete a store item (admin).
  public func deleteItem(
    items : Map.Map<Common.Id, Types.StoreItem>,
    itemId : Common.Id,
  ) : () {
    items.remove(itemId);
  };
};
