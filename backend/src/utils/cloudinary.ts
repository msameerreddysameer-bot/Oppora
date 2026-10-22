import { v2 as cloudinary } from "cloudinary";
import { env } from "../user/user.validation.ts";
import fs from "fs";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const safeUnlink = (filePath: string) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (unlinkErr) {
    console.warn("[Cloudinary] File cleanup notice:", (unlinkErr as any)?.message);
  }
};

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    safeUnlink(localFilePath);
    return response;
  } catch (error) {
    safeUnlink(localFilePath);
    console.error(
      "[Cloudinary Upload Error]:",
      (error as any)?.message || "Upload failed"
    );
    return null;
  }
};

export { uploadOnCloudinary };
