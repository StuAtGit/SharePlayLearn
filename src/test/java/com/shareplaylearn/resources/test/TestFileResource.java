package com.shareplaylearn.resources.test;

import com.shareplaylearn.resources.File;
import org.apache.http.HttpEntity;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.FileEntity;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.util.EntityUtils;
import org.jsoup.nodes.Attributes;
import org.jsoup.nodes.FormElement;
import org.jsoup.parser.Tag;

import javax.net.ssl.SSLEngineResult;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

/**
 * Created by stu on 5/7/15.
 */
public class TestFileResource {

    private static final String TEST_UPLOAD_FILE_NAME = "TestUpload.txt";
    private static final String TEST_UPLOAD_FILE_PATH = "/home/stu/Projects/SharePlayLearnMaven/" + TEST_UPLOAD_FILE_NAME;
    private String accessToken;
    private String userId;
    private HttpClient httpClient;

    public TestFileResource( String userId, String accessToken, HttpClient httpClient ) {
        this.accessToken = accessToken;
        this.httpClient = httpClient;
        this.userId = userId;
    }

    public void testPost() throws IOException {
        Path uploadTest = FileSystems.getDefault().getPath(TEST_UPLOAD_FILE_PATH);
        byte[] uploadBuffer = Files.readAllBytes(uploadTest);
        HttpEntity formEntity = MultipartEntityBuilder.create().
                addBinaryBody("file", uploadBuffer,
                        ContentType.APPLICATION_OCTET_STREAM,
                        TEST_UPLOAD_FILE_NAME).
                addTextBody("user_id", userId).
                addTextBody("access_token", accessToken).build();

        HttpPost httpPost = new HttpPost(BackendTest.TEST_BASE_URL + File.RESOURCE_BASE + "/form");
        httpPost.setEntity(formEntity);
        try( CloseableHttpResponse response = (CloseableHttpResponse) httpClient.execute(httpPost)) {
            String reply = "";
            if( response.getEntity() != null ) {
                reply += EntityUtils.toString(response.getEntity());
            }
            if( response.getStatusLine().getStatusCode() != Response.Status.CREATED.getStatusCode() ) {
                String message = "Post to file resource returned " + response.getStatusLine().getReasonPhrase() +
                        response.getStatusLine().getStatusCode();
                message += reply;
                throw new RuntimeException(message);
            }
            System.out.println(reply);
        }
    }

    public void testGet() throws IOException {
        Path uploadTest = FileSystems.getDefault().getPath(TEST_UPLOAD_FILE_PATH);
        byte[] testFileBuffer = Files.readAllBytes(uploadTest);
        String fileResource = BackendTest.TEST_BASE_URL + File.RESOURCE_BASE
                + "/" + this.userId + "/" + TEST_UPLOAD_FILE_NAME;
        HttpGet fileGet = new HttpGet(fileResource);
        fileGet.addHeader("Authorization", "Bearer " + this.accessToken);
        try( CloseableHttpResponse response = (CloseableHttpResponse) httpClient.execute(fileGet)) {
            int code = response.getStatusLine().getStatusCode();
            String reason = response.getStatusLine().getReasonPhrase();
            byte[] entity = null;
            if( response.getEntity() != null ) {
                entity = EntityUtils.toByteArray(response.getEntity());
            }
            if( code != Response.Status.OK.getStatusCode() ) {
                String message = "Get from file resource: " + fileResource + " failed ";
                message += code + "/" + reason;
                if( entity != null ) {
                    message += new String( entity, StandardCharsets.UTF_8 );
                }
                throw new RuntimeException(message);
            }

            if( !Arrays.equals(entity, testFileBuffer) ) {
                String message = "File resource: " + fileResource + " did not have matching bytes!";
                if( entity == null ) {
                    message += " entity was null!?";
                } else {
                    message += " returned buffer  was: " + new String(entity, StandardCharsets.UTF_8);
                }
                throw new RuntimeException( message );
            }
            System.out.println( "Successfully retrieved the test file - and the bytes matched! :)");
        }
    }
}