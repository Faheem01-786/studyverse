import Common "common";

module {
  /// An external educational website shortcut.
  public type WebsiteLink = {
    id : Common.Id;
    name : Text;
    description : Text;
    url : Text;
    category : Text;
    createdAt : Common.Timestamp;
  };
};
