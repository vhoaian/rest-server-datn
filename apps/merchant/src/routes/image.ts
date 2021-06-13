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
  "/single",
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

router.post(
  "/multiple",
  jwtAuthentication,
  upload.array("images"),
  async function (req, res) {
    const uploadedFiles = req.files as any[];
    const images: any = [];
    const filePaths = uploadedFiles.map((uploadedFile) =>
      path.join(process.cwd(), uploadedFile.path)
    );
    for (let i = 0; i < uploadedFiles.length; i++) {
      const FILE = {
        name: uploadedFiles[i].filename,
        type: uploadedFiles[i].mimetype,
        path: filePaths[i],
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
        images.push({ id: newImage.id, Url: newImage.Url });
      } catch (e) {
        res.status(500).send(nomalizeResponse(null, 2));
        images.forEach((image) => ggAPI.deleteFile(image.Url));
        break;
      } // server khong the upload
    }
    res.send(nomalizeResponse(images));
    filePaths.forEach((filePath) => fs.unlinkSync(filePath));
  }
);

export default router;
