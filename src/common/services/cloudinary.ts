import { Injectable, InternalServerErrorException } from '@nestjs/common';

import cloudinary from '../../config/cloudinary.config.js';

@Injectable()
export class CloudinaryService {
  // Upload image to Cloudinary
  async uploadImage(
    buffer: Buffer,
    folder: string,
  ): Promise<{
    secure_url: string;
    public_id: string;
  }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Store the image inside the specified Asset Folder
          asset_folder: folder,

          // Tell Cloudinary that the uploaded file is an image
          resource_type: 'image',
        },

        (error, result) => {
          // Handle Cloudinary upload error
          if (error) {
            return reject(
              new InternalServerErrorException('Image upload failed'),
            );
          }

          // Make sure Cloudinary returned a result
          if (!result) {
            return reject(
              new InternalServerErrorException('Image upload failed'),
            );
          }

          // Return only the data we need to store in MongoDB
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      // Send the image buffer to Cloudinary
      uploadStream.end(buffer);
    });
  }

  // Delete one image from Cloudinary
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  // Replace an existing image with a new one
  async replaceImage(
    buffer: Buffer,
    oldPublicId: string | undefined,
    folder: string,
  ): Promise<{
    secure_url: string;
    public_id: string;
  }> {
    // 1. Upload the new image
    const newImage = await this.uploadImage(buffer, folder);

    // 2. Delete the old image if it exists
    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }

    // 3. Return the new image information
    return newImage;
  }

  // Delete an empty Asset Folder from Cloudinary
  async deleteFolder(folderPath: string): Promise<void> {
    try {
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error('Cloudinary delete folder error:', error);

      throw new InternalServerErrorException(
        'Failed to delete Cloudinary folder',
      );
    }
  }
}
