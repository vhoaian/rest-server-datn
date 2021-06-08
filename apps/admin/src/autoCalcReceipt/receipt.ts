class ReceiptController {
  private _TAG_LOG: string = "RECEIPT_CONTROLLER";
  private _TAG_LOG_FAIL: string = "RECEIPT_CONTROLLER_FAIL";

  private _STATUS_PAID_RECEIPT: number = 1;

  constructor() {}

  async paidReceipt(receiptID: string): Promise<boolean> {
    try {
      // await Receipt.updateOne(
      //   { _id: receiptID },
      //   { Status: this._STATUS_PAID_RECEIPT }
      // );
      console.log(`[${this._TAG_LOG}]: paid receipt ${receiptID} success.`);
      return true;
    } catch (e) {
      console.log(`[${this._TAG_LOG_FAIL}]: ${e.message}`);
      return false;
    }
  }
}

const receiptController = new ReceiptController();
export default receiptController;
