import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { TAG_EVENT } from "../../TAG_EVENT";
import merchantController from "./merchantController";

// Confir for merchant
const merchantConfig = (io, socket) => {
  merchantController.addMerchant(socket.decode.id, socket.id);

  socket.on(TAG_EVENT.REQUEST_MERCHANT_CONFIRM_ORDER, async ({ orderID }) => {
    if (!(await merchantController.confirmOrder(orderID, socket.decode.id))) {
      socket
        .to(orderID)
        .emit(
          "error",
          normalizeResponse("Error message", { message: "Error message" })
        );

      socket.leave(orderID);
    }
  });

  socket.on(TAG_EVENT.REQUEST_MERCHANT_CANCEL_ORDER, async ({ orderID }) => {
    if (!(await merchantController.cancelOrder(orderID, socket.decode.id))) {
      socket
        .to(orderID)
        .emit(
          "error",
          normalizeResponse("Error message", { message: "Error message" })
        );
    }

    socket.leave(orderID);
  });

  socket.on("disconnect", () => {
    merchantController.removeMerchant(socket.decode.id);
  });
};

export default merchantConfig;
