onmessage = async function (message) {
  let headers = new Headers();
  const fileNumber = message.data.fileNumber;
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Origin", "http://localhost:3000");

  const response = await fetch("http://localhost:3000/puntos/" + fileNumber, {
    method: "GET",
    headers: headers,
  }).then((response) => response.json());

  this.postMessage(response);
};
