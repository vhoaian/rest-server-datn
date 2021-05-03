import { google } from "googleapis";
import fs from "fs";
import readline from "readline";

import credentials from "./credentials";

const oAuth2Client = new google.auth.OAuth2(
  credentials.CLIENT_ID,
  credentials.CLIENT_SECRET,
  credentials.REDIRECT_URLS[0]
);

oAuth2Client.setCredentials({ refresh_token: credentials.REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oAuth2Client });

function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: credentials.SCOPES,
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
    });
  });
}

// const listFiles = async () => {
//   drive.files.list(
//     {
//       pageSize: 10,
//       fields: "nextPageToken, files(id, name)",
//     },
//     (err, res) => {
//       if (err) return console.log("The API returned an error: " + err);
//       const files = res.data.files;
//       if (files.length) {
//         console.log("Files:");
//         files.map((file) => {
//           console.log(file);
//           // console.log(`${file.name} (${file.id})`);
//         });
//       } else {
//         console.log("No files found.");
//       }
//     }
//   );
// };

async function generatePublicUrl(fileId) {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    /* 
    webViewLink: View the file in browser
    webContentLink: Direct download link 
    */
    const result = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink, webContentLink",
    });
    return result.data;
  } catch (error) {
    console.log(`[UPLOAD_GENERATE_PUBLIC_URL_FAILED]: ${error.message}`);
    return { webContentLink: null, webViewLink: null };
  }
}

export const uploadFile = async (file) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: file.name, //This can be name of your choice
        mimeType: file.type,
      },
      media: {
        mimeType: file.type,
        body: fs.createReadStream(file.path),
      },
    });

    console.log(response.data);

    return await generatePublicUrl(response.data.id);
  } catch (error) {
    console.log(`[UPLOAD_FAILED]: ${error.message}`);
    return { webContentLink: null, webViewLink: null };
  }
};

export const deleteFile = async (url) => {
  let fileId = null;

  const LINK1 = {
    head: "https://drive.google.com/uc?id=",
    tail: "&export=download",
  };

  const LINK2 = {
    head: "https://drive.google.com/file/d/",
    tail: "/view?usp=",
  };

  if (url.indexOf(LINK1.head) > -1) {
    fileId = url.slice(LINK1.head.length, url.indexOf(LINK1.tail));
  } else if (url.indexOf(LINK2.head) > -1) {
    fileId = url.slice(LINK2.head.length, url.indexOf(LINK2.tail));
  }

  try {
    const response = await drive.files.delete({
      // @ts-expect-error
      fileId,
    });
    console.log(
      `[DELETE]: success delete file with id ${fileId}, status ${response.status}`
    );
    return true;
  } catch (error) {
    console.log(`[DELETE_FAILED]: ${error.message}`);
    return false;
  }
};
