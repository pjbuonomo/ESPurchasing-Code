function addComment(comment) {
    let timestamp = new Date().toLocaleString();
    let username = currentUser.Title;
    let userData = currentUser;
    console.log(username);
    console.log(userData);
    let currentUserId = currentUser.Id;
    let currentItemID = getQueryStringParameter("ID");
    let newCard = createCard("comment", username, comment, timestamp);
    $("#ActivityLog").append(newCard);
  
    // Retrieve the existing comment history
    let commentHistory = null;
    $.ajax({
      url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")?$select=HistoryLog",
      method: "GET",
      headers: {
        "Accept": "application/json; odata=verbose"
      },
      async: false, // Ensure synchronous execution to get the value before continuing
      success: function (data) {
        commentHistory = data.d.HistoryLog;
      },
      error: function (error) {
        console.error('Request failed. ' + JSON.stringify(error));
      }
    });
  
    // Update the comment history with the new comment
    commentHistory = commentHistory ? commentHistory + '\n' + username + ' (' + timestamp + '): ' + comment : username + ' (' + timestamp + '): ' + comment;
  
    // Update the item with the modified comment history and message flags
    let isSendMessageToRequestor = currentUserId === userData.AuthorId ? true : false;
    let isSendMessageToAgent = currentUserId !== userData.AuthorId ? true : false;
  
    $.ajax({
      url: siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + currentItemID + ")",
      type: "POST",
      data: JSON.stringify({
        '__metadata': { 'type': 'SP.Data.' + listName + 'ListItem' },
        'HistoryLog': commentHistory,
        'NewComment1': comment,
        'CommentingUser1': username,
        'isSendMessageToRequestor': isSendMessageToRequestor,
        'isSendMessageToAgent': isSendMessageToAgent
      }),
      headers: {
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "accept": "application/json;odata=verbose",
        "IF-MATCH": "*",
        "content-type": "application/json;odata=verbose",
        "X-HTTP-Method": "MERGE"
      },
      success: function () {
        console.log('Comment has been added successfully.');
      },
      error: function (error) {
        console.error('Request failed. ' + JSON.stringify(error));
      }
    });
  }  