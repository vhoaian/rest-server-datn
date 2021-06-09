import { Manager, Restaurant } from "@vohoaian/datn-models";
import { normalizeResponse } from "apps/socket/src/utils/normalizeResponse";
import { TAG_EVENT } from "../../TAG_EVENT";
import merchantController from "./merchantController";

// Confir for merchant
const merchantConfig = async (io, socket) => {
  try {
    const manager = await Manager.findById(socket.decode.id).populate(
      "Roles.Restaurant"
    );

    if (!manager) throw new Error("Manager not exist.");
    if (!manager.Roles.length)
      throw new Error("Manager don't have any restaurant");

    // @ts-expect-error
    socket.decode.id = `${manager.Roles[0].Restaurant._id}`;
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
  } catch (e) {
    console.log(`[CONFIG_FAIL]: config socket for merchant fail, ${e.message}`);
  }

  socket.on("disconnect", () => {
    merchantController.removeMerchant(socket.decode.id);
  });
};

export default merchantConfig;
