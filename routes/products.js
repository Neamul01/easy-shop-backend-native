const express = require("express");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

// --------- multer configuration ---------

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/png": "png",
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// --------- get all products //-------{ query= count: string, categories:[] }
router.get(`/`, async (req, res) => {
  try {
    let count = parseInt(req.query.count) || 10;
    let filter = {};

    if (req.query.categories) {
      filter = { category: { $in: req.query.categories.split(",") } };
    }

    const productList = await Product.find(filter)
      .limit(count)
      .populate("category");

    if (productList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    res.status(200).json(productList);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- get a specific product
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});

// ------------ create a product
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");
  // ------- upload image with multer
  const file = req.file;
  if (!file) return res.status(400).send("No image in the request");

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });
  product = await product.save();

  if (!product) {
    res.status(500).send("Product cannot found");
  }
  res.send(product);
});

// ------------ update a product
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id ");
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const singleProduct = await Product.findById(req.params.id);
  if (!singleProduct) return res.status(400).send("No product found");

  const file = req.file;
  let imagePath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = singleProduct.image;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product) {
    return res.status(500).send("The product cannot be Updated");
  }
  res.send(product);
});

// ---------- delete a product
router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "product deleted Successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

// ----------- get count of products
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({ productCount: productCount });
});

// ------------ get only featured products //----{params count},
router.get("/get/featured", async (req, res) => {
  let count = parseInt(req.query.count) || 10;

  try {
    const products = await Product.find({ isFeatured: true }).limit(count);

    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No featured products found" });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
