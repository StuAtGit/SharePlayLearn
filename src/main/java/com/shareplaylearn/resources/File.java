package com.shareplaylearn.resources;

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.shareplaylearn.models.FileListItem;
import com.shareplaylearn.models.UploadMetadataFields;
import com.shareplaylearn.services.*;
import com.shareplaylearn.utilities.Exceptions;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.*;
import java.net.InetAddress;
import java.util.*;
import java.util.List;

/**
 * Created by stu on 4/14/15.
 */
@Path(File.RESOURCE_BASE)
public class File {

    private static final String S3_BUCKET = "shareplaylearn";
    private static final String MODAL_DIV_ID = "OpenImageModal";
    private static final String MODAL_IMAGE_CLASS = "modalImagePopup";
    //we store this in the display html to indicate the token should be replaced
    //when sent to the user.
    private static final String ACCESS_TOKEN_MARKER = "{{ACCESS_TOKEN}}";
    public static final String RESOURCE_BASE = "/file";

    /**
     * With 2MB default upload limit on tomcat, this comes to about:
     * 1000*2MB ~ 2GB of data stored at any given time.
     * 1 req/sec ~ 3x10^6 requests a month.
     * At 10 GB / Month out, and 1 TB / Month in (kyup limits it to 1 TB, so that should throttle that).
     * https://calculator.s3.amazonaws.com/index.html says we should be spending around $24 max.
     */
    //per user
    private static final int MAX_NUM_FILES_PER_USER = 100;
    private static final int MAX_TOTAL_FILES = 1000;
    //limit retrieves to 0.5 GB for now (Tomcat should limit uploads to 2MB).
    //raise to 1 GB when we buy more memory (if needed)
    private static final int MAX_RETRIEVE_SIZE = (1024*1024*1024)/2;

    @POST
    @Consumes( MediaType.APPLICATION_OCTET_STREAM )
    public Response postFile( )
    {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Not implemented yet").build();
    }

    /**
     * This is not good enough. It slows things down, and still costs money.
     * Eventually, we should have an async task that updates a local cache of
     * used storage. If the cache says your below X of the limit (think atms),
     * you're good. Once you get up close, ping Amazon every time.
     * @param objectListing
     * @param maxSize
     * @return
     */
    private Response checkObjectListingSize( ObjectListing objectListing, int maxSize )
    {
        if( objectListing.isTruncated() && objectListing.getMaxKeys() >= maxSize ) {
            System.out.println("Error, too many uploads");
            return Response.status(418).entity("I'm a teapot! j/k - not enough space " + maxSize).build();
        }
        if( objectListing.getObjectSummaries().size() >= maxSize ) {
            System.out.println("Error, too many uploads");
            return Response.status(418).entity("I'm a teapot! Er, well, at least I can't hold " + maxSize + " stuff.").build();
        }
        return Response.status(Response.Status.OK).entity("OK").build();
    }

