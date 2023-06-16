$(document).ready(function () {
  let currentUser;
  let collListItem;

  $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/currentuser",
    type: "GET",
    headers: { "Accept": "application/json;odata=verbose" },
    success: function (data) {
      currentUser = data.d;
      console.log('Current user: ' + currentUser.Title);
    },
    error: function (data) {
      console.error('Request failed. ' + data.responseJSON.error);
    }
  });

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

  function addComment(comment) {
    let timestamp = new Date().toLocaleString();
    let username = currentUser.Title;
    let currentUserId = currentUser.Id;
    let currentItemID = getQueryStringParameter("ID");
    let newCard = createCard("comment", username, comment, timestamp);
    $("#ActivityLog").append(newCard);

    let listName = "PurchaseRequests";
    let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";

    $.ajax({
      url: siteUrl + "/_api/web/lists/getbytitle('" + listName + "')/items(" + currentItemID + ")",
      type: "POST",
      data: JSON.stringify({
        '__metadata': { 'type': 'SP.Data.PurchaseRequestsListItem' },
        'HistoryLog': comment,
        'NewComment1': comment,
        'CommentingUser1Id': currentUserId
      }),
      headers: {
        "Accept": "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "X-HTTP-Method": "MERGE",
        "If-Match": "*"
      },
      success: function (data) {
        console.log('Comment has been added successfully.');
      },
      error: function (data) {
        console.error('Request failed. ' + data.responseJSON.error);
      }
    });
  }

  function getQueryStringParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    let results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  function populateActivityLog() {
    let currentItemID = getQueryStringParameter("ID");
    let listName = "PurchaseRequests";
    let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
  
    $.ajax({
      url: `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${currentItemID})/FieldValuesAsText`,
      type: "GET",
      headers: { "Accept": "application/json;odata=verbose" },
      success: function (data) {
        let commentHistory = data.d.HistoryLog;
        if (commentHistory) {
          let comments = commentHistory.split('\n');
          comments.forEach(function (comment) {
            let user, timestamp, content;
            let userEndIndex = comment.indexOf(' (');
            if (userEndIndex !== -1) {
              user = comment.substring(0, userEndIndex);
            }
            let timestampStartIndex = comment.indexOf('(');
            let timestampEndIndex = comment.indexOf(')');
            if (timestampStartIndex !== -1 && timestampEndIndex !== -1) {
              timestamp = comment.substring(timestampStartIndex + 1, timestampEndIndex);
            }
            let commentStartIndex = comment.indexOf('):');
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
      error: function (data) {
        console.error('Request failed. ' + data.responseJSON.error);
      }
    });
  }
  

  $("#addCommentButton").on("click", function () {
    let comment = $(".form-control").val();
    if (comment) {
      addComment(comment);
      $(".form-control").val('');
    }
  });

  populateActivityLog();
});