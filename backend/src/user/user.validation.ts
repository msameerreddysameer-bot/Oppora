import { z } from 'zod';


const envSchema = z.object(
    {
       ACCESS_TOKEN_SECRET:z.string().min(10),
       ACCESS_TOKEN_EXPIRY:z.string(),
       REFRESH_TOKEN_SECRET:z.string().min(10),
       REFRESH_TOKEN__EXPIRY:z.string(),
       PASSWORD_PEPPER:z.string().max(18),
       PORT:z.coerce.number().default(3000),
       CLOUDINARY_URL:z.string().min(1,"Cloudinary cloud url is required"),
       CLOUDINARY_API_KEY :z.string().min(1,"cloudinary cloud api key is required"),
       CLOUDINARY_API_SECRET:z.string().min(1,"cloudinary cloud api key sceret is required"),
       CLOUDINARY_CLOUD_NAME:z.string().min(1,"cloudinary cloud name is required ")

    }
)

export const env = envSchema.parse(process.env) 

export const toogleUserRoleByEmailSchema = z.object({
    email:z.email("invalid email adress").trim()
})

const multipartArray = z.preprocess((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return value;

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : value.split(",");
    } catch {
        return value.split(",");
    }
}, z.array(z.string().trim()))

export const updateUserProfileDetailsSchema =z.object({
        FullName:z.string().trim().min(2,"name should not be less than 2 characters"),
        college:z.string().trim(),
        branch:z.string().trim(),
        year:z.coerce.string(),
        skills:multipartArray,
        interests:multipartArray

}).partial()

export const searchUserSchema = z.object({
  queryTerm: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  page: z.coerce.number().default(1).optional(),
  limit: z.coerce.number().default(10).optional(),
});





