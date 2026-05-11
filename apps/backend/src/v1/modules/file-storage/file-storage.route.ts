import express from "express";
import { getSignedUrlForUpload, getSignedUrlForView, deleteFile } from "./file-storage.controller";
import { handleController } from "../../../common/helper";

const router = express.Router();

router.get("/upload-url", handleController(getSignedUrlForUpload));
router.get("/view-url", handleController(getSignedUrlForView));
router.delete("/", handleController(deleteFile));

export default router;
