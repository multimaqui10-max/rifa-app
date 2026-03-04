import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadPrizeImage } from "./upload";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Endpoint para subir imágenes de premios
 * POST /api/upload-prize-image
 */
router.post("/upload-prize-image", upload.single("file"), async (req: FileRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const imageUrl = await uploadPrizeImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("[Upload Endpoint] Error:", error);
    return res.status(400).json({ error: error.message || "Error uploading image" });
  }
});

export default router;
