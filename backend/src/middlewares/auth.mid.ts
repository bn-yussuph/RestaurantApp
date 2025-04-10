import { verify } from "jsonwebtoken";
import { HTTP_UNAUTHORIZED } from "../constants/http_status";
const JWT_SECRET = "00f037ae51cd7ba6e878e7c8b6ddf63934ef050f2822112482b3362b69b9763a9ad034215aa0395d890105884bbc9f747663c6f368a169e31bb013087987379718a5e6d21b6f75fb24f794136174b80b7f05e0cee59ff35f7c7b686dcd05f0995aa9eade7274c6543c54ed749111dbd88e6a00d183be03308d2539e073a9ee0731c5e0a230e718ca8aad0f1fc42a7696e4567f54a57a187d1c16a9618989790f4692bb7792563db42b4b9bb2d02d51f7bfd7c2be561408d24f00247f95ac324308b0e529990481d79edc8ba7f377fcff1b4d996d62c3e6c0328f6d5163764f197851ba731c289af6541a5d3a0ff68ba2a5d05edd9a1cc1fc571dc189cca4310b";

export default (req: any, res: any, next: any) => {
    
    // Extracting the access token from the request headers
    const token = req.headers.access_token as string;

    // If no token, return 401 Unauthorized
    if (!token) {
        return res.status(HTTP_UNAUTHORIZED).send();
    }

    try {
        // Verifying the token using the JWT_SECRET
        const decodedUser = verify(token, JWT_SECRET!);

        // If verification is successful, attaching the decoded user information to the request object
        req.user = decodedUser;

    } catch (error) {
        // If an error occurs during token verification, respond with 401 Unauthorized
        res.status(HTTP_UNAUTHORIZED).send();
    }

    // Continue to the next middleware or route handler
    return next();
}