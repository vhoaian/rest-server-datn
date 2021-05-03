//
var template = ["time", "name", "gender", "address"];
var defaultValue = "None";
var url = `http://2a84adde33a9.ngrok.io`;
var tokenAuth =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.os1jViRPZ5FoxjOiykh_bfzCWHzj3MmAPBnoJoj36Ao";

function triggerUpdate(e) {
  var rows = e.range.getValues()[0];

  var data = template.reduce((prev, curr, index) => {
    prev[`${curr}`] = rows[index] || defaultValue;
    return prev;
  }, {});

  var options = {
    method: "post",
    headers: {
      Authorization: `Bearer ${tokenAuth}`,
    },
    contentType: "application/json",
    payload: JSON.stringify(data),
  };

  const dataResponse = UrlFetchApp.fetch(url, options);
  console.log(dataResponse.getContentText());
}
