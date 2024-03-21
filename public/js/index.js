document
  .getElementById("registrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form values
    var name = document.getElementById("name").value;
    var gender = document.getElementById("gender").value;
    var interest = document.getElementById("interest").value;

    const userData = { name: name, gender: gender, interest: interest };
    const userDataString = JSON.stringify(userData);
    localStorage.setItem("userdata", userDataString);    
    window.location.href = "/chat";
  });
