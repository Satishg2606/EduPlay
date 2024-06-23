import { v2 as cloudinary} from "cloudinary";
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath) return null;
        else{
            const response = await cloudinary.uploader.upload(localFilePath);
            // console.log("File has been uploaded on cloudinary : ",response.url);
            fs.unlinkSync(localFilePath);
            return response;
        }

    }catch(error){
        console.log(error)
        fs.unlinkSync(localFilePath);//remove the locally saved temporary file.
        return null;
    }
}
const uploadVideoOnCloudinary = async(localFilePath,type="auto")=>{
    try{
        if(!localFilePath) return null;
        else{
            const response = await cloudinary.uploader.upload(localFilePath,
                {
                    resource_type: type,
                    format : "mp4"
                }
            );
            // console.log("File has been uploaded on cloudinary : ",response.url);
            fs.unlinkSync(localFilePath);
            return response;
        }

    }catch(error){
        console.log(error)
        fs.unlinkSync(localFilePath);//remove the locally saved temporary file.
        return null;
    }
}

const deleteFileFromCloudinary= async(cloudFilePublicId)=>{
    try {
        cloudinary.api
            .delete_resources([cloudFilePublicId], 
            { type: 'upload', resource_type: 'image' })
            .then(console.log);


        // console.log(success)
        return response;
    } catch (error) {
        console.log("Deletion from url failed",error)
        return null;
    }
}
const deleteVideoFromCloudinary= async(cloudFilePublicId)=>{
    try {
        cloudinary.api
            .delete_resources([cloudFilePublicId], 
            { type: 'upload', resource_type: 'video', format:"mp4" })
            .then(console.log);


        // console.log(success)
        return response;
    } catch (error) {
        console.log("Deletion from url failed",error)
        return null;
    }
}
export {uploadOnCloudinary,uploadVideoOnCloudinary,deleteFileFromCloudinary,deleteVideoFromCloudinary};

