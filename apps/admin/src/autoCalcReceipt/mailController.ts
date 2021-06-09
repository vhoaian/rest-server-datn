import nodemailer from "nodemailer";
import templateMail from "./templateMail";

class MailController {
  private _transporter: any = null;
  private _MAIL_ADDRESS = "flashfood1234@gmail.com";
  private _MAIL_PASSWORD = "Fl@shfood1234";
  private _TAG = "[FLASHFOOD]";

  constructor() {
    this._transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: this._MAIL_ADDRESS,
        pass: this._MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  public async sendMailLockAccount(
    username: string,
    mailAddress: string
  ): Promise<boolean> {
    const mail = {
      from: this._MAIL_ADDRESS,
      to: mailAddress,
      subject: `${this._TAG}: lock account`,
      text: templateMail.createMailLockAccount(username),
    };

    return this.sendMail(mail);
  }

  private async sendMail(mail: MAIL): Promise<boolean> {
    this.log("send mail...");

    // send mail
    try {
      const res = await this._transporter.sendMail(mail);
      this.log("Send mail success!!");
      return true;
    } catch (e) {
      this.logFail(`Send mail fail, ${e.message}`);
      return false;
    }
  }

  private log(message: string) {
    console.log(`[MAIL]: ${message}`);
  }

  private logFail(message: string) {
    console.log(`[MAIL_FAIL]: ${message}`);
  }
}

const mailController = new MailController();
export default mailController;

interface MAIL {
  from: string;
  to: string;
  subject: string;
  text: string;
}
