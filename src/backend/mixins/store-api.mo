import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/store";
import ProfileTypes "../types/profiles";
import StoreLib "../lib/store";

mixin (
  accessControlState : AccessControl.AccessControlState,
  items : Map.Map<Common.Id, Types.StoreItem>,
  purchases : Map.Map<Common.Id, Types.Purchase>,
  storeState : { var nextItemId : Nat; var nextPurchaseId : Nat },
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
) {
  /// List store items with the caller's ownership.
  public query ({ caller }) func listStoreItems() : async [Types.StoreItemView] {
    StoreLib.listItems(items, purchases, caller);
  };

  /// Purchase an item with XP.
  public shared ({ caller }) func purchaseStoreItem(itemId : Common.Id) : async Types.Purchase {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: sign in to purchase items");
    };
    let item = items.get(itemId) ?? Runtime.trap("Store item not found");
    if (not item.active) {
      Runtime.trap("Store item is not available");
    };
    if (StoreLib.ownsItem(purchases, caller, itemId)) {
      Runtime.trap("You already own this item");
    };
    let profile = profiles.get(caller) ?? Runtime.trap("Create your profile before purchasing");
    if (profile.xp < item.xpPrice) {
      Runtime.trap("Not enough XP to purchase this item");
    };
    StoreLib.purchaseItem(items, purchases, profiles, storeState, caller, itemId, Time.now());
  };

  /// The caller's purchase history.
  public query ({ caller }) func getPurchaseHistory() : async [Types.Purchase] {
    StoreLib.purchaseHistory(purchases, caller);
  };

  /// Create a store item (admin).
  public shared ({ caller }) func adminCreateStoreItem(name : Text, description : Text, kind : Types.StoreItemKind, xpPrice : Common.Xp) : async Types.StoreItem {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create store items");
    };
    StoreLib.createItem(items, storeState, name, description, kind, xpPrice, Time.now());
  };

  /// Update a store item (admin).
  public shared ({ caller }) func adminUpdateStoreItem(itemId : Common.Id, name : Text, description : Text, kind : Types.StoreItemKind, xpPrice : Common.Xp, active : Bool) : async Types.StoreItem {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update store items");
    };
    StoreLib.updateItem(items, itemId, name, description, kind, xpPrice, active);
  };

  /// Delete a store item (admin).
  public shared ({ caller }) func adminDeleteStoreItem(itemId : Common.Id) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete store items");
    };
    StoreLib.deleteItem(items, itemId);
  };
};
