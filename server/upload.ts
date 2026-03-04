import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * Sube una imagen a S3 y retorna la URL pública
 * @param fileBuffer - Buffer del archivo
 * @param fileName - Nombre original del archivo
 * @param mimeType - Tipo MIME del archivo (ej: image/jpeg)
 * @returns URL pública de la imagen
 */
export async function uploadPrizeImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // Validar tipo de archivo
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedMimes.includes(mimeType)) {
    throw new Error("Solo se permiten archivos JPG, PNG o WebP");
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileBuffer.length > maxSize) {
    throw new Error("El archivo no puede superar 5MB");
  }

  try {
    // Generar nombre único para el archivo
    const fileExtension = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `prize-${nanoid()}.${fileExtension}`;
    const fileKey = `prizes/${uniqueFileName}`;

    // Subir a S3
    const { url } = await storagePut(fileKey, fileBuffer, mimeType);

    return url;
  } catch (error) {
    console.error("[Upload] Error uploading prize image:", error);
    throw new Error("Error al subir la imagen");
  }
}
