const showMessageAuth = (data) => {
  if (!document.getElementById("msg-id")) {
    return;
  }

  document.getElementById("msg-id").innerText = data.message;

  setTimeout(() => {
    document.getElementById("msg-id").innerText = "";
  }, 10000);
};

const register = async () => {
  const form = document.getElementById("signin-form-id");
  const formData = new FormData(form);
  const formDataJson = {};

  for (const [key, value] of formData) {
    formDataJson[key] = value;
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formDataJson),
  };

  try {
    const res = await fetch(`/api/users/register`, options);
    const data = await res.json();

    if (data.status === 400 || data.status === 500) {
      showMessageAuth(data);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = data.url;
  } catch (err) {
    console.log(err);
  }
};

const signin = async () => {
  const form = document.getElementById("signin-form-id");
  const formData = new FormData(form);
  const formDataJson = {};

  for (const [key, value] of formData) {
    formDataJson[key] = value;
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formDataJson),
  };

  try {
    const res = await fetch(`/api/users/signin`, options);
    const data = await res.json();

    if (data.status === 400 || data.status === 500) {
      showMessageAuth(data);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = data.url;
  } catch (err) {
    console.log(err);
  }
};

const signout = async () => {
  try {
    const res = await fetch(`/api/users/signout`);
    const data = await res.json();

    localStorage.removeItem("user");
    window.location.href = data.url;
  } catch (err) {
    console.log(err);
  }
};
