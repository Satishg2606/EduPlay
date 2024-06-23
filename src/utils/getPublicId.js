function extractPublicIdFromUrl(url1) {
    // Convert URL to string to avoid type errors
    const urlString = String(url1);
    console.log(url1)
    // Cloudinary URLs typically have this format: 
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<extension>
    const matches = urlString.match(/\/(?:v\d+\/)?([^\/]+)\.\w+$/);
    console.log("match",matches)
    return matches ? matches[1] : null;
  }
export {extractPublicIdFromUrl};