import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/hub";

module {
  /// List all website links.
  public func listLinks(
    links : Map.Map<Common.Id, Types.WebsiteLink>,
  ) : [Types.WebsiteLink] {
    links.values().toArray();
  };

  /// Add a website link (admin).
  public func addLink(
    links : Map.Map<Common.Id, Types.WebsiteLink>,
    state : { var nextLinkId : Nat },
    name : Text,
    description : Text,
    url : Text,
    category : Text,
    now : Common.Timestamp,
  ) : Types.WebsiteLink {
    let id = state.nextLinkId;
    state.nextLinkId := id + 1;
    let link : Types.WebsiteLink = {
      id;
      name;
      description;
      url;
      category;
      createdAt = now;
    };
    links.add(id, link);
    link;
  };

  /// Remove a website link (admin).
  public func removeLink(
    links : Map.Map<Common.Id, Types.WebsiteLink>,
    linkId : Common.Id,
  ) : () {
    links.remove(linkId);
  };
};
