import express from "express";
import multer from "multer";
import {
    createSubCategory,
    getSubCategories,
    getSubCategory,
    updateSubCategory,
    patchSubCategory,
    deleteSubCategory,
} from "../controllers/subCategoryController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Change path if needed

router.post("/", upload.single("image"), createSubCategory);
router.get("/", getSubCategories);
router.get("/:id", getSubCategory);
router.put("/:id", upload.single("image"), updateSubCategory);
router.patch("/:id", upload.single("image"), patchSubCategory);
router.delete("/:id", deleteSubCategory);

export default router;
