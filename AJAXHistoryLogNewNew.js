$(document).ready(function() {
    /* Global variable declaration */
    let currentUser;
    let collListItem;
  
    /* Fetching current user's information from SharePoint */
    $.ajax({
      url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/currentUser",
      method: "GET",
      headers: {
        Accept: "application/json; odata=verbose",
      },
      success: function(data) {
        currentUser = data.d;
        onQuerySucceeded();
      },
      error: function(error) {
        onQueryFailed(error);
      },
    });
  
    /* Function to handle successful user information fetch */
    function onQuerySucceeded() {
      let username = currentUser.Title;
      console.log("Current user: " + username);
    }
  
    /* Function to handle failed user information fetch */
    function onQueryFailed(error) {
      console.error("Request failed. " + error.statusText);
    }
  
    /* Function to create an activity card */
    function createCard(type, user, content, timestamp) {
      let activityType, activityIcon;
      switch (type) {
        case "comment":
          activityType = "commented";
          activityIcon = "circle-user";
          break;
        case "create":
          activityType = "created this request";
          activityIcon = "add";
          break;
        case "modify":
          activityType = "modified this request";
          activityIcon = "pen";
          break;
      }
  
      let card = `<div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%">
        <div class="card-body">
          <div class="row">
            <div class="col-2 px-2">
              <div class="activityIcon">
                <span><i class="fa-solid fa-${activityIcon}"></i></span>
              </div>
            </div>
            <div class="col-10 textActivityContent">
              <div class="row">
                <div class="activity-summary">
                  <b>${user}</b> ${activityType}
                </div>
                <div id="ActivityMessageContent" class="activity-msg-content">
                  ${content}
                </div>
              </div>
              <div class="row">
                <div id="ActivityTimeStamp" class="activity-timestamp">
                  ${timestamp}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  
      return card;
    }
  
    /* Function to add a new comment */
    function addComment(comment) {
      let timestamp = new Date().toLocaleString();
      let username = currentUser.Title;
      let currentUserId = currentUser.Id;
  
      // Get current user's ID
      let currentItemID = getQueryStringParameter("ID");
      let newCard = createCard("comment", username, comment, timestamp);
      $("#ActivityLog").append(newCard);
  
      let listName = "PurchaseRequests";
      let siteUrl = _spPageContextInfo.webAbsoluteUrl;
  
      $.ajax({
        url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`,
        method: "GET",
        headers: {
          Accept: "application/json; odata=verbose",
          "Content-Type": "application/json; odata=verbose",
          "X-HTTP-Method": "MERGE",
          "IF-MATCH": "*",
        },
        success: function(data) {
          let item = data.d;
          let commentHistory = item.HistoryLog || "";
          let authorId = item.AuthorId;
  
          commentHistory =
            commentHistory +
            (commentHistory ? "\n" : "") +
            currentUser.Title +
            " (" +
            timestamp +
            "): " +
            comment;
  
          item.HistoryLog = commentHistory;
          item.NewComment1 = comment;
          item.CommentingUser1 = currentUserId;
  
          if (currentUserId !== authorId) {
            item.IsSendMessageToRequestor = true;
          }
  
          if (currentUserId === authorId) {
            item.IsSendMessageToAgent = true;
          }
  
          $.ajax({
            url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`,
            method: "POST",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "MERGE",
                "If-Match": "*"
            },
            data: JSON.stringify(item),
            success: function() {
              onUpdateSucceeded();
            },
            error: function(error) {
              onQueryFailed(error);
            },
          });
        },
        error: function(error) {
          onQueryFailed(error);
        },
      });
    }
  
    /* Function to get query string parameter */
    function getQueryStringParameter(name) {
      name = name.replace(/[\[\]]/g, "\\$&");
      let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
      if (!results) return null;
      if (!results[2]) return "";
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
  
    /* Function to populate activity log when page loads */
    function populateActivityLog() {
      let currentItemID = getQueryStringParameter("ID");
      let listName = "PurchaseRequests";
      let siteUrl = _spPageContextInfo.webAbsoluteUrl;
  
      $.ajax({
        url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`,
        method: "GET",
        headers: {
          Accept: "application/json; odata=verbose",
        },
        success: function(data) {
          let item = data.d;
          let commentHistory = item.HistoryLog;
  
          if (commentHistory) {
            let comments = commentHistory.split("\n");
  
            comments.forEach(function(comment) {
              let user, timestamp, content;
              let userEndIndex = comment.indexOf(" (");
  
              if (userEndIndex !== -1) {
                user = comment.substring(0, userEndIndex);
              }
  
              let timestampStartIndex = comment.indexOf("(");
              let timestampEndIndex = comment.indexOf(")");
  
              if (timestampStartIndex !== -1 && timestampEndIndex !== -1) {
                timestamp = comment.substring(
                  timestampStartIndex + 1,
                  timestampEndIndex
                );
              }
  
              let commentStartIndex = comment.indexOf("):");
  
              if (commentStartIndex !== -1) {
                content = comment.substring(commentStartIndex + 2).trim();
              }
  
              if (user && timestamp && content) {
                let newCard = createCard("comment", user, content, timestamp);
                $("#ActivityLog").prepend(newCard);
              }
            });
          }
        },
        error: function(error) {
          onQueryFailed(error);
        },
      });
    }
  
    /* Binding click event to the comment button */
    $("#addCommentButton").on("click", function() {
      let comment = $(".form-control").val();
      if (comment) {
        addComment(comment);
        $(".form-control").val("");
      }
    });
  
    /* Call populateActivityLog when page loads */
    populateActivityLog();
  });