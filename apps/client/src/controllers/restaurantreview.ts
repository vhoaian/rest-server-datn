import {
  Image,
  Order,
  RestaurantReview,
  ShipperReview,
} from "@vohoaian/datn-models";
import { nomalizeResponse } from "../utils/normalize";
import path from "path";
import fs from "fs";
import ggAPI from "@rest-servers/google-api";

export async function getRestaurantReviews(req, res) {
  const { page, perpage, point, image } = req.query;
  const query: any = { Restaurant: req.data.restaurant._id };
  if (point?.length > 0) query.Point = { $in: point };
  if (typeof image == "boolean") {
    if (image) query["Images.0"] = { $exists: true };
    else query["Images.0"] = { $exists: false };
  }

  const count = await RestaurantReview.countDocuments(query);
  const orders = await RestaurantReview.find(query)
    .populate("User", "FullName Avatar")
    .skip((page - 1) * perpage)
    .limit(perpage)
    .sort({ CreatedAt: -1 })
    .exec();

  res.send(
    nomalizeResponse(
      orders.map((o) => {
        const t = o.toObject();
        t.id = t._id;
        delete t._id;
        return t;
      }),
      0,
      {
        totalPage: Math.ceil(count / perpage),
        currentPage: page,
        perPage: perpage,
        total: count,
      }
    )
  );
}

export async function addRestaurantReview(req, res) {
  const { point, content } = req.body;
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  const oldReview = await RestaurantReview.findOne({ Order: id });
  if (oldReview) return res.send(nomalizeResponse(null, 3)); // Da review roi

  const newReview = new RestaurantReview({
    User: req.user.id,
    Restaurant: order.Restaurant,
    Order: order.id,
    Content: content,
    Point: point,
  });

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
      const newImage = await Image.create({
        Sender: {
          Id: (req.user as any).id,
          Role: 0,
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
  filePaths.forEach((filePath) => fs.unlinkSync(filePath));

  newReview.Images = images.map((image) => image.Url);

  const response = (await newReview.save()).toObject();
  // TODO; tinh diem
  response.id = response._id;
  delete response._id;
  res.send(response);
}

export async function addRestaurantReviewNoImages(req, res) {
  const { point, content } = req.body;
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  const oldReview = await RestaurantReview.findOne({ Order: id });
  if (oldReview) return res.send(nomalizeResponse(null, 3)); // Da review roi

  const newReview = new RestaurantReview({
    User: req.user.id,
    Restaurant: order.Restaurant,
    Order: order.id,
    Content: content,
    Point: point,
  });

  const response = (await newReview.save()).toObject();
  // TODO; tinh diem
  response.id = response._id;
  delete response._id;
  res.send(response);
}

export async function addShipperReview(req, res) {
  const { point, content } = req.body;
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  if (!order.Shipper) return res.send(nomalizeResponse(null, 4)); // shipper khong ton tai

  const oldReview = await ShipperReview.findOne({ Order: id });
  if (oldReview) return res.send(nomalizeResponse(null, 3)); // Da review roi

  const newReview = new ShipperReview({
    User: req.user.id,
    Shipper: order.Shipper,
    Order: order.id,
    Content: content,
    Point: point,
  });

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
      const newImage = await Image.create({
        Sender: {
          Id: (req.user as any).id,
          Role: 0,
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
  filePaths.forEach((filePath) => fs.unlinkSync(filePath));

  newReview.Images = images.map((image) => image.Url);

  const response = (await newReview.save()).toObject();
  // TODO; tinh diem
  response.id = response._id;
  delete response._id;
  res.send(response);
}

export async function addShipperReviewNoImages(req, res) {
  const { point, content } = req.body;
  const { id } = req.params;
  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  if (!order.Shipper) return res.send(nomalizeResponse(null, 4)); // shipper khong ton tai

  const oldReview = await ShipperReview.findOne({ Order: id });
  if (oldReview) return res.send(nomalizeResponse(null, 3)); // Da review roi

  const newReview = new ShipperReview({
    User: req.user.id,
    Shipper: order.Shipper,
    Order: order.id,
    Content: content,
    Point: point,
  });

  const response = (await newReview.save()).toObject();
  // TODO; tinh diem
  response.id = response._id;
  delete response._id;
  res.send(response);
}

export async function getRestaurantReviewsv2(req, res) {
  const { id } = req.params;

  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  const query: any = { Order: id };

  const reviews = await RestaurantReview.find(query)
    .populate("Restaurant", "Name Avatar")

    .exec();

  res.send(
    nomalizeResponse(
      reviews.map((o) => {
        const t = o.toObject();
        t.id = t._id;
        delete t._id;
        return t;
      })
    )
  );
}

export async function getShipperReviews(req, res) {
  const { id } = req.params;

  const order = await Order.findOne({
    User: req.user.id,
    _id: id,
  });
  if (!order) return res.send(nomalizeResponse(null, 2)); // order khong ton tai

  const query: any = { Order: id };

  const reviews = await ShipperReview.find(query)
    .populate("Shipper", "FullName Avatar")
    .exec();

  res.send(
    nomalizeResponse(
      reviews.map((o) => {
        const t = o.toObject();
        t.id = t._id;
        delete t._id;
        return t;
      })
    )
  );
}
