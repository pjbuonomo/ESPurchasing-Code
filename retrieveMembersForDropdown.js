function retrieveGroupMembers() {
  const siteUrl = "https://sp.bbh.com/sites/ESPurchasing";
  const groupId = 7;

  const endpointUrl = `${siteUrl}/_api/web/sitegroups(${groupId})/users`;
  fetch(endpointUrl, {
    headers: {
      Accept: "application/json;odata=verbose",
    },
  })
    .then(response => response.json())
    .then(data => {
      const members = data.d.results.map(member => {
        return {
          name: member.Title,
          userId: member.Id,
        };
      });

      // Populate the dropdown with user display names
      const assignedToDropdown = document.createElement("select");
      assignedToDropdown.id = "assignedToDropdown";
      members.forEach(member => {
        const option = document.createElement("option");
        option.value = member.userId;
        option.text = member.name;
        assignedToDropdown.appendChild(option);
      });

      // Set event listener for the dropdown change
      assignedToDropdown.addEventListener("change", () => {
        const selectedOption = assignedToDropdown.options[assignedToDropdown.selectedIndex];

        // Get the selected option value (user ID) and update the field
        const fieldElement = document.querySelector("span.dataQuickLocate[data-internalName='AssignedTo']");
        fieldElement.innerText = selectedOption.value;
      });

      // Append the dropdown to the desired element
      const fieldContainer = document.querySelector("span.dataQuickLocate[data-internalName='AssignedTo']");
      fieldContainer.appendChild(assignedToDropdown);
    })
    .catch(error => {
      console.log("Error retrieving group members:", error);
    });
}

retrieveGroupMembers();