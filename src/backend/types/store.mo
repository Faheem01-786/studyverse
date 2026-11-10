import Common "common";

module {
  /// The kind of reward an XP store item grants.
  public type StoreItemKind = {
    #resource;
    #badge;
    #avatar;
    #frame;
    #dashboardTheme;
    #digitalReward;
  };

  /// An XP store product.
  public type StoreItem = {
    id : Common.Id;
    name : Text;
    description : Text;
    kind : StoreItemKind;
    xpPrice : Common.Xp;
    active : Bool;
    createdAt : Common.Timestamp;
  };

  /// A completed purchase.
  public type Purchase = {
    id : Common.Id;
    owner : Common.UserId;
    itemId : Common.Id;
    xpSpent : Common.Xp;
    purchasedAt : Common.Timestamp;
  };

  /// A store item plus whether the caller owns it.
  public type StoreItemView = {
    item : StoreItem;
    owned : Bool;
  };
};
