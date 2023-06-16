$(document).ready(function () {
    /* Global variable declaration */
    let currentUser;
    let listName = "PurchaseRequests";
    let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
    
    /* Fetching current user's information from SharePoint */
    $.ajax({
      url: siteUrl + "/_api/web/currentuser",
      method: "GET",
      headers: {
        "Accept": "application/json; odata=verbose"
      },
      success: function(data) {
        currentUser = data.d.Title;
        console.log('Current user: ' + currentUser);
        populateActivityLog();
      },
      error: function(error) {
        console.error('Request failed. ' + JSON.stringify(error));
      }
    });
    
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
      let card = `
        <div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%">
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
      let username = currentUser;
      let currentUserId = _spPageContextInfo.userId; // Get current user's ID
      let currentItemID = getQueryStringParameter("ID");
      let newCard = createCard("comment", username, comment, timestamp);
      $("#ActivityLog").append(newCard);
      
      $.ajax({
        url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")",
        type: "POST",
        data: JSON.stringify({
          '__metadata': {
            'type': 'SP.Data.' + listName + 'ListItem'
          },
          'HistoryLog': {
            '__metadata': { 'type': 'SP.FieldLookupValue' },
            'LookupId': currentUserId
          },
          'NewComment1': comment,
          'IsSendMessageToRequestor': currentUserId !== currentItemID, // Adjust according to your logic
          'IsSendMessageToAgent': currentUserId === currentItemID // Adjust according to your logic
        }),
        headers: {
          "X-RequestDigest": $("#__REQUESTDIGEST").val(),
          "accept": "application/json;odata=verbose",
          "IF-MATCH": "*",
          "content-type": "application/json;odata=verbose",
          "X-HTTP-Method": "MERGE"
        },
        success: function() {
          console.log('Comment has been added successfully.');
        },
        error: function(error) {
          console.error('Request failed. ' + JSON.stringify(error));
        }
      });
    }
    
    /* Function to get query string parameter */
    function getQueryStringParameter(name) {
      name = name.replace(/[\[\]]/g, '\\$&');
      let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(window.location.href);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
    
    /* Function to populate activity log when page loads */
    function populateActivityLog() {
      let currentItemID = getQueryStringParameter("ID");
      
      $.ajax({
        url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")?$select=HistoryLog,Author/Title&$expand=Author",
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          let commentHistory = data.d.HistoryLog;
          if (commentHistory) {
            let comments = commentHistory.results;
            comments.forEach(function(comment) {
              let user, timestamp, content;
              let userEndIndex = comment.Author.Title.indexOf(' (');
              if (userEndIndex !== -1) {
                user = comment.Author.Title.substring(0, userEndIndex);
              }
              let timestampStartIndex = comment.HistoryLog.indexOf('(');
              let timestampEndIndex = comment.HistoryLog.indexOf(')');
              if (timestampStartIndex !== -1 && timestampEndIndex !== -1) {
                timestamp = comment.HistoryLog.substring(timestampStartIndex + 1, timestampEndIndex);
              }
              let commentStartIndex = comment.HistoryLog.indexOf('):');
              if (commentStartIndex !== -1) {
                content = comment.HistoryLog.substring(commentStartIndex + 2).trim();
              }
              if (user && timestamp && content) {
                let newCard = createCard("comment", user, content, timestamp);
                $("#ActivityLog").prepend(newCard);
              }
            });
          }
        },
        error: function(error) {
          console.error('Request failed. ' + JSON.stringify(error));
        }
      });
    }
    
    /* Binding click event to the comment button */
    $("#addCommentButton").on("click", function () {
      let comment = $(".form-control").val();
      if (comment) {
        addComment(comment);
        $(".form-control").val('');
      }
    });
    
    /* Call populateActivityLog when page loads */
    populateActivityLog();
  });
  
  function clearHistoryLogForAllItems(listName) {
    let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
    
    $.ajax({
      url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items",
      method: "GET",
      headers: {
        "Accept": "application/json; odata=verbose"
      },
      success: function(data) {
        let items = data.d.results;
        let requests = [];
        items.forEach(function(item) {
          let request = $.ajax({
            url: item.__metadata.uri,
            type: "POST",
            data: JSON.stringify({
              '__metadata': { 'type': 'SP.Data.' + listName + 'ListItem' },
              'HistoryLog': ''
            }),
            headers: {
              "X-RequestDigest": $("#__REQUESTDIGEST").val(),
              "accept": "application/json;odata=verbose",
              "IF-MATCH": "*",
              "content-type": "application/json;odata=verbose",
              "X-HTTP-Method": "MERGE"
            }
          });
          requests.push(request);
        });
        
        $.when.apply($, requests).done(function() {
          console.log("HistoryLog cleared for all items successfully.");
        }).fail(function(error) {
          console.error("Request failed. " + JSON.stringify(error));
        });
      },
      error: function(error) {
        console.error('Request failed. ' + JSON.stringify(error));
      }
    });
  }
  