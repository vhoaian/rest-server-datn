import express from "express";
import multer from "multer";
import { jwtAuthentication } from "../middlewares/services";
import { Image } from "@vohoaian/datn-models";
import ggAPI from "@rest-servers/google-api";
import { nomalizeResponse } from "../utils/normalize";
import path from "path";
import fs from "fs";
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  jwtAuthentication,
  upload.single("image"),
  async function (req, res) {
    const uploadedFile = req.file;
    const filePath = path.join(process.cwd(), uploadedFile.path);
    const FILE = {
      name: uploadedFile.filename,
      type: uploadedFile.mimetype,
      path: filePath,
    };
    try {
      const img = await ggAPI.uploadFile(FILE);

      // ggAPI.deleteFile(img.webContentLink);
      const newImage = await Image.create({
        Sender: {
          Id: (req.user as any).id,
          Role: 2,
        },
        Url: img.webContentLink,
      });
      res.send(nomalizeResponse({ id: newImage.id, Url: newImage.Url }));
    } catch (e) {
      res.status(500).send(nomalizeResponse(null, 2));
    } // server khong the upload

    fs.unlinkSync(filePath);
  }
);

export default router;
