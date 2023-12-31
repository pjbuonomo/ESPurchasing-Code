$(document).ready(function() {
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
      let username = currentUser.get_title();
      let currentUserId = currentUser.get_id();
      let currentItemID = getQueryStringParameter("ID");
      let newCard = createCard("comment", username, comment, timestamp);
      $("#ActivityLog").append(newCard);
  
      $.ajax({
        url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")",
        type: "POST",
        data: JSON.stringify({
          '__metadata': { 'type': 'SP.Data.' + listName + 'ListItem' },
          'HistoryLog': commentHistory ? commentHistory + '\n' + currentUser.get_title() + ' (' + timestamp + '): ' + comment : currentUser.get_title() + ' (' + timestamp + '): ' + comment,
          'NewComment1': comment,
          'CommentingUser1': currentUserId,
          'IsSendMessageToRequestor': currentUserId !== authorId,
          'IsSendMessageToAgent': currentUserId === authorId
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
        url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")?$select=HistoryLog,Author/Id,Author/Title&$expand=Author",
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          let commentHistory = data.d.HistoryLog;
          if (commentHistory) {
            let comments = commentHistory.split('\n');
            comments.forEach(function(comment) {
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
        error: function(error) {
          console.error('Request failed. ' + JSON.stringify(error));
        }
      });
    }
  
    /* Binding click event to the comment button */
    $("#addCommentButton").on("click", function() {
      let comment = $(".form-control").val();
      if (comment) {
        addComment(comment);
        $(".form-control").val('');
      }
    });
  });
  
  
































  $(document).ready(function() { /* Global variable declaration */ let currentUser; let listName = "PurchaseRequests"; let siteUrl = "https://sp.bbh.com/sites/ESPurchasing"; /* Fetching current user's information from SharePoint */ $.ajax({ url: siteUrl + "/_api/web/currentuser", method: "GET", headers: { "Accept": "application/json; odata=verbose" }, success: function(data) { currentUser = data.d.Title; console.log('Current user: ' + currentUser); populateActivityLog(); }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); /* Function to create an activity card */ function createCard(type, user, content, timestamp) { let activityType, activityIcon; switch (type) { case "comment": activityType = "commented"; activityIcon = "circle-user"; break; case "create": activityType = "created this request"; activityIcon = "add"; break; case "modify": activityType = "modified this request"; activityIcon = "pen"; break; } let card = ` <div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%"> <div class="card-body"> <div class="row"> <div class="col-2 px-2"> <div class="activityIcon"> <span><i class="fa-solid fa-${activityIcon}"></i></span> </div> </div> <div class="col-10 textActivityContent"> <div class="row"> <div class="activity-summary"> <b>${user}</b> ${activityType} </div> <div id="ActivityMessageContent" class="activity-msg-content"> ${content} </div> </div> <div class="row"> <div id="ActivityTimeStamp" class="activity-timestamp"> ${timestamp} </div> </div> </div> </div> </div> </div>`; return card; } /* Function to add a new comment */ function addComment(comment) { let timestamp = new Date().toLocaleString(); let currentItemID = getQueryStringParameter("ID"); let newCard = createCard("comment", currentUser, comment, timestamp); $("#ActivityLog").append(newCard); $.ajax({ url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")", type: "POST", data: JSON.stringify({ '__metadata': { 'type': 'SP.Data.' + listName + 'ListItem' }, 'HistoryLog': comment, 'NewComment1': comment, 'CommentingUser1Id': currentUser.Id, 'IsSendMessageToRequestor': currentUser.Id !== currentItemID, // Adjust according to your logic 'IsSendMessageToAgent': currentUser.Id === currentItemID // Adjust according to your logic }), headers: { "X-RequestDigest": $("#__REQUESTDIGEST").val(), "accept": "application/json;odata=verbose", "IF-MATCH": "*", "content-type": "application/json;odata=verbose", "X-HTTP-Method": "MERGE" }, success: function() { console.log('Comment has been added successfully.'); }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); } /* Function to get query string parameter */ function getQueryStringParameter(name) { name = name.replace(/[\[\]]/g, '\\$&'); let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(window.location.href); if (!results) return null; if (!results[2]) return ''; return decodeURIComponent(results[2].replace(/\+/g, ' ')); } /* Function to populate activity log when page loads */ function populateActivityLog() { let currentItemID = getQueryStringParameter("ID"); $.ajax({ url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")", method: "GET", headers: { "Accept": "application/json; odata=verbose" }, success: function(data) { let commentHistory = data.d.HistoryLog; if (commentHistory) { let comments = commentHistory.split('\n'); comments.forEach(function(comment) { let user, timestamp, content; let userEndIndex = comment.indexOf(' ('); if (userEndIndex !== -1) { user = comment.substring(0, userEndIndex); } let timestampStartIndex = comment.indexOf('('); let timestampEndIndex = comment.indexOf(')'); if (timestampStartIndex !== -1 && timestampEndIndex !== -1) { timestamp = comment.substring(timestampStartIndex + 1, timestampEndIndex); } let commentStartIndex = comment.indexOf('):'); if (commentStartIndex !== -1) { content = comment.substring(commentStartIndex + 2).trim(); } if (user && timestamp && content) { let newCard = createCard("comment", user, content, timestamp); $("#ActivityLog").prepend(newCard); } }); } }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); } /* Function to populate activity log when page loads */ function populateActivityLog() { let currentItemID = getQueryStringParameter("ID"); $.ajax({ url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")?$select=HistoryLog,Author/Id,Author/Title&$expand=Author", method: "GET", headers: { "Accept": "application/json; odata=verbose" }, success: function(data) { let commentHistory = data.d.HistoryLog; if (commentHistory) { let comments = commentHistory.split('\n'); comments.forEach(function(comment) { let user, timestamp, content; let userEndIndex = comment.indexOf(' ('); if (userEndIndex !== -1) { user = comment.substring(0, userEndIndex); } let timestampStartIndex = comment.indexOf('('); let timestampEndIndex = comment.indexOf(')'); if (timestampStartIndex !== -1 && timestampEndIndex !== -1) { timestamp = comment.substring(timestampStartIndex + 1, timestampEndIndex); } let commentStartIndex = comment.indexOf('):'); if (commentStartIndex !== -1) { content = comment.substring(commentStartIndex + 2).trim(); } if (user && timestamp && content) { let newCard = createCard("comment", user, content, timestamp); $("#ActivityLog").prepend(newCard); } }); } }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); } /* Binding click event to the comment button */ $("#addCommentButton").on("click", function() { let comment = $(".form-control").val(); if (comment) { addComment(comment); $(".form-control").val(''); } }); });

$(document).ready(function() { /* Global variable declaration */ let currentUser; let listName = "PurchaseRequests"; let siteUrl = "https://sp.bbh.com/sites/ESPurchasing"; /* Fetching current user's information from SharePoint */ $.ajax({ url: siteUrl + "/_api/web/currentuser", method: "GET", headers: { "Accept": "application/json; odata=verbose" }, success: function(data) { currentUser = data.d.Title; console.log('Current user: ' + currentUser); populateActivityLog(); }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); /* Function to create an activity card */ function createCard(type, user, content, timestamp) { let activityType, activityIcon; switch (type) { case "comment": activityType = "commented"; activityIcon = "circle-user"; break; case "create": activityType = "created this request"; activityIcon = "add"; break; case "modify": activityType = "modified this request"; activityIcon = "pen"; break; } let card = `<div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%"> <div class="card-body"> <div class="row"> <div class="col-2 px-2"> <div class="activityIcon"> <span><i class="fa-solid fa-${activityIcon}"></i></span> </div> </div> <div class="col-10 textActivityContent"> <div class="row"> <div class="activity-summary"> <b>${user}</b> ${activityType} </div> <div id="ActivityMessageContent" class="activity-msg-content"> ${content} </div> </div> <div class="row"> <div id="ActivityTimeStamp" class="activity-timestamp"> ${timestamp} </div> </div> </div> </div> </div> </div>`; return card; } /* Function to add a new comment */ function addComment(comment) { let timestamp = new Date().toLocaleString(); let username = currentUser.get_title(); let currentUserId = currentUser.get_id(); let currentItemID = getQueryStringParameter("ID"); let newCard = createCard("comment", username, comment, timestamp); $("#ActivityLog").append(newCard); $.ajax({ url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")", type: "POST", data: JSON.stringify({ '__metadata': { 'type': 'SP.Data.' + listName + 'ListItem' }, 'HistoryLog': commentHistory ? commentHistory + '\n' + currentUser.get_title() + ' (' + timestamp + '): ' + comment : currentUser.get_title() + ' (' + timestamp + '): ' + comment, 'NewComment1': comment, 'CommentingUser1': currentUserId, 'IsSendMessageToRequestor': currentUserId !== authorId, 'IsSendMessageToAgent': currentUserId === authorId }), headers: { "X-RequestDigest": $("#__REQUESTDIGEST").val(), "accept": "application/json;odata=verbose", "IF-MATCH": "*", "content-type": "application/json;odata=verbose", "X-HTTP-Method": "MERGE" }, success: function() { console.log('Comment has been added successfully.'); }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); } /* Function to get query string parameter */ function getQueryStringParameter(name) { name = name.replace(/[\[\]]/g, '\\$&'); let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(window.location.href); if (!results) return null; if (!results[2]) return ''; return decodeURIComponent(results[2].replace(/\+/g, ' ')); } /* Function to populate activity log when page loads */ function populateActivityLog() { let currentItemID = getQueryStringParameter("ID"); $.ajax({ url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")?$select=HistoryLog,Author/Id,Author/Title&$expand=Author", method: "GET", headers: { "Accept": "application/json; odata=verbose" }, success: function(data) { let commentHistory = data.d.HistoryLog; if (commentHistory) { let comments = commentHistory.split('\n'); comments.forEach(function(comment) { let user, timestamp, content; let userEndIndex = comment.indexOf(' ('); if (userEndIndex !== -1) { user = comment.substring(0, userEndIndex); } let timestampStartIndex = comment.indexOf('('); let timestampEndIndex = comment.indexOf(')'); if (timestampStartIndex !== -1 && timestampEndIndex !== -1) { timestamp = comment.substring(timestampStartIndex + 1, timestampEndIndex); } let commentStartIndex = comment.indexOf('):'); if (commentStartIndex !== -1) { content = comment.substring(commentStartIndex + 2).trim(); } if (user && timestamp && content) { let newCard = createCard("comment", user, content, timestamp); $("#ActivityLog").prepend(newCard); } }); } }, error: function(error) { console.error('Request failed. ' + JSON.stringify(error)); } }); } /* Binding click event to the comment button */ $("#addCommentButton").on("click", function() { let comment = $(".form-control").val(); if (comment) { addComment(comment); $(".form-control").val(''); } }); });


$(document).ready(function() { /* Global variable declaration */ let currentUser; let collListItem; /* Fetching current user's information from SharePoint */ $.ajax({ url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/currentUser", method: "GET", headers: { Accept: "application/json; odata=verbose", }, success: function(data) { currentUser = data.d; onQuerySucceeded(); }, error: function(error) { onQueryFailed(error); }, }); /* Function to handle successful user information fetch */ function onQuerySucceeded() { let username = currentUser.Title; console.log("Current user: " + username); } /* Function to handle failed user information fetch */ function onQueryFailed(error) { console.error("Request failed. " + error.statusText); } /* Function to create an activity card */ function createCard(type, user, content, timestamp) { let activityType, activityIcon; switch (type) { case "comment": activityType = "commented"; activityIcon = "circle-user"; break; case "create": activityType = "created this request"; activityIcon = "add"; break; case "modify": activityType = "modified this request"; activityIcon = "pen"; break; } let card = `<div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%"> <div class="card-body"> <div class="row"> <div class="col-2 px-2"> <div class="activityIcon"> <span><i class="fa-solid fa-${activityIcon}"></i></span> </div> </div> <div class="col-10 textActivityContent"> <div class="row"> <div class="activity-summary"> <b>${user}</b> ${activityType} </div> <div id="ActivityMessageContent" class="activity-msg-content"> ${content} </div> </div> <div class="row"> <div id="ActivityTimeStamp" class="activity-timestamp"> ${timestamp} </div> </div> </div> </div> </div> </div>`; return card; } /* Function to add a new comment */ function addComment(comment) { let timestamp = new Date().toLocaleString(); let username = currentUser.Title; let currentUserId = currentUser.Id; // Get current user's ID let currentItemID = getQueryStringParameter("ID"); let newCard = createCard("comment", username, comment, timestamp); $("#ActivityLog").append(newCard); let listName = "PurchaseRequests"; let siteUrl = _spPageContextInfo.webAbsoluteUrl; $.ajax({ url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`, method: "GET", headers: { Accept: "application/json; odata=verbose", }, success: function(data) { let item = data.d; let commentHistory = item.HistoryLog || ""; let authorId = item.AuthorId; commentHistory = commentHistory + (commentHistory ? "\n" : "") + currentUser.Title + " (" + timestamp + "): " + comment; item.HistoryLog = commentHistory; item.NewComment1 = comment; item.CommentingUser1 = currentUserId; if (currentUserId !== authorId) { item.IsSendMessageToRequestor = true; } if (currentUserId === authorId) { item.IsSendMessageToAgent = true; } $.ajax({ url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`, method: "MERGE", headers: { Accept: "application/json;odata=verbose", "Content-Type": "application/json;odata=verbose", "X-RequestDigest": $("#__REQUESTDIGEST").val(), }, data: JSON.stringify(item), success: function() { onUpdateSucceeded(); }, error: function(error) { onQueryFailed(error); }, }); }, error: function(error) { onQueryFailed(error); }, }); } /* Function to get query string parameter */ function getQueryStringParameter(name) { name = name.replace(/[\[\]]/g, "\\$&"); let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(window.location.href); if (!results) return null; if (!results[2]) return ""; return decodeURIComponent(results[2].replace(/\+/g, " ")); } /* Function to populate activity log when page loads */ function populateActivityLog() { let currentItemID = getQueryStringParameter("ID"); let listName = "PurchaseRequests"; let siteUrl = _spPageContextInfo.webAbsoluteUrl; $.ajax({ url: `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${currentItemID})`, method: "GET", headers: { Accept: "application/json; odata=verbose", }, success: function(data) { let item = data.d; let commentHistory = item.HistoryLog; if (commentHistory) { let comments = commentHistory.split("\n"); comments.forEach(function(comment) { let user, timestamp, content; let userEndIndex = comment.indexOf(" ("); if (userEndIndex !== -1) { user = comment.substring(0, userEndIndex); } let timestampStartIndex = comment.indexOf("("); let timestampEndIndex = comment.indexOf(")"); if (timestampStartIndex !== -1 && timestampEndIndex !== -1) { timestamp = comment.substring( timestampStartIndex + 1, timestampEndIndex ); } let commentStartIndex = comment.indexOf("):"); if (commentStartIndex !== -1) { content = comment.substring(commentStartIndex + 2).trim(); } if (user && timestamp && content) { let newCard = createCard("comment", user, content, timestamp); $("#ActivityLog").prepend(newCard); } }); } }, error: function(error) { onQueryFailed(error); }, }); } /* Binding click event to the comment button */ $("#addCommentButton").on("click", function() { let comment = $(".form-control").val(); if (comment) { addComment(comment); $(".form-control").val(""); } }); /* Call populateActivityLog when page loads */ populateActivityLog(); });





