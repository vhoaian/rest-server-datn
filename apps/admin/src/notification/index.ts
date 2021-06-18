import axios from "axios";
import environment from "../environments/base";

export async function pushNotification(notificationID: string): Promise<void> {
  try {
    const body = {
      notificationID,
    };

    await axios.post(`${environment.URL_SOCKET_SERVER}/notification`, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e.message);
  }
}
