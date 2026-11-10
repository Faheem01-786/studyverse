import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/hub";
import HubLib "../lib/hub";

mixin (
  accessControlState : AccessControl.AccessControlState,
  links : Map.Map<Common.Id, Types.WebsiteLink>,
  hubState : { var nextLinkId : Nat },
) {
  /// List all website links.
  public query func listWebsiteLinks() : async [Types.WebsiteLink] {
    HubLib.listLinks(links);
  };

  /// Add a website link (admin).
  public shared ({ caller }) func adminAddWebsiteLink(name : Text, description : Text, url : Text, category : Text) : async Types.WebsiteLink {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add website links");
    };
    HubLib.addLink(links, hubState, name, description, url, category, Time.now());
  };

  /// Remove a website link (admin).
  public shared ({ caller }) func adminRemoveWebsiteLink(linkId : Common.Id) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can remove website links");
    };
    HubLib.removeLink(links, linkId);
  };
};
