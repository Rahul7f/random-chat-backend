document
  .getElementById("registrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form values
    var name = document.getElementById("name").value;
    var gender = document.getElementById("gender").value;
    var interests = document.getElementById("intrest").value;
    
    window.location.href =
      "/chat?name=" + name + "&gender=" + gender + "&interest=" + interests;

  });
