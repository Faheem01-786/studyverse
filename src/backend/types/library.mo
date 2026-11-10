import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// A study library resource.
  public type Resource = {
    id : Common.Id;
    title : Text;
    description : Text;
    category : Text;
    subject : Text;
    classLevel : Text;
    board : Text;
    file : Storage.ExternalBlob;
    fileName : Text;
    downloadCount : Nat;
    createdAt : Common.Timestamp;
  };

  /// A shared projection of a library resource.
  public type ResourceView = {
    id : Common.Id;
    title : Text;
    description : Text;
    category : Text;
    subject : Text;
    classLevel : Text;
    board : Text;
    file : Storage.ExternalBlob;
    fileName : Text;
    downloadCount : Nat;
    createdAt : Common.Timestamp;
  };

  /// A search/filter request over the library.
  public type ResourceFilter = {
    searchTerm : ?Text;
    category : ?Text;
    subject : ?Text;
    classLevel : ?Text;
    board : ?Text;
  };
};
