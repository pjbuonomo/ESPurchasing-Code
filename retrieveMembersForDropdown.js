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

      // Create the dropdown and assign options
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
        const inputElement = document.querySelector("span.dataQuickLocate[data-internalName='AssignedTo'] input");
        inputElement.value = selectedOption.value;
      });

      // Append the dropdown to a container element with its own ID
      const dropdownContainer = document.getElementById("dropdownContainer");
      dropdownContainer.appendChild(assignedToDropdown);
    })
    .catch(error => {
      console.log("Error retrieving group members:", error);
    });
}

retrieveGroupMembers();