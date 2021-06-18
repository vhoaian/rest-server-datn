import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import path from "path";
import axios from "axios";

interface Coordinate {
  lat: number;
  lng: number;
}

class GGAPI {
  private ACCOUNT_GG: { email: string; pass: string } = {
    email: "flashfood1234@gmail.com",
    pass: "Fl@shfood1234",
  };
  private TOKEN_PATH = "./token.json";

  private credentials: any = null;
  private oAuth2Client: any = null;
  private drive: any = null;

  private _TAG_LOG = "[GG_API]";
  private _TAG_LOG_FAIL = "[GG_API_FAIL]";

  private _TEMPLATE_GOOGLE_DIRECT =
    "https://maps.googleapis.com/maps/api/directions/json?origin=__ORIGIN&destination=__DESTINATION&key=__KEY";

  constructor() {
    const pathCredentials = path.join(
      process.cwd(),
      "libs",
      "google-api",
      "src",
      "lib",
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

    console.log(
      `${this._TAG_LOG}: Authorize this app by visiting this url: ${authUrl}`
    );

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
          console.log(`${this._TAG_LOG}: Token stored to ${this.TOKEN_PATH}`);
        });
      });
    });
  }

  public getFileIDFromURL(url: string | null): string | null {
    if (!url) return null;

    let fileId: string = "";
    const NULL_STRING = "_^^__/**_NULL_STRING_**/__^^_";

    const _TEMPLATE: Array<{
      head: string;
      tail: string;
    }> = [
      {
        head: "https://drive.google.com/uc?id=",
        tail: "&export=download",
      },
      {
        head: "https://drive.google.com/file/d/",
        tail: "/view?usp=",
      },
      {
        head: "https://drive.google.com/open?id=",
        tail: NULL_STRING,
      },
    ];

    _TEMPLATE.forEach((template) => {
      if (url.includes(template.head)) {
        fileId = url.split(template.head)[1];
      }

      if (url.includes(template.tail)) {
        fileId = fileId.split(template.tail)[0];
      }
    });

    return !!fileId ? fileId : null;
  }

  public async generatePublicUrl(
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

      console.log(`${this._TAG_LOG}: generate public url success.`);

      return result.data;
    } catch (error) {
      console.log(
        `${this._TAG_LOG_FAIL}: generate public url fail, ${error.message}`
      );
      return { webContentLink: null, webViewLink: null };
    }
  }

  public async calcDistance(
    origin: string,
    destination: string
  ): Promise<{
    distance: number;
    distanceUnit: "m";
    duration: number;
    durationUnit: "s";
    originAddress: string;
    destinationAddress: string;
    originCoor: Coordinate;
    destinationCoor: Coordinate;
  }> {
    try {
      const _origin = origin.split(" ").join("%20");
      const _destination = destination.split(" ").join("%20");

      // Key TEST
      const LIST_API_KEY = [
        "AIzaSyCgcFxR44eAe0y6tdjymkqRfgUtXN2ceSI",
        this.credentials.API_KEY,
        "AIzaSyBZqajeEV1bxzly92dXxkSy5vxf30ASsRk",
        "AIzaSyBL5NFRIKsim5nZLWf34oVPVw-0Bl_qv-8",
      ];
      const API_KEY = LIST_API_KEY[0];

      const query = unescape(
        encodeURIComponent(
          this._TEMPLATE_GOOGLE_DIRECT
            .replace("__ORIGIN", _origin)
            .replace("__DESTINATION", _destination)
            .replace("__KEY", API_KEY)
        )
      );

      const { data } = await axios.get(`${query}`);

      if (data.status !== "OK") {
        console.log(`${this._TAG_LOG_FAIL}: call google api failed.`);
        console.log(`${this._TAG_LOG_FAIL}: ${data.error_message}.`);
        return {
          distance: 0,
          distanceUnit: "m",
          duration: 0,
          durationUnit: "s",
          originAddress: "",
          destinationAddress: "",
          originCoor: { lat: 0, lng: 0 },
          destinationCoor: { lat: 0, lng: 0 },
        };
      }

      const legs = data.routes[0].legs[0];

      console.log(`${this._TAG_LOG}: calc distance success.`);

      return {
        distance: legs.distance.value,
        distanceUnit: "m",
        duration: legs.duration.value,
        durationUnit: "s",
        originAddress: legs.start_address,
        destinationAddress: legs.end_address,
        originCoor: legs.start_location,
        destinationCoor: legs.end_location,
      };
    } catch (e) {
      console.log(`${this._TAG_LOG_FAIL}: ${e.message}`);
      return {
        distance: 0,
        distanceUnit: "m",
        duration: 0,
        durationUnit: "s",
        originAddress: "",
        destinationAddress: "",
        originCoor: { lat: 0, lng: 0 },
        destinationCoor: { lat: 0, lng: 0 },
      };
    }
  }

  public async uploadFile(file: {
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
      console.log(`${this._TAG_LOG}: upload file success, ${link}`);

      return link;
    } catch (error) {
      console.log(`${this._TAG_LOG_FAIL}: upload file fail, ${error.message}`);

      const TOKEN_EXPIRED = "invalid_grant";
      if (error.message === TOKEN_EXPIRED) {
        console.log(
          `${this._TAG_LOG_FAIL}: Invalid token, please try get new REFRESH TOKEN`
        );

        console.log(
          `${this._TAG_LOG_FAIL}: Use this account for get new token: ${this.ACCOUNT_GG}`
        );
        this.getAccessToken();
      }

      return { webContentLink: null, webViewLink: null };
    }
  }

  public async deleteFile(url: string | null): Promise<boolean> {
    const fileId = this.getFileIDFromURL(url);
    if (!fileId) return false;

    try {
      const response = await this.drive.files.delete({
        fileId,
      });
      console.log(
        `${this._TAG_LOG}: delete file success with id ${fileId}, status ${response.status}`
      );
      return true;
    } catch (error) {
      console.log(`${this._TAG_LOG_FAIL}: delete file fail, ${error.message}`);
      return false;
    }
  }

  public test() {
    console.log("GG_API_TEST_MODE");

    const url =
      "https://drive.google.com/open?id=1bqkNYnvK5_EGFpJhMGXKKyaqM5thMG8r";

    // const fileID = this.getFileIDFromURL(url);
    // this.generatePublicUrl(fileID).then((d) => console.log(d));

    //this.getAccessToken();
  }
}

export const ggAPI = new GGAPI();