    /**
     * TODO: Once we have an async form, send access token in header, not in form
     * @param filestream
     * @param contentDisposition
     * @param filename
     * @param userId
     * @param accessToken
     * @return
     */
    @POST
    @Path("/form")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response postFileForm( @FormDataParam("file") InputStream filestream,
                                  @FormDataParam("file") FormDataContentDisposition contentDisposition,
                                  //we'll let this be optional, derive from the contentDisposition for now
                                  //and add this where we want/need to
                                  @FormDataParam("filename") String filename,
                                  @FormDataParam("user_id") String userId,
                                  @FormDataParam("access_token") String accessToken,
                                  @HeaderParam("Content-Length") String contentLength )
    {
        try {
            //these still show up as null, despite annotations
            if (filestream == null || contentDisposition == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("Content Disposition or file not supplied " + filestream + "," + contentDisposition).build();

            }
            if (filename == null || filename.trim().length() == 0) {
                filename = contentDisposition.getFileName();
                if( filename == null || filename.trim().length() == 0 ) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity("Filename not specified and not preseent in the content disposition").build();
                }
            }
            if (userId == null || userId.trim().length() == 0) {
                return Response.status(Response.Status.BAD_REQUEST).entity("No user id given.").build();
            }
            if (accessToken == null || accessToken.trim().length() == 0) {
                return Response.status(Response.Status.BAD_REQUEST).entity("No access token given.").build();
            }

            Response tokenResponse = OAuth2Callback.validateToken(accessToken);
            if (tokenResponse.getStatus() != Response.Status.OK.getStatusCode()) {
                return tokenResponse;
            }
            System.out.println("file submitted, and user authenticated, checking quota");
            //you could possible parse out the token response username & id and check if they match
            //but maybe we want to override that sometimes?
            AmazonS3Client s3Client = new AmazonS3Client(
                    new BasicAWSCredentials(SecretsService.amazonClientId, SecretsService.amazonClientSecret));
            ObjectListing curList = s3Client.listObjects(S3_BUCKET, "/" + userId + "/");
            Response listCheck;
            if ((listCheck = this.checkObjectListingSize(curList, MAX_NUM_FILES_PER_USER)).getStatus() != Response.Status.OK.getStatusCode()) {
                return listCheck;
            }
            ObjectListing userList = s3Client.listObjects(S3_BUCKET, "/");
            if ((listCheck = this.checkObjectListingSize(userList, MAX_TOTAL_FILES)).getStatus() != Response.Status.OK.getStatusCode()) {
                return listCheck;
            }
            byte[] fileBuffer = org.apache.commons.io.IOUtils.toByteArray(filestream);
            //perhaps not the best way to check for an image, but it works!
            List<UploadPreprocessorPlugin> uploadPreprocessorPlugins = new ArrayList<>();
            uploadPreprocessorPlugins.add(new ImagePreprocessorPlugin());
            UploadPreprocessor uploadPreprocessor = new UploadPreprocessor( uploadPreprocessorPlugins );
            Map<String,byte[]> uploads = uploadPreprocessor.process(fileBuffer);

            if( uploads.size() == 0 ) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).
                        entity("Upload processor returned empty upload set").build();
            } else if( !uploads.containsKey(uploadPreprocessor.getPreferredTag()) ) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).
                        entity("Upload processor had no preferred tag! Not sure what to do.").build();
            }

            byte[] preferredUpload = uploads.get(uploadPreprocessor.getPreferredTag());
            boolean isPublic = false;
            ObjectMetadata rootObjectMetadata = this.makeBasicMetadata(preferredUpload.length, isPublic);

            boolean beenResized = false;
            boolean hasOnClick = false;
            String onClick = "";
            String displayHtml = "";

            if( uploadPreprocessor.getLastUsedProcessor() instanceof  ImagePreprocessorPlugin ) {

                //So if it's not resized, then the original tag should be the preferred
                //so only upload the original if the preferred tag is not the original
                if (!uploadPreprocessor.getPreferredTag().equals(ImagePreprocessorPlugin.ORIGINAL_TAG)) {
                    String originalKey = "/" + userId + "/" + ImagePreprocessorPlugin.ORIGINAL_TAG + "/" + filename;
                    byte[] originalBuffer = uploads.get(ImagePreprocessorPlugin.ORIGINAL_TAG);
                    ObjectMetadata originalMetadata = this.makeBasicMetadata( originalBuffer.length, isPublic );
                    originalMetadata.addUserMetadata(UploadMetadataFields.IS_ORIGINAL, UploadMetadataFields.TRUE_VALUE);
                    ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(originalBuffer);
                    s3Client.putObject( S3_BUCKET, originalKey, byteArrayInputStream, originalMetadata );

                    rootObjectMetadata.addUserMetadata(UploadMetadataFields.HAS_ORIGINAL, UploadMetadataFields.TRUE_VALUE);
                    beenResized = true;
                }

                if (uploads.containsKey(ImagePreprocessorPlugin.PREVIEW_TAG)) {
                    int previewHeight = ((ImagePreprocessorPlugin) uploadPreprocessor.
                            getLastUsedProcessor()).getLastPreviewHeight();
                    String previewFilename = ImagePreprocessorPlugin.PREVIEW_TAG + "_" + filename;
                    if( !previewFilename.endsWith(".jpg") ) {
                        previewFilename += ".jpg";
                    }
                    String previewKey = "/" + userId + "/" + previewFilename;
                    displayHtml = this.generatePreviewHtml(userId, previewFilename, filename, previewHeight);
                    hasOnClick = true;
                    onClick = "#" + MODAL_DIV_ID;
                    byte[] previewBuffer = uploads.get(ImagePreprocessorPlugin.PREVIEW_TAG);
                    ByteArrayInputStream previewStream = new ByteArrayInputStream(previewBuffer);
                    ObjectMetadata previewMetadata = this.makeBasicMetadata(previewBuffer.length, isPublic);
                    s3Client.putObject( S3_BUCKET, previewKey, previewStream, previewMetadata );
                    rootObjectMetadata.addUserMetadata(UploadMetadataFields.HAS_PREVIEW, UploadMetadataFields.TRUE_VALUE);
                } else {
                    displayHtml = filename;
                }
            } else {
                displayHtml = filename;
            }
            rootObjectMetadata.addUserMetadata(UploadMetadataFields.DISPLAY_HTML,displayHtml);
            rootObjectMetadata.addUserMetadata(UploadMetadataFields.HAS_ON_CLICK, amazonBoolean(hasOnClick));
            rootObjectMetadata.addUserMetadata(UploadMetadataFields.ON_CLICK, onClick);

            //if we resized, then it's a jpg now.
            if( !filename.endsWith(".jpg") && beenResized ) {
                filename += ".jpg";
            }
            String rootObjectPath = "/" + userId + "/" + filename;
            ByteArrayInputStream rootObjectStream = new ByteArrayInputStream(preferredUpload);
            s3Client.putObject(S3_BUCKET, rootObjectPath, rootObjectStream, rootObjectMetadata);

            ///s3Client.putObject(S3_BUCKET, "/" + userId + "/" + filename, byteArrayInputStream, fileMetadata);
            System.out.println("Get localhost: " + InetAddress.getLocalHost());
            String[] host = InetAddress.getLocalHost().toString().split("/");
            if( host[0].trim().length() == 0 ) {
                return Response.status(Response.Status.CREATED).entity(filename + " stored under user id " + userId + " " + InetAddress.getLocalHost()).build();
            } else {
                String hostname = host[0].trim().toLowerCase();
                if( !hostname.equals("shareplaylearn.com") && !hostname.equals("shareplaylearn.net") ) {
                    hostname = "localhost";
                }
                return Response.status(Response.Status.CREATED).
                        entity(this.generateBackPage(filename, userId)).build();
            }
        }
        catch( RuntimeException r )
        {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            r.printStackTrace(pw);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(sw.toString()).build();
        }
        catch( Throwable t )
        {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            t.printStackTrace(pw);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(sw.toString()).build();
        }
    }

    private String amazonBoolean( boolean val ) {
        if( val ) {
            return UploadMetadataFields.TRUE_VALUE;
        } else {
            return UploadMetadataFields.FALSE_VALUE;
        }
    }

    //TODO: not what we're getting from S3 in test (old stuff)
    private String generatePreviewHtml(String userId, String previewFilename
            , String filename, int previewHeight) {
        StringBuilder previewTag = new StringBuilder();
        //"/api/file/{{user_info.user_id}}/{{user_info.access_token}}/{{item.name}}"
        previewTag.append( this.generateImageLink(userId, previewFilename, "preview of " + filename, previewHeight));
        //TODO: we'll set this objects onClick to #openModal
        previewTag.append("<div id='" + MODAL_DIV_ID + "' class='" + MODAL_IMAGE_CLASS + "'>");
        previewTag.append( this.generateImageLink(userId, filename, "Picture of " + filename, -1));
        previewTag.append("</div>");
        return previewTag.toString();
    }

    private String generateImageLink(String userId, String previewFilename, String altText, int imageHeight) {
        String imageLink = "<img src=/api/file/" + userId + "/" + ACCESS_TOKEN_MARKER + "/" + previewFilename + " alt=" +
                "\"" + altText + "\" width=\"" + ImagePreprocessorPlugin.PREVIEW_WIDTH +"";
        if( imageHeight > 0 ) {
            imageLink += "\" height=\"" + imageHeight + "\" border=0 />";
        } else {
            imageLink += " border=0 />";
        }
        return imageLink;
    }
    /**
     * Messy. But returning seeOther() from uploadForm post:
     *  (a) invalidates the login (at least in Firefox). Looks like it clears the session cache due to redirect.
     *  (b) isn't really "correct" return value.
     *  (c) the real fix is to async the upload form.
     * @return
     */
    private String generateBackPage( String filename, String userId ) {
        StringBuffer backPage = new StringBuffer();
        backPage.append("<html>\n<head>");
        backPage.append("<link rel=\"stylesheet\" href=\"../../css/style-master.css\" type=\"text/css\">");
        backPage.append("</head><body>");
        backPage.append("        <div class=\"header\">\n" +
                "            <ul>\n" +
                "                <li class=\"header-section\">\n" +
                "                    <a href=\"../../#/share\">Share</a>\n" +
                "                </li>\n" +
                "                <li class=\"header-section\">\n" +
                "                    <a href=\"../../#/play\">Play</a>\n" +
                "                </li>\n" +
                "                <li class=\"header-section\">\n" +
                "                    <a href=\"../../#\">Learn</a>\n" +
                "                </li>\n" +
                "                <li class=\"login\">\n" +
                "                    <a href=\"../../#/login\" id=\"login-control\">Login</a>\n" +
                "                    <a href=\"../../#/logout\" id=\"logout-control\" style=\"display:none;\">Logout</a>\n" +
                "                </li>\n" +
                "            </ul>\n" +
                "            \n" +
                "        </div>");
        backPage.append("<div id='wrap'><div class='app-content'>" + filename + " saved!</div></div>");
        backPage.append("</body></html>");
        return backPage.toString();
    }

    private ObjectMetadata makeBasicMetadata( int bufferLength, boolean isPublic ) {
        ObjectMetadata fileMetadata = new ObjectMetadata();
        fileMetadata.setContentEncoding(MediaType.APPLICATION_OCTET_STREAM);
        if (isPublic) {
            fileMetadata.addUserMetadata(UploadMetadataFields.PUBLIC, UploadMetadataFields.TRUE_VALUE);
        } else {
            fileMetadata.addUserMetadata(UploadMetadataFields.PUBLIC, UploadMetadataFields.FALSE_VALUE);
        }
        fileMetadata.setContentLength(bufferLength);
        return fileMetadata;
    }

    private Response getS3Object( AmazonS3Client s3Client, String itemPath ) {
        if( !itemPath.startsWith("/") ) {
            itemPath = "/" + itemPath;
        }
        S3Object object = s3Client.getObject(S3_BUCKET, itemPath);
        try( S3ObjectInputStream inputStream = object.getObjectContent() ) {
            long contentLength = object.getObjectMetadata().getContentLength();
            if(contentLength > MAX_RETRIEVE_SIZE)
            {
                throw new IOException("Object is to large: " + contentLength + " bytes.");
            }
            int bufferSize = Math.min((int)contentLength,10*8192);
            byte[] buffer = new byte[bufferSize];
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            int bytesRead = 0;
            int totalBytesRead = 0;
            while( (bytesRead = inputStream.read(buffer)) > 0 ) {
                outputStream.write(buffer,0,bytesRead);
                totalBytesRead += bytesRead;
            }
            System.out.println("GET in file resource read: " + totalBytesRead + " bytes.");
            return Response.status(Response.Status.OK).entity(outputStream.toByteArray()).build();
        } catch (IOException e) {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            e.printStackTrace(pw);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(sw.toString()).build();
        }
    }

    /**
     * Factored out this functionality so we can support access token in header, and in URL
     * @param userId
     * @param filename
     * @param access_token
     * @return
     */
    public Response getFileGeneric( String userId, String filename, String access_token )
    {
        if( userId == null || userId.trim().length() == 0  ) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No user id").build();
        }
        if( filename == null || filename.trim().length() == 0  ) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No file id given").build();
        }
        String itemPath = "/" + userId + "/" + filename;
        /**
         * Actually, don't need this for now, as java Path annotation won't let anything go too screwy
         * Eventually, we should regex the filename, though to allow / hiearchies (perhaps)
         try {
         URI userBucketPath = new URI(null,null,filename,null);
         } catch (URISyntaxException e) {

         **/
        AmazonS3Client s3Client = new AmazonS3Client(
                new BasicAWSCredentials(SecretsService.amazonClientId, SecretsService.amazonClientSecret)
        );
        ObjectMetadata objectMetadata = s3Client.getObjectMetadata(S3_BUCKET, itemPath);
        if( access_token == null  || access_token.length() == 0 || access_token.equals("public")) {
            String isPublic = objectMetadata.getUserMetaDataOf(UploadMetadataFields.PUBLIC);
            /**
             * TODO: (note we have an untested change above to not add jpg if the filename already ends with it)
             *       (e) path should not be using access token.
             *                - equivalent lifetime token
             *                - token to share with specific users??? (might use a different approach then this for sharing)
             *                - perma-token for shareable, but not fully public, links.
             *       (e) access token should be invalidated upon logout, if possible.
             *       (f) we need a in-line div "pop-up" of items that we know how to display
             *          (like images or markdown or text)
             *       (f) layout of previews should be a responsive grid .. or not?
             *       (g) try to figure out how to work with angular's SCE stuff.
             */
            if( isPublic != null && isPublic.equals(UploadMetadataFields.TRUE_VALUE)) {
                try {
                    return getS3Object(s3Client, itemPath);
                } catch (Throwable t) {
                    return Response.status(Response.Status.BAD_REQUEST).entity("Amazon has failed us, for key: " +
                            filename + "\n" + Exceptions.asString(t)).build();
                }
            } else {
                return Response.status(Response.Status.UNAUTHORIZED).entity("Not authorized " + isPublic).build();
            }
        }
        else
        {
            Response tokenResponse = OAuth2Callback.validateToken(access_token);
            if( tokenResponse.getStatus() == Response.Status.OK.getStatusCode() ) {
                return getS3Object(s3Client,itemPath);
            }
            return tokenResponse;
        }
    }

    @GET
    @Produces( MediaType.APPLICATION_OCTET_STREAM )
    @Path("/{userId}/{filename}")
    public Response getFile( @PathParam("userId") String userId,
                             @PathParam("filename") String filename,
                             @HeaderParam("Authorization") String access_token)
    {
        return getFileGeneric(userId, filename, access_token );
    }

    /***
     * Might want to yank this back later (don't really want to encourage ppl to share their access token!!)
     * OTOH, we might want to look into a limited scope token that just works for this. Handy for sharing,
     * and will make the links expire.
     *
     * TODO: Deprecate this with angular click() intercept in template
     *
     * Note: we flip the order of access_token & filename so the browser will save the file with the logical
     * name
     * @param userId
     * @param filename
     * @param access_token
     * @return
     */
    @GET
    @Produces( MediaType.APPLICATION_OCTET_STREAM )
    @Path("/{userId}/{access_token}/{filename}")
    public Response getFilePathAuthorization( @PathParam("userId") String userId,
                                              @PathParam("filename") String filename,
                                              @PathParam("access_token") String access_token)
    {
        return getFileGeneric(userId, filename, access_token );
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/{userId}/filelist")
    public Response getFileList( @PathParam("userId") String userId,
                                 @HeaderParam("Authorization") String authorization )
    {
        if( userId == null ) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No user id provided??").build();
        }
        if( authorization == null ) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No user id provided??").build();
        }
        Response authResponse = OAuth2Callback.validateToken(authorization);
        if( authResponse.getStatus() != Response.Status.OK.getStatusCode() ) {
            return authResponse;
        }
        AmazonS3Client s3Client = new AmazonS3Client(
                new BasicAWSCredentials(SecretsService.amazonClientId, SecretsService.amazonClientSecret)
        );
        ObjectListing objectListing = s3Client.listObjects(S3_BUCKET, "/" + userId + "/");
        Gson gson = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create();
        List<FileListItem> objectNames = new ArrayList<>();
        List<S3ObjectSummary> objectSummaries = objectListing.getObjectSummaries();
        int prefixLength = ("/" + userId + "/").length();
        StoredTokenService storedTokenService = new StoredTokenService();
        /**
         * Maybe we can stream this out??? Sloww.. get some perf logs in here.
         * Fast on my phone, though?
         */
        for( S3ObjectSummary objectSummary : objectSummaries ) {
            String displayHtml = s3Client.getObjectMetadata(S3_BUCKET, objectSummary.getKey())
                    .getUserMetaDataOf(UploadMetadataFields.DISPLAY_HTML);

            //previews don't have display html - the display html of the objects points at the preview.
            if( displayHtml == null || displayHtml.trim().length() == 0) {
                continue;
            }
            if( objectSummary.getKey().length() <= prefixLength ) {
                System.out.println( "Item in S3 that appears only be a user directory: " + objectSummary.getKey() );
                continue;
            }

            System.out.println("Display html of: " + objectSummary.getKey() + ": " + displayHtml);
            if( displayHtml != null && displayHtml.contains(ACCESS_TOKEN_MARKER) ) {
                    displayHtml = displayHtml.replace(ACCESS_TOKEN_MARKER,
                            storedTokenService.getStoredToken(userId, "", authorization));
            }
            FileListItem fileListItem = new FileListItem( objectSummary.getKey().substring(prefixLength), displayHtml );
            String hasOnClickVal = s3Client.getObjectMetadata(S3_BUCKET, objectSummary.getKey())
                    .getUserMetaDataOf(UploadMetadataFields.HAS_ON_CLICK);
            boolean hasOnClick = hasOnClickVal != null &&  hasOnClickVal.equals(UploadMetadataFields.TRUE_VALUE);
            String onClick = "";
            if( hasOnClick ) {
                onClick = s3Client.getObjectMetadata(S3_BUCKET, objectSummary.getKey())
                        .getUserMetaDataOf(UploadMetadataFields.ON_CLICK);
                fileListItem.setOnClick(onClick);
            }
            fileListItem.setHasOnClick(hasOnClick);
            objectNames.add( fileListItem );
        }
        return Response.status(Response.Status.OK).entity(gson.toJson(objectNames)).build();
    }

}
