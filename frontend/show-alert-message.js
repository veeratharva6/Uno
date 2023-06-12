export const showMessage = (message) => {
  if (!document.getElementById("msg-id")) {
    return;
  }

  document.getElementById("msg-id").innerText = message;

  setTimeout(() => {
    document.getElementById("msg-id").innerText = "";
  }, 10000);
};
