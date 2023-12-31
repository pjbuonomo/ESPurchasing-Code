$(document).ready(function () {
    /* Global variable declaration */
    let currentUser;
    let collListItem;
  
    /* Fetching current user's information from SharePoint */
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
      let context = new SP.ClientContext.get_current();
      let web = context.get_web();
      currentUser = web.get_currentUser();
      currentUser.retrieve();
      context.load(web);
      context.executeQueryAsync(onQuerySucceeded, onQueryFailed);
    });
  
    /* Function to handle successful user information fetch */
    function onQuerySucceeded() {
      let username = currentUser.get_title();
      console.log('Current user: ' + username);
    }
  
    /* Function to handle failed user information fetch */
    function onQueryFailed(sender, args) {
      console.error('Request failed. ' + args.get_message());
    }
  
    /* Function to create an activity card */
    function createCard(type, user, content, timestamp) {
      let activityType, activityIcon;
      switch (type) {
        case "comment":
          activityType = "commented";
          activityIcon = "fa-circle-user";
          break;
        case "create":
          activityType = "created this request";
          activityIcon = "fa-add";
          break;
        case "modify":
          activityType = "modified this request";
          activityIcon = "fa-pen";
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
      let timestamp = new Date();
      let username = currentUser.get_title();
      let currentUserId = currentUser.get_id(); // Get current user's ID
      let currentItemID = getQueryStringParameter("ID");
      let newCard = createCard("comment", username, comment, timestamp);
      $("#ActivityLog").append(newCard);
  
      let listName = "PurchaseRequests";
      let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
      let clientContext = new SP.ClientContext(siteUrl);
      let oList = clientContext.get_web().get_lists().getByTitle(listName);
      let camlQuery = new SP.CamlQuery();
      camlQuery.set_viewXml(`<View><Query><Where><Eq><FieldRef Name='ID'/><Value Type='Counter'>${currentItemID}</Value></Eq></Where></Query></View>`);
      collListItem = oList.getItems(camlQuery);
      clientContext.load(collListItem);
      clientContext.executeQueryAsync(
        Function.createDelegate(this, onQuerySucceeded),
        Function.createDelegate(this, onQueryFailed)
      );
  
      function onQuerySucceeded(sender, args) {
        let listItemEnumerator = collListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
          let oListItem = listItemEnumerator.get_current();
          let commentHistory = oListItem.get_item('HistoryLog');
          let authorId = oListItem.get_item('Author').get_lookupId(); // Get author's ID
          commentHistory = commentHistory ? commentHistory + '\n' + currentUser.get_title() + ': ' + comment : currentUser.get_title() + ': ' + comment;
          oListItem.set_item('HistoryLog', commentHistory);
          oListItem.set_item('NewComment1', comment); // Update NewComment1 field
          oListItem.set_item('CommentingUser1', currentUserId);
          if (currentUserId != authorId) {
            // Check if current user is not the author
            oListItem.set_item('IsSendMessageToRequestor', true); // Set IsSendMessageToRequestor to Yes
          }
          oListItem.update();
        }
        clientContext.executeQueryAsync(
          Function.createDelegate(this, onUpdateSucceeded),
          Function.createDelegate(this, onQueryFailed)
        );
      }
  
      function onUpdateSucceeded() {
        console.log('Comment has been added successfully.');
      }
  
      function onQueryFailed(sender, args) {
        console.error('Request failed. ' + args.get_message());
      }
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
      let listName = "PurchaseRequests";
      let siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
      let clientContext = new SP.ClientContext(siteUrl);
      let oList = clientContext.get_web().get_lists().getByTitle(listName);
      let camlQuery = new SP.CamlQuery();
      camlQuery.set_viewXml(`<View><Query><Where><Eq><FieldRef Name='ID'/><Value Type='Counter'>${currentItemID}</Value></Eq></Where></Query></View>`);
      collListItem = oList.getItems(camlQuery);
      clientContext.load(collListItem);
      clientContext.executeQueryAsync(
        Function.createDelegate(this, onQuerySucceeded),
        Function.createDelegate(this, onQueryFailed)
      );
  
      function onQuerySucceeded(sender, args) {
        let listItemEnumerator = collListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
          let oListItem = listItemEnumerator.get_current();
          let commentHistory = oListItem.get_item('HistoryLog');
          if (commentHistory) {
            let comments = commentHistory.split('\n');
            comments.forEach(function (comment) {
              let splitIndex = comment.indexOf(':');
              let user = comment.substring(0, splitIndex);
              let content = comment.substring(splitIndex + 1);
              let newCard = createCard("comment", user, content, '');
              $("#ActivityLog").append(newCard);
            });
          }
        }
      }
  
      function onQueryFailed(sender, args) {
        console.error('Request failed. ' + args.get_message());
      }
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
    let clientContext = new SP.ClientContext(siteUrl);
    let oList = clientContext.get_web().get_lists().getByTitle(listName);
    let camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml("<View><Query></Query></View>");
    let collListItem = oList.getItems(camlQuery);
    clientContext.load(collListItem);
    clientContext.executeQueryAsync(onQuerySucceeded, onQueryFailed);
  
    function onQuerySucceeded() {
      let listItemEnumerator = collListItem.getEnumerator();
      while (listItemEnumerator.moveNext()) {
        let listItem = listItemEnumerator.get_current();
        listItem.set_item("HistoryLog", "");
        listItem.update();
      }
      clientContext.executeQueryAsync(onUpdateSucceeded, onQueryFailed);
    }
  
    function onUpdateSucceeded() {
      console.log("HistoryLog cleared for all items successfully.");
    }
  
    function onQueryFailed(sender, args) {
      console.error("Request failed. " + args.get_message());
    }
  }
  
  $(document).ready(function () { /* Global variable declaration */ let currentUser; let collListItem; /* Fetching current user's information from SharePoint */ SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () { let context = new SP.ClientContext.get_current(); let web = context.get_web(); currentUser = web.get_currentUser(); currentUser.retrieve(); context.load(web); context.executeQueryAsync(onQuerySucceeded, onQueryFailed); }); /* Function to handle successful user information fetch */ function onQuerySucceeded() { let username = currentUser.get_title(); console.log('Current user: ' + username); } /* Function to handle failed user information fetch */ function onQueryFailed(sender, args) { console.error('Request failed. ' + args.get_message()); } /* Function to create an activity card */ function createCard(type, user, content, timestamp) { let activityType, activityIcon; switch (type) { case "comment": activityType = "commented"; activityIcon = "circle-user"; break; case "create": activityType = "created this request"; activityIcon = "add"; break; case "modify": activityType = "modified this request"; activityIcon = "pen"; break; } let card = `<div class="card border-0 activityItemCard ${type}Card my-2 p-1" style="width: 100%"> <div class="card-body"> <div class="row"> <div class="col-2 px-2"> <div class="activityIcon"> <span><i class="fa-solid fa-${activityIcon}"></i></span> </div> </div> <div class="col-10 textActivityContent"> <div class="row"> <div class="activity-summary"> <b>${user}</b> ${activityType} </div> <div id="ActivityMessageContent" class="activity-msg-content"> ${content} </div> </div> <div class="row"> <div id="ActivityTimeStamp" class="activity-timestamp"> ${timestamp} </div> </div> </div> </div> </div> </div>`; return card; } /* Function to add a new comment */ function addComment(comment) { let timestamp = new Date().toLocaleString(); let username = currentUser.get_title(); let currentUserId = currentUser.get_id(); // Get current user's ID let currentItemID = getQueryStringParameter("ID"); let newCard = createCard("comment", username, comment, timestamp); $("#ActivityLog").append(newCard); let listName = "PurchaseRequests"; let siteUrl = "https://sp.bbh.com/sites/ESPurchasing"; let clientContext = new SP.ClientContext(siteUrl); let oList = clientContext.get_web().get_lists().getByTitle(listName); let camlQuery = new SP.CamlQuery(); camlQuery.set_viewXml(`<View><Query><Where><Eq><FieldRef Name='ID'/><Value Type='Counter'>${currentItemID}</Value></Eq></Where></Query></View>`); collListItem = oList.getItems(camlQuery); clientContext.load(collListItem); clientContext.executeQueryAsync( Function.createDelegate(this, onQuerySucceeded), Function.createDelegate(this, onQueryFailed) ); function onQuerySucceeded(sender, args) { let listItemEnumerator = collListItem.getEnumerator(); let timestamp = new Date().toLocaleString(); while (listItemEnumerator.moveNext()) { let oListItem = listItemEnumerator.get_current(); let commentHistory = oListItem.get_item('HistoryLog'); let authorId = oListItem.get_item('Author').get_lookupId(); // Get author's ID commentHistory = commentHistory ? commentHistory + '\n' + currentUser.get_title() + ' (' + timestamp + '): ' + comment: currentUser.get_title() + ' (' + timestamp + '): ' + comment; oListItem.set_item('HistoryLog', commentHistory); oListItem.set_item('NewComment1', comment); // Update NewComment1 field oListItem.set_item('CommentingUser1', currentUserId); if (currentUserId != authorId) { // Check if current user is not the author oListItem.set_item('IsSendMessageToRequestor', true); // Set IsSendMessageToRequestor to Yes } if (currentUserId === authorId) { // Check if current user is not the author oListItem.set_item('IsSendMessageToAgent', true); // Set IsSendMessageToAgent to Yes } oListItem.update(); } clientContext.executeQueryAsync( Function.createDelegate(this, onUpdateSucceeded), Function.createDelegate(this, onQueryFailed) ); } function onUpdateSucceeded() { console.log('Comment has been added successfully.'); } function onQueryFailed(sender, args) { console.error('Request failed. ' + args.get_message()); } } /* Function to get query string parameter */ function getQueryStringParameter(name) { name = name.replace(/[\[\]]/g, '\\$&'); let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(window.location.href); if (!results) return null; if (!results[2]) return ''; return decodeURIComponent(results[2].replace(/\+/g, ' ')); } /* Function to populate activity log when page loads */ function populateActivityLog() { let currentItemID = getQueryStringParameter("ID"); let listName = "PurchaseRequests"; let siteUrl = "https://sp.bbh.com/sites/ESPurchasing"; let clientContext = new SP.ClientContext(siteUrl); let oList = clientContext.get_web().get_lists().getByTitle(listName); let camlQuery = new SP.CamlQuery(); camlQuery.set_viewXml(`<View><Query><Where><Eq><FieldRef Name='ID'/><Value Type='Counter'>${currentItemID}</Value></Eq></Where></Query></View>`); collListItem = oList.getItems(camlQuery); clientContext.load(collListItem); clientContext.executeQueryAsync( Function.createDelegate(this, onQuerySucceeded), Function.createDelegate(this, onQueryFailed) ); function onQuerySucceeded(sender, args) { let listItemEnumerator = collListItem.getEnumerator(); while (listItemEnumerator.moveNext()) { let oListItem = listItemEnumerator.get_current(); let commentHistory = oListItem.get_item('HistoryLog'); if (commentHistory) { let comments = commentHistory.split('\n'); comments.forEach(function(comment) { let user, timestamp, content; let userEndIndex = comment.indexOf(' ('); if (userEndIndex !== -1) { user = comment.substring(0, userEndIndex); } let timestampStartIndex = comment.indexOf('('); let timestampEndIndex = comment.indexOf(')'); if (timestampStartIndex !== -1 && timestampEndIndex !== -1) { timestamp = comment.substring(timestampStartIndex + 1, timestampEndIndex); } let commentStartIndex = comment.indexOf('):'); if (commentStartIndex !== -1) { content = comment.substring(commentStartIndex + 2).trim(); } if (user && timestamp && content) { let newCard = createCard("comment", user, content, timestamp); $("#ActivityLog").append(newCard); } }); } } } function onQueryFailed(sender, args) { console.error('Request failed. ' + args.get_message()); } } /* Binding click event to the comment button */ $("#addCommentButton").on("click", function () { let comment = $(".form-control").val(); if (comment) { addComment(comment); $(".form-control").val(''); } }); /* Call populateActivityLog when page loads */ populateActivityLog(); }); function clearHistoryLogForAllItems(listName) { let siteUrl = "https://sp.bbh.com/sites/ESPurchasing"; let clientContext = new SP.ClientContext(siteUrl); let oList = clientContext.get_web().get_lists().getByTitle(listName); let camlQuery = new SP.CamlQuery(); camlQuery.set_viewXml("<View><Query></Query></View>"); let collListItem = oList.getItems(camlQuery); clientContext.load(collListItem); clientContext.executeQueryAsync(onQuerySucceeded, onQueryFailed); function onQuerySucceeded() { let listItemEnumerator = collListItem.getEnumerator(); while (listItemEnumerator.moveNext()) { let listItem = listItemEnumerator.get_current(); listItem.set_item("HistoryLog", ""); listItem.update(); } clientContext.executeQueryAsync(onUpdateSucceeded, onQueryFailed); } function onUpdateSucceeded() { console.log("HistoryLog cleared for all items successfully."); } function onQueryFailed(sender, args) { console.error("Request failed. " + args.get_message()); } }