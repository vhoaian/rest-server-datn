import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import path from "path";

class GGAPI {
  private ACCOUNT_GG: { email: string; pass: string } = {
    email: "flashfood1234@gmail.com",
    pass: "Fl@shfood1234",
  };
  private TOKEN_PATH = "./token.json";

  private credentials: any = null;
  private oAuth2Client: any = null;
  private drive: any = null;

  constructor() {
    const pathCredentials = path.join(
      __dirname.replace("/dist", "").replace("\\dist", ""),
      "src",
      "googleAPI",
      "credentials.json"
    );

    this.credentials = JSON.parse(fs.readFileSync(pathCredentials).toString());

    this.oAuth2Client = new google.auth.OAuth2(
      this.credentials.CLIENT_ID,
      this.credentials.CLIENT_SECRET,
      this.credentials.REDIRECT_URLS[0]
    );

    this.oAuth2Client.setCredentials({
      refresh_token: this.credentials.REFRESH_TOKEN,
    });
    this.drive = google.drive({ version: "v3", auth: this.oAuth2Client });
  }

  private getAccessToken() {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.credentials.SCOPES,
    });

    console.log("Authorize this app by visiting this url:", authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      this.oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("Error retrieving access token", err);
        this.oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log("Token stored to", this.TOKEN_PATH);
        });
      });
    });
  }

  private async generatePublicUrl(
    fileId: string | null
  ): Promise<{ webContentLink: string | null; webViewLink: string | null }> {
    try {
      await this.drive.permissions.create({
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
      const result: any = await this.drive.files.get({
        fileId: fileId,
        fields: "webViewLink, webContentLink",
      });
      return result.data;
    } catch (error) {
      console.log(`[UPLOAD_GENERATE_PUBLIC_URL_FAILED]: ${error.message}`);
      return { webContentLink: null, webViewLink: null };
    }
  }

  async uploadFile(file: {
    name: string;
    type: string;
    path: string;
  }): Promise<{ webContentLink: string | null; webViewLink: string | null }> {
    try {
      const response: any = await this.drive.files.create({
        requestBody: {
          name: file.name, //This can be name of your choice
          mimeType: file.type,
        },
        media: {
          mimeType: file.type,
          body: fs.createReadStream(file.path),
        },
      });

      const link = await this.generatePublicUrl(response.data.id);
      console.log(`[UPLOAD]:`, link);

      return link;
    } catch (error) {
      console.log(`[UPLOAD_FAILED]: ${error.message}`);

      const TOKEN_EXPIRED = "invalid_grant";
      if (error.message === TOKEN_EXPIRED) {
        console.log(
          "[GGAPI_FAILED]: Invalid token, please try get new REFRESH TOKEN"
        );

        console.log(
          "[GGAPI_FAILED]: Use this account for get new token:",
          this.ACCOUNT_GG
        );
        this.getAccessToken();
      }

      return { webContentLink: null, webViewLink: null };
    }
  }

  async deleteFile(url: string | null): Promise<boolean> {
    if (!url) return false;

    let fileId: string | null = null;

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
      const response = await this.drive.files.delete({
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
  }
}

const ggAPI = new GGAPI();
export default ggAPI;
