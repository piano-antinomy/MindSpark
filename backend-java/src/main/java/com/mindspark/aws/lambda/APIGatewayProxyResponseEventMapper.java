package com.mindspark.aws.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Mapper class to convert between HttpServletResponse and APIGatewayProxyResponseEvent
 */
class APIGatewayProxyResponseEventMapper {

    /**
     * Creates a mock HttpServletResponse that captures output to a ByteArrayOutputStream
     *
     * @param outputStream the output stream to capture response data
     * @return a mock HttpServletResponse implementation
     */
    static HttpServletResponse createHttpServletResponse(ByteArrayOutputStream outputStream) {
        return new HttpServletResponse() {
            private int status = 200;
            private Map<String, String> headers = new HashMap<>();
            private String contentType = "application/json";
            private String characterEncoding = "UTF-8";

            @Override
            public void setStatus(int sc) {
                this.status = sc;
            }

            @Override
            public void setStatus(int sc, String sm) {
                this.status = sc;
            }

            @Override
            public int getStatus() {
                return status;
            }

            @Override
            public void setHeader(String name, String value) {
                headers.put(name, value);
            }

            @Override
            public void addHeader(String name, String value) {
                headers.put(name, value);
            }

            @Override
            public String getHeader(String name) {
                return headers.get(name);
            }

            @Override
            public Collection<String> getHeaders(String name) {
                String value = getHeader(name);
                return value != null ?
                        Collections.singletonList(value) :
                        Collections.emptyList();
            }

            @Override
            public Collection<String> getHeaderNames() {
                return new ArrayList<>(headers.keySet());
            }

            @Override
            public void setContentType(String type) {
                this.contentType = type;
            }

            @Override
            public String getContentType() {
                return contentType;
            }

            @Override
            public void setCharacterEncoding(String charset) {
                this.characterEncoding = charset;
            }

            @Override
            public String getCharacterEncoding() {
                return characterEncoding;
            }

            @Override
            public PrintWriter getWriter() throws IOException {
                return new PrintWriter(outputStream);
            }

            @Override
            public ServletOutputStream getOutputStream() throws IOException {
                return new ServletOutputStream() {
                    @Override
                    public void write(int b) throws IOException {
                        outputStream.write(b);
                    }

                    @Override
                    public boolean isReady() {
                        return true;
                    }

                    @Override
                    public void setWriteListener(javax.servlet.WriteListener writeListener) {
                        // Not implemented
                    }
                };
            }

            // Implement other required methods with default implementations
            @Override public void addCookie(javax.servlet.http.Cookie cookie) {}
            @Override public boolean containsHeader(String name) { return headers.containsKey(name); }
            @Override public String encodeURL(String url) { return url; }
            @Override public String encodeRedirectURL(String url) { return url; }
            @Override public String encodeUrl(String url) { return url; }
            @Override public String encodeRedirectUrl(String url) { return url; }
            @Override public void sendError(int sc, String msg) throws IOException { setStatus(sc); }
            @Override public void sendError(int sc) throws IOException { setStatus(sc); }
            @Override public void sendRedirect(String location) throws IOException { setStatus(302); setHeader("Location", location); }
            @Override public void setDateHeader(String name, long date) { setHeader(name, String.valueOf(date)); }
            @Override public void addDateHeader(String name, long date) { addHeader(name, String.valueOf(date)); }
            @Override public void setIntHeader(String name, int value) { setHeader(name, String.valueOf(value)); }
            @Override public void addIntHeader(String name, int value) { addHeader(name, String.valueOf(value)); }
            @Override public void setContentLength(int len) {}
            @Override public void setContentLengthLong(long len) {}
            @Override public void setBufferSize(int size) {}
            @Override public int getBufferSize() { return 8192; }
            @Override public void flushBuffer() throws IOException { outputStream.flush(); }
            @Override public void resetBuffer() { outputStream.reset(); }
            @Override public boolean isCommitted() { return false; }
            @Override public void reset() { outputStream.reset(); }
            @Override public void setLocale(java.util.Locale loc) {}
            @Override public java.util.Locale getLocale() { return java.util.Locale.getDefault(); }
        };
    }

    /**
     * Creates an APIGatewayProxyResponseEvent from an HttpServletResponse and output stream
     *
     * @param response the servlet response containing status and headers
     * @param outputStream the output stream containing the response body
     * @return an APIGatewayProxyResponseEvent
     */
    static APIGatewayProxyResponseEvent createApiGatewayResponse(HttpServletResponse response, ByteArrayOutputStream outputStream) {
        APIGatewayProxyResponseEvent apiResponse = new APIGatewayProxyResponseEvent();
        apiResponse.setStatusCode(response.getStatus());
        apiResponse.setBody(outputStream.toString());

        // Copy headers from response
        Map<String, String> responseHeaders = new HashMap<>();
        Collection<String> headerNames = response.getHeaderNames();
        for (String headerName : headerNames) {
            String headerValue = response.getHeader(headerName);
            responseHeaders.put(headerName, headerValue);
        }
        apiResponse.setHeaders(responseHeaders);

        return apiResponse;
    }
}
